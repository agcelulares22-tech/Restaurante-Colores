import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Minus, X, Bike, MapPin, Phone, Clock, 
  DollarSign, CheckCircle2, AlertCircle, Trash2, 
  ShoppingBag, Clipboard, Send, Compass, User
} from 'lucide-react';
import { Pedido, ProductoMenu, PedidoItem } from '../types';
import { useToast } from './ToastContainer';

interface DeliveryModuleProps {
  pedidos: Pedido[];
  productosMenu: ProductoMenu[];
  onCrearPedido: (pedido: any) => Promise<void>;
  onCambiarEstadoPedido: (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => void;
  onFacturarMesa: (idPedido: number, alreadyUpdatedInCaja?: boolean) => void;
  addLog: (tipo: any, mensaje: string) => void;
  activeMozo: string;
}

export default function DeliveryModule({
  pedidos,
  productosMenu,
  onCrearPedido,
  onCambiarEstadoPedido,
  onFacturarMesa,
  addLog,
  activeMozo
}: DeliveryModuleProps) {
  const { toast } = useToast();
  
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [channelFilter, setChannelFilter] = useState<string>('todos');
  
  // Modal state
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [orderChannel, setOrderChannel] = useState<'Mozo' | 'Rappi' | 'PedidosYa'>('Mozo');
  const [assignedCourier, setAssignedCourier] = useState('');
  const [cart, setCart] = useState<{ product: ProductoMenu; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('todo');

  // Filter products for the modal cart builder
  const filteredProducts = useMemo(() => {
    return productosMenu.filter(p => {
      if (!p.activo) return false;
      const matchCat = productCategory === 'todo' || p.categoria === productCategory;
      const matchSearch = p.nombre.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productosMenu, productCategory, productSearch]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(productosMenu.map(p => p.categoria));
    return ['todo', ...Array.from(cats)];
  }, [productosMenu]);

  // Filter delivery orders
  const deliveryOrders = useMemo(() => {
    return pedidos.filter(p => {
      // It is a delivery order if its table number starts with "DELIVERY:" or if its origin is Rappi/PedidosYa
      const isDelivery = p.numero_mesa.startsWith('DELIVERY:') || p.origen === 'Rappi' || p.origen === 'PedidosYa';
      if (!isDelivery) return false;

      // Filter by state
      if (statusFilter !== 'todos') {
        if (statusFilter === 'pendiente' && p.estado_comanda !== 'pendiente') return false;
        if (statusFilter === 'en_cocina' && p.estado_comanda !== 'en_cocina') return false;
        if (statusFilter === 'listo' && p.estado_comanda !== 'listo') return false;
        if (statusFilter === 'viaje' && p.estado_comanda !== 'entregado') return false;
        if (statusFilter === 'entregado_cobrado' && p.estado_comanda !== 'entregado_cobrado') return false;
      }

      // Filter by origin channel
      if (channelFilter !== 'todos') {
        if (channelFilter === 'propio' && p.origen !== 'Mozo') return false;
        if (channelFilter === 'rappi' && p.origen !== 'Rappi') return false;
        if (channelFilter === 'pedidosya' && p.origen !== 'PedidosYa') return false;
      }

      // Search queries (name, address, order id)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const addressMatch = p.numero_mesa.toLowerCase().includes(query);
        const obsMatch = p.observaciones?.toLowerCase().includes(query) || false;
        const idMatch = String(p.id_pedido).includes(query);
        return addressMatch || obsMatch || idMatch;
      }

      return true;
    });
  }, [pedidos, searchQuery, statusFilter, channelFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const deliveries = pedidos.filter(p => p.numero_mesa.startsWith('DELIVERY:') || p.origen === 'Rappi' || p.origen === 'PedidosYa');
    return {
      pendientes: deliveries.filter(p => p.estado_comanda === 'pendiente').length,
      en_cocina: deliveries.filter(p => p.estado_comanda === 'en_cocina').length,
      listos: deliveries.filter(p => p.estado_comanda === 'listo').length,
      en_viaje: deliveries.filter(p => p.estado_comanda === 'entregado').length,
      finalizados: deliveries.filter(p => p.estado_comanda === 'entregado_cobrado').length,
      totalFacturado: deliveries
        .filter(p => p.estado_comanda === 'entregado_cobrado')
        .reduce((sum, p) => {
          const orderSum = p.items.reduce((itemSum, item) => {
            const pm = productosMenu.find(pr => pr.id_producto === item.id_producto);
            const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
            return itemSum + (price * item.quantity);
          }, 0);
          return sum + orderSum;
        }, 0)
    };
  }, [pedidos, productosMenu]);

  // Handle adding items to order creator cart
  const addToCart = (product: ProductoMenu) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id_producto === product.id_producto);
      if (existing) {
        return prev.map(item => item.product.id_producto === product.id_producto 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id_producto === productId) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Submit new delivery order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientAddress.trim()) {
      toast.error('Por favor, ingresa el nombre del cliente y la dirección.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agrega al menos una pizza o bebida a la comanda.');
      return;
    }

    const nextId = Date.now() + Math.floor(Math.random() * 100);
    const detailAddress = `DELIVERY: ${clientName} - ${clientAddress}`;
    
    // Create items formatted for PedidoItem
    const items: PedidoItem[] = cart.map(item => ({
      id_producto: item.product.id_producto,
      nombre: item.product.nombre,
      cantidad: item.quantity,
      categoria: item.product.categoria,
      precio_unitario: item.product.precio_venta
    }));

    const observationString = [
      clientPhone ? `Tel: ${clientPhone}` : '',
      assignedCourier ? `Repartidor: ${assignedCourier}` : '',
    ].filter(Boolean).join(' | ');

    const newOrder = {
      id_mesa: 900 + (nextId % 100), // Virtual table ID for delivery
      numero_mesa: detailAddress,
      mozo: activeMozo,
      estado_comanda: 'pendiente' as const,
      items,
      observaciones: observationString || undefined,
      origen: orderChannel,
      idempotency_key: `deliv_${nextId}`
    };

    try {
      await onCrearPedido(newOrder);
      toast.success('Pedido de delivery registrado y enviado a cocina.');
      addLog('pedido_creado', `DELIVERY: Pedido creado para ${clientName} (${orderChannel}). Total items: ${items.length}`);
      
      // Reset form
      setClientName('');
      setClientAddress('');
      setClientPhone('');
      setAssignedCourier('');
      setCart([]);
      setShowNewOrderModal(false);
    } catch (err) {
      toast.error('Error al crear el pedido de delivery.');
    }
  };

