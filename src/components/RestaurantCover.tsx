import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Calendar, 
 MapPin, 
 Clock, 
 Phone, 
 Mail, 
 ArrowRight, 
 Sparkles, 
 ChefHat, 
 Flame, 
 Pizza,
 Utensils,
 Heart,
 Star,
 Award,
 MessageSquare,
 MessageCircle,
 TrendingUp,
 ShoppingBag,
 Layers,
 ThumbsUp
} from 'lucide-react';
import { INITIAL_PRODUCTOS_MENU } from '../data/initialData';
import { ProductoMenu, Insumo } from '../types';
import { promocionesService, Promocion } from '../services/promocionesService';

import { dbSavePedidoComplex } from '../supabase';

interface RestaurantCoverProps {
 onEnterSystem: () => void;
 productosMenu?: ProductoMenu[];
 insumos?: Insumo[];
}

export default function RestaurantCover({ 
 onEnterSystem, 
 productosMenu = INITIAL_PRODUCTOS_MENU,
 insumos = []
}: RestaurantCoverProps) {
 // Booking states
 const [bookingForm, setBookingForm] = useState({
 nombre: '',
 telefono: '',
 personas: '2',
 fecha: '',
 hora: '21:00'
 });
 const [showBookingSuccess, setShowBookingSuccess] = useState(false);

 const [promocionesList, setPromocionesList] = useState<Promocion[]>([]);

 useEffect(() => {
 promocionesService.list()
 .then(data => {
 setPromocionesList((data || []).filter(p => p.activo !== false));
 })
 .catch(err => {
 console.warn("Falla al cargar promociones para la portada:", err);
 });
 }, []);

 const handleBookingSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!bookingForm.nombre || !bookingForm.telefono || !bookingForm.fecha) {
 alert('Por favor complete los campos obligatorios para solicitar su mesa.');
 return;
 }

 const parts = bookingForm.fecha.split('-');
 const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : bookingForm.fecha;

 const cleanPhone = '5493584024822'; // Colores Pizzería WhatsApp line
 const text = `¡Hola Colores Pizzería! Me gustaría solicitar una reserva:\n\n` +
 `• Nombre: ${bookingForm.nombre}\n` +
 `• Teléfono: ${bookingForm.telefono}\n` +
 `• Comensales: ${bookingForm.personas} ${parseInt(bookingForm.personas) === 1 ? 'persona' : 'personas'}\n` +
 `• Fecha: ${formattedDate}\n` +
 `• Hora: ${bookingForm.hora} hs\n\n` +
 `¡Muchas gracias!`;

 const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');

 setShowBookingSuccess(true);
 };

 const closeBookingSuccess = () => {
 setShowBookingSuccess(false);
 setBookingForm({
 nombre: '',
 telefono: '',
 personas: '2',
 fecha: '',
 hora: '21:00'
 });
 };

 const [activeCategory, setActiveCategory] = useState<string>('Pizzas');

 // Event modal states
 const [showEventModal, setShowEventModal] = useState(false);
 const [eventForm, setEventForm] = useState({
 personas: '',
 fecha: '',
 lugar: ''
 });

 // Digital Menu states
 const [showDigitalMenu, setShowDigitalMenu] = useState(false);
 const [menuCart, setMenuCart] = useState<{ [id: string]: number }>({});
 const [menuStep, setMenuStep] = useState<1 | 2>(1);
 const [menuActiveCategory, setMenuActiveCategory] = useState<string>('');
 const [menuForm, setMenuForm] = useState({
 nombre: '',
 telefono: '',
 modalidad: 'delivery' as 'delivery' | 'retiro',
 direccion: ''
 });

 // Billing states
 const [quieroFactura, setQuieroFactura] = useState(false);
 const [facturacionForm, setFacturacionForm] = useState({
 registroImpositivo: 'Consumidor Final',
 razonSocial: '',
 cuit: '',
 domicilioFiscal: '',
 email: ''
 });



 // Scroll active category tab into view in Digital Menu modal
 useEffect(() => {
 if (showDigitalMenu) {
 const timer = setTimeout(() => {
 const activeEl = document.querySelector('.active-category-tab');
 if (activeEl) {
 activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
 }
 }, 100);
 return () => clearTimeout(timer);
 }
 }, [showDigitalMenu, menuActiveCategory]);

 const handleAddToCart = (id: string) => {
 setMenuCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
 };

 const handleRemoveFromCart = (id: string) => {
 setMenuCart(prev => {
 const next = { ...prev };
 if (next[id] > 1) {
 next[id]--;
 } else {
 delete next[id];
 }
 return next;
 });
 };

 const handleMenuSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!menuForm.nombre || !menuForm.telefono || (menuForm.modalidad === 'delivery' && !menuForm.direccion)) {
 alert('Por favor complete todos los campos obligatorios para continuar.');
 return;
 }

 if (quieroFactura) {
 if (!facturacionForm.razonSocial.trim()) {
 alert('Por favor ingrese la Razón Social o Nombre para la factura.');
 return;
 }
 if (!facturacionForm.cuit.trim()) {
 alert('Por favor ingrese el CUIT.');
 return;
 }
 if (!/^\d{2}-\d{8}-\d{1}$/.test(facturacionForm.cuit.trim())) {
 alert('El CUIT debe tener el formato XX-XXXXXXXX-X (Ej. 30-12345678-9).');
 return;
 }
 if (!facturacionForm.domicilioFiscal.trim()) {
 alert('Por favor ingrese el Domicilio Fiscal.');
 return;
 }
 if (!facturacionForm.email.trim()) {
 alert('Por favor ingrese el Email de Facturación.');
 return;
 }
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facturacionForm.email.trim())) {
 alert('Por favor ingrese un correo electrónico válido.');
 return;
 }
 }

 const cartItems = Object.entries(menuCart).map(([id, qty]) => {
 const p = productosMenu.find(prod => prod.id_producto === id);
 return {
 id_producto: id,
 nombre: p?.nombre || 'Producto',
 cantidad: qty,
 categoria: p?.categoria || 'Pizzas',
 precio_unitario: p?.precio_venta || 0
 };
 });

 const total = cartItems.reduce((sum, it) => sum + it.precio_unitario * it.cantidad, 0);
 const orderId = `PED_ON_${Date.now()}`;

 const newPedido = {
 id_pedido: orderId,
 id_mesa: 0,
 numero_mesa: menuForm.modalidad === 'delivery' ? 'Delivery Online' : 'Retiro Online',
 mozo: 'Carta Digital',
 estado_comanda: 'pendiente' as const,
 items: cartItems,
 fecha_hora: new Date(),
 minutos_transcurridos: 0,
 origen: 'Rappi' as const,
 nombre_cliente: menuForm.nombre,
 telefono_cliente: menuForm.telefono,
 direccion_cliente: menuForm.modalidad === 'delivery' ? menuForm.direccion : undefined,
 costo_envio: 0
 };

 try {
 await dbSavePedidoComplex(newPedido);
 } catch (err) {
 console.warn('Silent DB persistence failed:', err);
 }

 let itemLines = '';
 cartItems.forEach(it => {
 itemLines += `• *${it.cantidad}x ${it.nombre}* ─── $${(it.precio_unitario * it.cantidad).toLocaleString('es-AR')}\n`;
 });

 let billingInfo = '';
 if (quieroFactura) {
 billingInfo = `🧾 *DATOS DE FACTURACIÓN:*\n` +
 `• *Reg. Impositivo:* ${facturacionForm.registroImpositivo}\n` +
 `• *Razón Social:* ${facturacionForm.razonSocial.trim()}\n` +
 `• *CUIT:* ${facturacionForm.cuit.trim()}\n` +
 `• *Domicilio Fiscal:* ${facturacionForm.domicilioFiscal.trim()}\n` +
 `• *Email:* ${facturacionForm.email.trim()}\n` +
 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
 }

 const msg = `🍕 *NUEVO PEDIDO - PIZZERÍA COLORES* 🍕\n` +
 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
 `📋 *Pedido N°:* #${orderId}\n` +
 `👤 *Cliente:* ${menuForm.nombre}\n` +
 `📞 *Teléfono:* ${menuForm.telefono}\n` +
 `🛵 *Modalidad:* ${menuForm.modalidad === 'delivery' ? 'Envío a Domicilio 🛵' : 'Retiro en el Local 🏪'}\n` +
 (menuForm.modalidad === 'delivery' ? `📍 *Dirección:* ${menuForm.direccion}\n` : '') +
 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
 `📦 *DETALLE DEL PEDIDO:*\n` +
 itemLines + `\n` +
 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
 `💵 *TOTAL A PAGAR:* *$${total.toLocaleString('es-AR')}*\n` +
 `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
 billingInfo +
 `¡Muchas gracias! Aguardo confirmación del pedido.`;

 let cleanPhone = menuForm.telefono.replace(/\D/g, '');
 let formattedPhone = '5493584024822';
 const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;

 setMenuCart({});
 setMenuStep(1);
 setShowDigitalMenu(false);
 setQuieroFactura(false);
 setFacturacionForm({
 registroImpositivo: 'Consumidor Final',
 razonSocial: '',
 cuit: '',
 domicilioFiscal: '',
 email: ''
 });
 
 window.open(url, '_blank');
 };

 const handleEventSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!eventForm.personas || !eventForm.fecha) {
 alert('Por favor complete los campos obligatorios para cotizar su evento.');
 return;
 }

 const parts = eventForm.fecha.split('-');
 const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : eventForm.fecha;
 const lugarText = eventForm.lugar.trim() || 'No especificado';

 const cleanPhone = '5493584024822'; // Colores Pizzería WhatsApp line
 const text = `¡Hola Pizzería Colores! Me gustaría cotizar un evento. Datos:\n\n` +
 `• Cantidad de personas: ${eventForm.personas}\n` +
 `• Fecha aproximada: ${formattedDate}\n` +
 `• Lugar/Localidad: ${lugarText}\n\n` +
 `¡Muchas gracias!`;

 const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');

 setShowEventModal(false);
 setEventForm({ personas: '', fecha: '', lugar: '' });
 };

 // Custom Pizza Builder states
 const [pizzaSize, setPizzaSize] = useState<'individual' | 'grande'>('grande');
 const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

 const TOPPINGS = [
 { id: 'ins_jamon_cocido', name: 'Jamón Cocido', price: 1500, icon: '🍖', color: '#E5989B' },
 { id: 'ins_morrones', name: 'Morrones Asados', price: 1500, icon: '🌶️', color: '#fc0000' },
 { id: 'ins_panceta', name: 'Panceta Ahumada', price: 1800, icon: '🥓', color: '#B5828C' },
 { id: 'ins_huevo_fresco', name: 'Huevo Duro', price: 1000, icon: '🥚', color: '#F1FAEE' },
 { id: 'ins_aceitunas', name: 'Aceitunas', price: 1000, icon: '🟢', color: '#52B788' },
 { id: 'ins_albahaca', name: 'Albahaca Fresca', price: 800, icon: '🌿', color: '#2D6A4F' },
 { id: 'ins_cebolla', name: 'Cebolla Caramelizada', price: 1000, icon: '🧅', color: '#FFE5EC' },
 { id: 'ins_provolone', name: 'Queso Provolone', price: 1800, icon: '🧀', color: '#F77F00' }
 ];

 const getStock = (idInsumo: string) => {
 if (!insumos || insumos.length === 0) return 5000;
 const ins = insumos.find(i => i.id_insumo === idInsumo);
 return ins ? ins.stock_actual : 0;
 };

 const basePrice = pizzaSize === 'individual' ? 11000 : 22000;
 // Up to 4 toppings included, each extra topping is $1500
 const extraToppingsCount = Math.max(0, selectedToppings.length - 4);
 const extraToppingsPrice = extraToppingsCount * 1500;
 const customPizzaPrice = basePrice + extraToppingsPrice;

 // Dynamic Promos list from database, fallback to initial/hardcoded combos if none found
 const promos = (productosMenu || []).filter(p => 
 p.activo && (
 p.categoria?.toLowerCase().includes('promo') ||
 p.categoria?.toLowerCase().includes('combo') ||
 p.categoria?.toLowerCase().includes('extras') ||
 p.id_producto.includes('promo') ||
 p.id_producto.includes('combo') ||
 p.id_producto.startsWith('prod_ext_')
 )
 );

 const displayPromos = promos.length > 0 ? promos.map(p => ({
 title: p.nombre,
 price: p.precio_venta,
 badge: p.categoria || "PROMO 🔥",
 desc: p.descripcion || "Disfrutá de esta promoción especial en casa.",
 note: p.requiere_cocina ? "Elaboración en el acto" : "Listo para consumir",
 id: p.id_producto
 })) : [
 {
 title: "Combo Amigos",
 price: 28000,
 badge: "MÁS VENDIDO 🏆",
 desc: "🍕 1 Pizza Especial Grande + 🥟 6 Empanadas Criollas + 🥤 1 Gaseosa de 1.5L",
 note: "Ideal para 3-4 personas"
 },
 {
 title: "Combo Pareja",
 price: 23000,
 badge: "¡DE FIN DE SEMANA! 🍺",
 desc: "🍕 1 Pizza Muzzarella Grande + 🍺 2 Pintas de Cerveza Artesanal GIUS",
 note: "Ideal para 2 personas"
 },
 {
 title: "Combo Familiar",
 price: 42000,
 badge: "¡SÚPER PROMO! 🔥",
 desc: "🍕 2 Pizzas Grandes a elección + 🥯 2 Fainá + 🥤 1 Gaseosa de 1.5L",
 note: "Ideal para 5-6 personas"
 }
 ];

 return (
 <div className="min-h-screen bg-[#FFFDF9] text-[#3b3b3b] font-sans selection:bg-[#fc0000] selection:text-white transition-colors duration-300 pb-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] ">
 
 {/* 1. BRAND HEADER (McDonald's High Contrast Inspired) */}
 <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FFFDF9]/95 border-b-4 border-[#3b3b3b] px-4 sm:px-6 lg:px-8 shadow-sm">
 <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
 <div 
 onClick={onEnterSystem}
 className="flex items-center gap-3 cursor-default select-none"
 >
 <div className="w-12 h-12 bg-[#fc0000] border-2 border-[#3b3b3b] rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(59,59,59,1)] transition-all duration-150">
 <Pizza className="w-7 h-7 text-white" />
 </div>
 <div className="flex flex-col">
 <span className="font-display text-2xl sm:text-3xl tracking-wide text-[#fc0000] leading-none">
 COLORES
 </span>
 <span className="text-[9px] font-black uppercase text-[#fbd127] tracking-widest pl-0.5">
 Pizzería & Minutas
 </span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={() => {
 setMenuStep(1);
 setShowDigitalMenu(true);
 }}
 className="px-4 py-2.5 bg-[#fbd127] hover:bg-[#ffe163] text-[#3b3b3b] border-2 border-[#3b3b3b] rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(59,59,59,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(59,59,59,1)] transition-all cursor-pointer flex items-center gap-1.5"
 >
 <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
 Ver Carta & Pedir
 </button>
 </div>
 </div>
 </header>

 {/* 2. HERO COMMERCIAL BOARD */}
 <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
 <div className="text-center space-y-6 max-w-4xl mx-auto">
 <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fbd127] text-[#3b3b3b] border-2 border-[#3b3b3b] rounded-full font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(59,59,59,1)] transform -rotate-1">
 <Sparkles className="w-4 h-4 text-[#fc0000] fill-[#fc0000]" />
 ¡EL SABOR QUE TE VUELVE A ENAMORAR!
 </div>

 <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-none text-[#3b3b3b] uppercase tracking-tight">
 PIZZERÍA COLORES <br />
 <span className="text-[#fc0000] italic underline decoration-wavy decoration-[#fbd127] tracking-wide">SABOR AL HORNO DE BARRO</span>
 </h1>

 <p className="text-[#3b3b3b] text-base sm:text-xl font-bold leading-relaxed max-w-2xl mx-auto pl-4 border-l-4 border-[#fc0000]">
 Masa madre fermentada durante 48 hs, ingredientes frescos seleccionados y el toque único de la leña natural. Una mordida y entendés todo.
 </p>

 <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
 <button 
 onClick={() => setShowEventModal(true)}
 className="w-full sm:w-auto px-8 py-5 bg-[#fc0000] hover:bg-[#ff2b2b] text-white border-2 border-[#3b3b3b] rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(59,59,59,1)] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_rgba(59,59,59,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(59,59,59,1)] transition-all cursor-pointer text-center"
 >
 Contactarnos para tu evento
 </button>
 <button 
 onClick={() => {
 setMenuStep(1);
 setShowDigitalMenu(true);
 }}
 className="w-full sm:w-auto px-8 py-5 bg-[#fbd127] hover:bg-[#ffe163] text-[#3b3b3b] border-2 border-[#3b3b3b] rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(59,59,59,1)] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_rgba(59,59,59,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(59,59,59,1)] transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
 >
 <ShoppingBag className="w-5 h-5 stroke-[2.5px]" />
 Pedir Online & Ver Carta
 </button>
 </div>
 </div>

 {/* 3. ESCAPARATE PUBLICITARIO ESTILO POP FAST-FOOD (McDONALD'S / BURGER KING) */}
 <div id="especialidades" className="space-y-12 pt-8">
 <div className="text-center space-y-3">
 <span className="inline-block px-3 py-1 bg-[#fc0000] text-white border-2 border-[#3b3b3b] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[2px_2px_0px_rgba(59,59,59,1)] transform -rotate-1">
 🍔 ¡LOS PREFERIDOS DE LA CASA!
 </span>
 <h2 className="font-display text-4xl sm:text-6xl text-[#3b3b3b] uppercase leading-none">
 Nuestras Promociones
 </h2>
 <p className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wider max-w-lg mx-auto leading-relaxed">
 No hacemos todo el menú igual, seleccionamos tres productos firma elaborados a la leña con la mejor materia prima. ¡Entran por los ojos!
 </p>
 <div className="w-20 h-1.5 bg-[#fbd127] mx-auto border-2 border-[#3b3b3b] rounded-full shadow-[2px_2px_0px_0px_rgba(59,59,59,1)]" />
 </div>

 {/* 3 Signature Products Grid */}
 {/* 3 Signature Products Grid -> replaced dynamically with Active Database Promos */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4 max-w-6xl mx-auto">
 {promocionesList.length === 0 ? (
 <div className="col-span-3 text-center py-12 text-stone-500 ">
 <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#fbd127]" />
 <p className="text-sm uppercase font-black text-[#3b3b3b] ">No hay promociones activas registradas en el sistema</p>
 </div>
 ) : (
 promocionesList.map((p, idx) => {
 const labelUpper = p.tipo === 'happy_hour' ? '🍺 HAPPY HOUR' : p.tipo === 'combo' ? '🍕 COMBO' : '🔥 DESCUENTO';
 const labelColor = p.tipo === 'happy_hour' ? '#fbd127' : p.tipo === 'combo' ? '#FF5722' : '#fc0000';
 const cleanImage = p.imagen_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';

 return (
 <div
 key={p.id_promo}
 className={`bg-white border-4 border-[#3b3b3b] rounded-[2.5rem] overflow-hidden shadow-[8px_8px_0px_0px_rgba(59,59,59,1)] transition-all duration-300 hover:translate-y-[-8px] hover:shadow-[14px_14px_0px_0px_rgba(59,59,59,1)] ${
 idx % 2 === 0 ? 'hover:rotate-1' : 'hover:rotate-[-1]'
 } flex flex-col h-full group`}
 >
 <div className="h-64 relative overflow-hidden bg-stone-100 border-b-4 border-[#3b3b3b]">
 <img
 src={cleanImage}
 alt={p.nombre}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 onError={e => {
 (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80';
 }}
 />
 <span 
 className="absolute top-4 left-4 px-4 py-2 text-[#3b3b3b] border-2 border-[#3b3b3b] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_rgba(59,59,59,1)] transform -rotate-2"
 style={{ backgroundColor: labelColor }}
 >
 {labelUpper}
 </span>
 <span className="absolute bottom-4 right-4 px-3.5 py-1.5 bg-[#3b3b3b] text-[#fbd127] border-2 border-[#3b3b3b] text-xs font-black rounded-xl shadow-[2px_2px_0px_rgba(255,255,255,0.1)]">
 -{p.descuento_porcentaje}% OFF
 </span>
 </div>

 <div className="p-6 flex-grow flex flex-col justify-between space-y-6 text-left">
 <div className="space-y-3">
 <div className="flex items-center justify-between gap-2">
 <h3 className="font-display text-2xl text-[#3b3b3b] uppercase leading-none group-hover:text-[#fc0000] transition-colors">
 {p.nombre}
 </h3>
 </div>
 <p className="text-xs font-bold text-[#3b3b3b] leading-relaxed italic">
 "{p.descripcion || 'Disfrutá de esta promoción especial en nuestro salón o a domicilio.'}"
 </p>
 {p.dias_vigentes && (
 <span className="inline-block text-[9px] font-extrabold text-[#fc0000] uppercase tracking-wider bg-stone-50 px-2 py-1 rounded border border-[#3b3b3b]/10">
 🗓️ {p.dias_vigentes}
 </span>
 )}
 </div>

 <div className="pt-4 border-t border-[#3b3b3b]/10 flex items-center justify-between">
 <div>
 <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block">Descuento</span>
 <span className="font-display text-2xl text-[#fc0000]">
 {p.descuento_porcentaje}% OFF
 </span>
 </div>
 <a
 href={`https://wa.me/5493584024822?text=${encodeURIComponent(
 `¡Hola Pizzería Colores! Me gustaría solicitar la promoción especial:\n` +
 `• ${p.nombre} (-${p.descuento_porcentaje}% OFF)\n` +
 `• Detalle: ${p.descripcion}\n\n` +
 `¡Muchas gracias!`
 )}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-5 py-4 bg-[#fbd127] hover:bg-[#ffe163] text-[#3b3b3b] border-2 border-[#3b3b3b] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_rgba(59,59,59,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(59,59,59,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(59,59,59,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
 >
 <ShoppingBag className="w-4 h-4" />
 Pedir Promo
 </a>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* 4. SIMULADOR INTERACTIVO "ARMA TU PIZZA" (REDiseño ARCADE / MOBILE POP) */}
 <div className="bg-[#FFFDF9] border-4 border-[#3b3b3b] rounded-[2.5rem] p-6 sm:p-10 shadow-[10px_10px_0px_0px_rgba(59,59,59,1)] space-y-8 text-left mt-16 max-w-5xl mx-auto relative overflow-hidden">
 <div className="absolute top-0 right-0 bg-[#fbd127] border-b-2 border-l-2 border-[#3b3b3b] text-[#3b3b3b] text-[9px] font-black px-4 py-2 uppercase tracking-widest rounded-bl-xl shadow-sm">
 🕹️ MULTIPLAYER / FUN MODE
 </div>

 <div className="text-center space-y-2 max-w-xl mx-auto">
 <span className="inline-block px-3 py-1 bg-[#3b3b3b] text-[#fbd127] border-2 border-[#3b3b3b] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[2px_2px_0px_rgba(255,255,255,0.1)] transform rotate-1">
 🍕 ¡SIMULADOR DIGITAL!
 </span>
 <h2 className="font-display text-4xl sm:text-5xl text-[#3b3b3b] uppercase leading-none">
 Crea tu Propia Pizza
 </h2>
 <p className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wide">
 ¡Interactiva, rápida y directo al WhatsApp! Elige tu tamaño y hasta 4 toppings incluidos.
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
 {/* Options Panel (Left Side - 7 cols) */}
 <div className="lg:col-span-7 space-y-6">
 {/* 1. Size Selection */}
 <div className="space-y-3">
 <h4 className="text-xs font-black uppercase tracking-wider text-[#3b3b3b] flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-[#fc0000] text-white border border-[#3b3b3b] flex items-center justify-center text-[10px] font-bold">1</span>
 Elegir Tamaño de Base
 </h4>
 <div className="grid grid-cols-2 gap-4">
 {[
 { id: 'individual', name: 'Individual (4 Porciones)', price: 11000 },
 { id: 'grande', name: 'Grande (8 Porciones)', price: 22000 }
 ].map(sz => (
 <button
 key={sz.id}
 type="button"
 onClick={() => setPizzaSize(sz.id as any)}
 className={`p-4 border-2 border-[#3b3b3b] rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between shadow-[3px_3px_0px_rgba(59,59,59,1)] active:translate-y-[1px] ${
 pizzaSize === sz.id 
 ? 'bg-[#fc0000] text-white shadow-[5px_5px_0px_rgba(59,59,59,1)] translate-y-[-2px]' 
 : 'bg-white hover:bg-stone-50 text-[#3b3b3b]'
 }`}
 >
 <span className="block font-black text-xs uppercase leading-tight">{sz.name}</span>
 <span className="block font-display text-xl mt-2">${sz.price.toLocaleString('es-AR')}</span>
 </button>
 ))}
 </div>
 </div>

 {/* 2. Toppings Selection */}
 <div className="space-y-3">
 <h4 className="text-xs font-black uppercase tracking-wider text-[#3b3b3b] flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-[#fc0000] text-white border border-[#3b3b3b] flex items-center justify-center text-[10px] font-bold">2</span>
 Sumar Toppings (Máx. 5 Toppings)
 </h4>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {TOPPINGS.map(top => {
 const stock = getStock(top.id);
 const isSinStock = stock <= 0;
 const isSelected = selectedToppings.includes(top.id);
 const isLimitReached = selectedToppings.length >= 5 && !isSelected;
 const isDisabled = isSinStock || isLimitReached;

 return (
 <div
 key={top.id}
 onClick={() => {
 if (isDisabled) return;
 if (isSelected) {
 setSelectedToppings(selectedToppings.filter(t => t !== top.id));
 } else {
 setSelectedToppings([...selectedToppings, top.id]);
 }
 }}
 className={`relative p-3 border-2 border-[#3b3b3b] rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-[2px_2px_0px_rgba(59,59,59,1)] active:translate-y-[1px] select-none ${
 isSinStock ? 'opacity-40 filter grayscale pointer-events-none' : ''
 } ${
 isSelected
 ? 'bg-[#fbd127] text-[#3b3b3b] shadow-[4px_4px_0px_rgba(59,59,59,1)] font-extrabold translate-y-[-2px]'
 : 'bg-white hover:bg-stone-50 text-[#3b3b3b] font-semibold'
 } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
 >
 {isSinStock && (
 <span className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#fc0000] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-[#3b3b3b] shadow-sm">
 SIN STOCK
 </span>
 )}
 <span className="text-2xl">{top.icon}</span>
 <span className="text-[10px] uppercase leading-none">{top.name}</span>
 
 <div className="flex items-center gap-1 mt-1">
 <input 
 type="checkbox"
 checked={isSelected}
 disabled={isDisabled}
 onChange={() => {}}
 className="w-3.5 h-3.5 accent-[#fc0000] cursor-pointer"
 />
 </div>

 {selectedToppings.indexOf(top.id) >= 4 && (
 <span className="text-[8px] font-black text-white bg-[#3b3b3b] px-1.5 py-0.5 rounded border border-white/20 mt-1">
 +$1.500
 </span>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* Summary and WhatsApp button */}
 <div className="pt-4 border-t-2 border-[#3b3b3b] flex flex-col sm:flex-row items-center justify-between gap-4">
 <div>
 <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Precio Total Estimado</span>
 <span className="font-display text-3xl sm:text-4xl text-[#fc0000]">
 ${customPizzaPrice.toLocaleString('es-AR')}
 </span>
 {selectedToppings.length > 4 && (
 <span className="text-[9px] font-black text-stone-500 block uppercase">
 Incluye {selectedToppings.length - 4} topping(s) extra(s)
 </span>
 )}
 </div>
 <a
 href={`https://wa.me/5493584024822?text=${encodeURIComponent(
 `¡Hola Pizzería Colores! Armé una pizza personalizada en el simulador:\n` +
 `• Tamaño: Pizza ${pizzaSize === 'individual' ? 'Chica/Individual (4 porciones)' : 'Familiar/Grande (8 porciones)'}\n` +
 `• Toppings: ${selectedToppings.length > 0 ? selectedToppings.map(tid => TOPPINGS.find(t => t.id === tid)?.name).join(', ') : 'Solo Queso Muzzarella'}\n` +
 `• Total: $${customPizzaPrice.toLocaleString('es-AR')}\n\n` +
 `¿Me la podrían preparar y enviar? ¡Muchas gracias!`
 )}`}
 target="_blank"
 rel="noopener noreferrer"
 className="w-full sm:w-auto px-6 py-4 bg-[#fc0000] hover:bg-[#ff2b2b] text-white border-2 border-[#3b3b3b] rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-[4px_4px_0px_rgba(59,59,59,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(59,59,59,1)] active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <MessageCircle className="w-5 h-5 stroke-[2.5px]" />
 Pedir Pizza Armada
 </a>
 </div>
 </div>

 {/* Interactive Pizza Visual (Right Side - 5 cols) */}
 <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 border-4 border-[#3b3b3b] rounded-[2rem] bg-white shadow-[4px_4px_0px_rgba(59,59,59,1)] relative h-80 min-h-[300px]">
 <div className="absolute top-4 left-4 bg-[#3b3b3b] text-white text-[9px] font-black px-2 py-1 rounded border border-white/20 uppercase tracking-widest">
 Vista Previa
 </div>

 {/* Pizza Base */}
 <div 
 className={`relative rounded-full border-4 border-amber-900 bg-[#E07A5F] shadow-inner flex items-center justify-center transition-all duration-300 ${
 pizzaSize === 'individual' ? 'w-44 h-44' : 'w-60 h-60'
 }`}
 style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)' }}
 >
 {/* Crust edge */}
 <div className="absolute inset-2 rounded-full border-4 border-[#F4A261] bg-[#FFE0B2]" />
 
 {/* Cheese base */}
 <div className="absolute inset-4 rounded-full bg-[#FFE57F] border border-amber-500/20" />

 {/* Oregano particles (Mockup CSS dots) */}
 <div className="absolute inset-5 opacity-40 bg-[radial-gradient(#2d6a4f_2px,transparent_2px)] [background-size:12px_12px] rounded-full pointer-events-none" />

 {/* Render toppings visually as CSS elements or emojis */}
 {selectedToppings.map((topId, index) => {
 const topObj = TOPPINGS.find(t => t.id === topId);
 if (!topObj) return null;
 
 // Position emojis around the circle randomly/symmetrically based on index and topping ID
 const count = pizzaSize === 'individual' ? 5 : 8;
 const elements = [];
 for (let i = 0; i < count; i++) {
 const radius = pizzaSize === 'individual' ? 35 : 55;
 const angle = (i * (360 / count)) + (index * 25);
 const rad = (angle * Math.PI) / 180;
 const x = Math.round(radius * Math.cos(rad));
 const y = Math.round(radius * Math.sin(rad));
 elements.push(
 <div
 key={`${topId}_${i}`}
 className="absolute text-lg select-none pointer-events-none transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-200"
 style={{
 left: `calc(50% + ${x}px)`,
 top: `calc(50% + ${y}px)`,
 transform: `translate(-50%, -50%) rotate(${angle}deg)`
 }}
 >
 {topObj.icon}
 </div>
 );
 }
 return elements;
 })}
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* 4. BRAND VALUES & HORNO EXPERIENCE */}
 <section className="py-20 bg-[#fbd127] border-y-4 border-[#3b3b3b] text-[#3b3b3b] relative overflow-hidden">
 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
 
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
 <div className="space-y-6 text-left">
 <span className="inline-block px-3 py-1 bg-[#3b3b3b] text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_rgba(59,59,59,1)]">
 CALIDAD PREMIUM SIN VUELTAS
 </span>
 <h2 className="font-display text-4xl sm:text-6xl text-[#3b3b3b] uppercase leading-none">
 El Secreto Está en el Horno
 </h2>
 <p className="text-[#3b3b3b] text-sm sm:text-base font-bold leading-relaxed">
 En Colores Pizzería no hacemos milagros, hacemos tradición. Calentamos nuestro horno a más de 400°C usando únicamente leña de espinillo seleccionada. Esto le da a la masa ese dorado rústico inconfundible y funde la muzzarella hasta crear hebras cremosas infinitas.
 </p>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
 <div className="bg-white p-4 border-2 border-[#3b3b3b] rounded-2xl shadow-[3px_3px_0px_rgba(59,59,59,1)] flex gap-3">
 <div className="w-10 h-10 rounded-xl bg-[#fc0000] flex items-center justify-center shrink-0 border border-[#3b3b3b] text-white">
 <ChefHat className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-black text-xs uppercase text-[#3b3b3b] ">Hecho a Mano</h4>
 <p className="text-[10px] text-stone-500 font-semibold">Repulgues manuales y horneado en el acto.</p>
 </div>
 </div>
 <div className="bg-white p-4 border-2 border-[#3b3b3b] rounded-2xl shadow-[3px_3px_0px_rgba(59,59,59,1)] flex gap-3">
 <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center shrink-0 border border-[#3b3b3b] text-white">
 <Flame className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-black text-xs uppercase text-[#3b3b3b] ">Fuego & Leña</h4>
 <p className="text-[10px] text-stone-500 font-semibold">El inconfundible sabor ahumado del quebracho y espinillo.</p>
 </div>
 </div>
 </div>
 </div>

 {/* Interactive Map Block */}
 <div className="relative flex justify-center">
 <div className="w-full h-80 sm:h-96 rounded-3xl border-4 border-[#3b3b3b] overflow-hidden shadow-[8px_8px_0px_0px_rgba(59,59,59,1)] bg-stone-100 relative">
 <iframe 
 src="https://maps.google.com/maps?q=Alvear%201362,%20R%C3%ADo%20Cuarto,%20C%C3%B3rdoba,%20Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed" 
 width="100%" 
 height="100%" 
 style={{ border: 0 }} 
 allowFullScreen={true} 
 loading="lazy"
 title="Ubicación de Colores Pizzería"
 />
 </div>
 </div>
 </div>
 </section>



 {/* 4.5. MURO DE RESEÑAS / TESTIMONIOS INTERACTIVO */}
 <section className="py-20 bg-stone-50 border-t-4 border-[#3b3b3b] text-[#3b3b3b] relative overflow-hidden">
 <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
 
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
 <div className="text-center space-y-2">
 <span className="inline-block px-3 py-1 bg-[#fc0000] text-white border-2 border-[#3b3b3b] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[2px_2px_0px_rgba(59,59,59,1)] transform -rotate-1">
 💬 OPINIONES DEL BARRIO
 </span>
 <h2 className="font-display text-3xl sm:text-5xl text-[#3b3b3b] uppercase leading-none">
 Lo Que Dicen Nuestros Clientes
 </h2>
 <p className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wider">
 Opiniones reales de vecinos de Río Cuarto que disfrutan de nuestra cocina
 </p>
 <div className="w-16 h-1.5 bg-[#fbd127] mx-auto border-2 border-[#3b3b3b] rounded-full shadow-[2px_2px_0px_0px_rgba(59,59,59,1)]" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {[
 {
 name: "Mariela G.",
 role: "Cliente Frecuente",
 stars: 5,
 comment: "La mejor pizza a la leña de Río Cuarto sin dudas. La masa es super liviana y la muzzarella es abundante. Llegó caliente y crocante.",
 date: "Hace 2 días"
 },
 {
 name: "Carlos F.",
 role: "Vecino del Barrio",
 stars: 5,
 comment: "Los calzones son gigantes, comimos tres personas de uno solo. Excelente relación precio-calidad y la atención por WhatsApp de diez.",
 date: "Hace 1 semana"
 },
 {
 name: "Laura M.",
 role: "Amante de las Empanadas",
 stars: 5,
 comment: "Las empanadas salteñas son un espectáculo, súper jugosas y con el toque justo de comino y papa. Siempre pedimos acá los fines de semana.",
 date: "Hace 3 días"
 }
 ].map((rev, idx) => (
 <div 
 key={idx}
 className="bg-white p-8 border-4 border-[#3b3b3b] rounded-3xl shadow-[6px_6px_0px_rgba(59,59,59,1)] flex flex-col justify-between space-y-6 text-left"
 >
 <div className="space-y-4">
 {/* Stars block */}
 <div className="flex gap-1">
 {Array.from({ length: rev.stars }).map((_, i) => (
 <Star key={i} className="w-4 h-4 fill-[#fbd127] text-[#3b3b3b] stroke-[1.5px]" />
 ))}
 </div>
 <p className="text-xs font-bold text-[#3b3b3b] leading-relaxed italic">
 "{rev.comment}"
 </p>
 </div>

 <div className="pt-4 border-t border-[#3b3b3b]/10 flex items-center justify-between">
 <div>
 <h4 className="font-black text-xs uppercase text-[#3b3b3b] leading-none">{rev.name}</h4>
 <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{rev.role}</span>
 </div>
 <span className="text-[9px] font-extrabold text-stone-450 uppercase">{rev.date}</span>
 </div>
 </div>
 ))}
 </div>

 <div className="pt-4 text-center">
 <a
 href="https://wa.me/5493584024822?text=¡Hola Pizzería Colores! Quería dejarles mi opinión sobre el pedido..."
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3b3b3b] text-white hover:bg-[#fc0000] hover:text-white border-2 border-[#3b3b3b] rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_rgba(59,59,59,1)] active:translate-y-[1px] transition-all cursor-pointer"
 >
 <MessageSquare className="w-4 h-4" />
 Dejar una Opinión
 </a>
 </div>
 </div>
 </section>

 {/* 5. BOOKING FORM (McDonald's High Contrast Theme) */}
 <section id="reserva" className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
 <div className="text-center space-y-3">
 <span className="text-xs uppercase font-extrabold text-[#fc0000] tracking-widest bg-[#fc0000]/10 px-4 py-1.5 rounded-full border border-[#fc0000]/20">
 ¡COMPARTÍ EL MOMENTO!
 </span>
 <h2 className="font-display text-4xl sm:text-6xl text-[#3b3b3b] uppercase">
 Reservar tu Mesa
 </h2>
 <p className="text-xs sm:text-sm text-stone-500 font-bold max-w-md mx-auto italic">
 Completá tus datos y enviá la solicitud. Te responderemos por WhatsApp para confirmar tu reserva al instante.
 </p>
 </div>

 <form onSubmit={handleBookingSubmit} className="bg-white p-8 sm:p-10 rounded-3xl border-4 border-[#3b3b3b] shadow-[8px_8px_0px_0px_rgba(59,59,59,1)] space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2 text-left">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Nombre Completo *</label>
 <input 
 type="text" 
 required
 value={bookingForm.nombre}
 onChange={(e) => setBookingForm(prev => ({ ...prev, nombre: e.target.value }))}
 placeholder="Ej. Juan Pérez"
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 />
 </div>
 <div className="space-y-2 text-left">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">WhatsApp de contacto *</label>
 <input 
 type="tel" 
 required
 value={bookingForm.telefono}
 onChange={(e) => setBookingForm(prev => ({ ...prev, telefono: e.target.value }))}
 placeholder="Ej. 11 1234 5678"
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
 <div className="space-y-2 text-left">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Comensales</label>
 <select 
 value={bookingForm.personas}
 onChange={(e) => setBookingForm(prev => ({ ...prev, personas: e.target.value }))}
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 >
 {[1,2,3,4,5,6,7,8].map(n => (
 <option key={n} value={n}>{n} {n === 1 ? 'Persona' : 'Personas'}</option>
 ))}
 </select>
 </div>
 <div className="space-y-2 text-left">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Fecha *</label>
 <input 
 type="date" 
 required
 value={bookingForm.fecha}
 onChange={(e) => setBookingForm(prev => ({ ...prev, fecha: e.target.value }))}
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 />
 </div>
 <div className="space-y-2 text-left">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Hora</label>
 <select 
 value={bookingForm.hora}
 onChange={(e) => setBookingForm(prev => ({ ...prev, hora: e.target.value }))}
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 >
 {['12:00', '13:00', '14:00', '20:00', '21:00', '22:00', '23:00'].map(h => (
 <option key={h} value={h}>{h} hs</option>
 ))}
 </select>
 </div>
 </div>

 <button 
 type="submit"
 className="w-full py-5 bg-[#fc0000] hover:bg-[#ff2b2b] text-white border-2 border-[#3b3b3b] rounded-2xl font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(59,59,59,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(59,59,59,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(59,59,59,1)] transition-all cursor-pointer"
 >
 Solicitar Reserva por WhatsApp
 </button>
 </form>
 </section>

 {/* 6. CONTACT & LOCATION INFO */}
 <section id="contacto" className="py-12 border-t-4 border-[#3b3b3b] bg-stone-50 ">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
 <div className="space-y-6 text-left">
 <h3 className="font-display text-4xl text-[#3b3b3b] uppercase leading-none">Ubicación & Contacto</h3>
 <div className="space-y-4 text-[#3b3b3b] text-sm font-bold">
 <div className="flex items-center gap-3">
 <MapPin className="w-6 h-6 text-[#fc0000] shrink-0 stroke-[2.5px]" />
 <span>Alvear 1362, Río Cuarto, Córdoba, X5800</span>
 </div>
 <a 
 href="https://wa.me/5493584024822" 
 target="_blank" 
 rel="noopener noreferrer"
 className="flex items-center gap-3 hover:text-[#fc0000] transition-colors"
 >
 <Phone className="w-6 h-6 text-[#fc0000] shrink-0 stroke-[2.5px]" />
 <span>+54 9 358 402-4822 (WhatsApp)</span>
 </a>
 <div className="flex items-center gap-3">
 <Clock className="w-6 h-6 text-[#fc0000] shrink-0 stroke-[2.5px]" />
 <span>Martes a Domingos: 12:00 a 16:00 hs & 20:00 a 00:00 hs</span>
 </div>
 <a 
 href="mailto:colores.pizzeria@gmail.com"
 className="flex items-center gap-3 hover:text-[#fc0000] transition-colors"
 >
 <Mail className="w-6 h-6 text-[#fc0000] shrink-0 stroke-[2.5px]" />
 <span>colores.pizzeria@gmail.com</span>
 </a>
 </div>
 </div>
 <div className="flex flex-col justify-center space-y-4 border-4 border-[#3b3b3b] p-8 rounded-3xl bg-white shadow-[4px_4px_0px_rgba(59,59,59,1)] text-left">
 <h4 className="font-display text-2xl text-[#fc0000] uppercase leading-none">Reservá Hoy</h4>
 <p className="text-xs font-bold text-stone-500 leading-relaxed uppercase">
 Hacé clic en el botón para ingresar al panel de pedidos para mozos o solicitar tu mesa en el salón directamente en segundos.
 </p>
 </div>
 </div>
 </section>

 {/* 7. FOOTER */}
 <footer className="bg-[#3b3b3b] text-stone-400 py-12 px-4 border-t-4 border-[#3b3b3b] text-center space-y-6">
 <div 
 className="flex items-center justify-center gap-2.5 cursor-pointer select-none" 
 onDoubleClick={onEnterSystem}
 >
 <div className="w-8 h-8 bg-[#fc0000] rounded-lg flex items-center justify-center border border-white/20">
 <Pizza className="w-5 h-5 text-white" />
 </div>
 <span className="font-display text-xl tracking-wider text-[#FFFDF9]">COLORES PIZZERÍA</span>
 </div>
 <p className="text-[10px] font-bold tracking-widest max-w-sm mx-auto uppercase">
 © {new Date().getFullYear()} Colores Pizzería. Todos los derechos reservados. Hecho con pasión criolla e italiana.
 </p>
 </footer>

 {/* EVENT BOOKING DIALOG */}
 <AnimatePresence>
 {showEventModal && (
 <div className="fixed inset-0 z-50 bg-[#3b3b3b]/70 backdrop-blur-xs flex items-center justify-center p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-white p-8 rounded-3xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(59,59,59,1)] space-y-5 border-4 border-[#3b3b3b] text-left"
 >
 <h3 className="font-display text-3xl text-[#3b3b3b] uppercase leading-none">Cotizá tu Evento 🎉</h3>
 <p className="text-xs text-[#3b3b3b] font-bold leading-relaxed">
 Completá los datos y coordinamos el menú de forma directa por WhatsApp.
 </p>
 
 <form onSubmit={handleEventSubmit} className="space-y-4">
 <div className="flex flex-col gap-2">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Cantidad de personas aproximada *</label>
 <input 
 type="number" 
 required
 min="1"
 value={eventForm.personas}
 onChange={(e) => setEventForm(prev => ({ ...prev, personas: e.target.value }))}
 placeholder="Ej. 30"
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 />
 </div>
 
 <div className="flex flex-col gap-2">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Fecha aproximada *</label>
 <input 
 type="date" 
 required
 value={eventForm.fecha}
 onChange={(e) => setEventForm(prev => ({ ...prev, fecha: e.target.value }))}
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#fbd127] transition-all"
 />
 </div>
 
 <div className="flex flex-col gap-2">
 <label className="text-xs font-black uppercase text-[#3b3b3b] ">Lugar / Localidad (Opcional)</label>
 <input 
 type="text" 
 value={eventForm.lugar}
 onChange={(e) => setEventForm(prev => ({ ...prev, lugar: e.target.value }))}
 placeholder="Ej: Quincho, Club, Domicilio..."
 className="w-full p-4 rounded-xl border-2 border-[#3b3b3b] bg-[#FFFDF9] text-sm font-bold focus:outline-none"
 />
 </div>
 
 <div className="flex justify-end gap-3 pt-4 border-t border-[#3b3b3b]/10">
 <button 
 type="button" 
 onClick={() => {
 setShowEventModal(false);
 setEventForm({ personas: '', fecha: '', lugar: '' });
 }} 
 className="px-5 py-3 bg-[#e0e0e0] text-[#3b3b3b] border-2 border-[#3b3b3b] rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(59,59,59,1)] active:translate-y-[1px] cursor-pointer"
 >
 Cancelar
 </button>
 <button 
 type="submit" 
 className="px-5 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white border-2 border-[#3b3b3b] rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(59,59,59,1)] active:translate-y-[1px] cursor-pointer"
 >
 Enviar a WhatsApp 🚀
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* 8. BOOKING SUCCESS DIALOG */}
 <AnimatePresence>
 {showBookingSuccess && (
 <div className="fixed inset-0 z-50 bg-[#3b3b3b]/70 backdrop-blur-xs flex items-center justify-center p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-white p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(59,59,59,1)] text-center space-y-5 border-4 border-[#3b3b3b]"
 >
 <div className="w-16 h-16 bg-[#fbd127] rounded-full flex items-center justify-center mx-auto border-2 border-[#3b3b3b] shadow-[2px_2px_0px_rgba(59,59,59,1)]">
 <Utensils className="w-8 h-8 text-[#3b3b3b]" />
 </div>
 <div className="space-y-2">
 <h3 className="font-display text-3xl text-[#fc0000] uppercase leading-none">¡SOLICITUD ENVIADA!</h3>
 <p className="text-xs sm:text-sm text-[#3b3b3b] font-bold leading-relaxed italic">
 Abrimos la conversación de WhatsApp con tu solicitud de reserva pre-armada. Respondemos las solicitudes a la brevedad. ¡Gracias por elegirnos!
 </p>
 </div>
 <button 
 onClick={closeBookingSuccess}
 className="w-full py-4 bg-[#3b3b3b] hover:bg-[#fc0000] text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition-all"
 >
 ¡Entendido!
 </button>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* CARTA DIGITAL / SHOPPING MODAL */}
 <AnimatePresence>
 {showDigitalMenu && (
 <div className="fixed inset-0 z-50 bg-[#3b3b3b]/85 backdrop-blur-md flex items-center justify-center p-4">
 <motion.div 
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-[#121214] border border-stone-850 p-6 sm:p-8 rounded-3xl max-w-5xl w-full shadow-2xl text-left flex flex-col max-h-[95vh] h-full text-stone-100 font-sans"
 >
 {/* Modal Header */}
 <div className="flex justify-between items-center pb-4 border-b border-stone-850">
 <div>
 <h3 className="font-display text-2xl sm:text-4xl text-stone-100 uppercase leading-none">📖 Carta Digital</h3>
 <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-1">Pedí por WhatsApp • Horno de Barro & Leña</p>
 </div>
 <button 
 onClick={() => {
 setShowDigitalMenu(false);
 setMenuStep(1);
 setMenuActiveCategory('');
 }}
 className="w-11 h-11 bg-[#1C1C1E] hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95"
 >
 ✕
 </button>
 </div>

 {/* Step 1: Browse Menu and Cart */}
 {menuStep === 1 ? (
 <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1 flex flex-col min-h-0">
 {/* Category Tabs */}
 <div className="flex gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-none border-b border-stone-900">
 {Array.from(
 new Set((productosMenu || []).filter(p => p.activo !== false).map(p => p.categoria))
 ).filter(Boolean).map(cat => {
 const isActive = menuActiveCategory === cat || (menuActiveCategory === '' && cat === 'Pizzas');
 return (
 <button
 key={cat}
 type="button"
 onClick={() => setMenuActiveCategory(cat)}
 className={`shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
 isActive
 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 active-category-tab'
 : 'bg-[#1C1C1E] text-stone-400 border border-stone-850 hover:text-stone-200'
 }`}
 >
 {cat}
 </button>
 );
 })}
 </div>

 {/* Products Grid */}
 <div className="flex-1 overflow-y-auto pr-1">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 {(productosMenu || [])
 .filter(p => {
 if (p.activo === false) return false;
 const currentCat = menuActiveCategory || 'Pizzas';
 return p.categoria === currentCat;
 })
 .map((p) => {
 const qty = menuCart[p.id_producto] || 0;
 return (
 <div 
 key={p.id_producto}
 className="bg-[#1C1C1E] border border-stone-850/65 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300 shadow-md group"
 >
 <div className="flex gap-4">
 {p.imagen && (
 <img 
 src={p.imagen} 
 alt={p.nombre} 
 className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-800 shrink-0 group-hover:scale-105 transition-transform duration-300" 
 />
 )}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start gap-2">
 <h5 className="font-extrabold text-base sm:text-lg text-stone-100 group-hover:text-amber-400 transition-colors leading-tight">{p.nombre}</h5>
 <span className="font-mono text-sm sm:text-base font-black text-amber-450 shrink-0">
 ${p.precio_venta.toLocaleString('es-AR')}
 </span>
 </div>
 <p className="text-xs sm:text-sm text-stone-300 mt-1.5 leading-relaxed line-clamp-4">
 {p.descripcion || 'Especialidad de la casa elaborada al horno de barro con ingredientes frescos.'}
 </p>
 </div>
 </div>

 <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-900">
 <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
 {p.tipo === 'bebida' ? '🥤 Bebida' : '🍕 Plato'}
 </span>

 {qty > 0 ? (
 <div className="flex items-center bg-[#121214] rounded-xl p-0.5 border border-stone-850">
 <button 
 type="button"
 onClick={() => handleRemoveFromCart(p.id_producto)}
 className="w-8 h-8 flex items-center justify-center font-bold text-base bg-[#1C1C1E] hover:bg-stone-850 border border-stone-800 rounded-lg active:scale-90 text-stone-300 cursor-pointer"
 >
 -
 </button>
 <span className="px-3 font-mono font-bold text-sm text-stone-100">{qty}</span>
 <button 
 type="button"
 onClick={() => handleAddToCart(p.id_producto)}
 className="w-8 h-8 flex items-center justify-center font-bold text-base bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg active:scale-90 cursor-pointer"
 >
 +
 </button>
 </div>
 ) : (
 <button 
 type="button"
 onClick={() => handleAddToCart(p.id_producto)}
 className="px-4 py-2 bg-[#121214] hover:bg-stone-900 text-amber-400 border border-stone-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
 >
 Agregar
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 ) : (
 /* Step 2: Checkout Form */
 <form onSubmit={handleMenuSubmit} className="flex-1 overflow-y-auto py-6 space-y-4 pr-1 text-left">
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Nombre completo *</label>
 <input 
 type="text" 
 required
 value={menuForm.nombre}
 onChange={(e) => setMenuForm(prev => ({ ...prev, nombre: e.target.value }))}
 placeholder="Ej. Juan Pérez"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Teléfono (WhatsApp) *</label>
 <input 
 type="tel" 
 required
 value={menuForm.telefono}
 onChange={(e) => setMenuForm(prev => ({ ...prev, telefono: e.target.value }))}
 placeholder="Ej. 3584123456"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Modalidad de entrega *</label>
 <div className="flex gap-3">
 <button 
 type="button" 
 onClick={() => setMenuForm(prev => ({ ...prev, modalidad: 'delivery' }))}
 className={`flex-1 py-3 border border-stone-800 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${
 menuForm.modalidad === 'delivery' 
 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
 : 'bg-[#1C1C1E] text-stone-450 border border-stone-850 hover:bg-stone-800'
 }`}
 >
 Delivery 🛵
 </button>
 <button 
 type="button" 
 onClick={() => setMenuForm(prev => ({ ...prev, modalidad: 'retiro' }))}
 className={`flex-1 py-3 border border-stone-800 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${
 menuForm.modalidad === 'retiro' 
 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
 : 'bg-[#1C1C1E] text-stone-450 border border-stone-850 hover:bg-stone-800'
 }`}
 >
 Retiro 🏪
 </button>
 </div>
 </div>

 {menuForm.modalidad === 'delivery' && (
 <div className="flex flex-col gap-1.5 animate-fadeIn">
 <label className="text-[10px] font-bold uppercase text-stone-400">Dirección de Entrega *</label>
 <input 
 type="text" 
 required
 value={menuForm.direccion}
 onChange={(e) => setMenuForm(prev => ({ ...prev, direccion: e.target.value }))}
 placeholder="Ej: Alvear 1362, Dpto 3B"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>
 )}

 {/* Option "Quiero mi factura" */}
 <div className="flex items-center justify-between py-2 border-t border-b border-stone-800/40 my-2 select-none">
 <label className="text-xs font-bold text-stone-300 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2.5 animate-fadeIn" htmlFor="quiero-factura-toggle">
 <span className="text-amber-500">🧾</span> Quiero mi factura
 </label>
 <button
 type="button"
 id="quiero-factura-toggle"
 onClick={() => setQuieroFactura(prev => !prev)}
 className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
 quieroFactura ? 'bg-amber-500' : 'bg-stone-850'
 }`}
 >
 <span
 className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
 quieroFactura ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>

 {quieroFactura && (
 <div className="space-y-4 animate-fadeIn border-l-2 border-amber-500/30 pl-3 my-3">
 <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2">Datos de Facturación Fiscal</h4>
 
 {/* REGISTRO IMPOSITIVO */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Registro Impositivo *</label>
 <select
 value={facturacionForm.registroImpositivo}
 onChange={(e) => setFacturacionForm(prev => ({ ...prev, registroImpositivo: e.target.value }))}
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 cursor-pointer"
 >
 <option value="Consumidor Final">Consumidor Final</option>
 <option value="Monotributista">Monotributista</option>
 <option value="Responsable Inscripto">Responsable Inscripto</option>
 <option value="Exento">Exento</option>
 </select>
 </div>

 {/* RAZÓN SOCIAL / NOMBRE */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Razón Social o Nombre *</label>
 <input
 type="text"
 required
 value={facturacionForm.razonSocial}
 onChange={(e) => setFacturacionForm(prev => ({ ...prev, razonSocial: e.target.value }))}
 placeholder="Ej. Juan Pérez o Colores Pizza S.A."
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>

 {/* CUIT */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">CUIT *</label>
 <input
 type="text"
 required
 value={facturacionForm.cuit}
 onChange={(e) => {
 let val = e.target.value.replace(/\D/g, '');
 if (val.length > 11) val = val.substring(0, 11);
 let formatted = val;
 if (val.length > 2 && val.length <= 10) {
 formatted = `${val.substring(0, 2)}-${val.substring(2)}`;
 } else if (val.length > 10) {
 formatted = `${val.substring(0, 2)}-\n${val.substring(2, 10)}-${val.substring(10)}`.replace('\n', '');
 }
 setFacturacionForm(prev => ({ ...prev, cuit: formatted }));
 }}
 placeholder="Ej. 30-12345678-9"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>

 {/* DOMICILIO FISCAL */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Domicilio Fiscal *</label>
 <input
 type="text"
 required
 value={facturacionForm.domicilioFiscal}
 onChange={(e) => setFacturacionForm(prev => ({ ...prev, domicilioFiscal: e.target.value }))}
 placeholder="Ej. Av. Principal 123, CABA"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>

 {/* EMAIL */}
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-bold uppercase text-stone-400">Email de Facturación *</label>
 <input
 type="email"
 required
 value={facturacionForm.email}
 onChange={(e) => setFacturacionForm(prev => ({ ...prev, email: e.target.value }))}
 placeholder="Ej. factura@colorespizza.com"
 className="w-full p-4 rounded-xl border border-stone-800 bg-[#1C1C1E] text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder-stone-600"
 />
 </div>
 </div>
 )}

 {/* Resumen */}
 <div className="bg-[#121214] border border-stone-850 p-4 rounded-2xl space-y-2 mt-4">
 <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Resumen de Compra</span>
 <div className="space-y-1.5 text-xs font-bold text-stone-300">
 {Object.entries(menuCart).map(([id, qty]) => {
 const p = productosMenu.find(prod => prod.id_producto === id);
 if (!p) return null;
 return (
 <div key={id} className="flex justify-between">
 <span className="text-stone-400">{qty}x {p.nombre}</span>
 <span className="font-mono text-stone-200">${(p.precio_venta * qty).toLocaleString('es-AR')}</span>
 </div>
 );
 })}
 <div className="border-t border-stone-800 pt-2 flex justify-between font-black text-sm uppercase">
 <span className="text-stone-100">Total a Pagar</span>
 <span className="font-mono text-amber-400">
 ${Object.entries(menuCart).reduce((sum, [id, qty]) => {
 const p = productosMenu.find(prod => prod.id_producto === id);
 return sum + (p ? p.precio_venta * qty : 0);
 }, 0).toLocaleString('es-AR')}
 </span>
 </div>
 </div>
 </div>
 </form>
 )}

 {/* Modal Footer / Cart Summary */}
 {Object.keys(menuCart).length > 0 && (
 <div className="pt-4 border-t border-stone-850 flex justify-between items-center">
 <div className="text-left">
 <span className="text-[9px] font-bold text-stone-500 uppercase block tracking-wider">Total Pedido:</span>
 <span className="font-mono font-black text-lg text-amber-400">
 ${Object.entries(menuCart).reduce((sum, [id, qty]) => {
 const p = productosMenu.find(prod => prod.id_producto === id);
 return sum + (p ? p.precio_venta * qty : 0);
 }, 0).toLocaleString('es-AR')}
 </span>
 </div>
 
 <div className="flex gap-2">
 {menuStep === 1 ? (
 <button 
 type="button"
 onClick={() => setMenuStep(2)}
 className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
 >
 Continuar
 <ArrowRight className="w-4 h-4" />
 </button>
 ) : (
 <>
 <button 
 type="button"
 onClick={() => setMenuStep(1)}
 className="px-5 py-3.5 bg-[#1C1C1E] border border-stone-800 hover:bg-stone-850 text-stone-300 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 cursor-pointer"
 >
 Atrás
 </button>
 <button 
 type="button"
 onClick={handleMenuSubmit}
 className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-green-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
 >
 Pedir WhatsApp 🚀
 </button>
 </>
 )}
 </div>
 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>
\n\n {/* 9. FLOATING WHATSAPP BUTTON (Pulsing and modern) */}
 <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group">
 <div className="bg-[#3b3b3b] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-2 border-[#3b3b3b] shadow-[2px_2px_0px_rgba(59,59,59,1)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
 ¿Dudas? Escribinos
 </div>
 <a
 href="https://wa.me/5493584024822?text=¡Hola Pizzería Colores! Quería hacerles una consulta..."
 target="_blank"
 rel="noopener noreferrer"
 className="w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white border-2 border-[#3b3b3b] rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(59,59,59,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(59,59,59,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(59,59,59,1)] transition-all duration-150 relative cursor-pointer"
 title="Consultar por WhatsApp"
 >
 <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
 <MessageCircle className="w-7 h-7 stroke-[2.5px]" />
 </a>
 </div>

 </div>
 );
}
