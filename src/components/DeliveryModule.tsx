import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, Minus, X, Bike, MapPin, Phone, Clock, 
  DollarSign, CheckCircle2, AlertCircle, Trash2, 
  ShoppingBag, Clipboard, Send, Compass, User, Map as MapIcon, HelpCircle
} from 'lucide-react';
import { Pedido, ProductoMenu, PedidoItem, ZonaEnvio, CalleEnvio } from '../types';
import { useToast } from './ToastContainer';
import { fetchZonasEnvio, fetchCallesEnvio, resolverZonaEnvio } from '../services/zonasEnvioService';

interface DeliveryModuleProps {
  pedidos: Pedido[];
  productosMenu: ProductoMenu[];
  onCrearPedido: (pedido: any) => Promise<void>;
  onCambiarEstadoPedido: (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => void;
  onFacturarMesa: (idPedido: number, alreadyUpdatedInCaja?: boolean) => void;
  addLog: (tipo: any, mensaje: string) => void;
  activeMozo: string;
}

// Default Central Pizzeria Location: Colores Pizza, Alvear 1362, Río Cuarto, Córdoba
const ORIGEN_LAT = -33.1263;
const ORIGEN_LNG = -64.3498;
const TARIFA_BASE_DEFAULT = 1000;
const COSTO_POR_KM_DEFAULT = 500;

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
  
  // Configuración de tarifas (Dueño)
  const [tarifaBase, setTarifaBase] = useState<number>(() => {
    const saved = localStorage.getItem('deliv_tarifa_base');
    return saved ? parseFloat(saved) : TARIFA_BASE_DEFAULT;
  });
  const [costoPorKm, setCostoPorKm] = useState<number>(() => {
    const saved = localStorage.getItem('deliv_costo_por_km');
    return saved ? parseFloat(saved) : COSTO_POR_KM_DEFAULT;
  });
  const [recargoHorarioPct, setRecargoHorarioPct] = useState<number>(() => {
    const saved = localStorage.getItem('deliv_recargo_horario_pct');
    return saved ? parseFloat(saved) : 20;
  });
  const [origenDireccion, setOrigenDireccion] = useState<string>(() => {
    return localStorage.getItem('deliv_origen_direccion') || 'Alvear 1362, Río Cuarto';
  });
  const [origenLat, setOrigenLat] = useState<number>(() => {
    const saved = localStorage.getItem('deliv_origen_lat');
    return saved ? parseFloat(saved) : ORIGEN_LAT;
  });
  const [origenLng, setOrigenLng] = useState<number>(() => {
    const saved = localStorage.getItem('deliv_origen_lng');
    return saved ? parseFloat(saved) : ORIGEN_LNG;
  });
  const [isUpdatingOrigen, setIsUpdatingOrigen] = useState(false);

