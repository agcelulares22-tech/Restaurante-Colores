import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Coins, 
  Download, 
  Printer, 
  ArrowLeft, 
  CheckCircle,
  Receipt,
  Tag
} from 'lucide-react';
import { CierreCaja, TicketData, TicketItem, TipoComprobante } from '../types';
import { facturacionService, Factura } from '../services/facturacionService';
import { pdfService } from '../services/pdfService';
import { cajaService } from '../services/cajaService';
import { isArcaConfigured, createArcaInvoice, TIPOS_COMPROBANTE, getArcaCuit } from '../services/arcaService';

interface ManualBillingPanelProps {
  cajaSession: CierreCaja | null;
  restaurante: {
    nombreComercial: string;
    razonSocial: string;
    cuit: string;
    direccion: string;
    telefono: string;
    email: string;
    mensajePie: string;
    moneda: string;
  };
  onEmitSuccess: () => void;
  onClose: () => void;
  addLog: (tipo: 'pedido_creado' | 'descuento_stock' | 'alerta_stock' | 'comanda_estado' | 'merma_registrada' | 'sistema', mensaje: string) => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

interface ManualItem {
  id: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
}

const UNIDADES_MEDIDA = [
  { id: '1', label: 'UNIDADES' },
  { id: '7', label: 'UNIDADES (AFIP 7)' },
  { id: '2', label: 'KILOGRAMOS' },
  { id: '3', label: 'METROS' },
  { id: '4', label: 'LITROS' }
];

const CONDICIONES_IVA = [
  { id: 5, label: 'Consumidor Final' },
  { id: 1, label: 'IVA Responsable Inscripto' },
  { id: 6, label: 'IVA Monotributo' },
  { id: 3, label: 'IVA Exento' },
];

const CONCEPTOS_AFIP = [
  { id: 1, label: '1 - Productos' },
  { id: 2, label: '2 - Servicios' },
  { id: 3, label: '3 - Productos y Servicios' }
];

const ALICUOTAS_IVA = [
  { id: 5, value: 21, label: '21%' },
  { id: 4, value: 10.5, label: '10.5%' },
  { id: 6, value: 27, label: '27%' },
  { id: 3, value: 0, label: '0%' }
];

const money = (value: number) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ManualBillingPanel({
  cajaSession,
  restaurante,
  onEmitSuccess,
  onClose,
  addLog,
  toast
}: ManualBillingPanelProps) {
  const [tipoComprobante, setTipoComprobante] = useState<'Factura C' | 'Factura B' | 'Factura A' | 'Ticket' | 'Comprobante X'>('Factura C');
  const [condicionIvaReceptor, setCondicionIvaReceptor] = useState<number>(5); // Consumidor Final
  const [docTipo, setDocTipo] = useState<number>(99); // Consumidor Final
  const [numeroDocumento, setNumeroDocumento] = useState<string>('0');
  const [concepto, setConcepto] = useState<number>(1); // Productos
  const [ivaGeneral, setIvaGeneral] = useState<number>(21); // 21% default
  const [fechaEmision, setFechaEmision] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [medioPago, setMedioPago] = useState<Factura['medio_pago']>('efectivo');

  // Items State
  const [items, setItems] = useState<ManualItem[]>([
    { id: `item_${Date.now()}`, descripcion: '', unidadMedida: 'UNIDADES', cantidad: 1, precioUnitario: 0 }
  ]);

  const [preciosConIva, setPreciosConIva] = useState<boolean>(true);
  const [isEmitting, setIsEmitting] = useState<boolean>(false);

  // Sync DocTipo with CondicionIva
  useEffect(() => {
    if (condicionIvaReceptor === 5) { // Consumidor Final
      setDocTipo(99); // C. Final
      setNumeroDocumento('0');
    } else if (condicionIvaReceptor === 1) { // Resp. Inscripto
      setDocTipo(80); // CUIT
      if (numeroDocumento === '0') setNumeroDocumento('');
    } else if (condicionIvaReceptor === 6) { // Monotributo
      setDocTipo(80); // CUIT
      if (numeroDocumento === '0') setNumeroDocumento('');
    }
  }, [condicionIvaReceptor]);

  // Handle changes in DocTipo
  const handleDocTipoChange = (val: number) => {
    setDocTipo(val);
    if (val === 99) {
      setCondicionIvaReceptor(5);
      setNumeroDocumento('0');
    } else {
      if (numeroDocumento === '0') setNumeroDocumento('');
    }
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, descripcion: '', unidadMedida: 'UNIDADES', cantidad: 1, precioUnitario: 0 }
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.warning('Debe conservar por lo menos un concepto o ítem en la factura.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Update Item Property
  const handleUpdateItem = (id: string, key: keyof ManualItem, value: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      return { ...it, [key]: value };
    }));
  };

  // Calculation Metrics
  const calculatedTotals = useMemo(() => {
    let subtotalTotal = 0; // Sum of qty * price
    items.forEach(it => {
      subtotalTotal += (it.cantidad * it.precioUnitario);
    });

    const ivaRateFraction = ivaGeneral / 100;
    let total = 0;
    let netoGravado = 0;
    let ivaValue = 0;

    if (preciosConIva) {
      total = subtotalTotal;
      netoGravado = Number((total / (1 + ivaRateFraction)).toFixed(2));
      ivaValue = Number((total - netoGravado).toFixed(2));
    } else {
      netoGravado = subtotalTotal;
      ivaValue = Number((netoGravado * ivaRateFraction).toFixed(2));
      total = Number((netoGravado + ivaValue).toFixed(2));
    }

    return {
      netoGravado,
      ivaValue,
      total
    };
  }, [items, ivaGeneral, preciosConIva]);

  // Validation
  const validateInvoice = () => {
    if (items.some(it => !it.descripcion.trim())) {
      toast.error('Todos los conceptos deben tener una descripción cargada.');
      return false;
    }
    if (items.some(it => it.cantidad <= 0)) {
      toast.error('La cantidad de los ítems debe ser mayor a cero.');
      return false;
    }
    if (items.some(it => it.precioUnitario < 0)) {
      toast.error('El precio unitario no puede ser negativo.');
      return false;
    }
    if (calculatedTotals.total <= 0) {
      toast.error('El monto total de la factura debe ser mayor a cero.');
      return false;
    }

    if (tipoComprobante === 'Factura A') {
      if (docTipo !== 80 || !numeroDocumento.trim() || numeroDocumento === '0') {
        toast.error('Para emitir una Factura A es obligatorio ingresar un CUIT de receptor.');
        return false;
      }
      if (condicionIvaReceptor !== 1) {
        toast.error('La Factura A requiere que la condición de IVA sea Responsable Inscripto.');
        return false;
      }
    }

    if (docTipo === 80) {
      const cleanDoc = numeroDocumento.replace(/-/g, '').trim();
      if (cleanDoc.length < 11) {
        toast.error('El número de CUIT ingresado es inválido (debe tener 11 dígitos).');
        return false;
      }
    }

    if (docTipo === 96) {
      const cleanDoc = numeroDocumento.replace(/-/g, '').trim();
      if (cleanDoc.length < 7 || cleanDoc.length > 9) {
        toast.error('El número de DNI ingresado es inválido (debe tener entre 7 y 9 dígitos).');
        return false;
      }
    }

    return true;
  };

  // AFIP Next Ticket Number
  const getNextInvoiceNumber = async (facturasList: Factura[], tipo: string) => {
    const codeMap: Record<string, string> = {
      'Factura A': 'A',
      'Factura B': 'B',
      'Factura C': 'C',
      'Ticket': 'T',
      'Comprobante X': 'X'
    };
    const letter = codeMap[tipo] || 'C';
    const prefix = `${letter}-0001-`;

    const last = facturasList
      .filter(f => f.nro_ticket.startsWith(prefix))
      .map(f => Number(f.nro_ticket.split('-').pop() || 0))
      .reduce((max, n) => Math.max(max, Number.isFinite(n) ? n : 0), 8320);

    return `${prefix}${String(last + 1).padStart(8, '0')}`;
  };

  // Submit Invoice Emission
  const handleEmitInvoice = async () => {
    if (!cajaSession) {
      toast.error('Operación bloqueada. Tenga a bien abrir primero el turno de caja.');
      return;
    }
    if (isEmitting) return;
    if (!validateInvoice()) return;

    setIsEmitting(true);
    try {
      // 1. Get invoice list to compute correct ticket number
      const currentFacturas = await facturacionService.list();
      const nroTicket = await getNextInvoiceNumber(currentFacturas, tipoComprobante);

      // 2. Map Tipo to AFIP code
      let afipTipoId = 11; // Factura C default
      if (tipoComprobante === 'Factura A') afipTipoId = 1;
      else if (tipoComprobante === 'Factura B') afipTipoId = 6;
      else if (tipoComprobante === 'Ticket') afipTipoId = 206; // Ticket B

      // 3. Build AFIP payload details
      const ivaAlicuotaId = ALICUOTAS_IVA.find(a => a.value === ivaGeneral)?.id || 5;

      const mappedItems = items.map(it => {
        const itemTotal = it.cantidad * it.precioUnitario;
        let itemNet = itemTotal;
        let itemIva = 0;

        if (preciosConIva) {
          itemNet = Number((itemTotal / (1 + (ivaGeneral / 100))).toFixed(2));
          itemIva = Number((itemTotal - itemNet).toFixed(2));
        } else {
          itemIva = Number((itemNet * (ivaGeneral / 100)).toFixed(2));
        }

        return {
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          ivaId: ivaAlicuotaId,
          ivaBase: itemNet,
          ivaImporte: itemIva
        };
      });

      const clientDocNumber = numeroDocumento === '0' ? 0 : parseInt(numeroDocumento.replace(/-/g, '')) || 0;

      // 4. Call Mock AFIP connection
      let afipCae = '';
      let afipVto = '';
      let afipQr = '';

      if (isArcaConfigured() && tipoComprobante !== 'Comprobante X') {
        try {
          const arcaResult = await createArcaInvoice({
            tipoComprobante: afipTipoId,
            puntoVenta: 1,
            cliente: {
              tipoDoc: docTipo,
              nroDoc: clientDocNumber,
              nombre: docTipo === 99 ? 'Consumidor Final' : (tipoComprobante === 'Factura A' ? 'Razon Social Cliente A' : 'Cliente General'),
              condicionIva: condicionIvaReceptor
            },
            items: mappedItems,
            total: calculatedTotals.total,
            neto: calculatedTotals.netoGravado,
            ivaTotal: calculatedTotals.ivaValue
          });

          afipCae = arcaResult?.CodAutorizacion || arcaResult?.CAE || '';
          afipVto = arcaResult?.Vencimiento || arcaResult?.CAEFchVto || '';
          
          if (afipCae) {
            const emitterCuit = getArcaCuit() || 30716492514;
            afipQr = JSON.stringify({
              ver: 1,
              fecha: fechaEmision,
              cuit: emitterCuit,
              ptoVta: 1,
              tipoCmp: afipTipoId,
              nroCmp: parseInt(nroTicket.split('-').pop() || '1'),
              importe: calculatedTotals.total,
              moneda: 'PES',
              ctz: 1,
              tipoDocRec: docTipo,
              nroDocRec: clientDocNumber,
              tipoCodAut: 1,
              codAut: parseInt(afipCae) || 0
            });
          }
        } catch (arcaErr: any) {
          console.warn('ARCA error simulation fallback:', arcaErr);
          toast.warning('ARCA: Conexión fiscal simulada / local debido a fallos remotos.');
        }
      }

      // 5. Build Factura Db structure
      const letterCode = nroTicket.charAt(0);
      const mappedTipoCode: 'ticket' | 'A' | 'B' | 'X' = 
        letterCode === 'A' ? 'A' :
        letterCode === 'B' ? 'B' :
        letterCode === 'X' ? 'X' : 'ticket';

      const invoiceToSave: Factura & { tipo?: 'ticket' | 'A' | 'B' | 'X'; observaciones?: string; fecha_emision?: string } = {
        id_factura: `fac_${Date.now()}`,
        id_pedido: undefined,
        nro_ticket: nroTicket,
        cliente: docTipo === 99 ? 'Consumidor Final' : `Cliente ${numeroDocumento}`,
        cuit: docTipo === 99 ? '99-99999999-9' : numeroDocumento,
        total: calculatedTotals.total,
        iva_veintiuno: calculatedTotals.ivaValue,
        medio_pago: medioPago,
        fecha: `${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`,
        estado: 'emitido',
        afip_cae: afipCae || undefined,
        afip_vto: afipVto || undefined,
        afip_qr: afipQr || undefined,
        afip_resultado: afipCae ? 'A' : undefined,
        tipo: mappedTipoCode,
        observaciones: `Facturación manual libre: ${items.map(i => `${i.cantidad}x ${i.descripcion}`).join(', ')}`,
        fecha_emision: new Date().toISOString()
      };

      // 6. Save in FacturacionService
      await facturacionService.create(invoiceToSave);

      // 7. Update Caja Session Sales totals
      await cajaService.updateSales(calculatedTotals.total, { [medioPago]: calculatedTotals.total });

      // 8. Generate and download PDF
      const pdfItems: TicketItem[] = items.map(it => {
        const itemTotal = it.cantidad * it.precioUnitario;
        const price = preciosConIva 
          ? Number((it.precioUnitario / (1 + (ivaGeneral / 100))).toFixed(2)) 
          : it.precioUnitario;

        return {
          cantidad: it.cantidad,
          descripcion: it.descripcion,
          precio_unitario: price,
          subtotal: it.cantidad * price
        };
      });

      const mappedComprobanteType: TipoComprobante = 
        tipoComprobante === 'Factura A' ? 'factura_a' :
        tipoComprobante === 'Factura B' ? 'factura_b' :
        tipoComprobante === 'Factura C' ? 'factura_c' : 'ticket_consumo';

      const ticketData: TicketData = {
        idPedido: "0",
        nroComprobante: nroTicket,
        tipoComprobante: mappedComprobanteType,
        fechaHora: `${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs`,
        mesa: 'Venta manual',
        mozo: 'Caja',
        cajero: cajaSession.usuario_cajero,
        nombreComercial: restaurante.nombreComercial,
        razonSocial: restaurante.razonSocial,
        cuit: restaurante.cuit,
        direccion: restaurante.direccion,
        telefono: restaurante.telefono,
        email: restaurante.email,
        items: pdfItems,
        subtotal: calculatedTotals.netoGravado,
        descuento: 0,
        propina: 0,
        iva: calculatedTotals.ivaValue,
        total: calculatedTotals.total,
        metodosPago: [{ metodo: medioPago === 'mp_qr' ? 'QR' : medioPago.toUpperCase(), monto: calculatedTotals.total }],
        vuelto: 0,
        mensajePie: restaurante.mensajePie,
        clienteNombre: docTipo === 99 ? 'Consumidor Final' : `Cliente ${numeroDocumento}`,
        clienteCuit: docTipo === 99 ? '99-99999999-9' : numeroDocumento,
        cae: afipCae || undefined,
        vto: afipVto || undefined,
        qrData: afipQr || undefined
      };

      await pdfService.exportToPDF(ticketData);

      // 9. Success Callback
      toast.success(`Comprobante fiscal ${nroTicket} emitido y guardado correctamente.`);
      addLog('sistema', `CAJA: Factura manual ${nroTicket} emitida por ${money(calculatedTotals.total)}.`);
      onEmitSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al emitir factura manual: ${err?.message || err}`);
    } finally {
      setIsEmitting(false);
    }
  };

  return (
    <div className="bg-[#131b2e] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5 text-zinc-100 font-sans animate-fadeIn">
      {/* Panel Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#E8B800]" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider block">Emitir Factura Libre</h3>
            <p className="text-[9px] text-zinc-400 font-semibold">Generador de comprobantes manuales e ítems libres</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>
      </div>

      {/* Caja Closed Warning */}
      {!cajaSession && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] text-amber-450 leading-relaxed font-semibold">
          ⚠️ El turno de caja se encuentra cerrado. Para poder emitir comprobantes y registrarlos contablemente, es necesario abrir primero el turno fiscal.
        </div>
      )}

      {/* Header Fields Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/40 p-4 rounded-xl border border-white/5">
        
        {/* TIPO COMPROBANTE */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Tipo Comprobante</span>
          <select 
            value={tipoComprobante} 
            onChange={e => setTipoComprobante(e.target.value as any)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            <option value="Factura C">Factura C</option>
            <option value="Factura B">Factura B</option>
            <option value="Factura A">Factura A</option>
            <option value="Ticket">Ticket Factura B</option>
            <option value="Comprobante X">Comprobante X</option>
          </select>
        </label>

        {/* CONDICIÓN IVA RECEPTOR */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Condición IVA Receptor</span>
          <select 
            value={condicionIvaReceptor} 
            onChange={e => setCondicionIvaReceptor(parseInt(e.target.value) || 5)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            {CONDICIONES_IVA.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        {/* DOC */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Doc.</span>
          <select 
            value={docTipo} 
            onChange={e => handleDocTipoChange(parseInt(e.target.value) || 99)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            <option value="99">C. Final</option>
            <option value="96">DNI</option>
            <option value="80">CUIT</option>
          </select>
        </label>

        {/* NÚMERO DOCUMENTO */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Número Documento</span>
          <input 
            type="text"
            disabled={docTipo === 99}
            value={numeroDocumento} 
            onChange={e => setNumeroDocumento(e.target.value)} 
            placeholder="Ej: 20-35661223-4"
            className="w-full min-h-10 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>

        {/* CONCEPTO */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Concepto</span>
          <select 
            value={concepto} 
            onChange={e => setConcepto(parseInt(e.target.value) || 1)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            {CONCEPTOS_AFIP.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        {/* IVA GENERAL */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">IVA General</span>
          <select 
            value={ivaGeneral} 
            onChange={e => setIvaGeneral(parseFloat(e.target.value) || 21)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            {ALICUOTAS_IVA.map(a => (
              <option key={a.id} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>

        {/* FECHA DE EMISIÓN */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Fecha de Emisión</span>
          <input 
            type="date"
            value={fechaEmision}
            onChange={e => setFechaEmision(e.target.value)}
            className="w-full min-h-10 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          />
        </label>

        {/* MEDIO DE PAGO */}
        <label className="space-y-1 block">
          <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">Medio de Pago</span>
          <select 
            value={medioPago} 
            onChange={e => setMedioPago(e.target.value as any)} 
            className="w-full min-h-10 p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/30"
          >
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            <option value="tarjeta">Tarjeta Crédito</option>
            <option value="transferencia">Transferencia</option>
            <option value="mp_qr">QR MercadoPago</option>
          </select>
        </label>
      </div>

      {/* Section: Conceptos / Items */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Conceptos / Ítems</h4>
          <button 
            type="button"
            onClick={handleAddItem}
            className="w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-90 transition-all"
            title="Añadir item"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {items.map((it, index) => (
            <div key={it.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-zinc-950/20 p-3 rounded-xl border border-white/5">
              
              {/* DESCRIPCIÓN */}
              <div className="sm:col-span-5 space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wide sm:hidden">Descripción</span>
                <input 
                  type="text" 
                  value={it.descripcion}
                  onChange={e => handleUpdateItem(it.id, 'descripcion', e.target.value)}
                  placeholder="Ej: Programacion sistion web"
                  className="w-full min-h-9 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#E8B800]/20"
                />
              </div>

              {/* U. MEDIDA */}
              <div className="sm:col-span-3 space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wide sm:hidden">U. Medida</span>
                <select 
                  value={it.unidadMedida}
                  onChange={e => handleUpdateItem(it.id, 'unidadMedida', e.target.value)}
                  className="w-full min-h-9 p-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none"
                >
                  {UNIDADES_MEDIDA.map(um => (
                    <option key={um.id} value={um.label}>{um.label}</option>
                  ))}
                </select>
              </div>

              {/* CANT */}
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wide sm:hidden">Cant.</span>
                <input 
                  type="number"
                  min="0.01"
                  step="any"
                  value={it.cantidad || ''}
                  onChange={e => handleUpdateItem(it.id, 'cantidad', parseFloat(e.target.value) || 0)}
                  className="w-full min-h-9 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-center font-bold text-white focus:outline-none"
                />
              </div>

              {/* P. UNITARIO */}
              <div className="sm:col-span-1.5 space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wide sm:hidden">P. Unitario</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-zinc-500 text-xs">$</span>
                  <input 
                    type="number"
                    min="0"
                    step="any"
                    value={it.precioUnitario || ''}
                    onChange={e => handleUpdateItem(it.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="w-full min-h-9 pl-5 pr-1 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-center font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* DELETE */}
              <div className="sm:col-span-0.5 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(it.id)}
                  className="w-8 h-8 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center cursor-pointer transition-colors"
                  title="Eliminar fila"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Calculations & Totals display */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-950/65 p-4 rounded-xl border border-white/5">
        
        {/* IVA Inclusion Checkbox */}
        <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={preciosConIva} 
            onChange={e => setPreciosConIva(e.target.checked)} 
            className="w-4 h-4 accent-[#E8B800] rounded"
          />
          Precios de conceptos con IVA incluido
        </label>

        {/* Calculated metrics */}
        <div className="flex gap-4 sm:gap-6 justify-between sm:justify-end text-xs font-semibold text-zinc-400">
          <div className="text-left sm:text-right">
            <span className="text-[8px] uppercase font-black text-zinc-400 block">Neto Gravado</span>
            <span className="font-mono text-zinc-200 text-sm font-bold">{money(calculatedTotals.netoGravado)}</span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[8px] uppercase font-black text-zinc-400 block">IVA ({ivaGeneral}%)</span>
            <span className="font-mono text-zinc-200 text-sm font-bold">{money(calculatedTotals.ivaValue)}</span>
          </div>

          <div className="text-left sm:text-right border-l border-white/10 pl-4 sm:pl-6">
            <span className="text-[8px] uppercase font-black text-[#E8B800] block">Total General</span>
            <span className="font-mono text-[#E8B800] text-base font-black">{money(calculatedTotals.total)}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onClose}
          className="w-full sm:w-1/3 min-h-11 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase rounded-xl transition-colors cursor-pointer border border-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={handleEmitInvoice}
          disabled={isEmitting || !cajaSession}
          className="w-full sm:w-2/3 min-h-11 py-2.5 bg-[#E8B800] hover:bg-[#D4A700] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-xs font-black uppercase rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 glow-yellow border-0 active:scale-95"
        >
          <CheckCircle className="w-4 h-4 text-zinc-950" />
          {isEmitting ? 'Emitiendo...' : `Emitir y descargar PDF`}
        </button>
      </div>
    </div>
  );
}
