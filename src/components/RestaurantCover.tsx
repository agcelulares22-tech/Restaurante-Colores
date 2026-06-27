import React, { useState } from 'react';
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
  Award
} from 'lucide-react';

interface RestaurantCoverProps {
  onEnterSystem: () => void;
}

export default function RestaurantCover({ onEnterSystem }: RestaurantCoverProps) {
  // Booking states
  const [bookingForm, setBookingForm] = useState({
    nombre: '',
    telefono: '',
    personas: '2',
    fecha: '',
    hora: '21:00'
  });
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.nombre || !bookingForm.telefono || !bookingForm.fecha) {
      alert('Por favor complete los campos obligatorios para solicitar su mesa.');
      return;
    }

    const parts = bookingForm.fecha.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : bookingForm.fecha;

    const cleanPhone = '5491148029988'; // Colores Pizzería WhatsApp line
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

  // Real food images (3 user + 1 extra high quality savory tart photo)
  const menuItems = [
    {
      src: '/images/pizza_usuario.jpg',
      badge: '🔥 ¡NUESTRA ESTRELLA!',
      title: 'Muzzarella Especial de la Casa',
      desc: 'Abundante queso muzzarella fundido, tiras gruesas de morrones asados al fuego y aceitunas verdes seleccionadas sobre una base crocante.'
    },
    {
      src: '/images/empanadas_usuario.jpg',
      badge: '🥟 ¡SÚPER JUGOSA!',
      title: 'Empanadas de Carne Criollas',
      desc: 'Carne picada de primera calidad, rehogada a mano con cebollita de verdeo dulce y huevo picado. Doradas al horno de barro con aroma a leña.'
    },
    {
      src: '/images/calzone_usuario.jpg',
      badge: '🥖 ¡GIGANTE Y SABROSO!',
      title: 'Calzone de Verdura y Queso',
      desc: 'Masa rústica artesanal rellena generosamente de acelga y espinaca fresca salteada, cebollas caramelizadas y abundante queso muzzarella fundido.'
    },
    {
      src: 'https://images.unsplash.com/photo-1621303837873-ee55d28d011f?q=80&w=1000&auto=format&fit=crop',
      badge: '🥧 ¡CRUJIENTE DE VERDAD!',
      title: 'Tarta de Jamón y Queso Rústica',
      desc: 'Base de hojaldre casero súper crocante, rellena con jamón cocido seleccionado de primera calidad y un gratinado dorado de queso parmesano.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#0D0B0A] text-stone-900 dark:text-[#FFFDF9] font-sans selection:bg-[#E63946] selection:text-white transition-colors duration-300 pb-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#1f1c1a_1px,transparent_1px)]">
      
      {/* 1. BRAND HEADER (McDonald's High Contrast Inspired) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FFFDF9]/95 dark:bg-[#0D0B0A]/95 border-b-4 border-black px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-[#D90429] border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">
              <Pizza className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl sm:text-3xl tracking-wide text-[#D90429] dark:text-[#FFFDF9] leading-none">
                COLORES
              </span>
              <span className="text-[9px] font-black uppercase text-[#FFC300] tracking-widest pl-0.5">
                Pizzería & Minutas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onEnterSystem}
              className="px-5 py-3 bg-[#FFC300] hover:bg-[#FFD000] text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer flex items-center gap-2"
            >
              Acceder al Sistema
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO COMMERCIAL BOARD */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC300] text-black border-2 border-black rounded-full font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <Sparkles className="w-4 h-4 text-[#D90429] fill-[#D90429]" />
            ¡EL SABOR QUE TE VUELVE A ENAMORAR!
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-none text-black dark:text-white uppercase tracking-tight">
            CRUJIENTE, CALIENTE <br />
            <span className="text-[#D90429] italic underline decoration-wavy decoration-[#FFC300] tracking-wide">Y AL HORNO DE BARRO</span>
          </h1>

          <p className="text-stone-850 dark:text-stone-200 text-base sm:text-xl font-bold leading-relaxed max-w-2xl mx-auto pl-4 border-l-4 border-[#D90429]">
            Masa madre fermentada durante 48 hs, ingredientes frescos seleccionados y el toque único de la leña natural. Una mordida y entendés todo.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <a 
              href="#reserva" 
              className="px-8 py-5 bg-[#D90429] hover:bg-[#EF233C] text-white border-2 border-black rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              ¡Reservar Mesa Ahora!
            </a>
          </div>
        </div>

        {/* 3. SHOWCASE BOARD OF REAL PLATTER IMAGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
          {menuItems.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#151312] border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:scale-102 flex flex-col h-full group"
            >
              {/* Product Image Wrapper */}
              <div className="h-72 relative overflow-hidden bg-stone-100 dark:bg-stone-900 border-b-4 border-black">
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-4 py-2 bg-[#FFC300] text-black border-2 border-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {item.badge}
                </span>
              </div>
              
              {/* Appetizing Copy */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-left">
                  <h3 className="font-display text-xl sm:text-2xl text-black dark:text-white uppercase leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs font-bold text-stone-600 dark:text-stone-300 leading-relaxed italic">
                    "{item.desc}"
                  </p>
                </div>
                
                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  <span>Leña Real</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-[#FFC300] text-black stroke-[1.5px]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BRAND VALUES & HORNO EXPERIENCE */}
      <section className="py-20 bg-[#FFC300] dark:bg-[#1A1200] border-y-4 border-black text-black dark:text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-left">
            <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              CALIDAD PREMIUM SIN VUELTAS
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-black dark:text-white uppercase leading-none">
              El Secreto Está en el Horno
            </h2>
            <p className="text-stone-850 dark:text-stone-200 text-sm sm:text-base font-bold leading-relaxed">
              En Colores Pizzería no hacemos milagros, hacemos tradición. Calentamos nuestro horno a más de 400°C usando únicamente leña de espinillo seleccionada. Esto le da a la masa ese dorado rústico inconfundible y funde la muzzarella hasta crear hebras cremosas infinitas.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-white dark:bg-stone-900 p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D90429] flex items-center justify-center shrink-0 border border-black text-white">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase text-black dark:text-white">Hecho a Mano</h4>
                  <p className="text-[10px] text-stone-500 font-semibold">Repulgues manuales y horneado en el acto.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-stone-900 p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center shrink-0 border border-black text-white">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase text-black dark:text-white">Fuego & Leña</h4>
                  <p className="text-[10px] text-stone-500 font-semibold">El inconfundible sabor ahumado del quebracho y espinillo.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map Block */}
          <div className="relative flex justify-center">
            <div className="w-full h-80 sm:h-96 rounded-3xl border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-stone-100 relative">
              <iframe 
                src="https://maps.google.com/maps?q=Av.%20de%20Mayo%201420,%20Ramos%20Mej%C3%ADa,%20Buenos%20Aires,%20Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed" 
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

      {/* 5. BOOKING FORM (McDonald's High Contrast Theme) */}
      <section id="reserva" className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-extrabold text-[#D90429] dark:text-[#FFC300] tracking-widest bg-[#D90429]/10 px-4 py-1.5 rounded-full border border-[#D90429]/20">
            ¡COMPARTÍ EL MOMENTO!
          </span>
          <h2 className="font-display text-4xl sm:text-6xl text-black dark:text-white uppercase">
            Reservar tu Mesa
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-bold max-w-md mx-auto italic">
            Completá tus datos y enviá la solicitud. Te responderemos por WhatsApp para confirmar tu reserva al instante.
          </p>
        </div>

        <form onSubmit={handleBookingSubmit} className="bg-white dark:bg-[#151312] p-8 sm:p-10 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase text-stone-600 dark:text-stone-400">Nombre Completo *</label>
              <input 
                type="text" 
                required
                value={bookingForm.nombre}
                onChange={(e) => setBookingForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej. Juan Pérez"
                className="w-full p-4 rounded-xl border-2 border-black bg-[#FFFDF9] dark:bg-stone-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FFC300] transition-all"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase text-stone-600 dark:text-stone-400">WhatsApp de contacto *</label>
              <input 
                type="tel" 
                required
                value={bookingForm.telefono}
                onChange={(e) => setBookingForm(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej. 11 1234 5678"
                className="w-full p-4 rounded-xl border-2 border-black bg-[#FFFDF9] dark:bg-stone-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FFC300] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase text-stone-600 dark:text-stone-400">Comensales</label>
              <select 
                value={bookingForm.personas}
                onChange={(e) => setBookingForm(prev => ({ ...prev, personas: e.target.value }))}
                className="w-full p-4 rounded-xl border-2 border-black bg-[#FFFDF9] dark:bg-stone-900 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#FFC300] transition-all"
              >
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Persona' : 'Personas'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase text-stone-600 dark:text-stone-400">Fecha *</label>
              <input 
                type="date" 
                required
                value={bookingForm.fecha}
                onChange={(e) => setBookingForm(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full p-4 rounded-xl border-2 border-black bg-[#FFFDF9] dark:bg-stone-900 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#FFC300] transition-all"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-black uppercase text-stone-600 dark:text-stone-400">Hora</label>
              <select 
                value={bookingForm.hora}
                onChange={(e) => setBookingForm(prev => ({ ...prev, hora: e.target.value }))}
                className="w-full p-4 rounded-xl border-2 border-black bg-[#FFFDF9] dark:bg-stone-900 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#FFC300] transition-all"
              >
                {['12:00', '13:00', '14:00', '20:00', '21:00', '22:00', '23:00'].map(h => (
                  <option key={h} value={h}>{h} hs</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-[#D90429] hover:bg-[#EF233C] text-white border-2 border-black rounded-2xl font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            Solicitar Reserva por WhatsApp
          </button>
        </form>
      </section>

      {/* 6. CONTACT & LOCATION INFO */}
      <section id="contacto" className="py-12 border-t-4 border-black bg-stone-50 dark:bg-[#12100F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6 text-left">
            <h3 className="font-display text-4xl text-black dark:text-white uppercase leading-none">Ubicación & Contacto</h3>
            <div className="space-y-4 text-stone-850 dark:text-stone-300 text-sm font-bold">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-[#D90429] shrink-0 stroke-[2.5px]" />
                <span>Av. de Mayo 1420, Ramos Mejía, Buenos Aires</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-[#D90429] shrink-0 stroke-[2.5px]" />
                <span>+54 9 11 4802-9988</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#D90429] shrink-0 stroke-[2.5px]" />
                <span>Martes a Domingos: 12:00 a 16:00 hs & 20:00 a 00:00 hs</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[#D90429] shrink-0 stroke-[2.5px]" />
                <span>contacto@colorespizzeria.com.ar</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4 border-4 border-black p-8 rounded-3xl bg-white dark:bg-[#151312] shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left">
            <h4 className="font-display text-2xl text-[#D90429] uppercase leading-none">Reservá Hoy</h4>
            <p className="text-xs font-bold text-stone-500 leading-relaxed uppercase">
              Hacé clic en el botón para ingresar al panel de pedidos para mozos o solicitar tu mesa en el salón directamente en segundos.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-black text-stone-400 py-12 px-4 border-t-4 border-black text-center space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 bg-[#D90429] rounded-lg flex items-center justify-center border border-white/20">
            <Pizza className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl tracking-wider text-[#FFFDF9]">COLORES PIZZERÍA</span>
        </div>
        <p className="text-[10px] font-bold tracking-widest max-w-sm mx-auto uppercase">
          © {new Date().getFullYear()} Colores Pizzería. Todos los derechos reservados. Hecho con pasión criolla e italiana.
        </p>
        <div className="pt-2">
          <button 
            onClick={onEnterSystem}
            className="text-[10px] uppercase font-black text-stone-500 hover:text-white border-2 border-stone-800 hover:border-[#FFC300] rounded-xl px-4 py-2 transition-all cursor-pointer"
          >
            🔑 Acceso Administrativo
          </button>
        </div>
      </footer>

      {/* 8. BOOKING SUCCESS DIALOG */}
      <AnimatePresence>
        {showBookingSuccess && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#151312] p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-5 border-4 border-black"
            >
              <div className="w-16 h-16 bg-[#FFC300] rounded-full flex items-center justify-center mx-auto border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Utensils className="w-8 h-8 text-black" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-3xl text-[#D90429] uppercase leading-none">¡SOLICITUD ENVIADA!</h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-bold leading-relaxed italic">
                  Abrimos la conversación de WhatsApp con tu solicitud de reserva pre-armada. Respondemos las solicitudes a la brevedad. ¡Gracias por elegirnos!
                </p>
              </div>
              <button 
                onClick={closeBookingSuccess}
                className="w-full py-4 bg-black hover:bg-[#D90429] text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition-all"
              >
                ¡Entendido!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