  const handleUpdateOrigenDireccion = async (direccion: string) => {
    setOrigenDireccion(direccion);
    localStorage.setItem('deliv_origen_direccion', direccion);
    
    if (direccion.trim().length < 4) return;
    
    setIsUpdatingOrigen(true);
    try {
      const searchAddr = (direccion.toLowerCase().includes('rio cuarto') || direccion.toLowerCase().includes('río cuarto'))
        ? direccion
        : `${direccion}, Río Cuarto, Córdoba, Argentina`;
        
      const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'PizzeriaColoresAdmin/1.0' }
      });
      const geoData = await geoResp.json();
      
      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        setOrigenLat(lat);
        setOrigenLng(lng);
        localStorage.setItem('deliv_origen_lat', String(lat));
        localStorage.setItem('deliv_origen_lng', String(lng));
        toast.success(`Ubicación de la pizzería actualizada: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (err) {
      console.error('Error geocoding origin:', err);
    } finally {
      setIsUpdatingOrigen(false);
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  
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

  // Zonas y calles de envío desde Supabase
  const [zonasEnvio, setZonasEnvio] = useState<ZonaEnvio[]>([]);
  const [callesEnvio, setCallesEnvio] = useState<CalleEnvio[]>([]);
  const [zonaResultado, setZonaResultado] = useState<ReturnType<typeof resolverZonaEnvio> | null>(null);

  // Geo / Route / Estimations state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<{ base: number; distance: number; surge: number } | null>(null);
  
  // Leaflet map reference
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Leaflet library dynamically when the modal opens
  useEffect(() => {
    if (showNewOrderModal) {
      const loadLeaflet = () => {
        if ((window as any).L) {
          initMap();
          return;
        }

        // Stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initMap();
        };
        document.head.appendChild(script);
      };

      // Delay slightly to ensure modal is fully rendered
      setTimeout(loadLeaflet, 200);
    } else {
      // Destroy map instance when modal closes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        markersRef.current = [];
      }
      // Reset estimations
      setEstimatedDistance(null);
      setEstimatedDuration(null);
      setDeliveryCost(0);
      setCostBreakdown(null);
    }
  }, [showNewOrderModal]);

  // Cargar zonas y calles de envío desde Supabase al abrir el modal
  useEffect(() => {
    if (showNewOrderModal) {
      let active = true;
      const loadZonas = async () => {
        const [zonas, calles] = await Promise.all([fetchZonasEnvio(), fetchCallesEnvio()]);
        if (!active) return;
        setZonasEnvio(zonas);
        setCallesEnvio(calles);
      };
      loadZonas();
      return () => {
        active = false;
      };
    }
  }, [showNewOrderModal]);

  // Recalcular zona cada vez que cambia la dirección
  useEffect(() => {
    if (!clientAddress.trim() || callesEnvio.length === 0) {
      setZonaResultado(null);
      return;
    }
    const result = resolverZonaEnvio(clientAddress, zonasEnvio, callesEnvio);
    setZonaResultado(result);
    if (result.status === 'success' && result.costo_envio != null) {
      setDeliveryCost(result.costo_envio);
    } else {
      setDeliveryCost(0);
    }
  }, [clientAddress, zonasEnvio, callesEnvio]);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;

    try {
      // Create map centered at pizzeria
      mapRef.current = L.map('delivery-route-map', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([origenLat, origenLng], 13);

      // Add OpenStreetMap tiles (premium looking style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20
      }).addTo(mapRef.current);

      // Add Pizzeria origin marker (Blue)
      const pizzeriaIcon = L.divIcon({
        className: 'custom-pizzeria-marker',
        html: '<div style="background-color: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
        iconSize: [12, 12]
      });

      L.marker([origenLat, origenLng], { icon: pizzeriaIcon })
        .addTo(mapRef.current)
        .bindPopup('Colores Pizza • Alvear 1362, Río Cuarto')
        .openPopup();

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 400);

    } catch (err) {
      console.error('Leaflet initialization error:', err);
    }
  };

  // Estimate distance and price (with FastAPI backend falling back to client-side OSM/OSRM)
  const handleEstimateRoute = async () => {
    if (!clientAddress.trim()) {
      toast.warning('Ingresa una dirección primero para calcular la ruta.');
      return;
    }

    setIsEstimating(true);
    const L = (window as any).L;

    try {
      let data;
      try {
        // Attempt calling local Python FastAPI backend
        const response = await fetch('http://localhost:8000/api/delivery/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            address: clientAddress,
            tarifa_base: tarifaBase,
            costo_por_km: costoPorKm,
            recargo_porcentaje: recargoHorarioPct
          })
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Python backend returned error or is offline');
        }
      } catch (backendError) {
        console.warn('FastAPI backend unreachable, falling back to client-side Nominatim/OSRM routing...');
        
        // Client-side Fallback using OSM Nominatim for Geocoding
        const searchAddr = clientAddress.includes('argentina') ? clientAddress : `${clientAddress}, Río Cuarto, Córdoba, Argentina`;
        const geoResp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'PizzeriaColoresClientCalculator/1.0' }
        });
        const geoData = await geoResp.json();

        if (!geoData || geoData.length === 0) {
          throw new Error('No se pudo encontrar la dirección de destino.');
        }

        const destLat = parseFloat(geoData[0].lat);
        const destLng = parseFloat(geoData[0].lon);

        // OSRM Routing
        const routeResp = await fetch(`https://router.project-osrm.org/route/v1/driving/${origenLng},${origenLat};${destLng},${destLat}?overview=full&geometries=geojson`);
        const routeData = await routeResp.json();

        if (!routeData.routes || routeData.routes.length === 0) {
          throw new Error('No se pudo calcular la ruta terrestre.');
        }

        const route = routeData.routes[0];
        const distKm = parseFloat((route.distance / 1000).toFixed(2));
        const durMin = parseFloat((route.duration / 60).toFixed(1));

        // Pricing Rules
        const currentHour = new Date().getHours();
        const esHoraPico = currentHour >= 20 && currentHour <= 23;
        const tarifaDistancia = parseFloat((distKm * costoPorKm).toFixed(2));
        const subtotal = tarifaBase + tarifaDistancia;
        const recargo = esHoraPico ? parseFloat((subtotal * (recargoHorarioPct / 100)).toFixed(2)) : 0;
        const total = subtotal + recargo;

        data = {
          destino_coords: [destLat, destLng],
          distancia_km: distKm,
          duracion_minutos: durMin,
          tarifa_base: tarifaBase,
          tarifa_distancia: tarifaDistancia,
          recargo_horario: recargo,
          total: total,
          route_geojson: route.geometry
        };
      }

      // Update UI with calculated values
      setEstimatedDistance(data.distancia_km);
      setEstimatedDuration(data.duracion_minutos);
      setDeliveryCost(data.total);
      setCostBreakdown({
        base: data.tarifa_base,
        distance: data.tarifa_distancia,
        surge: data.recargo_horario
      });

      // Update map markers and route geometry
      if (mapRef.current && L) {
        // Clear previous route layer & destination markers
        if (routeLayerRef.current) {
          mapRef.current.removeLayer(routeLayerRef.current);
        }
        markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
        markersRef.current = [];

        const destCoords = data.destino_coords;

        // Draw destination Marker (Red)
        const destIcon = L.divIcon({
          className: 'custom-dest-marker',
          html: '<div style="background-color: #EF4444; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>',
          iconSize: [14, 14]
        });

        const destMarker = L.marker(destCoords, { icon: destIcon })
          .addTo(mapRef.current)
          .bindPopup(`Destino: ${clientAddress}`);
        
        markersRef.current.push(destMarker);

        // Draw route line (Polylines from GeoJSON coordinates)
        const polylineCoords = data.route_geojson.coordinates.map((coord: any) => [coord[1], coord[0]]);
        
        routeLayerRef.current = L.polyline(polylineCoords, {
          color: '#E8B800',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round'
        }).addTo(mapRef.current);

        // Fit map bounds to fit both points
        mapRef.current.fitBounds([
          [origenLat, origenLng],
          destCoords
        ], { padding: [40, 40] });
      }

      toast.success('Ruta calculada y costo del delivery estimado.');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo estimar la ruta del delivery.');
    } finally {
      setIsEstimating(false);
    }
  };

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
            return itemSum + (price * item.cantidad);
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

    // Add delivery cost item if estimated
    if (deliveryCost > 0) {
      items.push({
        id_producto: 'prod_costo_envio_delivery',
        nombre: `Envío Delivery (${estimatedDistance ? estimatedDistance + ' km' : 'Calculado'})`,
        cantidad: 1,
        categoria: 'Servicios',
        precio_unitario: deliveryCost
      });
    }

    const observationString = [
      clientPhone ? `Tel: ${clientPhone}` : '',
      assignedCourier ? `Repartidor: ${assignedCourier}` : '',
      estimatedDistance ? `Distancia: ${estimatedDistance} km` : ''
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

  // Calculate order items subtotal (excluding delivery service item)
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.precio_venta * item.quantity), 0);
  };

  const getOrderTotal = (p: Pedido) => {
    const itemsTotal = p.items.reduce((sum, item) => {
      const pm = productosMenu.find(pr => pr.id_producto === item.id_producto);
      const price = item.precio_unitario ?? pm?.precio_venta ?? 0;
      return sum + (price * item.cantidad);
    }, 0);
    
    // Si ya existe el item de costo de envío, el total ya lo incluye
    const hasDeliveryItem = p.items.some(item => item.id_producto === 'prod_costo_envio_delivery');
    if (hasDeliveryItem) {
      return itemsTotal;
    }
    
    return itemsTotal + (p.costo_envio || 0);
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

  const handleSendWhatsApp = (pedido: Pedido) => {
    const clientNameVal = pedido.nombre_cliente || parseClientInfo(pedido.numero_mesa).name;
    const clientAddressVal = pedido.direccion_cliente || parseClientInfo(pedido.numero_mesa).address;
    const clientPhoneVal = pedido.telefono_cliente || pedido.observaciones?.match(/Tel:\s*([^\s|]+)/)?.[1] || '';
    
    const cleanPhone = clientPhoneVal.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone.length > 0 && !formattedPhone.startsWith('54')) {
      formattedPhone = '54' + formattedPhone;
    }
    
    const msg = `Hola *${clientNameVal}*! Tu pedido de *Colores Pizzería* está listo y el cadete ya salió hacia tu domicilio: *${clientAddressVal}*. ¡Gracias por elegirnos!`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
            Gestione y supervise pedidos propios y de aplicaciones de delivery en tiempo real con geolocalización.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            Ajustes Tarifas
          </button>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="bg-brand-yellow hover:bg-[#D4A700] text-brand-black px-4 py-3 rounded-xl font-black text-xs tracking-wider uppercase shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nueva Entrega (Delivery)
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL (COLLAPSIBLE) */}
      {showSettings && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Tarifa Base ($)</label>
              <input
                type="number"
                value={tarifaBase}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTarifaBase(val);
                  localStorage.setItem('deliv_tarifa_base', String(val));
                }}
                className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Costo por Kilómetro ($/km)</label>
              <input
                type="number"
                value={costoPorKm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setCostoPorKm(val);
                  localStorage.setItem('deliv_costo_por_km', String(val));
                }}
                className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Recargo Hora Pico (%)</label>
              <input
                type="number"
                value={recargoHorarioPct}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setRecargoHorarioPct(val);
                  localStorage.setItem('deliv_recargo_horario_pct', String(val));
                }}
                className="w-full p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none font-mono"
              />
            </div>
          </div>
          
          <div className="border-t border-stone-100 pt-3">
            <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Dirección de Origen del Local (Pizzería)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Alvear 1362, Río Cuarto"
                value={origenDireccion}
                onChange={(e) => handleUpdateOrigenDireccion(e.target.value)}
                className="flex-1 p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none text-slate-800 bg-white font-medium"
              />
              <span className="text-[10px] font-mono text-slate-500 self-center bg-slate-50 px-2 py-1 rounded border">
                {isUpdatingOrigen ? 'Buscando...' : `Coords: ${origenLat.toFixed(4)}, ${origenLng.toFixed(4)}`}
              </span>
            </div>
          </div>
        </div>
      )}

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
            const clientParsed = parseClientInfo(p.numero_mesa);
            const client = {
              name: p.nombre_cliente || clientParsed.name,
              address: p.direccion_cliente || clientParsed.address,
              phone: p.telefono_cliente || p.observaciones?.match(/Tel:\s*([^\s|]+)/)?.[1] || ''
            };
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

                  {/* Phone */}
                  {client.phone && (
                    <div className="flex gap-2 items-center text-xs text-stone-600">
                      <Phone className="w-4 h-4 text-brand-yellow shrink-0" />
                      <span className="font-semibold">{client.phone}</span>
                    </div>
                  )}

                  {/* Obs (Phone / Courier) */}
                  {p.observaciones && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/50 text-[11px] text-stone-500 flex gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{p.observaciones}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    {p.items
                      .filter(item => item.id_producto !== 'prod_costo_envio_delivery')
                      .map((item, idx) => (
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

                    {/* Fila destacada para la Tarifa de Envío */}
                    {(() => {
                      const deliveryItem = p.items.find(item => item.id_producto === 'prod_costo_envio_delivery');
                      const shippingFee = p.costo_envio || (deliveryItem ? (deliveryItem.precio_unitario ?? 0) : 0);
                      if (shippingFee <= 0) return null;
                      return (
                        <div className="flex justify-between items-center text-xs text-[#E85D00] font-black pt-1.5 border-t border-dashed border-stone-200">
                          <span className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 fill-current shrink-0" />
                            Costo de Envío
                          </span>
                          <span className="font-mono text-[11px]">
                            ${shippingFee.toLocaleString('es-AR')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Footer & Actions */}
                <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center flex-wrap gap-2">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Total a Cobrar</span>
                    <strong className="text-base font-black font-mono text-stone-900">${total.toLocaleString('es-AR')}</strong>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {client.phone && (
                      <button
                        onClick={() => handleSendWhatsApp(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm border border-emerald-500"
                        title="Enviar WhatsApp"
                      >
                        Notificar WA
                      </button>
                    )}

                    {p.estado_comanda === 'pendiente' && (
                      <button
                        onClick={() => onCambiarEstadoPedido(p.id_pedido, 'en_cocina')}
                        className="bg-brand-yellow hover:bg-[#D4A700] text-brand-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95"
                      >
                        Enviar a Horno
                      </button>
                    )}
                    {p.estado_comanda === 'en_cocina' && (
                      <button
                        onClick={() => onCambiarEstadoPedido(p.id_pedido, 'listo')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95"
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Bike className="w-3.5 h-3.5 fill-current" />
                        Despachar
                      </button>
                    )}
                    {p.estado_comanda === 'entregado' && (
                      <button
                        onClick={() => {
                          onFacturarMesa(p.id_pedido);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95 flex items-center gap-1"
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
                        className="border border-red-200 hover:bg-red-50 text-red-500 p-1.5 rounded-xl cursor-pointer transition-all"
                        title="Cancelar Pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col lg:flex-row h-[95vh] sm:h-[90vh] border border-stone-200">
            
            {/* Form Fields & Cart summary (Left) */}
            <div className="w-full lg:w-[35%] p-5 border-r border-stone-100 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-5 h-5 text-brand-yellow shrink-0 fill-current" />
                    Datos del Delivery
                  </h2>
                  <button 
                    onClick={() => setShowNewOrderModal(false)}
                    className="lg:hidden w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Dirección de Envío</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Calle y altura (ej: Av. Corrientes 1200)"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className="flex-1 p-2.5 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleEstimateRoute}
                        disabled={isEstimating}
                        className="bg-brand-yellow hover:bg-[#D4A700] text-brand-black px-3 rounded-xl font-bold text-xs border border-transparent flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Calcular ruta en el mapa"
                      >
                        {isEstimating ? 'Estimando...' : <Compass className="w-4 h-4 animate-spin-slow" />}
                      </button>
                    </div>
                  </div>

                  {/* Zona de envío según Supabase */}
                  {clientAddress.trim() && zonaResultado && (
                    <div
                      className={`p-3 rounded-xl text-xs space-y-1.5 animate-fadeIn border ${
                        zonaResultado.status === 'success'
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black uppercase text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Zona
                        </span>
                        <span
                          className="font-black px-2 py-0.5 rounded-full text-[10px]"
                          style={{
                            backgroundColor: zonaResultado.status === 'success' ? zonaResultado.color || '#E8B800' : '#D42B2B',
                            color: zonaResultado.status === 'success' ? '#1A1A1A' : '#FFFFFF'
                          }}
                        >
                          {zonaResultado.status === 'success' ? zonaResultado.zona : 'Sin cobertura'}
                        </span>
                      </div>
                      {zonaResultado.status === 'success' ? (
                        <>
                          <div className="flex justify-between items-center text-stone-700">
                            <span className="font-semibold">Costo de envío:</span>
                            <strong className="font-mono text-brand-orange">${zonaResultado.costo_envio?.toLocaleString('es-AR')}</strong>
                          </div>
                          {(zonaResultado.minimo_pedido || 0) > 0 && (
                            <div className="flex justify-between items-center text-stone-700">
                              <span className="font-semibold">Mínimo de pedido:</span>
                              <strong className="font-mono">${zonaResultado.minimo_pedido?.toLocaleString('es-AR')}</strong>
                            </div>
                          )}
                          <p className="text-[10px] text-stone-500">{zonaResultado.mensaje}</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-red-600 font-semibold">{zonaResultado.mensaje}</p>
                      )}
                    </div>
                  )}

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
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Repartidor</label>
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
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <h4 className="text-[10px] font-black uppercase text-stone-400 mb-2">Resumen de Comanda</h4>
                  {cart.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">No hay productos agregados.</p>
                  ) : (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">Costo de Envío</span>
                  <span className="font-mono text-xs text-stone-800">${deliveryCost.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-stone-500 uppercase">Total a Cobrar</span>
                  <strong className="text-xl font-black font-mono text-stone-900">${(getCartTotal() + deliveryCost).toLocaleString('es-AR')}</strong>
                </div>
                {zonaResultado?.status === 'error' && clientAddress.trim() && (
                  <p className="text-[10px] text-red-600 mb-2">{zonaResultado.mensaje}</p>
                )}
                {(zonaResultado?.minimo_pedido || 0) > 0 && getCartTotal() < (zonaResultado?.minimo_pedido || 0) && (
                  <p className="text-[10px] text-amber-600 mb-2">
                    El pedido no alcanza el mínimo de ${zonaResultado?.minimo_pedido?.toLocaleString('es-AR')} para esta zona.
                  </p>
                )}
                
                <button
                  onClick={handleCreateOrder}
                  disabled={zonaResultado?.status !== 'success' || clientAddress.trim() === ''}
                  className="w-full py-3 rounded-xl bg-brand-yellow hover:bg-[#D4A700] disabled:bg-stone-300 disabled:text-stone-500 text-brand-black font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Enviar Pedido a Cocinar
                </button>
              </div>
            </div>

            {/* Map Viewer (Right) */}
            <div className="w-full lg:w-[65%] bg-stone-100 flex flex-col h-full relative" id="map-panel">
              {/* Map Title Header */}
              <div className="p-3 bg-white border-b border-stone-200 flex justify-between items-center z-10">
                <span className="text-xs font-black uppercase text-stone-700 flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-brand-yellow" />
                  Ruta del Repartidor
                </span>
                <span className="text-[9px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Live (OSM/OSRM)</span>
              </div>

              {/* Map Container */}
              <div id="delivery-route-map" className="flex-1 w-full h-full z-0" style={{ minHeight: '350px', height: '100%', width: '100%' }} />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
