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
  Wine, 
  ChevronRight, 
  CheckCircle,
  Menu,
  X,
  Flame,
  Pizza
} from 'lucide-react';

interface RestaurantCoverProps {
  onEnterSystem: () => void;
}

export default function RestaurantCover({ onEnterSystem }: RestaurantCoverProps) {
  // Mobile Nav Drawer Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Format date from YYYY-MM-DD to DD/MM/YYYY
    const parts = bookingForm.fecha.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : bookingForm.fecha;

    const cleanPhone = '5491148029988'; // Pizzería Colores WhatsApp line
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

  const specialties = [
    {
      id: 'spec_1',
      title: 'Pizza Margherita de Búfala',
      description: 'Salsa de tomates italianos, muzzarella de búfala premium, hojas de albahaca fresca y un toque de aceite de oliva virgen extra sobre masa madre fermentada por 48 horas.',
      tag: 'La Especialidad',
      image: '/images/pizza_wood_oven.png'
    },
    {
      id: 'spec_2',
      title: 'Empanadas Criollas de Lomo',
      description: 'Relleno jugoso de lomo cortado a cuchillo, huevo de campo, cebolla de verdeo y especias criollas horneadas en el auténtico horno de leña.',
      tag: 'Clásico al Horno',
      image: '/images/empanadas.jpg'
    },
    {
      id: 'spec_3',
      title: 'Calzone Napolitano',
      description: 'Masa italiana doblada y rellena de jamón cocido premium, muzzarella hilada, tomates seleccionados, albahaca y aceite de oliva.',
      tag: 'Exclusivo del Horno',
      image: '/images/pizza_wood_oven.png'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#120B07] text-stone-900 dark:text-[#FAF7F0] font-sans selection:bg-[#9B2226] selection:text-white transition-colors duration-300">
      
      {/* 1. FLOATING HEADER */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF7F0]/80 dark:bg-[#120B07]/80 border-b border-[#9B2226]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 bg-[#9B2226] rounded-xl flex items-center justify-center shadow-md">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-widest font-serif text-[#9B2226] dark:text-[#FAF7F0]">
              COLORES PIZZERÍA
            </span>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 dark:text-stone-300">
            <a href="#especialidades" className="hover:text-[#9B2226] dark:hover:text-red-400 transition-colors">Especialidades</a>
            <a href="#experiencia" className="hover:text-[#9B2226] dark:hover:text-red-400 transition-colors">El Horno</a>
            <a href="#reserva" className="hover:text-[#9B2226] dark:hover:text-red-400 transition-colors">Reservas</a>
            <a href="#contacto" className="hover:text-[#9B2226] dark:hover:text-red-400 transition-colors">Ubicación</a>
          </nav>

          {/* Action Gateway Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onEnterSystem}
              className="px-4 py-2 bg-[#9B2226] hover:bg-[#B22222] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Acceder al Sistema
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onEnterSystem}
              className="px-3 py-1.5 bg-[#9B2226] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Acceder
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-[#9B2226]/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden w-full bg-[#FAF7F0] dark:bg-[#1E140E] border-b border-[#9B2226]/10 px-6 py-4 space-y-3 flex flex-col font-medium"
          >
            <a href="#especialidades" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-850">Especialidades</a>
            <a href="#experiencia" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-850">El Horno</a>
            <a href="#reserva" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-700 dark:text-stone-300 border-b border-stone-100 dark:border-stone-850">Reservas</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="py-2 text-stone-700 dark:text-stone-300">Ubicación</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-[#120B07] text-white flex items-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70 select-none pointer-events-none transition-all duration-700 ease-in-out"
          style={{ backgroundImage: `url('/images/pizza_wood_oven.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120B07] via-[#120B07]/70 to-[#120B07]/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="max-w-2xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-stone-300 text-xs font-bold uppercase tracking-wider font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              Pizzas de Masa Madre & Horno a la Leña
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif leading-tight tracking-wide text-[#FAF7F0] drop-shadow-md"
            >
              Auténtico Sabor <br />
              <span className="text-red-400 italic font-semibold">al Horno de Barro</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-stone-200 text-sm sm:text-base md:text-lg max-w-xl italic leading-relaxed"
            >
              Pizzas artesanales fermentadas en frío por 48 horas, empanadas jugosas repulgadas a mano y calzones rellenos cocinados a leña. Descubrí la calidad de Colores Pizzería.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <a 
                href="#reserva"
                className="px-6 py-3.5 bg-[#9B2226] hover:bg-[#B22222] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-[1.02] flex items-center gap-2"
              >
                Solicitar Reserva
                <Calendar className="w-4 h-4" />
              </a>
              <a 
                href="#especialidades"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.02]"
              >
                Ver Especialidades
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. CORE STATS / VALUES BAR */}
      <section className="bg-[#FAF7F0] dark:bg-[#1C140E] py-8 border-y border-[#9B2226]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center p-3 space-y-1">
            <Pizza className="w-7 h-7 text-[#9B2226] animate-bounce duration-[2000ms]" />
            <span className="font-extrabold text-sm uppercase text-[#9B2226] dark:text-red-400 font-serif tracking-widest">Horno de Barro</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">Pizzas de masa madre a la leña</span>
          </div>
          <div className="flex flex-col items-center p-3 space-y-1 border-y sm:border-y-0 sm:border-x border-stone-200 dark:border-stone-850">
            <Flame className="w-7 h-7 text-[#3A5A40] animate-pulse" />
            <span className="font-extrabold text-sm uppercase text-stone-700 dark:text-amber-400 font-serif tracking-widest">Tradición Criolla</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">Empanadas hechas a mano</span>
          </div>
          <div className="flex flex-col items-center p-3 space-y-1">
            <Wine className="w-7 h-7 text-[#C8956A]" />
            <span className="font-extrabold text-sm uppercase text-stone-700 dark:text-amber-400 font-serif tracking-widest">Copa de la Casa</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">Cerveza artesanal y vinos para maridar</span>
          </div>
        </div>
      </section>

      {/* 4. SPECIALTIES SECTION */}
      <section id="especialidades" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-bold text-[#3A5A40] dark:text-green-400 tracking-widest">Nuestra Carta</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-wide font-serif text-[#9B2226] dark:text-[#FAF7F0]">
            Pizzas & Calzones al Horno
          </h2>
          <div className="w-16 h-1 bg-[#9B2226] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialties.map((spec) => (
            <motion.div
              key={spec.id}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-[#1C140E] rounded-3xl overflow-hidden border border-stone-200/60 dark:border-stone-850 shadow-md flex flex-col h-full"
            >
              <div className="h-56 relative overflow-hidden bg-stone-100 dark:bg-stone-900">
                <img 
                  src={spec.image} 
                  alt={spec.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600';
                  }}
                />
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#9B2226] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow">
                  {spec.tag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-serif text-[#9B2226] dark:text-[#FAF7F0] tracking-wide">
                    {spec.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 italic leading-relaxed">
                    {spec.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. EL HORNO EXPERIENCE SECTION */}
      <section id="experiencia" className="py-20 bg-stone-100 dark:bg-[#17100D] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase font-bold text-[#3A5A40] dark:text-green-400 tracking-widest">El Secreto</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-wide text-[#9B2226] dark:text-[#FAF7F0]">
              La Leña y el Horno de Barro
            </h2>
            <p className="text-stone-650 dark:text-stone-300 text-sm leading-relaxed">
              El secreto de nuestra pizza reside en el calor seco y envolvente de nuestro horno de barro artesanal. Calentado únicamente a base de leña seleccionada, alcanza los 450°C para cocinar las pizzas en menos de 90 segundos, logrando un borde inflado y crocante (leopard pardo) con un centro tierno y sabroso.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3A5A40]/10 flex items-center justify-center shrink-0">
                  <ChefHat className="w-5 h-5 text-[#3A5A40]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-stone-750 dark:text-[#FAF7F0]">Masa Madre 48h</h4>
                  <p className="text-[10px] text-stone-500">Fermentación natural lenta para alta digestibilidad.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9B2226]/10 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#9B2226]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-stone-750 dark:text-[#FAF7F0]">Fuego Real</h4>
                  <p className="text-[10px] text-stone-500">Aroma ahumado inigualable de leña de espinillo.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-96 rounded-3xl overflow-hidden shadow-2xl relative">
            <img 
              src="/images/pizza_wood_oven.png" 
              alt="Horno a la Leña" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=800';
              }}
            />
          </div>
        </div>
      </section>

      {/* 6. BOOKING SECTION */}
      <section id="reserva" className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-bold text-[#3A5A40] dark:text-green-400 tracking-widest">Reserva tu Lugar</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#9B2226] dark:text-[#FAF7F0]">
            Solicitar Mesa
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Completá tus datos y enviá la solicitud. Te responderemos por WhatsApp para confirmar tu reserva al instante.
          </p>
        </div>

        <form onSubmit={handleBookingSubmit} className="bg-white dark:bg-[#1C140E] p-8 rounded-3xl border border-stone-200/60 dark:border-stone-850 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">Nombre Completo *</label>
              <input 
                type="text" 
                required
                value={bookingForm.nombre}
                onChange={(e) => setBookingForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej. Juan Pérez"
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF7F0] dark:bg-stone-900 text-sm focus:outline-none focus:border-[#9B2226]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">WhatsApp de contacto *</label>
              <input 
                type="tel" 
                required
                value={bookingForm.telefono}
                onChange={(e) => setBookingForm(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej. 11 1234 5678"
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF7F0] dark:bg-stone-900 text-sm focus:outline-none focus:border-[#9B2226]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">Comensales</label>
              <select 
                value={bookingForm.personas}
                onChange={(e) => setBookingForm(prev => ({ ...prev, personas: e.target.value }))}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF7F0] dark:bg-stone-900 text-sm focus:outline-none focus:border-[#9B2226]"
              >
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Persona' : 'Personas'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">Fecha *</label>
              <input 
                type="date" 
                required
                value={bookingForm.fecha}
                onChange={(e) => setBookingForm(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF7F0] dark:bg-stone-900 text-sm focus:outline-none focus:border-[#9B2226]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">Hora</label>
              <select 
                value={bookingForm.hora}
                onChange={(e) => setBookingForm(prev => ({ ...prev, hora: e.target.value }))}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF7F0] dark:bg-stone-900 text-sm focus:outline-none focus:border-[#9B2226]"
              >
                {['12:00', '13:00', '14:00', '20:00', '21:00', '22:00', '23:00'].map(h => (
                  <option key={h} value={h}>{h} hs</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#9B2226] hover:bg-[#B22222] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            Solicitar Reserva por WhatsApp
          </button>
        </form>
      </section>

      {/* 7. CONTACT & LOCATION */}
      <section id="contacto" className="py-16 border-t border-stone-200 dark:border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-serif text-[#9B2226] dark:text-[#FAF7F0]">Ubicación & Contacto</h3>
            <div className="space-y-4 text-stone-600 dark:text-stone-300 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#9B2226] shrink-0" />
                <span>Av. de Mayo 1420, Ramos Mejía, Buenos Aires</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#9B2226] shrink-0" />
                <span>+54 9 11 4802-9988</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#9B2226] shrink-0" />
                <span>Martes a Domingos: 12:00 a 16:00 hs & 20:00 a 00:00 hs</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#9B2226] shrink-0" />
                <span>contacto@colorespizzeria.com.ar</span>
              </div>
            </div>
          </div>
          <div className="h-64 rounded-3xl overflow-hidden shadow-inner bg-stone-200 dark:bg-stone-900 flex items-center justify-center border border-stone-300/40">
            <span className="text-xs text-stone-500 font-mono">📍 Google Maps API Offline</span>
          </div>
        </div>
      </section>

      {/* 8. FOOTER WITH ADMINISTRATIVE GATEWAY */}
      <footer className="bg-stone-950 text-stone-400 py-12 px-4 border-t border-[#9B2226]/10 text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-[#9B2226] rounded-lg flex items-center justify-center">
            <Pizza className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-widest text-[#FAF7F0]">COLORES PIZZERÍA</span>
        </div>
        <p className="text-[10px] tracking-wide max-w-sm mx-auto">
          © {new Date().getFullYear()} Colores Pizzería. Todos los derechos reservados. Hecho con pasión criolla e italiana.
        </p>
        <div className="pt-2">
          <button 
            onClick={onEnterSystem}
            className="text-[10px] uppercase font-bold text-stone-600 hover:text-stone-400 transition-colors cursor-pointer border border-stone-800 rounded-lg px-3 py-1.5"
          >
            🔑 Acceso Administrativo
          </button>
        </div>
      </footer>

      {/* 9. BOOKING SUCCESS DIALOG */}
      <AnimatePresence>
        {showBookingSuccess && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1C140E] p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-5 border border-stone-200 dark:border-stone-850"
            >
              <div className="w-16 h-16 bg-[#3A5A40]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-[#3A5A40]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-serif text-[#9B2226] dark:text-[#FAF7F0]">Solicitud Enviada</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Abrimos la conversación de WhatsApp con tu solicitud de reserva pre-armada. Respondemos las solicitudes a la brevedad. ¡Gracias por elegirnos!
                </p>
              </div>
              <button 
                onClick={closeBookingSuccess}
                className="w-full py-3 bg-[#3A5A40] hover:bg-[#487050] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-all"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