  // Calculate order total
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.precio_venta * item.quantity), 0);
  };

  const getOrderTotal = (p: Pedido) => {
    return p.items.reduce((sum, item) => {
      const pm = productosMenu.find(pr => pr.id_producto === item.id_producto);
      const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
      return sum + (price * item.cantidad);
    }, 0);
  };

  // Helper to parse names from DELIVERY: [Name] - [Address]
  const parseClientInfo = (numero_mesa: string) => {
    if (numero_mesa.startsWith('DELIVERY:')) {
      const parts = numero_mesa.replace('DELIVERY:', '').split(' - ');
      return {
        name: parts[0]?.trim() || 'Cliente Delivery',
        address: parts[1]?.trim() || 'Dirección no especificada'
      };
    }
    return {
      name: 'Cliente Online',
      address: numero_mesa
    };
  };

  return (
    <div className="space-y-6" id="delivery-module-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Bike className="w-7 h-7 text-brand-yellow shrink-0 fill-current" />
            Consola de Entregas & Delivery
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Gestione y supervise pedidos propios y de aplicaciones de delivery en tiempo real.
          </p>
        </div>
        
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="bg-brand-yellow hover:bg-[#D4A700] text-brand-black px-4 py-3 rounded-xl font-black text-xs tracking-wider uppercase shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nueva Entrega (Delivery)
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Pendientes</span>
          <span className="text-xl font-black text-amber-500 font-mono mt-1 block">{kpis.pendientes}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">En Horno</span>
          <span className="text-xl font-black text-[#E85D00] font-mono mt-1 block">{kpis.en_cocina}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Listos</span>
          <span className="text-xl font-black text-emerald-500 font-mono mt-1 block">{kpis.listos}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">En Viaje</span>
          <span className="text-xl font-black text-blue-500 font-mono mt-1 block">{kpis.en_viaje}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Finalizados</span>
          <span className="text-xl font-black text-stone-600 font-mono mt-1 block">{kpis.finalizados}</span>
        </div>
        <div className="bg-stone-900 text-brand-yellow p-4 rounded-xl shadow-sm text-center col-span-2 md:col-span-1">
          <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">Total Entregado</span>
          <span className="text-lg font-black font-mono mt-1 block">${kpis.totalFacturado.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, dirección o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          
          {/* Status Filters */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'pendiente', label: 'Pendiente' },
              { id: 'en_cocina', label: 'En Horno' },
              { id: 'listo', label: 'Listos' },
              { id: 'viaje', label: 'En Viaje' },
              { id: 'entregado_cobrado', label: 'Cobrados' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${statusFilter === f.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Channel Filters */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'propio', label: 'Propio' },
              { id: 'rappi', label: 'Rappi' },
              { id: 'pedidosya', label: 'PedidosYa' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setChannelFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${channelFilter === f.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400 space-y-2">
            <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-stone-300" />
            <p className="text-sm font-bold text-stone-500">No se encontraron pedidos de delivery</p>
            <p className="text-xs">Usa el botón superior para crear un nuevo pedido o inyecta pedidos en el simulador.</p>
          </div>
        ) : (
          deliveryOrders.map(p => {
            const client = parseClientInfo(p.numero_mesa);
            const total = getOrderTotal(p);
            
            // Channel color accents
            const channelBadge = {
              Mozo: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
              Rappi: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
              PedidosYa: 'bg-red-500/10 text-red-700 border-red-500/20'
            }[p.origen];

            // Order status styling
            const statusTheme = {
              pendiente: { label: 'Pendiente', bg: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
              en_cocina: { label: 'En Horno', bg: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-600 animate-pulse' },
              listo: { label: 'Listo p/ Despacho', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
              entregado: { label: 'En Viaje', bg: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-500' },
              entregado_cobrado: { label: 'Finalizado', bg: 'bg-stone-50 border-stone-200 text-stone-600', dot: 'bg-stone-400' },
              cancelado: { label: 'Cancelado', bg: 'bg-red-50 border-red-200 text-red-800', dot: 'bg-red-500' }
            }[p.estado_comanda];

            return (
              <div key={p.id_pedido} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
                
                {/* Header */}
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">Orden #{p.id_pedido}</span>
                      <h3 className="text-sm font-black text-stone-900 mt-0.5 truncate max-w-[160px]">{client.name}</h3>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${channelBadge}`}>
                        {p.origen === 'Mozo' ? 'Propio' : p.origen}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 ${statusTheme.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
                        {statusTheme.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 space-y-3">
                  {/* Address */}
                  <div className="flex gap-2 items-start text-xs text-stone-600">
                    <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                    <span className="font-semibold leading-tight">{client.address}</span>
                  </div>

                  {/* Obs (Phone / Courier) */}
                  {p.observaciones && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/50 text-[11px] text-stone-500 flex gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{p.observaciones}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    {p.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-stone-800">
                        <span className="font-bold">
                          <span className="text-[#E85D00] font-mono mr-1">{item.cantidad}x</span>
                          {item.nombre}
                        </span>
                        <span className="font-mono text-stone-500 text-[11px]">
                          ${((item.precio_unitario ?? 0) * item.cantidad).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer & Actions */}
                <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Total a Cobrar</span>
                    <strong className="text-base font-black font-mono text-stone-900">${total.toLocaleString('es-AR')}</strong>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1.5">
                    {p.estado_comanda === 'pendiente' && (
                      <button
                        onClick={() => onCambiarEstadoPedido(p.id_pedido, 'en_cocina')}
                        className="bg-brand-yellow hover:bg-[#D4A700] text-brand-black px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95"
                      >
                        Enviar a Horno
                      </button>
                    )}
                    {p.estado_comanda === 'en_cocina' && (
                      <button
                        onClick={() => onCambiarEstadoPedido(p.id_pedido, 'listo')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95"
                      >
                        Completar Cocción
                      </button>
                    )}
                    {p.estado_comanda === 'listo' && (
                      <button
                        onClick={() => {
                          const courier = prompt("Nombre del Repartidor asignado:", "Repartidor 1");
                          if (courier === null) return;
                          
                          // Update order observations with Courier
                          const updatedObs = [p.observaciones, courier ? `Repartidor: ${courier}` : '']
                            .filter(Boolean)
                            .join(' | ');
                          
                          // Quick hack to attach delivery guy and switch state to 'entregado' (En Viaje)
                          p.observaciones = updatedObs;
                          onCambiarEstadoPedido(p.id_pedido, 'entregado');
                          toast.success(`Pedido #${p.id_pedido} despachado con repartidor: ${courier}`);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Bike className="w-3.5 h-3.5 fill-current" />
                        Despachar
                      </button>
                    )}
                    {p.estado_comanda === 'entregado' && (
                      <button
                        onClick={() => {
                          // Billing changes state to 'entregado_cobrado' and counts money
                          onFacturarMesa(p.id_pedido);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Entregado & Cobrar
                      </button>
                    )}
                    {p.estado_comanda !== 'entregado_cobrado' && p.estado_comanda !== 'cancelado' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Cancelar pedido de delivery?')) {
                            onCambiarEstadoPedido(p.id_pedido, 'cancelado');
                          }
                        }}
                        className="border border-red-200 hover:bg-red-50 text-red-500 p-2 rounded-xl cursor-pointer transition-all"
                        title="Cancelar Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW ORDER CREATOR MODAL */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowNewOrderModal(false)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[90vh] sm:h-[80vh] border border-stone-200">
            
            {/* Form Fields & Cart summary (Left) */}
            <div className="w-full md:w-[45%] p-5 border-r border-stone-100 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-5 h-5 text-brand-yellow shrink-0 fill-current" />
                    Datos del Delivery
                  </h2>
                  <button 
                    onClick={() => setShowNewOrderModal(false)}
                    className="md:hidden w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Nombre del Cliente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Dirección de Envío</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av. Siempreviva 742"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ej: 11-2345-6789"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Repartidor (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: Carlos"
                        value={assignedCourier}
                        onChange={(e) => setAssignedCourier(e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Canal de Delivery</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Mozo', label: 'Propio' },
                        { id: 'Rappi', label: 'Rappi' },
                        { id: 'PedidosYa', label: 'PedidosYa' }
                      ].map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setOrderChannel(ch.id as any)}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all ${orderChannel === ch.id ? 'bg-stone-900 border-stone-900 text-brand-yellow' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Cart summary */}
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <h4 className="text-[10px] font-black uppercase text-stone-400 mb-2">Resumen de Comanda</h4>
                  {cart.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">No hay productos agregados en el carrito.</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {cart.map(item => (
                        <div key={item.product.id_producto} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-stone-800">
                            <span className="text-[#E85D00] mr-1">{item.quantity}x</span>
                            {item.product.nombre}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-500">${(item.product.precio_venta * item.quantity).toLocaleString('es-AR')}</span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id_producto)}
                              className="text-stone-300 hover:text-red-500 cursor-pointer p-0.5 rounded-full hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-stone-100 mt-4 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-stone-500 uppercase">Total Pedido</span>
                  <strong className="text-xl font-black font-mono text-stone-900">${getCartTotal().toLocaleString('es-AR')}</strong>
                </div>
                
                <button
                  onClick={handleCreateOrder}
                  className="w-full py-3 rounded-xl bg-brand-yellow hover:bg-[#D4A700] text-brand-black font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Enviar Pedido a Cocinar
                </button>
              </div>
            </div>

            {/* Menu Product Selector (Right) */}
            <div className="w-full md:w-[55%] p-5 bg-stone-50 overflow-y-auto flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-stone-800 uppercase tracking-wide">Seleccionar Pizzas & Bebidas</h3>
                <button 
                  onClick={() => setShowNewOrderModal(false)}
                  className="hidden md:flex w-8 h-8 rounded-full bg-white border border-stone-200 items-center justify-center text-stone-500 cursor-pointer shadow-xs hover:bg-stone-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar pizzas, bebidas, combos..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                />
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none mb-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap cursor-pointer transition-all ${productCategory === cat ? 'bg-stone-900 text-brand-yellow' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'}`}
                  >
                    {cat === 'todo' ? 'Todos' : cat}
                  </button>
                ))}
              </div>

              {/* Products list grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <div
                    key={p.id_producto}
                    onClick={() => addToCart(p)}
                    className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs hover:border-brand-yellow cursor-pointer flex flex-col justify-between transition-all group hover:shadow-sm"
                  >
                    {/* Pizza thumbnail */}
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="w-full h-20 object-cover rounded-xl mb-2 group-hover:scale-[1.02] transition-transform" />
                    ) : (
                      <div className="w-full h-20 bg-stone-100 rounded-xl mb-2 flex items-center justify-center text-stone-400">
                        <ShoppingBag className="w-6 h-6 stroke-1" />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-snug truncate">{p.nombre}</h4>
                      <p className="text-[10px] text-stone-500 font-mono mt-1 font-black">${p.precio_venta.toLocaleString('es-AR')}</p>
                    </div>

                    <button
                      type="button"
                      className="w-full mt-2.5 py-1 bg-stone-50 hover:bg-brand-yellow group-hover:bg-brand-yellow text-stone-700 group-hover:text-brand-black rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
