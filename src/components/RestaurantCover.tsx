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
  ChevronRight,
  Menu,
  X,
  Plus
} from 'lucide-react';

interface RestaurantCoverProps {
  onEnterSystem: () => void;
}

type FoodCategory = 'pizzas' | 'empanadas' | 'tartas' | 'calzones';

export default function RestaurantCover({ onEnterSystem }: RestaurantCoverProps) {
  // Mobile Nav Drawer Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Category state
  const [activeCategory, setActiveCategory] = useState<FoodCategory>('pizzas');

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

  // Curated specialties with hyper-appetizing descriptions and Unsplash imagery
  const foodData: Record<FoodCategory, {
    title: string;
    badge: string;
    headline: string;
    description: string;
    image: string;
    accentColor: string;
    ingredients: string[];
  }> = {
    pizzas: {
      title: 'Pizzas de Masa Madre',
      badge: '🔥 ¡MÁS VENDIDA!',
      headline: 'Margherita Suprema con Búfala',
      description: 'Salsa de tomates italianos San Marzano seleccionados, muzzarella de búfala premium derretida con hilos cremosos, hojas de albahaca fresca de nuestra huerta y un hilo generoso de aceite de oliva virgen extra. Cocinada a 450°C al calor de la leña para un borde inflado y crocante.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
      accentColor: 'from-amber-500 to-red-650',
      ingredients: ['Masa Madre de 48 hs', 'Tomates San Marzano', 'Muzzarella de Búfala', 'Albahaca y Oliva']
    },
    empanadas: {
      title: 'Empanadas Criollas',
      badge: '🥟 ¡HIERVE DE JUGOSA!',
      headline: 'Lomo Cortado a Cuchillo',
      description: 'Gourmet y tradicionales. Carne de lomo seleccionada y cortada a cuchillo, rehogada en grasa de pella con cebolla de verdeo tierna, huevo de campo rallado y nuestro secreto de especias norteñas. Repulgadas a mano y doradas al horno de barro con aroma a leña.',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000&auto=format&fit=crop',
      accentColor: 'from-orange-500 to-amber-600',
      ingredients: ['Lomo Cortado a Cuchillo', 'Cebollita de Verdeo', 'Huevo de Campo', 'Especias del Norte']
    },
    tartas: {
      title: 'Tartas Rústicas',
      badge: '🥧 ¡HIENAS DE RELLENO!',
      headline: 'Tarta Dorada de Jamón y Queso',
      description: 'Base de hojaldre súper crujiente y casera, rellena de una combinación cremosa de jamón cocido seleccionado y muzzarella fundida de primera calidad, ligada con crema fresca y gratinada con abundante queso parmesano crocante en la superficie.',
      image: 'https://images.unsplash.com/photo-1621303837873-ee55d28d011f?q=80&w=1000&auto=format&fit=crop',
      accentColor: 'from-yellow-500 to-orange-600',
      ingredients: ['Hojaldre Casero', 'Jamón Premium', 'Muzzarella Hilada', 'Gratinado de Parmesano']
    },
    calzones: {
      title: 'Calzones Gigantes',
      badge: '🥖 ¡POCKET DE SABOR!',
      headline: 'Calzone Napolitano Relleno',
      description: 'Una pizza doblada a la mitad y sellada a mano, rellena generosamente con jamón cocido ahumado, muzzarella cremosa, rodajas de tomates frescos dulces, hojas de albahaca fresca y aceite de ajo. El resultado es un pan dorado, crujiente por fuera y fundido por dentro.',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1000&auto=format&fit=crop',
      accentColor: 'from-red-500 to-yellow-600',
      ingredients: ['Masa de Pizza Italiana', 'Jamón Ahumado', 'Tomate en Rodajas', 'Aceite de Ajo Casero']
    }
  };

  const activeFood = foodData[activeCategory];

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#0D0B0A] text-stone-900 dark:text-[#FFFDF9] font-sans selection:bg-[#E63946] selection:text-white transition-colors duration-300">
      
      {/* 1. MCDONALD'S STYLE HIGH-IMPACT HEADER */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FFFDF9]/95 dark:bg-[#0D0B0A]/95 border-b-4 border-black px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          {/* Logo Brand with Pop / Comic Shadow */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-[#D90429] border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">
              <Pizza className="w-7 h-7 text-white animate-pulse" />
            </div>
            <span className="font-display text-2xl sm:text-3xl tracking-wide text-[#D90429] dark:text-[#FFFDF9] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
              COLORES PIZZERÍA
            </span>
          </div>

          {/* Navigation links with Bold design */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
            <a href="#menu-seccion" className="hover:text-[#D90429] hover:underline decoration-4 transition-colors">La Carta</a>
            <a href="#experiencia" className="hover:text-[#D90429] hover:underline decoration-4 transition-colors">El Horno</a>
            <a href="#reserva" className="hover:text-[#D90429] hover:underline decoration-4 transition-colors">Reservas</a>
            <a href="#contacto" className="hover:text-[#D90429] hover:underline decoration-4 transition-colors">Contacto</a>
          </nav>

          {/* Action Gateway Button with Comic Shadow */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onEnterSystem}
              className="px-5 py-3 bg-[#FFC300] hover:bg-[#FFD000] text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer flex items-center gap-2"
            >
              Acceder al Sistema
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={onEnterSystem}
              className="px-4 py-2 bg-[#FFC300] text-black border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all cursor-pointer"
            >
              Acceder
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-black rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-[#D90429] hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
            className="lg:hidden w-full bg-[#FFFDF9] dark:bg-[#141211] border-b-4 border-black px-6 py-5 space-y-4 flex flex-col font-black uppercase tracking-wider text-sm border-x-4"
          >
            <a href="#menu-seccion" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-stone-700 dark:text-stone-300 border-b-2 border-black/10">La Carta</a>
            <a href="#experiencia" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-stone-700 dark:text-stone-300 border-b-2 border-black/10">El Horno</a>
            <a href="#reserva" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-stone-700 dark:text-stone-300 border-b-2 border-black/10">Reservas</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-stone-700 dark:text-stone-300">Contacto</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION - MCDONALD'S STYLE EYE-CATCHING SPLASH */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-[#FFC300] dark:bg-[#1A1200] border-b-4 border-black">
        {/* Dynamic decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#D90429_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-10" />
        <div className="absolute top-10 right-[-10%] w-96 h-96 bg-[#D90429] rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Block: Bold Copywriting */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D90429] text-white border-2 border-black rounded-full font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
              <Sparkles className="w-4 h-4 text-[#FFC300] fill-[#FFC300] animate-spin" />
              ¡EL VERDADERO SABOR AL HORNO DE BARRO!
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-none text-black dark:text-white drop-shadow-[3px_3px_0px_rgba(255,255,255,1)] dark:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              ¡PIZZAS QUE <br />
              <span className="text-[#D90429] italic underline decoration-wavy decoration-[#FFF] dark:decoration-amber-400">ENAMORAN!</span>
            </h1>

            <p className="text-stone-800 dark:text-stone-200 text-base sm:text-xl font-bold max-w-xl leading-relaxed italic border-l-4 border-[#D90429] pl-4">
              Masa madre artesanal fermentada 48 hs. Ingredientes frescos, queso derretido en hebras infinitas y el toque único de la leña natural.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a 
                href="#reserva"
                className="px-8 py-5 bg-[#D90429] hover:bg-[#EF233C] text-white border-2 border-black rounded-2xl text-sm font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
              >
                ¡Pedir Mesa Ahora!
                <Calendar className="w-5 h-5" />
              </a>
              <a 
                href="#menu-seccion"
                className="px-8 py-5 bg-white hover:bg-stone-50 text-black border-2 border-black rounded-2xl text-sm font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                Ver Menú Tentador
              </a>
            </div>
          </div>

          {/* Right Block: Massive Pop-art food image */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-3xl border-4 border-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <img 
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop" 
                alt="Pizza espectacular"
                className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute bottom-4 right-4 bg-[#FFC300] text-black border-2 border-black font-black uppercase text-xs px-4 py-2 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                🍕 Caliente & Crujiente
              </div>
            </div>
            {/* Pop art sticker */}
            <div className="absolute top-[-20px] left-[10px] w-24 h-24 bg-[#FF5722] border-2 border-black rounded-full flex flex-col items-center justify-center text-white font-black text-center uppercase tracking-tighter text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-12 animate-bounce">
              <span>Masa</span>
              <span className="text-yellow-300 font-display text-lg">Madre</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE COMMERCIAL MENU SELECTOR */}
      <section id="menu-seccion" className="py-20 bg-[#FFFDF9] dark:bg-[#0D0B0A] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header block */}
          <div className="text-center space-y-4">
            <span className="text-xs uppercase font-extrabold text-[#D90429] dark:text-[#FFC300] tracking-widest bg-[#D90429]/10 px-4 py-1.5 rounded-full border border-[#D90429]/20">
              ¡DALE UN GUSTO A TU DÍA!
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-black dark:text-white tracking-wide uppercase">
              Nuestras Especialidades
            </h2>
            <div className="w-24 h-2 bg-[#D90429] mx-auto rounded-full" />
          </div>

          {/* McDonald's style chunky category selector buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {(['pizzas', 'empanadas', 'tartas', 'calzones'] as FoodCategory[]).map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-4 rounded-2xl border-2 border-black text-sm font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    active 
                      ? 'bg-[#D90429] text-white' 
                      : 'bg-white hover:bg-stone-55 text-black dark:bg-stone-900 dark:text-white dark:hover:bg-stone-850'
                  }`}
                >
                  {cat === 'pizzas' && '🍕 Pizzas'}
                  {cat === 'empanadas' && '🥟 Empanadas'}
                  {cat === 'tartas' && '🥧 Tartas'}
                  {cat === 'calzones' && '🥖 Calzones'}
                </button>
              );
            })}
          </div>

          {/* High impact focus banner for the selected item */}
          <div className="bg-white dark:bg-[#151312] border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Block: Image */}
            <div className="lg:col-span-6 h-80 lg:h-[450px] relative overflow-hidden bg-stone-100 dark:bg-stone-900 border-b-4 lg:border-b-0 lg:border-r-4 border-black">
              <img 
                src={activeFood.image} 
                alt={activeFood.headline}
                className="w-full h-full object-cover transform scale-100 hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-4 py-2 bg-[#FFC300] text-black border-2 border-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {activeFood.badge}
              </span>
            </div>

            {/* Right Block: Flavor Copywriting */}
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#D90429] tracking-widest font-mono">
                  {activeFood.title}
                </span>
                <h3 className="font-display text-3xl sm:text-5xl text-black dark:text-[#FFFDF9] uppercase leading-none">
                  {activeFood.headline}
                </h3>
                <p className="text-sm sm:text-base text-stone-650 dark:text-stone-300 italic font-bold leading-relaxed border-l-4 border-[#FFC300] pl-4">
                  {activeFood.description}
                </p>
              </div>

              {/* Ingredients tag list */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Ingredientes Clave</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFood.ingredients.map((ing, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-[#FFFDF9] dark:bg-stone-900 text-xs font-bold border border-black rounded-lg flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="w-1.5 h-1.5 bg-[#D90429] rounded-full" />
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex items-center justify-between border-t border-black/10">
                <div className="text-xs font-black text-stone-500 dark:text-stone-400">
                  ¡HORNEADO AL INSTANTE!
                </div>
                <a 
                  href="#reserva" 
                  className="inline-flex items-center gap-2 text-sm font-black uppercase text-[#D90429] hover:text-[#FFC300] transition-colors"
                >
                  Pedir Mesa para Probar
                  <ChevronRight className="w-5 h-5 stroke-[3px]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EL HORNO EXPERIENCE SECTION - POP STYLE */}
      <section id="experiencia" className="py-20 bg-[#FFC300] dark:bg-[#1A1200] border-y-4 border-black text-black dark:text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
              EL SECRETO DEL FUEGO
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-black dark:text-white uppercase leading-none">
              Horno de Barro a la Leña Real
            </h2>
            <p className="text-stone-850 dark:text-stone-200 text-sm sm:text-base font-bold leading-relaxed">
              El secreto de nuestra pizza reside en el calor seco y envolvente de nuestro horno de barro artesanal. Calentado únicamente a base de leña seleccionada, alcanza los 450°C para cocinar las pizzas en menos de 90 segundos, logrando un borde inflado y crocante (leopard pardo) con un centro tierno y sabroso.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-white dark:bg-stone-900 p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D90429] flex items-center justify-center shrink-0 border border-black text-white">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase text-black dark:text-white">Masa Madre 48h</h4>
                  <p className="text-[10px] text-stone-500 font-semibold">Fermentación natural lenta para alta digestibilidad.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-stone-900 p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center shrink-0 border border-black text-white">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase text-black dark:text-white">Leña Real</h4>
                  <p className="text-[10px] text-stone-500 font-semibold">Aroma ahumado inigualable de leña de espinillo.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-full h-80 sm:h-96 rounded-3xl border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform">
              <img 
                src="https://images.unsplash.com/photo-1573821663912-569905455b1c?w=1000&auto=format&fit=crop" 
                alt="Horno a la Leña" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOOKING FORM WITH HIGH IMPACT POP STYLE */}
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

      {/* 6. CONTACT & LOCATION */}
      <section id="contacto" className="py-16 border-t-4 border-black bg-stone-50 dark:bg-[#12100F]">
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
          <div className="h-64 rounded-3xl border-4 border-black overflow-hidden bg-stone-200 dark:bg-stone-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <iframe 
              src="https://maps.google.com/maps?q=Av.%20de%20Mayo%201420,%20Ramos%20Mej%C3%ADa,%20Buenos%20Aires,%20Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
              title="Mapa de Colores Pizzería"
            />
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
