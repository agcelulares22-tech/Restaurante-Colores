import React, { useEffect, useState } from 'react';
import { Bike, Plus, Phone, MapPin, User, ClipboardList, X, Loader2 } from 'lucide-react';
import { pedidosService } from '../services/pedidosService';
import {
  fetchZonasEnvio,
  fetchCallesEnvio,
  resolverZonaEnvio,
  type ResultadoZonaEnvio
} from '../services/zonasEnvioService';
import type { Pedido, PedidoItem } from '../types';

interface QuickDeliveryFormProps {
  activeMozo?: string;
  onCrearPedido: (pedido: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos'> & { idempotency_key?: string }) => void;
}

export default function QuickDeliveryForm({ activeMozo = 'Sistema', onCrearPedido }: QuickDeliveryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [zonas, setZonas] = useState<Awaited<ReturnType<typeof fetchZonasEnvio>>>([]);
  const [calles, setCalles] = useState<Awaited<ReturnType<typeof fetchCallesEnvio>>>([]);
  const [zonaResultado, setZonaResultado] = useState<ResultadoZonaEnvio | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchZonasEnvio(), fetchCallesEnvio()]).then(([z, c]) => {
      if (!active) return;
      setZonas(z);
      setCalles(c);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!address.trim() || calles.length === 0) {
      setZonaResultado(null);
      return;
    }
    const result = resolverZonaEnvio(address, zonas, calles);
    setZonaResultado(result);
  }, [address, zonas, calles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !order.trim() || !address.trim() || !phone.trim()) {
      alert('Completá todos los campos del pedido.');
      return;
    }

    setSaving(true);
    try {
      const nextId = Date.now() + Math.floor(Math.random() * 100);
      const detailAddress = `DELIVERY: ${name.trim()} - ${address.trim()}`;

      const item: PedidoItem = {
        id_producto: `delivery_manual_${nextId}`,
        nombre: order.trim(),
        cantidad: 1,
        categoria: 'Delivery',
        precio_unitario: 0
      };

      const observationParts = [
        `Tel: ${phone.trim()}`,
        address.trim() !== name.trim() ? `Dir: ${address.trim()}` : '',
        zonaResultado?.status === 'success' ? `Zona: ${zonaResultado.zona} ($${zonaResultado.costo_envio?.toLocaleString('es-AR')})` : ''
      ].filter(Boolean);

      const newOrder = {
        id_mesa: 900 + (nextId % 100),
        numero_mesa: detailAddress,
        mozo: activeMozo,
        estado_comanda: 'pendiente' as const,
        items: [item],
        observaciones: observationParts.join(' | ') || undefined,
        origen: 'Mozo' as const,
        idempotency_key: `quick_deliv_${nextId}`
      };

      await onCrearPedido(newOrder);
      setName('');
      setOrder('');
      setAddress('');
      setPhone('');
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error creando pedido rápido:', err);
      alert(err.message || 'No se pudo crear el pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FFF9E6] rounded-[20px] p-4 border border-[#E8B800]/40 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bike className="w-4 h-4 text-[#E8B800]" />
          <span className="text-xs font-black uppercase text-[#4A2D1B] tracking-wider">Pedido de Delivery Rápido</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-bold px-3 py-1.5 bg-[#E8B800] hover:bg-[#D4A700] text-[#1A1A1A] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {isOpen ? 'Cancelar' : 'Agregar Pedido'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs animate-fadeIn">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-stone-500 block mb-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              Nombre del Cliente
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8B800]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-stone-500 block mb-1 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" />
              Pedido
            </label>
            <textarea
              required
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="Ej: 1 Pizza Muzzarella grande, 1 Coca 1.5L"
              rows={2}
              className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8B800] resize-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-stone-500 block mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dirección
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Alvear 1362"
              className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8B800]"
            />
            {zonaResultado?.status === 'success' && (
              <p className="mt-1 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                {zonaResultado.zona} — Envío ${zonaResultado.costo_envio?.toLocaleString('es-AR')}
              </p>
            )}
            {zonaResultado?.status === 'error' && address.trim() && (
              <p className="mt-1 text-[10px] font-bold text-red-600">{zonaResultado.mensaje}</p>
            )}
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-stone-500 block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Teléfono
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3584-123456"
              className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8B800]"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-[#E8B800] hover:bg-[#D4A700] text-[#1A1A1A] font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bike className="w-3.5 h-3.5" />}
              {saving ? 'Guardando...' : 'Guardar Pedido'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
