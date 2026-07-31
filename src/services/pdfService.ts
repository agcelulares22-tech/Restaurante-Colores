import { jsPDF } from 'jspdf';
import { TicketData, TicketItem } from '../types';

let logoDataUrlCache: string | null | undefined;

const BRAND = {
  brown: [98, 74, 62] as const,
  dark: [35, 31, 28] as const,
  cream: [245, 241, 233] as const,
  muted: [120, 113, 108] as const,
  line: [219, 213, 204] as const
};

const money = (value: number) => `$${Number(value || 0).toLocaleString('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const itemUnit = (item: TicketItem) => item.precio_unitario ?? item.precioUnitario ?? 0;

const loadLogoDataUrl = async () => {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;

  try {
    if (typeof window !== 'undefined') {
      const customLogo = localStorage.getItem('colores_pizzeria_custom_logo');
      if (customLogo) {
        logoDataUrlCache = customLogo;
        return logoDataUrlCache;
      }
    }

    const response = await fetch('/logo-colores-pizzeria.png');
    const blob = await response.blob();
    logoDataUrlCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('No se pudo cargar el logo para PDF:', err);
    logoDataUrlCache = null;
  }

  return logoDataUrlCache;
};

const loadQrDataUrl = async (qrDataText: string | undefined): Promise<string | null> => {
  if (!qrDataText) return null;
  try {
    let qrUrl = qrDataText;
    if (qrDataText.startsWith('{')) {
      try {
        const base64 = btoa(unescape(encodeURIComponent(qrDataText)));
        qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
      } catch (e) {
        console.warn('Error converting QR JSON to Base64:', e);
      }
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('No se pudo obtener el QR de AFIP/ARCA, usando fallback:', err);
    return null;
  }
};

const addLogo = (doc: jsPDF, logo: string | null, x: number, y: number, size: number) => {
  if (!logo) return;
  try {
    const isPng = logo.includes('iVBORw');
    const format = isPng ? 'PNG' : 'JPEG';
    doc.addImage(logo, format, x, y, size, size);
  } catch (err) {
    console.warn('No se pudo insertar el logo en PDF:', err);
  }
};

const sanitizeFile = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');

export const pdfService = {
  async exportToPDF(data: TicketData, forceWidth?: 58 | 80): Promise<void> {
    const doc = await this.generateTicketPDF(data, forceWidth);
    const compType = (data.tipoComprobante || '').toLowerCase();
    const isNC = compType.includes('nota_credito');
    const filename = compType.startsWith('factura')
      ? `factura-pizzeria-colores-${sanitizeFile(data.nroComprobante)}.pdf`
      : isNC
        ? `nota-credito-pizzeria-colores-${sanitizeFile(data.nroComprobante)}.pdf`
        : `ticket-pizzeria-colores-${sanitizeFile(data.nroComprobante || String(data.idPedido))}.pdf`;
    doc.save(filename);
  },

  async generateTicketPDF(data: TicketData, forceWidth?: 58 | 80): Promise<jsPDF> {
    const logo = await loadLogoDataUrl();
    const qrImage = await loadQrDataUrl(data.qrData);

    // Si es una factura de AFIP (factura_a, factura_b, factura_c, libre), exportarla en formato A4
    const compType = (data.tipoComprobante || '').toLowerCase();
    if (
      compType.includes('factura') || 
      compType.includes('nota_credito') || 
      compType.includes('nota_debito')
    ) {
      return this.generateA4Invoice(data, logo, qrImage);
    }

    let width: 58 | 80 = forceWidth || 80;
    if (!forceWidth) {
      try {
        const raw = localStorage.getItem('colores_pizzeria_printer_config');
        if (raw) {
          const config = JSON.parse(raw);
          if (config.paperWidth === '58mm') {
            width = 58;
          }
        }
      } catch (e) {}
    }

    // For Colores Pizza, they want ONLY thermal tickets for their tiketera
    return this.generateThermalTicket(data, logo, qrImage, width);
  },

  generateA4Invoice(data: TicketData, logo: string | null, qrImage: string | null): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    let y = 14;
    const compType = (data.tipoComprobante || '').toLowerCase();
    const isNC = compType.includes('nota_credito');
    
    let letter = 'B';
    let codComprobante = isNC ? 'COD. 008' : 'COD. 006';
    if (compType === 'factura_a' || compType === 'nota_credito_a') {
      letter = 'A';
      codComprobante = isNC ? 'COD. 003' : 'COD. 001';
    } else if (compType === 'factura_b' || compType === 'nota_credito_b') {
      letter = 'B';
      codComprobante = isNC ? 'COD. 008' : 'COD. 006';
    } else if (compType === 'factura_c' || compType === 'nota_credito_c') {
      letter = 'C';
      codComprobante = isNC ? 'COD. 013' : 'COD. 011';
    } else if (compType === 'ticket_a') {
      letter = 'A';
      codComprobante = 'COD. 201';
    } else if (compType === 'ticket_b') {
      letter = 'B';
      codComprobante = 'COD. 206';
    }

    const cliente = data.clienteNombre || 'Consumidor Final';
    const clienteCuit = data.clienteCuit || (data.clienteDniCuit || '99-99999999-9');
    const fechaEmision = data.fechaHora.split(' ')[0] || new Date().toLocaleDateString('es-AR');

    const formatAfipDate = (dateStr?: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('/')) return dateStr;
      if (dateStr.length === 8) {
        return `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;
      }
      return dateStr;
    };

    const moneyNoSign = (val: number) => money(val).replace('$', '').trim();
    const formatNumber = moneyNoSign;

    // 1. Recuadro ORIGINAL en la parte superior
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, 182, 6, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('ORIGINAL', margin + 91, y + 4.5, { align: 'center' });
    y += 6;

    // 2. Cabezal Principal Dividido (Alto: 38mm)
    const headerY = y;
    const headerHeight = 38;
    doc.rect(margin, headerY, 182, headerHeight, 'D');

    // Cuadro central de tipo de factura (Letra A/B/C)
    const xCenter = margin + 91; // 105
    const wLetterBox = 20;
    const hLetterBox = 18;
    const xLetterBox = xCenter - (wLetterBox / 2); // 95
    doc.rect(xLetterBox, headerY, wLetterBox, hLetterBox, 'D');
    
    // Letra grande
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(letter, xCenter, headerY + 10, { align: 'center' });
    
    // Línea divisoria interna
    doc.line(xLetterBox, headerY + 12, xLetterBox + wLetterBox, headerY + 12);
    
    // Código del comprobante
    doc.setFontSize(7.5);
    doc.text(codComprobante, xCenter, headerY + 15.5, { align: 'center' });

    // Línea divisoria vertical desde el final del cuadro de la letra hasta abajo
    doc.line(xCenter, headerY + hLetterBox, xCenter, headerY + headerHeight);

    // Escribir datos del Emisor (Columna Izquierda)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.razonSocial.toUpperCase(), margin + 4, headerY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Razón Social: ${data.razonSocial}`, margin + 4, headerY + 12);
    
    const domText = `Domicilio Comercial: Alvear 1362, X5800 Río Cuarto, Córdoba`;
    const domLines = doc.splitTextToSize(domText, 72);
    doc.text(domLines, margin + 4, headerY + 17);
    
    doc.text('Condición frente al IVA: IVA Responsable Inscripto', margin + 4, headerY + 28);

    // Escribir datos del Comprobante (Columna Derecha) - Desplazado a la derecha (x = 118) para evitar superposición con el cuadro de la letra
    const rightColX = xCenter + 13; // 118
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(isNC ? 'NOTA DE CRÉDITO' : 'FACTURA', rightColX, headerY + 6);

    const parts = (data.nroComprobante || '').split('-');
    const ptoVtaStr = parts.length === 3 ? parts[1] : '00003';
    const compNroStr = parts.length === 3 ? parts[2] : String(data.nroComprobante || '1').padStart(8, '0');

    doc.setFontSize(9);
    doc.text(`Punto de Venta: ${ptoVtaStr}    Comp. Nro: ${compNroStr}`, rightColX, headerY + 12);
    doc.text(`Fecha de Emisión: ${fechaEmision}`, rightColX, headerY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`CUIT: ${data.cuit.replace(/-/g, '')}`, rightColX, headerY + 22);
    doc.text(`Ingresos Brutos: ${data.razonSocial}`, rightColX, headerY + 27);
    doc.text(`Fecha de Inicio de Actividades: 01/10/2025`, rightColX, headerY + 32);

    y += headerHeight;

    // 3. Recuadro Períodos Facturados (Alto: 6.5mm)
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, y, 182, 6.5, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Período Facturado Desde: ${fechaEmision}`, margin + 4, y + 4.5);
    doc.text(`Hasta: ${fechaEmision}`, margin + 70, y + 4.5);
    doc.text(`Fecha de Vto. para el pago: ${fechaEmision}`, margin + 120, y + 4.5);
    y += 6.5;

    // 4. Recuadro de Datos del Receptor (Alto: 18mm) - Desplazada la columna derecha a x = 95 para evitar superposiciones
    y += 2;
    doc.rect(margin, y, 182, 18, 'D');
    
    // Fila 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CUIT:', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(clienteCuit, margin + 14, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Apellido y Nombre / Razón Social:', margin + 65, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(cliente.slice(0, 40), margin + 115, y + 5);

    // Fila 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Condición frente al IVA:', margin + 4, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const condIvaReceptor = letter === 'A' ? 'IVA Responsable Inscripto' : 'Consumidor Final';
    doc.text(condIvaReceptor, margin + 38, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Domicilio Comercial:', margin + 65, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('-', margin + 95, y + 10);

    // Fila 3
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Condición de venta:', margin + 4, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const condVenta = data.metodosPago.map(mp => mp.metodo.toUpperCase()).join(' + ') || 'EFECTIVO';
    doc.text(condVenta, margin + 33, y + 15);

    y += 18;

    // 5. Tabla de Productos (Estilo Oficial AFIP: Abierta en laterales y sin grilla vertical)
    y += 3;
    const colPositions = [26, 86, 98, 113, 131, 143, 161, 176];
    
    const drawTableHeader = (currentY: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(235, 235, 235);
      // Rectángulo relleno para la cabecera (dibujamos líneas superior e inferior)
      doc.rect(margin, currentY, 182, 7.5, 'F');
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, margin + 182, currentY);
      doc.line(margin, currentY + 7.5, margin + 182, currentY + 7.5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);

      doc.text('Código', 15, currentY + 4.8);
      doc.text('Producto / Servicio', 27, currentY + 4.8);
      doc.text('Cantidad', 96, currentY + 4.8, { align: 'right' });
      doc.text('U. medida', 105.5, currentY + 4.8, { align: 'center' });
      doc.text('Precio Unit.', 129, currentY + 4.8, { align: 'right' });
      doc.text('% Bonif', 141, currentY + 4.8, { align: 'right' });
      doc.text('Subtotal', 159, currentY + 4.8, { align: 'right' });
      doc.text('Alícuota IVA', 168.5, currentY + 4.8, { align: 'center' });
      doc.text('Subtotal c/IVA', 194, currentY + 4.8, { align: 'right' });
    };

    drawTableHeader(y);
    y += 7.5;

    // Dibujado de Items (Sin grillas ni líneas por fila, solo lista abierta sobre blanco)
    const rowHeight = 7;
    
    data.items.forEach((item, i) => {
      if (y > 205) {
        doc.addPage();
        y = 18;
        drawTableHeader(y);
        y += 7.5;
      }

      const isExemptOrC = letter === 'C';
      const netPrice = isExemptOrC ? itemUnit(item) : (itemUnit(item) / 1.21);
      const netSubtotal = isExemptOrC ? item.subtotal : (item.subtotal / 1.21);
      const alicuota = isExemptOrC ? '0%' : '21%';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);

      doc.text(String(i + 1).padStart(3, '0'), 15, y + 5.0);
      doc.text(item.descripcion.slice(0, 42), 27, y + 5.0);
      doc.text(String(item.cantidad), 96, y + 5.0, { align: 'right' });
      doc.text('unidades', 105.5, y + 5.0, { align: 'center' });
      doc.text(formatNumber(netPrice), 129, y + 5.0, { align: 'right' });
      doc.text('0,00', 141, y + 5.0, { align: 'right' });
      doc.text(formatNumber(netSubtotal), 159, y + 5.0, { align: 'right' });
      doc.text(alicuota, 168.5, y + 5.0, { align: 'center' });
      doc.text(formatNumber(item.subtotal), 194, y + 5.0, { align: 'right' });

      y += rowHeight;
    });

    y += 4;
    if (y > 195) {
      doc.addPage();
      y = 18;
    }

    // 6. Recuadro de Totales e Impuestos (Alto: 40mm) - Spacing ampliado para evitar superposición
    const isFacturaC = letter === 'C';
    const totalVal = data.total;
    const netVal = isFacturaC ? totalVal : (data.neto || (totalVal / 1.21));
    const ivaVal = isFacturaC ? 0 : (data.iva || (totalVal - netVal));

    const totalsY = y;
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, totalsY, 182, 40, 'D');

    // Izquierda del Recuadro de Totales
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Importe Otros Tributos: $', margin + 25, totalsY + 20);
    doc.text('0,00', margin + 62, totalsY + 20);

    // Derecha del Recuadro de Totales
    const rightLabelsX = margin + 115;
    const rightValuesX = margin + 178;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Importe Neto Gravado: $', rightLabelsX, totalsY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(moneyNoSign(isFacturaC ? 0 : netVal), rightValuesX, totalsY + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 27%: $', rightLabelsX, totalsY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 9, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 21%: $', rightLabelsX, totalsY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(moneyNoSign(isFacturaC ? 0 : ivaVal), rightValuesX, totalsY + 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 10.5%: $', rightLabelsX, totalsY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 17, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 5%: $', rightLabelsX, totalsY + 21);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 21, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 2.5%: $', rightLabelsX, totalsY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 25, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IVA 0%: $', rightLabelsX, totalsY + 29);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 29, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Importe Otros Tributos: $', rightLabelsX, totalsY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('0,00', rightValuesX, totalsY + 33, { align: 'right' });

    // Fila Total Destacada
    doc.line(rightLabelsX, totalsY + 35.5, rightValuesX, totalsY + 35.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Importe Total: $', rightLabelsX, totalsY + 38.5);
    doc.text(moneyNoSign(totalVal), rightValuesX, totalsY + 38.5, { align: 'right' });

    y += 44;

    // 7. Pie de Página Oficial Fijo al Fondo (CAE + QR + ARCA)
    const footerY = 255;

    // Línea superior del pie de página
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2, margin + 182, footerY - 2);

    // Renderizado QR
    if (qrImage) {
      try {
        doc.addImage(qrImage, 'PNG', margin, footerY, 24, 24);
      } catch (err) {
        doc.rect(margin, footerY, 24, 24);
        doc.setFontSize(6);
        doc.text('AFIP QR', margin + 5, footerY + 12);
      }
    } else {
      doc.rect(margin, footerY, 24, 24);
      doc.setFontSize(6);
      doc.text('AFIP QR', margin + 5, footerY + 12);
    }

    // ARCA Branding y Leyenda
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ARCA', margin + 28, footerY + 6);
    
    doc.setFontSize(6);
    doc.text('Agencia de Recaudación y Control Aduanero', margin + 28, footerY + 9);
    
    doc.setFontSize(9);
    doc.text('Comprobante Autorizado', margin + 28, footerY + 14);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5);
    doc.setTextColor(100, 100, 100);
    doc.text('Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación', margin + 28, footerY + 18);

    // Número de página centrado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Pág. 1/1', margin + 91, footerY + 22, { align: 'center' });

    // CAE y Vencimiento a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CAE N°: ${data.cae || ''}`, margin + 120, footerY + 6);
    doc.text(`Fecha de Vto. de CAE: ${formatAfipDate(data.vto)}`, margin + 120, footerY + 12);

    return doc;
  },

  generateThermalTicket(data: TicketData, logo: string | null, qrImage: string | null = null, forceWidth?: 58 | 80): jsPDF {
    const width = forceWidth || 80;
    const is58 = width === 58;
    const pageWidth = is58 ? 58 : 80;
    const margin = is58 ? 3 : 4;
    const centerCol = pageWidth / 2;
    const rightAlignCol = pageWidth - margin;

    const wrappedRows = data.items.map(item => ({
      item,
      lines: Math.max(1, Math.ceil(item.descripcion.length / (is58 ? 16 : 22)))
    }));
    
    const compType = (data.tipoComprobante || '') as string;
    const isFactura = compType === 'factura_a' || compType === 'factura_b' || compType === 'factura_c' || compType.includes('nota_credito');
    const itemsHeight = wrappedRows.reduce((sum, row) => sum + row.lines * (is58 ? 3.4 : 4.2) + 6, 0);
    const paymentsHeight = ((data.metodosPago?.length || 0) + 3) * (is58 ? 4.0 : 4.5);
    
    const baseHeight = isFactura ? (is58 ? 150 : 175) : (is58 ? 110 : 130);
    const ticketHeight = Math.max(
      is58 ? 140 : 160,
      baseHeight + itemsHeight + paymentsHeight
    );

    const doc = new jsPDF('p', 'mm', [pageWidth, ticketHeight]);

    const formatMoneyVal = (val: number) => {
      return Number(val || 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const renderSingleCopy = (copyIndex: number) => {
      if (copyIndex > 0) {
        doc.addPage([pageWidth, ticketHeight], 'p');
      }
      let y = 6;

      const centerText = (text: string, size = 8.5, bold = false) => {
        doc.setFont('courier', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(20, 20, 20);
        const lines = String(text).split('\n');
        lines.forEach(lineText => {
          doc.text(lineText, centerCol, y, { align: 'center' });
          y += size * 0.4 + 1.2;
        });
      };

      const lineDivider = (char = '-') => {
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const lineStr = char.repeat(is58 ? 32 : 42);
        doc.text(lineStr, centerCol, y, { align: 'center' });
        y += 3.5;
      };

      const rowTwoCols = (left: string, right: string, bold = false, size = 8) => {
        doc.setFont('courier', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(20, 20, 20);
        doc.text(left, margin, y);
        doc.text(right, rightAlignCol, y, { align: 'right' });
        y += size * 0.45 + 1.2;
      };

      // 1. Header (Nombre, Dirección, Título)
      centerText(data.nombreComercial || 'Colores Pizza', 11, true);
      centerText('Alvear 1362', 8.5, false);

      const rawMesa = data.mesa || 'Consumo';
      const formattedMesa = rawMesa.toUpperCase().includes('TICKET')
        ? rawMesa
        : `Ticket (${rawMesa})`;
      centerText(formattedMesa, 9.5, true);
      y += 1;
      lineDivider('-');

      // 2. Metadata Block (Comanda, Fecha, Comensales, Camarero)
      rowTwoCols('Comanda', String(data.idPedido || data.nroComprobante || ''));
      rowTwoCols('Fecha', data.fechaHora || '');
      rowTwoCols('Comensales', String(data.comensales || 1));
      rowTwoCols('Camarero', data.mozo || 'Agustín Gilardi');
      lineDivider('-');

      // 3. Table Headers (Cant Producto Total)
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text('Cant', margin, y);
      doc.text('Producto', margin + 7, y);
      doc.text('Total', rightAlignCol, y, { align: 'right' });
      y += 4;
      lineDivider('-');

      // 4. Item Rows
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      data.items.forEach(it => {
        const qtyStr = String(it.cantidad);
        const subtotalStr = formatMoneyVal(it.subtotal);
        const desc = it.descripcion;

        doc.text(qtyStr, margin, y);

        const descMaxWidth = rightAlignCol - margin - 26;
        const descLines = doc.splitTextToSize(desc, descMaxWidth) as string[];
        descLines.forEach((dLine, idx) => {
          doc.text(dLine, margin + 7, y + (idx * 3.5));
        });

        doc.text(subtotalStr, rightAlignCol, y, { align: 'right' });
        y += Math.max(1, descLines.length) * 3.5 + 1.5;
      });

      lineDivider('-');

      // 5. Total General Mesa
      rowTwoCols('Total General Mesa', formatMoneyVal(data.total), true, 9);
      y += 1;

      // 6. Payment Methods & Change
      if (data.metodosPago && data.metodosPago.length > 0) {
        data.metodosPago.forEach(mp => {
          rowTwoCols(mp.metodo.toUpperCase(), formatMoneyVal(mp.monto), false, 8);
        });
        const totalPagos = data.metodosPago.reduce((s, mp) => s + mp.monto, 0);
        rowTwoCols('Total Pagos', formatMoneyVal(totalPagos), true, 8.5);
        rowTwoCols('Cambio', formatMoneyVal(data.vuelto || 0), false, 8);
        lineDivider('-');
      }

      // 7. Footer
      y += 1;
      centerText('¡Gracias por su preferencia!', 8.5, true);
    };

    // Render DOUBLE COPY (2 COPIES for thermal printer)
    renderSingleCopy(0); // Copy 1
    renderSingleCopy(1); // Copy 2

    return doc;
  },

  async exportShiftClosePDF(data: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    let y = 14;

    const isReporteX = !data.fecha_cierre || data.fecha_cierre.toLowerCase().includes('curso');

    let nombreFantasia = 'Colores Pizza';
    let direccion = 'Alvear 1362, X5800 Río Cuarto, Córdoba';
    let telefono = '+54 358 4123456';
    let email = 'contacto@pizzeriacolores.com.ar';
    try {
      const saved = localStorage.getItem('colores_pizzeria_restaurante_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        nombreFantasia = parsed.nombreComercial || nombreFantasia;
        direccion = parsed.direccion || direccion;
        telefono = parsed.telefono || telefono;
        email = parsed.email || email;
      }
    } catch (e) {}

    // Top Accent Line
    doc.setFillColor(...BRAND.brown);
    doc.rect(margin, y, 182, 1.5, 'F');
    y += 4;

    // Header Content
    const logo = await loadLogoDataUrl();
    if (logo) {
      addLogo(doc, logo, margin, y, 22);
    }
    
    const detailsX = logo ? margin + 26 : margin;

    doc.setTextColor(...BRAND.brown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    const titleText = isReporteX 
      ? `${nombreFantasia.toUpperCase()} - REPORTE PARCIAL (X)` 
      : `${nombreFantasia.toUpperCase()} - CIERRE DE CAJA (Z)`;
    doc.text(titleText, detailsX, y + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.dark);
    doc.text(isReporteX ? 'ARQUEO PARCIAL DE CONTROL EN TURNO' : 'REPORTE CONTROL DE JORNADA FISCAL GASTRO', detailsX, y + 10);
    doc.setTextColor(...BRAND.muted);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, detailsX, y + 14);
    doc.text(`${direccion} | Tel: ${telefono}`, detailsX, y + 18);

    // Decorative Type Indicator
    doc.setFillColor(...BRAND.cream);
    doc.rect(margin + 152, y, 30, 20, 'F');
    doc.setDrawColor(...BRAND.brown);
    doc.setLineWidth(0.3);
    doc.rect(margin + 152, y, 30, 20, 'D');

    doc.setTextColor(...BRAND.brown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(isReporteX ? 'X' : 'Z', margin + 167, y + 12, { align: 'center' });
    doc.setTextColor(...BRAND.dark);
    doc.setFontSize(6.5);
    doc.text(isReporteX ? 'PARCIAL' : 'FISCAL', margin + 167, y + 17, { align: 'center' });

    y += 26;
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + 182, y);
    y += 6;

    // Cajero info table
    doc.setTextColor(...BRAND.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS DE LA SESIÓN DE CAJA', margin, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(`Responsable Cajero: ${data.usuario_cajero}`, margin, y);
    doc.text(`ID Sesión: ${data.id_cierre}`, margin + 95, y);
    y += 4.5;
    doc.text(`Apertura Turno: ${data.fecha_apertura}`, margin, y);
    doc.text(`Cierre Turno: ${data.fecha_cierre || 'En curso (Reporte X)'}`, margin + 95, y);
    y += 8;

    // Balance summary
    const movimientos = data.movimientos_manuales || [];
    const sumIngresos = movimientos.filter((m: any) => m.tipo === 'ingreso').reduce((s: number, m: any) => s + m.monto, 0);
    const sumEgresos = movimientos.filter((m: any) => m.tipo === 'egreso').reduce((s: number, m: any) => s + m.monto, 0);
    const esperado = data.monto_apertura + data.monto_ventas + sumIngresos - sumEgresos;

    // Conciliación Box
    doc.setFillColor(...BRAND.cream);
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, 182, 42, 'FD');
    
    doc.setTextColor(...BRAND.brown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CONCILIACIÓN Y ARQUEO DE VALORES', margin + 4, y + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.dark);
    doc.text(`(+) Saldo Inicial Apertura Caja:`, margin + 4, y + 13);
    doc.text(`${money(data.monto_apertura)}`, margin + 178, y + 13, { align: 'right' });

    doc.text(`(+) Ventas Registradas en Turno:`, margin + 4, y + 19);
    doc.text(`${money(data.monto_ventas)}`, margin + 178, y + 19, { align: 'right' });

    doc.text(`(+) Ingresos Manuales (Caja Chica):`, margin + 4, y + 25);
    doc.text(`${money(sumIngresos)}`, margin + 178, y + 25, { align: 'right' });

    doc.text(`(-) Egresos Manuales (Caja Chica):`, margin + 4, y + 31);
    doc.text(`-${money(sumEgresos)}`, margin + 178, y + 31, { align: 'right' });

    doc.setDrawColor(...BRAND.line);
    doc.line(margin + 4, y + 34, margin + 178, y + 34);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.brown);
    doc.text(`(=) Saldo Teórico Esperado:`, margin + 4, y + 39);
    doc.text(`${money(esperado)}`, margin + 178, y + 39, { align: 'right' });

    y += 46;

    // Real cash count
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(...BRAND.line);
    doc.rect(margin, y, 182, 16, 'FD');
    
    doc.setTextColor(...BRAND.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(isReporteX ? `(=) Saldo Estimado Físico:` : `(=) Arqueo Físico Declarado:`, margin + 4, y + 6);
    doc.text(`${money(data.monto_real || esperado)}`, margin + 178, y + 6, { align: 'right' });

    const diff = isReporteX ? 0 : (data.diferencia ?? 0);
    const hasDiffErr = diff !== 0;
    if (hasDiffErr) {
      doc.setTextColor(190, 24, 24); // Red warning color
    } else {
      doc.setTextColor(21, 128, 61); // Green success color
    }
    doc.text(`(±) Diferencia Conciliación de Caja:`, margin + 4, y + 12);
    doc.text(`${diff > 0 ? '+' : ''}${money(diff)}`, margin + 178, y + 12, { align: 'right' });

    y += 22;

    // Petty Cash movements section
    if (movimientos.length > 0) {
      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Detalle de Movimientos de Caja Chica', margin, y);
      y += 5;

      doc.setFillColor(...BRAND.brown);
      doc.rect(margin, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Fecha/Hora', margin + 4, y + 4.8);
      doc.text('Concepto / Descripción', margin + 45, y + 4.8);
      doc.text('Tipo', margin + 130, y + 4.8);
      doc.text('Monto ($)', margin + 178, y + 4.8, { align: 'right' });
      y += 7.5;

      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'normal');
      movimientos.forEach((m: any, idx: number) => {
        const rowHeight = 7;
        if (y > 270) {
          doc.addPage();
          y = 14;
          doc.setFillColor(...BRAND.brown);
          doc.rect(margin, y, 182, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Fecha/Hora', margin + 4, y + 4.8);
          doc.text('Concepto / Descripción', margin + 45, y + 4.8);
          doc.text('Tipo', margin + 130, y + 4.8);
          doc.text('Monto ($)', margin + 178, y + 4.8, { align: 'right' });
          y += 7.5;
          doc.setTextColor(...BRAND.dark);
          doc.setFont('helvetica', 'normal');
        }
        
        if (idx % 2 === 1) {
          doc.setFillColor(250, 248, 245);
          doc.rect(margin, y - 5, 182, rowHeight, 'F');
        }
        
        doc.setDrawColor(...BRAND.line);
        doc.setLineWidth(0.1);
        doc.line(margin, y + rowHeight - 5, margin + 182, y + rowHeight - 5);

        const timeStr = new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
        doc.text(timeStr, margin + 4, y);
        const descriptionStr = m.responsable 
          ? `${m.concepto.slice(0, 32)} (${m.responsable.toUpperCase()})` 
          : m.concepto.slice(0, 45);
        doc.text(descriptionStr, margin + 45, y);
        doc.text(m.tipo.toUpperCase(), margin + 130, y);
        doc.text(money(m.monto), margin + 178, y, { align: 'right' });
        y += rowHeight;
      });
      y += 6;
    }

    // Payment details if registers are present
    if (data.registros_totales) {
      if (y > 240) {
        doc.addPage();
        y = 14;
      }
      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Desglose de Ventas por Medio de Pago', margin, y);
      y += 5;

      doc.setFillColor(...BRAND.brown);
      doc.rect(margin, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Medio de Pago', margin + 4, y + 4.8);
      doc.text('Total Acumulado ($)', margin + 178, y + 4.8, { align: 'right' });
      y += 7.5;

      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'normal');
      const medios = [
        { key: 'efectivo', label: 'Efectivo' },
        { key: 'debito', label: 'Tarjeta de Débito' },
        { key: 'credito', label: 'Tarjeta de Crédito' },
        { key: 'transferencia', label: 'Transferencia Bancaria' },
        { key: 'mercadopago', label: 'MercadoPago QR' }
      ];

      medios.forEach((m, idx) => {
        const val = (data.registros_totales as any)[m.key] || 0;
        const rowHeight = 7;
        if (y > 270) {
          doc.addPage();
          y = 14;
          doc.setFillColor(...BRAND.brown);
          doc.rect(margin, y, 182, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Medio de Pago', margin + 4, y + 4.8);
          doc.text('Total Acumulado ($)', margin + 178, y + 4.8, { align: 'right' });
          y += 7.5;
          doc.setTextColor(...BRAND.dark);
          doc.setFont('helvetica', 'normal');
        }
        
        if (idx % 2 === 1) {
          doc.setFillColor(250, 248, 245);
          doc.rect(margin, y - 5, 182, rowHeight, 'F');
        }
        
        doc.setDrawColor(...BRAND.line);
        doc.setLineWidth(0.1);
        doc.line(margin, y + rowHeight - 5, margin + 182, y + rowHeight - 5);

        doc.text(m.label, margin + 4, y);
        doc.text(money(val), margin + 178, y, { align: 'right' });
        y += rowHeight;
      });
      y += 6;
    }

    // Resumen de Artículos / Comidas Vendidas
    if (data.desglose_productos && data.desglose_productos.length > 0) {
      if (y > 220) {
        doc.addPage();
        y = 14;
      }
      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Resumen de Artículos / Comidas Vendidas', margin, y);
      y += 5;

      doc.setFillColor(...BRAND.brown);
      doc.rect(margin, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Artículo / Producto', margin + 4, y + 4.8);
      doc.text('Cant.', margin + 130, y + 4.8, { align: 'right' });
      doc.text('Total Acumulado ($)', margin + 178, y + 4.8, { align: 'right' });
      y += 7.5;

      doc.setTextColor(...BRAND.dark);
      doc.setFont('helvetica', 'normal');
      data.desglose_productos.forEach((item: any, idx: number) => {
        const rowHeight = 7;
        if (y > 270) {
          doc.addPage();
          y = 14;
          doc.setFillColor(...BRAND.brown);
          doc.rect(margin, y, 182, 7, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text('Artículo / Producto', margin + 4, y + 4.8);
          doc.text('Cant.', margin + 130, y + 4.8, { align: 'right' });
          doc.text('Total Acumulado ($)', margin + 178, y + 4.8, { align: 'right' });
          y += 7.5;
          doc.setTextColor(...BRAND.dark);
          doc.setFont('helvetica', 'normal');
        }
        
        if (idx % 2 === 1) {
          doc.setFillColor(250, 248, 245);
          doc.rect(margin, y - 5, 182, rowHeight, 'F');
        }
        
        doc.setDrawColor(...BRAND.line);
        doc.setLineWidth(0.1);
        doc.line(margin, y + rowHeight - 5, margin + 182, y + rowHeight - 5);

        doc.text(String(item.nombre).slice(0, 50), margin + 4, y);
        doc.text(String(item.cantidad), margin + 130, y, { align: 'right' });
        doc.text(money(item.total), margin + 178, y, { align: 'right' });
        y += rowHeight;
      });
      y += 6;
    }

    // Observations
    if (y > 220) {
      doc.addPage();
      y = 14;
    }
    
    doc.setTextColor(...BRAND.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('OBSERVACIONES DE CIERRE', margin, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    const obsText = data.observaciones || 'Sin observaciones asentadas.';
    const splitObs = doc.splitTextToSize(obsText, 180);
    doc.text(splitObs, margin, y);
    
    y += (splitObs.length * 4) + 18;

    // Signature Lines
    if (y > 260) {
      doc.addPage();
      y = 30;
    }
    
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.25);
    doc.line(margin + 10, y, margin + 70, y);
    doc.line(margin + 110, y, margin + 170, y);
    y += 4.5;
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.dark);
    doc.text(isReporteX ? 'Firma Supervisor Turno' : 'Firma Cajero Responsable', margin + 40, y, { align: 'center' });
    doc.text('Firma Gerente / Auditor', margin + 140, y, { align: 'center' });

    const filename = isReporteX ? `reporte-x-caja-${data.id_cierre}.pdf` : `arqueo-cierre-caja-${data.id_cierre}.pdf`;
    doc.save(filename);
  },

  async exportPreparationTicketPDF(pedido: any, tipo: 'cocina' | 'barra'): Promise<void> {
    const isBarItem = (it: any) => {
      const cat = (it.categoria || '').toLowerCase();
      const nom = (it.nombre || '').toLowerCase();
      return (
        cat.includes('bebida') ||
        cat.includes('bodega') ||
        cat.includes('vino') ||
        nom.includes('vino') ||
        nom.includes('gaseosa') ||
        nom.includes('agua') ||
        nom.includes('cerveza')
      );
    };

    const filteredItems = pedido.items.filter((it: any) => {
      const isBar = isBarItem(it);
      return tipo === 'barra' ? isBar : !isBar;
    });

    if (filteredItems.length === 0) {
      throw new Error(`No hay productos de ${tipo === 'barra' ? 'Barra' : 'Cocina'} en este pedido.`);
    }

    const wrappedRows = filteredItems.map((item: any) => ({
      item,
      lines: Math.max(1, Math.ceil(item.nombre.length / 22))
    }));
    
    const ticketHeight = Math.max(
      110,
      50 + wrappedRows.reduce((sum: number, row: any) => sum + row.lines * 4.2 + 8, 0)
    );
    
    const doc = new jsPDF('p', 'mm', [80, ticketHeight]);
    let y = 6;

    const center = (text: string, size = 8, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = String(text).split('\n');
      lines.forEach(lineText => {
        doc.text(lineText, 40, y, { align: 'center' });
        y += size * 0.45 + 1.2;
      });
    };

    const line = (offset = 0) => {
      doc.setDrawColor(219, 213, 204);
      doc.setLineWidth(0.15);
      doc.line(5, y + offset, 75, y + offset);
      y += 3;
    };

    // Clean framed header for comanda
    doc.setDrawColor(98, 74, 62);
    doc.setLineWidth(0.4);
    doc.rect(5, y, 70, 11, 'D');
    
    doc.setTextColor(98, 74, 62);
    y += 4;
    center('Colores Pizza', 9, true);
    center(`COMANDA DE ${tipo.toUpperCase()}`, 7.5, false);
    y += 6;

    // Prominent Mesa Number
    doc.setTextColor(35, 31, 28);
    center(`MESA: ${pedido.numero_mesa}`, 15, true);
    center(`Pedido #${pedido.id_pedido}`, 8, false);
    y += 1.5;
    line();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(`Mozo: ${pedido.mozo}`, 5, y);
    doc.text(`Hora: ${new Date(pedido.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`, 75, y, { align: 'right' });
    y += 4;
    line();

    // Table Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(35, 31, 28);
    doc.text('Cant.  Producto / Descripción', 5, y);
    y += 3.5;
    line(-1);

    // Items list
    doc.setFont('helvetica', 'normal');
    filteredItems.forEach(({ nombre, cantidad, notas }: any) => {
      const lines = doc.splitTextToSize(nombre, 48) as string[];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${cantidad}x`, 5, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      lines.forEach((text, index) => {
        doc.text(text, 16, y + index * 4);
      });
      y += Math.max(4, lines.length * 4);
      
      // If item has specific item-level notes/observaciones
      if (notas) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(190, 24, 24);
        doc.text(`   * ${notas}`, 16, y);
        y += 4.5;
        doc.setTextColor(35, 31, 28);
      } else {
        y += 1.5;
      }
    });

    // General order level observations highlighted in red warning box
    if (pedido.observaciones) {
      line();
      doc.setFillColor(250, 240, 240); // Soft red background
      doc.setDrawColor(190, 24, 24); // Red border
      doc.setLineWidth(0.2);
      
      const splitObs = doc.splitTextToSize(pedido.observaciones, 66);
      const boxHeight = splitObs.length * 4.2 + 6;
      doc.rect(5, y, 70, boxHeight, 'FD');
      
      doc.setTextColor(190, 24, 24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('OBSERVACIONES GENERALES:', 7, y + 4.5);
      
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(7.5);
      splitObs.forEach((lineText: string, idx: number) => {
        doc.text(lineText, 7, y + 9 + idx * 4.2);
      });
      y += boxHeight + 4;
    }

    doc.save(`comanda-${tipo}-${pedido.id_pedido}.pdf`);
  }
};
