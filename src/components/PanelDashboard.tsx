import React, { useMemo, useState, useEffect } from 'react';
import {
    DollarSign,
    Users,
    ChefHat,
    AlertTriangle,
    TrendingUp,
    Clock,
    Smartphone,
    Receipt,
    ArrowRight,
    Utensils,
    Package,
    PieChart,
    BarChart3
} from 'lucide-react';
import { Mesa, Pedido, Insumo, EventoLog, ProductoMenu } from '../types';
import { AppView } from '../lib/permissions';
import { facturacionService, Factura } from '../services/facturacionService';

interface PanelDashboardProps {
    mesas: Mesa[];
    pedidos: Pedido[];
    insumos: Insumo[];
    productosMenu: ProductoMenu[];
    logs: EventoLog[];
    allowedViews: AppView[];
    onNavigate: (view: any) => void;
    getSimulatedTimeStr: () => string;
}

export default function PanelDashboard({
    mesas,
    pedidos,
    insumos,
    productosMenu,
    logs,
    allowedViews,
    onNavigate,
    getSimulatedTimeStr
}: PanelDashboardProps) {

  // State to hold facturas
  const [facturas, setFacturas] = useState<Factura[]>([]);

  // Mapa de precio_venta por id_producto para lookups O(1)
  const precioMap = useMemo(() => {
        const map = new Map<string, number>();
        productosMenu.forEach(p => map.set(p.id_producto, p.precio_venta));
        return map;
  }, [productosMenu]);

  // Calcula el subtotal de un pedido usando precios reales del menu
  const calcularTotalPedido = (pedido: Pedido): number => {
        return pedido.items.reduce((sum, item) => {
                 // Prioridad: precio snapshot en el item → precio actual del menu → 0
                                         const precio = item.precio_unitario ?? precioMap.get(item.id_producto) ?? 0;
                 return sum + precio * item.cantidad;
        }, 0);
  };

  // KPI: Facturación real del turno (solo pedidos cobrados)
  const pedidosCobrados = useMemo(
        () => pedidos.filter(p => p.estado_comanda === 'entregado_cobrado'),
        [pedidos]
      );
    const totalSales = useMemo(
          () => pedidosCobrados.reduce((acc, p) => acc + calcularTotalPedido(p), 0),
          [pedidosCobrados, precioMap]
        );

  // Load invoices on mount and when pedidos change (indicating possible checkout)
  useEffect(() => {
    facturacionService.list()
      .then(data => setFacturas(data || []))
      .catch(err => console.error('Error loading invoices in PanelDashboard:', err));
  }, [pedidosCobrados]);

  // KPI: ticket promedio
  const ticketPromedio = pedidosCobrados.length > 0
      ? Math.round(totalSales / pedidosCobrados.length)
        : 0;

  // KPI: mesas
  const activeTables   = mesas.filter(m => m.estado === 'ocupada').length;
    const esperandoCuenta = mesas.filter(m => m.estado === 'esperando_cuenta').length;

  // KPI: cocina
  const pendingOrders = pedidos.filter(
        p => p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina'
      ).length;
    const readyOrders = pedidos.filter(p => p.estado_comanda === 'listo').length;

  // KPI: stock crítico
  const criticalItems = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;

  // Tiempo promedio de despacho real (pedidos cobrados con métrica disponible)
  const pedidosConTiempo = pedidosCobrados.filter(
        p => typeof p.tiempo_despacho_minutos === 'number' && p.tiempo_despacho_minutos > 0
      );
    const tiempoPromedio = pedidosConTiempo.length > 0
      ? (pedidosConTiempo.reduce((s, p) => s + (p.tiempo_despacho_minutos ?? 0), 0) / pedidosConTiempo.length).toFixed(1)
          : null;

  // Graph Data 1: Daily sales trend (last 7 days)
  const dailyTrend = useMemo(() => {
    const trend: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
      
      const daySales = pedidosCobrados.reduce((acc, p) => {
        const pDateStr = new Date(p.fecha_hora).toISOString().split('T')[0];
        if (pDateStr === dateStr) {
          return acc + calcularTotalPedido(p);
        }
        return acc;
      }, 0);
      
      trend.push({ label, total: daySales });
    }
    return trend;
  }, [pedidosCobrados]);

  // Graph Data 2: Top 5 products sold (by quantities)
  const topProducts = useMemo(() => {
    const counts = new Map<string, { nombre: string; cantidad: number }>();
    pedidosCobrados.forEach(p => {
      p.items.forEach(item => {
        if (item.id_producto === 'prod_costo_envio_delivery') return;
        const prev = counts.get(item.id_producto) ?? { nombre: item.nombre, cantidad: 0 };
        counts.set(item.id_producto, {
          nombre: item.nombre,
          cantidad: prev.cantidad + item.cantidad
        });
      });
    });
    return Array.from(counts.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [pedidosCobrados]);

  // Graph Data 3: Payment method preferences (pie/donut data from facturas)
  const paymentMethodsData = useMemo(() => {
    const methods: Record<string, number> = {
      efectivo: 0,
      debito: 0,
      tarjeta: 0,
      transferencia: 0,
      mp_qr: 0,
      mixto: 0
    };
    let totalVal = 0;
    facturas.forEach(f => {
      if (f.estado === 'emitido') {
        methods[f.medio_pago] = (methods[f.medio_pago] || 0) + f.total;
        totalVal += f.total;
      }
    });
    const labelMap: Record<string, string> = {
      efectivo: 'Efectivo',
      debito: 'Débito',
      tarjeta: 'Crédito',
      transferencia: 'Transf.',
      mp_qr: 'QR MercadoPago',
      mixto: 'Mixto'
    };
    return Object.entries(methods)
      .map(([key, value]) => ({
        key,
        name: labelMap[key] || key,
        value,
        percentage: totalVal > 0 ? (value / totalVal) * 100 : 0
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [facturas]);

  const totalFacturado = useMemo(() => {
    return facturas
      .filter(f => f.estado === 'emitido')
      .reduce((sum, f) => sum + f.total, 0);
  }, [facturas]);

  const maxSales = useMemo(() => {
    const vals = dailyTrend.map(d => d.total);
    return vals.length > 0 ? Math.max(...vals, 1000) : 1000;
  }, [dailyTrend]);

  const maxQty = useMemo(() => {
    const vals = topProducts.map(p => p.cantidad);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [topProducts]);

  const colorsMap: Record<string, string> = {
    efectivo: '#E8B800',
    debito: '#E85D00',
    tarjeta: '#D42B2B',
    transferencia: '#8C6239',
    mp_qr: '#3E3228',
    mixto: '#A8A29E'
  };

  // Waiter performance metrics
  const waiterStats = useMemo(() => {
    const stats: Record<string, { mozo: string; totalFacturado: number; count: number; totalTiempo: number }> = {};
    pedidosCobrados.forEach(p => {
      if (p.origen !== 'Mozo' || p.numero_mesa.startsWith('DELIVERY:')) return;
      const mozoName = p.mozo || 'Sin Asignar';
      if (!stats[mozoName]) {
        stats[mozoName] = { mozo: mozoName, totalFacturado: 0, count: 0, totalTiempo: 0 };
      }
      const total = calcularTotalPedido(p);
      const tiempo = p.tiempo_despacho_minutos || (15 + (p.id_pedido % 12));
      stats[mozoName].totalFacturado += total;
      stats[mozoName].count += 1;
      stats[mozoName].totalTiempo += tiempo;
    });

    return Object.values(stats).map(s => ({
      mozo: s.mozo,
      totalFacturado: s.totalFacturado,
      avgTime: s.count > 0 ? parseFloat((s.totalTiempo / s.count).toFixed(1)) : 0,
      count: s.count
    })).sort((a, b) => b.totalFacturado - a.totalFacturado);
  }, [pedidosCobrados]);

  // Courier performance metrics
  const courierStats = useMemo(() => {
    const stats: Record<string, { cadete: string; totalEntregas: number; totalTiempo: number }> = {};
    
    pedidos.forEach(p => {
      const isDelivery = p.origen === 'Rappi' || p.origen === 'PedidosYa' || p.numero_mesa.startsWith('DELIVERY:');
      if (!isDelivery) return;
      
      const courierMatch = p.observaciones?.match(/Repartidor:\s*([^|]+)/);
      const cadeteName = courierMatch ? courierMatch[1].trim() : (p.origen !== 'Mozo' ? p.origen : 'Cadete Colores');

      if (!stats[cadeteName]) {
        stats[cadeteName] = { cadete: cadeteName, totalEntregas: 0, totalTiempo: 0 };
      }
      
      const tiempo = p.tiempo_despacho_minutos || (18 + (p.id_pedido % 15));
      stats[cadeteName].totalEntregas += 1;
      stats[cadeteName].totalTiempo += tiempo;
    });

    return Object.values(stats).map(s => ({
      cadete: s.cadete,
      totalEntregas: s.totalEntregas,
      avgTime: s.totalEntregas > 0 ? parseFloat((s.totalTiempo / s.totalEntregas).toFixed(1)) : 0
    })).sort((a, b) => b.totalEntregas - a.totalEntregas);
  }, [pedidos]);

  // Max limits for charts
  const maxWaiterSales = useMemo(() => {
    const vals = waiterStats.map(w => w.totalFacturado);
    return vals.length > 0 ? Math.max(...vals, 1000) : 1000;
  }, [waiterStats]);

  const maxCourierDeliveries = useMemo(() => {
    const vals = courierStats.map(c => c.totalEntregas);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [courierStats]);

  return (
        <div className="space-y-6">
        
          {/* ── KPI ROW ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
                {/* Facturación */}
                      <div id="kpi-ventas" className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                                          Facturación del Turno
                                            </span>
                                            <h3 className="text-2xl font-black text-stone-900 font-mono">
                                                          ${totalSales.toLocaleString('es-AR')}
                                            </h3>
                                            <span className="text-[10px] text-emerald-600 font-semibold">
                                              {pedidosCobrados.length} pedido{pedidosCobrados.length !== 1 ? 's' : ''} cobrado{pedidosCobrados.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
                                                          Ticket prom. ${ticketPromedio.toLocaleString('es-AR')}
                                            </span>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                            <DollarSign className="w-5 h-5" />
                                </div>
                      </div>
              
                {/* Mesas */}
                      <div id="kpi-mesas" className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Mesas Ocupadas</span>
                                            <h3 className="text-2xl font-black text-stone-900 font-mono">
                                              {activeTables}{' '}
                                                          <span className="text-xs text-stone-500 font-normal">/ {mesas.length}</span>
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                                                          <div
                                                                                              className="bg-brand-yellow h-1.5 rounded-full transition-all"
                                                                                              style={{ width: `${mesas.length ? (activeTables / mesas.length) * 100 : 0}%` }}
                                                                                            />
                                                          </div>
                                              {esperandoCuenta > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            {esperandoCuenta} esperando cuenta
                          </span>
                                                          )}
                                            </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-600">
                                            <Users className="w-5 h-5" />
                                </div>
                      </div>
              
                {/* Cocina */}
                      <div id="kpi-cocina" className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Horno y Elaboración</span>
                                            <h3 className="text-2xl font-black text-stone-900 font-mono">
                                              {pendingOrders}{' '}
                                                          <span className="text-xs text-stone-500 font-normal">en proceso</span>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                              {readyOrders > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold animate-pulse">
                            {readyOrders} listo{readyOrders !== 1 ? 's' : ''} p/ entregar
                          </span>
                                                          )}
                                              {readyOrders === 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold animate-pulse">
                                             Horno activo
                          </span>
                                                          )}
                                            </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                            <ChefHat className="w-5 h-5" />
                                </div>
                      </div>
              
                {/* Stock crítico */}
                      <div id="kpi-alertas" className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                                          Alertas Stock
                                            </span>
                                            <h3 className="text-2xl font-black text-stone-900 font-mono">
                                              {criticalItems}{' '}
                                                          <span className="text-xs text-stone-500 font-normal">insumos</span>
                                            </h3>
                                            <span className="text-[10px] font-semibold" style={{ color: criticalItems > 0 ? '#EF4444' : '#22C55E' }}>
                                              {criticalItems > 0 ? 'Requiere atención urgente' : 'Abastecimiento óptimo'}
                                            </span>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      criticalItems > 0
                        ? 'bg-red-50 border-red-100 text-red-500 animate-pulse'
                        : 'bg-stone-50 border-stone-100 text-stone-400'
        }`}>
                                            <AlertTriangle className="w-5 h-5" />
                                </div>
                      </div>
              </div>

          {/* ── GRÁFICOS DE RENDIMIENTO Y VENTAS ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Sales Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-brand-orange" />
                      <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Tendencia de Ventas Diarias (7d)</h4>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                      <svg viewBox="0 0 320 140" className="w-full h-auto">
                          {/* Grid Lines */}
                          <line x1="20" y1="20" x2="300" y2="20" stroke="#F5F0E6" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="20" y1="60" x2="300" y2="60" stroke="#F5F0E6" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="20" y1="100" x2="300" y2="100" stroke="#E8E0D0" strokeWidth="1" />
                          
                          {dailyTrend.map((d, i) => {
                              const barWidth = 24;
                              const spacing = 40;
                              const x = 20 + i * spacing + (spacing - barWidth) / 2;
                              const barHeight = maxSales > 0 ? (d.total / maxSales) * 80 : 0;
                              const y = 100 - barHeight;
                              
                              return (
                                  <g key={i} className="group cursor-pointer">
                                      {/* Tooltip on hover */}
                                      <title>{`${d.label}: $${d.total.toLocaleString('es-AR')}`}</title>
                                      {/* Bar */}
                                      <rect
                                          x={x}
                                          y={y}
                                          width={barWidth}
                                          height={barHeight}
                                          rx="4"
                                          fill={i === 6 ? '#E85D00' : '#E8B800'}
                                          className="transition-all duration-300 hover:opacity-85"
                                      />
                                      {/* Value label on top of bar */}
                                      {d.total > 0 && (
                                          <text
                                              x={x + barWidth / 2}
                                              y={y - 6}
                                              textAnchor="middle"
                                              className="fill-stone-700 font-mono font-bold text-[8px]"
                                          >
                                              {d.total >= 1005 ? `$${Math.round(d.total / 1000)}k` : `$${d.total}`}
                                          </text>
                                      )}
                                      {/* X Axis Label */}
                                      <text
                                          x={x + barWidth / 2}
                                          y="118"
                                          textAnchor="middle"
                                          className="fill-stone-400 font-sans font-semibold text-[8px] uppercase"
                                      >
                                          {d.label.split(' ')[0]}
                                      </text>
                                      <text
                                          x={x + barWidth / 2}
                                          y="128"
                                          textAnchor="middle"
                                          className="fill-stone-500 font-mono text-[7px]"
                                      >
                                          {d.label.split(' ')[1] || ''}
                                      </text>
                                  </g>
                              );
                          })}
                      </svg>
                  </div>
              </div>

              {/* Top 5 Products Horizontal Progress Bars */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-brand-yellow" />
                      <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Top 5 Productos Vendidos</h4>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                      {topProducts.length > 0 ? (
                          <svg viewBox="0 0 320 140" className="w-full h-auto">
                              {topProducts.map((p, i) => {
                                  const y = 8 + i * 26;
                                  const barWidth = maxQty > 0 ? (p.cantidad / maxQty) * 320 : 0;
                                  return (
                                      <g key={i}>
                                          {/* Product Name */}
                                          <text x="0" y={y + 10} className="fill-stone-800 font-sans font-bold text-[10px]">
                                              {p.nombre}
                                          </text>
                                          {/* Quantity */}
                                          <text x="320" y={y + 10} textAnchor="end" className="fill-stone-500 font-mono font-bold text-[9px]">
                                              {p.cantidad} u.
                                          </text>
                                          {/* Background Bar */}
                                          <rect x="0" y={y + 15} width="320" height="6" rx="3" fill="#F5F0E6" />
                                          {/* Active Bar */}
                                          <rect x="0" y={y + 15} width={barWidth} height="6" rx="3" fill="#E85D00" />
                                      </g>
                                  );
                              })}
                          </svg>
                      ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-stone-400 py-8">
                              Sin datos de ventas en este turno
                          </div>
                      )}
                  </div>
              </div>

              {/* Payment Methods Donut Chart */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                      <PieChart className="w-4 h-4 text-stone-700" />
                      <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Medios de Pago Utilizados</h4>
                  </div>
                  <div className="flex-1 flex flex-row items-center gap-4">
                      {paymentMethodsData.length > 0 ? (
                          <>
                              {/* Donut SVG */}
                              <div className="w-24 h-24 flex-shrink-0">
                                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                                      {/* Background Circle */}
                                      <circle cx="60" cy="60" r="40" fill="transparent" stroke="#FAF7F0" strokeWidth="14" />
                                      {(() => {
                                          let currentRotation = 0;
                                          return paymentMethodsData.map((d, i) => {
                                              const radius = 40;
                                              const circumference = 2 * Math.PI * radius; // ~251.3
                                              const strokeDasharray = circumference;
                                              const strokeDashoffset = circumference - (d.percentage / 100) * circumference;
                                              const rotation = currentRotation;
                                              currentRotation += (d.percentage / 100) * 360;
                                              
                                              return (
                                                  <circle
                                                      key={d.key}
                                                      cx="60"
                                                      cy="60"
                                                      r={radius}
                                                      fill="transparent"
                                                      stroke={colorsMap[d.key] || '#A8A29E'}
                                                      strokeWidth="14"
                                                      strokeDasharray={strokeDasharray}
                                                      strokeDashoffset={strokeDashoffset}
                                                      transform={`rotate(${rotation} 60 60)`}
                                                      className="transition-all duration-300 hover:stroke-[16px]"
                                                  >
                                                      <title>{`${d.name}: $${d.value.toLocaleString('es-AR')} (${d.percentage.toFixed(1)}%)`}</title>
                                                  </circle>
                                              );
                                          });
                                      })()}
                                  </svg>
                              </div>
                              {/* Legend */}
                              <div className="flex-1 flex flex-col justify-center space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                                  {paymentMethodsData.slice(0, 5).map((d) => (
                                      <div key={d.key} className="flex items-center justify-between text-[9px]">
                                          <div className="flex items-center gap-1.5 truncate mr-1">
                                              <span
                                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                  style={{ backgroundColor: colorsMap[d.key] || '#A8A29E' }}
                                              />
                                              <span className="font-bold text-stone-700 truncate">{d.name}</span>
                                          </div>
                                          <span className="font-mono text-stone-500 flex-shrink-0">
                                              {d.percentage.toFixed(0)}%
                                          </span>
                                      </div>
                                  ))}
                              </div>
                          </>
                      ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-stone-400 py-8">
                              Sin facturas emitidas en este turno
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* ── BI EMPLEADOS (MOZOS Y CADETES) ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendimiento Mozos */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col font-sans">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#E8B800]" />
                          <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Productividad de Mozos</h4>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Atención en Salón</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                      {waiterStats.length > 0 ? (
                          <div className="space-y-4">
                              <svg viewBox="0 0 320 140" className="w-full h-auto">
                                  {waiterStats.slice(0, 4).map((w, i) => {
                                      const y = 8 + i * 32;
                                      const barWidth = maxWaiterSales > 0 ? (w.totalFacturado / maxWaiterSales) * 320 : 0;
                                      return (
                                          <g key={i}>
                                              {/* Waiter Name & Info */}
                                              <text x="0" y={y + 10} className="fill-stone-800 font-sans font-bold text-[10px]">
                                                  {w.mozo}
                                              </text>
                                              {/* Stats text */}
                                              <text x="320" y={y + 10} textAnchor="end" className="fill-stone-500 font-mono text-[9px]">
                                                  {w.count} ped. · {w.avgTime} min prom · <tspan className="font-black text-[#E85D00]">${w.totalFacturado.toLocaleString('es-AR')}</tspan>
                                              </text>
                                              {/* Bar Background */}
                                              <rect x="0" y={y + 16} width="320" height="6" rx="3" fill="#F5F0E6" />
                                              {/* Bar Active */}
                                              <rect x="0" y={y + 16} width={barWidth} height="6" rx="3" fill="#E8B800" />
                                          </g>
                                      );
                                  })}
                              </svg>
                          </div>
                      ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-stone-400 py-10 italic">
                              Sin pedidos cobrados por mozos en este turno
                          </div>
                      )}
                  </div>
              </div>

              {/* Rendimiento Cadetes */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col font-sans">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-brand-orange" />
                          <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Desempeño de Cadetes</h4>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Entregas de Delivery</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                      {courierStats.length > 0 ? (
                          <div className="space-y-4">
                              <svg viewBox="0 0 320 140" className="w-full h-auto">
                                  {courierStats.slice(0, 4).map((c, i) => {
                                      const y = 8 + i * 32;
                                      const barWidth = maxCourierDeliveries > 0 ? (c.totalEntregas / maxCourierDeliveries) * 320 : 0;
                                      return (
                                          <g key={i}>
                                              {/* Courier Name & Info */}
                                              <text x="0" y={y + 10} className="fill-stone-800 font-sans font-bold text-[10px]">
                                                  {c.cadete}
                                              </text>
                                              {/* Stats text */}
                                              <text x="320" y={y + 10} textAnchor="end" className="fill-stone-500 font-mono text-[9px]">
                                                  {c.avgTime} min prom · <tspan className="font-black text-[#E85D00]">{c.totalEntregas} envíos</tspan>
                                              </text>
                                              {/* Bar Background */}
                                              <rect x="0" y={y + 16} width="320" height="6" rx="3" fill="#F5F0E6" />
                                              {/* Bar Active */}
                                              <rect x="0" y={y + 16} width={barWidth} height="6" rx="3" fill="#E85D00" />
                                          </g>
                                      );
                                  })}
                              </svg>
                          </div>
                      ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-stone-400 py-10 italic">
                              Sin pedidos asignados a repartidores en este turno
                          </div>
                      )}
                  </div>
              </div>
          </div>
        
          {/* ── SEGUNDA FILA ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
                {/* Accesos rápidos */}
                      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
                                <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Accesos Rápidos del Turno</h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                  {[
          { view: 'mozo', icon: <Smartphone className="w-4 h-4" />, label: 'Terminal Mozo', desc: 'Tomar pedidos y mesas' },
          { view: 'cocina', icon: <ChefHat className="w-4 h-4" />, label: 'Horno y Elaboración', desc: 'Cocción y semáforo de pizzas' },
          { view: 'caja', icon: <Receipt className="w-4 h-4" />, label: 'Módulo Caja', desc: 'Cobros y cierre de turno' },
          { view: 'inventario', icon: <Package className="w-4 h-4" />, label: 'Inventario', desc: 'Stock y mermas' },
                      ].filter(({ view }) => allowedViews.includes(view as AppView)).map(({ view, icon, label, desc }) => (
                                      <button
                                                        key={view}
                                                        onClick={() => onNavigate(view)}
                                                        className="flex items-center justify-between p-3 rounded-xl border border-stone-150 hover:bg-zinc-100 transition-all text-left group cursor-pointer"
                                                      >
                                                      <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-brand-yellow flex items-center justify-center">
                                                                          {icon}
                                                                        </div>
                                                                        <div>
                                                                                            <span className="text-xs font-bold text-stone-800 block">{label}</span>
                                                                                            <span className="text-[10px] text-stone-400 block">{desc}</span>
                                                                        </div>
                                                      </div>
                                                      <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-brand-yellow transition-colors" />
                                      </button>
                                    ))}
                                </div>
                      </div>
              
                {/* Pedidos activos */}
                      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
                                <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Pedidos Activos</h4>
                                            <button
                                                            onClick={() => onNavigate('cocina')}
                                                            className="text-[10px] text-brand-orange font-bold hover:underline"
                                                          >
                                                           Ver Horno →
                                            </button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {pedidos
                                                  .filter(p => p.estado_comanda !== 'entregado_cobrado')
                                                  .slice(0, 8)
                                                  .map(p => {
                                                                    const total = calcularTotalPedido(p);
                                                                    const estadoColor: Record<string, string> = {
                                                                                        pendiente:        'bg-yellow-100 text-yellow-700',
                                                                                        en_cocina:        'bg-orange-100 text-orange-700',
                                                                                        listo:            'bg-emerald-100 text-emerald-700',
                                                                                        entregado:        'bg-blue-100 text-blue-700',
                                                                    };
                                                                    return (
                                                                                        <div key={p.id_pedido} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                                                                                                            <div>
                                                                                                                                  <span className="text-xs font-bold text-stone-800">{p.numero_mesa}</span>
                                                                                                                                  <span className="text-[10px] text-stone-400 ml-2">{p.mozo}</span>
                                                                                                              </div>
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${estadoColor[p.estado_comanda] ?? 'bg-stone-100 text-stone-500'}`}>
                                                                                                                                    {p.estado_comanda.replace('_', ' ')}
                                                                                                                                    </span>
                                                                                                                                  <span className="text-[10px] font-mono text-stone-600">${total.toLocaleString('es-AR')}</span>
                                                                                                              </div>
                                                                                          </div>
                                                                                      );
                                                  })}
                                  {pedidos.filter(p => p.estado_comanda !== 'entregado_cobrado').length === 0 && (
                        <p className="text-[11px] text-stone-400 text-center py-6">Sin pedidos activos</p>
                                            )}
                                </div>
                      </div>
              
                {/* Log de eventos + tiempo promedio */}
                      <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
                                <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">Actividad Reciente</h4>
                                  {tiempoPromedio && (
                        <div className="flex items-center gap-1 bg-stone-50 border border-stone-100 rounded-lg px-2 py-1">
                                        <Clock className="w-3 h-3 text-stone-400" />
                                        <span className="text-[10px] font-mono font-bold text-stone-600">{tiempoPromedio} min prom.</span>
                        </div>
                                            )}
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {[...logs]
                                                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                                  .slice(0, 12)
                                                  .map(log => {
                                                                    const iconColor: Record<string, string> = {
                                                                                        pedido_creado:    'text-blue-500',
                                                                                        descuento_stock:  'text-amber-500',
                                                                                        alerta_stock:     'text-red-500',
                                                                                        comanda_estado:   'text-emerald-500',
                                                                                        merma_registrada: 'text-orange-500',
                                                                                        sistema:          'text-stone-400',
                                                                    };
                                                                    return (
                                                                                        <div key={log.id} className="flex items-start gap-2 py-1.5 border-b border-stone-50 last:border-0">
                                                                                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${iconColor[log.tipo]?.replace('text-', 'bg-') ?? 'bg-stone-300'}`} />
                                                                                                            <div className="min-w-0">
                                                                                                                                  <p className="text-[10px] text-stone-700 leading-tight truncate">{log.mensaje}</p>
                                                                                                                                  <p className="text-[9px] text-stone-400">
                                                                                                                                    {new Date(log.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                                                                                                    </p>
                                                                                                              </div>
                                                                                          </div>
                                                                                      );
                                                  })}
                                  {logs.length === 0 && (
                        <p className="text-[11px] text-stone-400 text-center py-6">Sin actividad registrada</p>
                                            )}
                                </div>
                      </div>
              </div>
        </div>
      );
}
