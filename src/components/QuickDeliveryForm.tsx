import React, { useState } from 'react';
import { Bike, Plus, Phone, MapPin, User, ClipboardList, X } from 'lucide-react';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';

export default function QuickDeliveryForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !order.trim() || !address.trim() || !phone.trim()) {
      alert('Completá todos los campos del pedido.');
      return;
    }
    setSaving(true);
    try {
      const client = tryGetActiveSupabaseClient();
      if (!client) throw new Error('No hay cliente Supabase activo.');
      const { error } = await client.from('pedidos_delivery_rapido').insert({
        nombre_cliente: name.trim(),
        pedido: order.trim(),
        direccion: address.trim(),
        telefono: phone.trim(),
        estado: 'nuevo',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      alert('Pedido de delivery guardado.');
      setName('');
      setOrder('');
      setAddress('');
      setPhone('');
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error guardando pedido rápido:', err);
      alert(err.message || 'No se pudo guardar el pedido. Verificá que exista la tabla pedidos_delivery_rapido.');
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
              <Bike className="w-3.5 h-3.5" />
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
