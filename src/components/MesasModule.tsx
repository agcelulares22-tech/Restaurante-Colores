import React, { useEffect, useMemo, useState } from 'react';
import { useToast, ToastContainer } from './ToastContainer';
import {
  Sofa, List, Link2, Unlink, Plus, Check, Trash, Edit2, X,
  MapPin, Users, AlertCircle, Search, LayoutGrid, Armchair
} from 'lucide-react';
import { Mesa, EventoLog } from '../types';
import { mesasService } from '../services/mesasService';
import MesaAsistente from './MesaAsistente';


interface MesasModuleProps {
  mesas: Mesa[];
  onMesasChange: (mesas: Mesa[]) => void;
  addLog: (tipo: EventoLog['tipo'], mensaje: string) => void;
}

const ESTADOS: { key: Mesa['estado']; label: string; color: string; bg: string; border: string; shadow: string; ring: string; dot: string }[] = [
  { key: 'libre', label: 'Libre', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', shadow: 'shadow-emerald-100', ring: 'ring-emerald-300', dot: 'bg-emerald-500' },
  { key: 'ocupada', label: 'Ocupada', color: 'text-[#4A2D1B]', bg: 'bg-[#FFF8F0]', border: 'border-[#C8956A]', shadow: 'shadow-[#C8956A]/25', ring: 'ring-[#C8956A]', dot: 'bg-[#624A3E]' },
  { key: 'esperando_cuenta', label: 'Espera cuenta', color: 'text-emerald-900', bg: 'bg-emerald-100', border: 'border-emerald-400', shadow: 'shadow-emerald-200', ring: 'ring-emerald-400', dot: 'bg-emerald-600' },
  { key: 'reservada', label: 'Reservada', color: 'text-amber-900', bg: 'bg-amber-50', border: 'border-amber-300', shadow: 'shadow-amber-100', ring: 'ring-amber-300', dot: 'bg-amber-500' },
  { key: 'sucia', label: 'Sucia', color: 'text-red-950', bg: 'bg-red-50', border: 'border-red-200', shadow: 'shadow-red-50', ring: 'ring-red-300', dot: 'bg-red-500' },
  { key: 'limpiando', label: 'Limpieza', color: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-300', shadow: 'shadow-blue-100', ring: 'ring-blue-300', dot: 'bg-blue-500' },
];

const ESTADO_POR_KEY = Object.fromEntries(ESTADOS.map(e => [e.key, e]));

/** Posiciones aproximadas basadas en el plano enviado. El plano es vertical; 0,0 = arriba-izquierda. */
const MESAS_INICIALES_PLANO: Partial<Mesa>[] = [
  // Comedor (zona superior, 4 mesas rectangulares)
  { id_mesa: 1, numero_mesa: 'Mesa 1', zona: 'comedor', capacidad: 4, x: 61, y: 16 },
  { id_mesa: 2, numero_mesa: 'Mesa 2', zona: 'comedor', capacidad: 5, x: 22, y: 16 },
  { id_mesa: 3, numero_mesa: 'Mesa 3', zona: 'comedor', capacidad: 5, x: 22, y: 27 },
  { id_mesa: 4, numero_mesa: 'Mesa 4', zona: 'comedor', capacidad: 4, x: 61, y: 27 },

  // Salón (zona inferior, 6 mesas redondas)
  { id_mesa: 5, numero_mesa: 'Mesa 5', zona: 'salon', capacidad: 4, x: 41, y: 58 },
  { id_mesa: 6, numero_mesa: 'Mesa 6', zona: 'salon', capacidad: 4, x: 22, y: 70 },
  { id_mesa: 7, numero_mesa: 'Mesa 7', zona: 'salon', capacidad: 3, x: 61, y: 70 },
  { id_mesa: 8, numero_mesa: 'Mesa 8', zona: 'salon', capacidad: 4, x: 22, y: 84 },
  { id_mesa: 9, numero_mesa: 'Mesa 9', zona: 'salon', capacidad: 2, x: 61, y: 84 },
  { id_mesa: 10, numero_mesa: 'Mesa 10', zona: 'salon', capacidad: 4, x: 41, y: 84 },
];

export default function MesasModule({ mesas, onMesasChange, addLog }: MesasModuleProps) {
  const { toast, toasts, removeToast } = useToast();

  const normalizedMesas = useMemo(() => {
    return mesas.map(m => {
      const plano = MESAS_INICIALES_PLANO.find(p => p.id_mesa === m.id_mesa);
      return {
        ...plano,
        ...m,
        estado: m.estado || 'libre',
        capacidad: m.capacidad ?? plano?.capacidad ?? 4,
        zona: m.zona ?? plano?.zona ?? 'salon',
        x: m.x ?? plano?.x ?? 50,
        y: m.y ?? plano?.y ?? 50,
        mesas_unidas: m.mesas_unidas ?? [],
        parent_id: m.parent_id ?? null,
      };
    });
  }, [mesas]);

  const [localMesas, setLocalMesas] = useState<Mesa[]>(normalizedMesas);
  const [viewMode, setViewMode] = useState<'lista' | 'plano'>('plano');
  const [filterSector, setFilterSector] = useState<'todos' | NonNullable<Mesa['sector']>>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | Mesa['estado']>('todos');
  const [search, setSearch] = useState('');

  // Formulario nueva mesa
  const [numeroMesa, setNumeroMesa] = useState('');
  const [sector, setSector] = useState<NonNullable<Mesa['sector']>>('salon');
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<NonNullable<Mesa['forma']>>('redonda');

  // Edición
  const [editingMesaId, setEditingMesaId] = useState<number | null>(null);
  const [editNumero, setEditNumero] = useState('');
  const [editSector, setEditSector] = useState<NonNullable<Mesa['sector']>>('salon');
  const [editCapacidad, setEditCapacidad] = useState(4);
  const [editForma, setEditForma] = useState<NonNullable<Mesa['forma']>>('redonda');
  const [editWidth, setEditWidth] = useState(12);
  const [editHeight, setEditHeight] = useState(6);

  // Unión
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [unionMode, setUnionMode] = useState(false);

  // Confirmación eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Drag & Drop
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleStartEditFromPlano = (m: Mesa) => {
    setEditingMesaId(m.id_mesa);
    setEditNumero(m.numero_mesa);
    setEditSector(m.sector || 'salon');
    setEditCapacidad(m.capacidad || 4);
    setEditForma(m.forma || 'redonda');
    setEditWidth(m.width || (m.forma === 'rectangular' ? 12 : 8));
    setEditHeight(m.height || (m.forma === 'rectangular' ? 6 : 8));
  };

  const handleSaveEditFromSidebar = () => {
    if (!editingMesaId || !editNumero.trim()) return;
    const duplicate = localMesas.find(m => m.numero_mesa.toLowerCase() === editNumero.trim().toLowerCase() && m.id_mesa !== editingMesaId);
    if (duplicate) {
      toast.error('Ya existe otra mesa con ese nombre.');
      return;
    }
    const next = localMesas.map(m => {
      if (m.id_mesa === editingMesaId) {
        const updated: Mesa = {
          ...m,
          numero_mesa: editNumero.trim(),
          sector: editSector,
          capacidad: editCapacidad,
          forma: editForma,
          width: editWidth,
          height: editHeight
        };
        mesasService.update(editingMesaId, updated).catch(() => {});
        addLog('sistema', `MESAS: Modificada mesa '${m.numero_mesa}' a '${editNumero.trim()}'`);
        return updated;
      }
      return m;
    });
    persist(next);
    setEditingMesaId(null);
    toast.success('Mesa actualizada.');
  };

  const handleToggleEditMode = async () => {
    if (isEditMode) {
      try {
        await mesasService.upsert(localMesas);
        toast.success('Distribución del salón guardada en la base de datos.');
      } catch (err) {
        toast.error('Error al guardar la distribución en la base de datos.');
      }
      setIsEditMode(false);
      setEditingMesaId(null);
    } else {
      setIsEditMode(true);
      setUnionMode(false);
      setSelectedIds([]);
      setEditingMesaId(null);
    }
  };

  useEffect(() => {
    setLocalMesas(normalizedMesas);
  }, [normalizedMesas]);

  useEffect(() => {
    if (draggingId === null) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;

      x = Math.max(3, Math.min(97, x));
      y = Math.max(3, Math.min(97, y));

      setLocalMesas(prev =>
        prev.map(m =>
          m.id_mesa === draggingId
            ? { ...m, x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) }
            : m
        )
      );
    };

    const handleWindowMouseUp = () => {
      const finalMesa = localMesas.find(m => m.id_mesa === draggingId);
      if (finalMesa) {
        mesasService.update(draggingId, finalMesa).catch(() => {});
        persist(localMesas);
      }
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingId, localMesas]);

  const persist = (next: Mesa[]) => {
    setLocalMesas(next);
    onMesasChange(next);
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDraggingId(id);
  };

  const handleCreateMesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroMesa.trim()) return;
    const formattedName = numeroMesa.trim();
    if (localMesas.some(m => m.numero_mesa.toLowerCase() === formattedName.toLowerCase())) {
      toast.error('La mesa ya existe.');
      return;
    }

    const nextId = localMesas.length > 0 ? Math.max(...localMesas.map(m => m.id_mesa)) + 1 : 1;
    const newMesa: Mesa = {
      id_mesa: nextId,
      numero_mesa: formattedName,
      estado: 'libre',
      capacidad,
      sector,
      forma,
      x: 10 + Math.random() * 70,
      y: 10 + Math.random() * 70,
      mesas_unidas: [],
      parent_id: null,
    };

    const next = [...localMesas, newMesa];
    persist(next);
    mesasService.create(newMesa).catch(() => {
      toast.warning('La mesa quedó disponible localmente, pero no pudo sincronizarse.');
    });
    addLog('sistema', `MESAS: Creada nueva mesa '${formattedName}' (${capacidad} pax) en ${sector.toUpperCase()}`);
    setNumeroMesa('');
    setCapacidad(4);
  };

  const handleAccionAsistente = async (accion: any) => {
    try {
      if (accion.accion === 'cambio_estado' && accion.mesa_id) {
        const ids = Array.isArray(accion.mesa_id) ? accion.mesa_id : [accion.mesa_id];
        
        const stateMap: Record<string, Mesa['estado']> = {
          'Ocupada': 'ocupada',
          'Reservada': 'reservada',
          'Sucia/En Limpieza': 'sucia',
          'Libre': 'libre'
        };
        const nuevoEstado = stateMap[accion.nuevo_estado] || 'libre';

        const next = [...localMesas];
        for (const id of ids) {
          const idx = next.findIndex(m => m.id_mesa === id);
          if (idx === -1) continue;
          
          const m = next[idx];
          if (m.parent_id) {
            toast.error(`La Mesa ${m.numero_mesa} está unida y no se puede modificar directamente.`);
            continue;
          }

          const updated: Mesa = {
            ...m,
            estado: nuevoEstado,
            comensales: nuevoEstado === 'ocupada' ? (accion.comensales || m.capacidad || 2) : undefined
          };
          next[idx] = updated;

          if (m.mesas_unidas?.length) {
            m.mesas_unidas.forEach(childId => {
              const cIdx = next.findIndex(c => c.id_mesa === childId);
              if (cIdx !== -1) {
                next[cIdx] = { ...next[cIdx], estado: nuevoEstado } as Mesa;
                mesasService.update(childId, { estado: nuevoEstado }).catch(() => {});
              }
            });
          }

          await mesasService.update(id, updated);
          addLog('sistema', `MESAS (Asistente): '${m.numero_mesa}' pasó a ${nuevoEstado.toUpperCase()}`);
        }
        persist(next);
        toast.success(accion.mensaje || 'Estado de mesa actualizado.');
      } else if (accion.accion === 'combinar_mesas' && Array.isArray(accion.mesa_id)) {
        if (accion.mesa_id.length < 2) return;
        const [id1, id2] = accion.mesa_id;
        
        const m1 = localMesas.find(m => m.id_mesa === id1);
        const m2 = localMesas.find(m => m.id_mesa === id2);

        if (m1 && m2) {
          if (m1.parent_id || m2.parent_id || m1.estado === 'unida' || m2.estado === 'unida') {
            toast.error('Una de las mesas ya se encuentra unida.');
            return;
          }
          const capacidadUnida = (m1.capacidad || 0) + (m2.capacidad || 0);
          const mesaUnida: Partial<Mesa> = {
            numero_mesa: `${m1.numero_mesa} + ${m2.numero_mesa}`,
            capacidad: capacidadUnida,
            sector: m1.sector || 'salon',
            estado: 'ocupada',
            mesas_unidas: [m1.id_mesa, m2.id_mesa]
          };

          await mesasService.update(m1.id_mesa, mesaUnida);
          await mesasService.update(m2.id_mesa, { parent_id: m1.id_mesa, estado: 'unida' });

          const next = localMesas.map(m => {
            if (m.id_mesa === m1.id_mesa) return { ...m, ...mesaUnida, estado: 'ocupada' } as Mesa;
            if (m.id_mesa === m2.id_mesa) return { ...m, parent_id: m1.id_mesa, estado: 'unida' } as Mesa;
            return m;
          });
          persist(next);
          addLog('sistema', `MESAS (Asistente): Unificadas mesas ${m1.numero_mesa} y ${m2.numero_mesa}`);
          toast.success(accion.mensaje || 'Mesas unidas con éxito.');
        }
      } else if (accion.accion === 'resumen_salon') {
        toast.info(accion.mensaje);
      } else if (accion.accion === 'error') {
        toast.error(accion.mensaje);
      }
    } catch (err: any) {
      toast.error(`Error del asistente: ${err.message || err}`);
    }
  };


  const handleToggleEstadoMesa = (id: number) => {
    setLocalMesas(prev => {
      const idx = prev.findIndex(m => m.id_mesa === id);
      if (idx === -1) return prev;
      const m = prev[idx];
      if (m.parent_id) {
        toast.error('No se puede editar una mesa que está unida a otra. Sepárela primero.');
        return prev;
      }
      const order: Mesa['estado'][] = ['libre', 'reservada', 'ocupada', 'esperando_cuenta', 'sucia', 'limpiando'];
      const currentIdx = order.indexOf(m.estado);
      const nextEstado = order[currentIdx === -1 ? 0 : (currentIdx + 1) % order.length];
      const updated: Mesa = {
        ...m,
        estado: nextEstado,
        comensales: nextEstado === 'ocupada' ? Math.min(m.capacidad || 2, 2) : undefined,
      };
      const next = [...prev];
      next[idx] = updated;
      if (m.mesas_unidas?.length) {
        m.mesas_unidas.forEach(childId => {
          const cIdx = next.findIndex(c => c.id_mesa === childId);
          if (cIdx !== -1) next[cIdx] = { ...next[cIdx], estado: nextEstado };
        });
      }
      persist(next);
      mesasService.update(id, updated).catch(() => {
        toast.warning('El estado cambió localmente, pero no pudo sincronizarse.');
      });
      addLog('sistema', `MESAS: '${m.numero_mesa}' a ${nextEstado.toUpperCase()}`);
      return next;
    });
  };

  const handleStartEdit = (m: Mesa) => {
    setEditingMesaId(m.id_mesa);
    setEditNumero(m.numero_mesa);
    setEditSector(m.sector || 'salon');
    setEditCapacidad(m.capacidad || 4);
    setEditForma(m.forma || 'redonda');
  };

  const handleSaveEdit = () => {
    if (!editingMesaId || !editNumero.trim()) return;
    const duplicate = localMesas.find(m => m.numero_mesa.toLowerCase() === editNumero.trim().toLowerCase() && m.id_mesa !== editingMesaId);
    if (duplicate) {
      toast.error('Ya existe otra mesa con ese nombre.');
      return;
    }

    const next = localMesas.map(m => {
      if (m.id_mesa === editingMesaId) {
        const updated: Mesa = { ...m, numero_mesa: editNumero.trim(), sector: editSector, capacidad: editCapacidad, forma: editForma };
        mesasService.update(editingMesaId, updated).catch(() => { });
        addLog('sistema', `MESAS: Modificada mesa a '${editNumero.trim()}'`);
        return updated;
      }
      return m;
    });
    persist(next);
    setEditingMesaId(null);
    toast.success('Mesa actualizada.');
  };

  const handleDeleteMesa = (id: number) => {
    const next = localMesas
      .filter(m => m.id_mesa !== id)
      .map(m => ({
        ...m,
        mesas_unidas: m.mesas_unidas?.filter(uid => uid !== id) || [],
        parent_id: m.parent_id === id ? null : m.parent_id,
      }));
    persist(next);
    mesasService.remove(id).catch(() => { });
    addLog('sistema', `MESAS: Mesa eliminada del sistema`);
    setDeleteConfirmId(null);
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const toggleSelectForUnion = (id: number) => {
    setSelectedIds(prev => {
      const exists = prev.includes(id);
      if (exists) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.error('Máximo 3 mesas por unión.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleUnirMesas = () => {
    if (selectedIds.length < 2) {
      toast.error('Seleccioná al menos 2 mesas para unir.');
      return;
    }
    const seleccionadas = localMesas.filter(m => selectedIds.includes(m.id_mesa));
    if (seleccionadas.some(m => m.parent_id || (m.mesas_unidas?.length ?? 0) > 0)) {
      toast.error('Alguna mesa seleccionada ya pertenece a otra unión.');
      return;
    }

    const principal = seleccionadas[0];
    const hijas = seleccionadas.slice(1);
    const capacidadTotal = seleccionadas.reduce((sum, m) => sum + (m.capacidad || 0), 0);

    const next = localMesas.map(m => {
      if (m.id_mesa === principal.id_mesa) {
        return {
          ...m,
          capacidad: capacidadTotal,
          mesas_unidas: [...(m.mesas_unidas || []), ...hijas.map(h => h.id_mesa)],
          numero_mesa: `${m.numero_mesa} +${hijas.length}`,
        };
      }
      if (selectedIds.includes(m.id_mesa)) {
        return { ...m, parent_id: principal.id_mesa, estado: principal.estado };
      }
      return m;
    });
    persist(next);
    addLog('sistema', `MESAS: Unidas ${selectedIds.length} mesas en '${principal.numero_mesa} +${hijas.length}' (${capacidadTotal} pax)`);
    setSelectedIds([]);
    setUnionMode(false);
    toast.success(`Mesas unidas. Capacidad total: ${capacidadTotal} pax.`);
  };

  const handleSepararMesas = (parentId: number) => {
    const parent = localMesas.find(m => m.id_mesa === parentId);
    if (!parent?.mesas_unidas?.length) return;

    const hijas = parent.mesas_unidas;
    const next = localMesas.map(m => {
      if (m.id_mesa === parentId) {
        const plano = MESAS_INICIALES_PLANO.find(p => p.id_mesa === parentId);
        return {
          ...m,
          capacidad: plano?.capacidad || m.capacidad ? Math.round(m.capacidad / ((hijas.length || 0) + 1)) : 4,
          mesas_unidas: [],
          numero_mesa: plano?.numero_mesa || m.numero_mesa.replace(/\s*\+\d+$/, ''),
        };
      }
      if (hijas.includes(m.id_mesa)) {
        const plano = MESAS_INICIALES_PLANO.find(p => p.id_mesa === m.id_mesa);
        return { ...m, parent_id: null, estado: 'libre' as const, capacidad: plano?.capacidad || m.capacidad };
      }
      return m;
    });
    persist(next);
    addLog('sistema', `MESAS: Separadas mesas de '${parent.numero_mesa}'`);
    toast.success('Mesas separadas.');
  };

  const filteredMesas = useMemo(() => {
    return localMesas.filter(m => {
      if (filterSector !== 'todos' && m.sector !== filterSector) return false;
      if (filterEstado !== 'todos' && m.estado !== filterEstado) return false;
      if (search && !m.numero_mesa.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [localMesas, filterSector, filterEstado, search]);

  const mesasVisiblesEnPlano = useMemo(() => {
    return filteredMesas.filter(m => !m.parent_id || selectedIds.includes(m.id_mesa));
  }, [filteredMesas, selectedIds]);

  const freeCount = localMesas.filter(m => m.estado === 'libre' && !m.parent_id).length;
  const occupiedCount = localMesas.filter(m => m.estado === 'ocupada' && !m.parent_id).length;
  const capacidadTotal = localMesas.filter(m => !m.parent_id).reduce((s, m) => s + (m.capacidad || 0), 0);
  const paxOcupados = localMesas.filter(m => m.estado === 'ocupada' && !m.parent_id).reduce((s, m) => s + (m.comensales || m.capacidad || 0), 0);

  const getEstadoStyle = (estado: Mesa['estado']) => ESTADO_POR_KEY[estado] || ESTADO_POR_KEY['libre'];

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Total Mesas</span>
          <h4 className="text-2xl font-black text-stone-950 font-mono mt-1">{localMesas.filter(m => !m.parent_id).length}</h4>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Libres</span>
          <h4 className="text-2xl font-black text-emerald-600 font-mono mt-1">{freeCount}</h4>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Ocupadas</span>
          <h4 className="text-2xl font-black text-[#624A3E] font-mono mt-1">{occupiedCount}</h4>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-[#624A3E]/5 border-l-4 border-l-[#624A3E]">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Capacidad / Ocupación</span>
          <h4 className="text-2xl font-black text-amber-700 font-mono mt-1">
            {paxOcupados}<span className="text-sm text-stone-400 font-normal">/{capacidadTotal} pax</span>
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left pane: form + filters */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 h-fit">
          {isEditMode && editingMesaId ? (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#624A3E]" />
                Editar Mesa: {editNumero}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Nombre / Número</label>
                  <input
                    type="text"
                    value={editNumero}
                    onChange={e => setEditNumero(e.target.value)}
                    className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Sector</label>
                    <select
                      value={editSector}
                      onChange={e => setEditSector(e.target.value as any)}
                      className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none text-stone-700 font-semibold"
                    >
                      <option value="comedor">Comedor</option>
                      <option value="salon">Salón</option>
                      <option value="terraza">Terraza</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Capacidad (pax)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editCapacidad}
                      onChange={e => setEditCapacidad(parseInt(e.target.value) || 1)}
                      className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Forma</label>
                  <select
                    value={editForma}
                    onChange={e => setEditForma(e.target.value as any)}
                    className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none text-stone-700 font-semibold"
                  >
                    <option value="redonda">Redonda</option>
                    <option value="rectangular">Rectangular</option>
                  </select>
                </div>

                {editForma === 'rectangular' ? (
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <div>
                      <label className="text-[9px] font-black text-stone-500 uppercase block mb-0.5">Ancho ({editWidth}%)</label>
                      <input
                        type="range"
                        min={8}
                        max={25}
                        value={editWidth}
                        onChange={e => setEditWidth(parseInt(e.target.value))}
                        className="w-full accent-[#624A3E]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-stone-500 uppercase block mb-0.5">Alto ({editHeight}%)</label>
                      <input
                        type="range"
                        min={4}
                        max={15}
                        value={editHeight}
                        onChange={e => setEditHeight(parseInt(e.target.value))}
                        className="w-full accent-[#624A3E]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                    <label className="text-[9px] font-black text-stone-500 uppercase block mb-0.5">Diámetro ({editWidth}%)</label>
                    <input
                      type="range"
                      min={6}
                      max={18}
                      value={editWidth}
                      onChange={e => {
                        setEditWidth(parseInt(e.target.value));
                        setEditHeight(parseInt(e.target.value));
                      }}
                      className="w-full accent-[#624A3E]"
                    />
                  </div>
                )}

                <div className="flex gap-1.5 pt-2">
                  <button
                    onClick={handleSaveEditFromSidebar}
                    className="flex-1 min-h-10 text-xs font-extrabold bg-[#624A3E] text-white rounded-xl hover:bg-[#503C32] transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Seguro que querés eliminar esta mesa?')) {
                        handleDeleteMesa(editingMesaId);
                        setEditingMesaId(null);
                        toast.success('Mesa eliminada.');
                      }
                    }}
                    className="p-2.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar Mesa"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingMesaId(null)}
                    className="p-2.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#624A3E]" />
                Nueva Mesa
              </h3>
              <form onSubmit={handleCreateMesa} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Nombre / Número</label>
                  <input
                    type="text"
                    value={numeroMesa}
                    onChange={e => setNumeroMesa(e.target.value)}
                    placeholder="Ej. Mesa 11, Barra 1"
                    className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Sector</label>
                    <select
                      value={sector}
                      onChange={e => setSector(e.target.value as NonNullable<Mesa['sector']>)}
                      className="w-full text-xs min-h-11 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E] cursor-pointer text-stone-700 font-semibold"
                    >
                      <option value="comedor">Comedor</option>
                      <option value="salon">Salón</option>
                      <option value="terraza">Terraza</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">Capacidad (pax)</label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={capacidad}
                        onChange={e => setCapacidad(parseInt(e.target.value) || 1)}
                        className="w-full text-xs min-h-11 pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                        required
                      />
                    </div>
                  </div>
                </div>


                <button
                  type="submit"
                  className="w-full min-h-11 py-2.5 bg-[#624A3E] hover:bg-[#503C32] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Agregar Mesa
                </button>
              </form>
            </>
          )}

          <hr className="border-stone-100" />

          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar mesa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs min-h-10 pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterSector}
                onChange={e => setFilterSector(e.target.value as any)}
                className="text-xs min-h-10 px-2 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los sectores</option>
                <option value="comedor">Comedor</option>
                <option value="salon">Salón</option>
                <option value="terraza">Terraza</option>
                <option value="vip">VIP</option>
              </select>
              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value as any)}
                className="text-xs min-h-10 px-2 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map(e => (
                  <option key={e.key} value={e.key}>{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-stone-100" />

          <div className="space-y-2">
            <button
              onClick={() => { setUnionMode(v => !v); setSelectedIds([]); setIsEditMode(false); }}
              className={`w-full min-h-10 flex items-center justify-center gap-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                unionMode ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              {unionMode ? 'Cancelar unión' : 'Unir mesas'}
            </button>
            {unionMode && (
              <>
                <p className="text-[10px] text-stone-500 text-center">Seleccioná 2 o 3 mesas y confirmá.</p>
                <button
                  onClick={handleUnirMesas}
                  disabled={selectedIds.length < 2}
                  className="w-full min-h-10 flex items-center justify-center gap-2 text-xs font-extrabold rounded-xl bg-[#624A3E] text-white disabled:opacity-40 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Confirmar unión ({selectedIds.length})
                </button>
              </>
            )}

          </div>

          <hr className="border-stone-100" />
          <MesaAsistente mesas={localMesas} onAccion={handleAccionAsistente} />
        </div>

        {/* Right pane: plano / lista */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs xl:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#624A3E]" />
              Distribución del Salón
            </h3>
            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'lista' ? 'bg-[#624A3E] text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('plano')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'plano' ? 'bg-[#624A3E] text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Plano
              </button>
            </div>
          </div>

          {/* Leyenda de estados */}
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map(e => (
              <div key={e.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 shadow-xs">
                <span className={`w-2 h-2 rounded-full ${e.dot} ring-2 ring-white shadow-sm`} />
                <span className="text-[10px] font-bold text-stone-600">{e.label}</span>
              </div>
            ))}
          </div>

          {viewMode === 'lista' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMesas.map(m => {
                const estilo = getEstadoStyle(m.estado);
                const isParent = (m.mesas_unidas?.length ?? 0) > 0;
                const isChild = !!m.parent_id;
                return (
                  <div key={m.id_mesa} className={`relative group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 border-l-4 ${estilo.border} ${estilo.shadow}`}>
                    {editingMesaId === m.id_mesa ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editNumero}
                          onChange={e => setEditNumero(e.target.value)}
                          className="w-full text-xs p-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
                        />
                        <div className="grid grid-cols-3 gap-1.5">
                          <select value={editSector} onChange={e => setEditSector(e.target.value as NonNullable<Mesa['sector']>)} className="text-[10px] p-1.5 border border-stone-300 rounded-lg bg-stone-50 cursor-pointer">
                            <option value="comedor">Comedor</option>
                            <option value="salon">Salón</option>
                            <option value="terraza">Terraza</option>
                            <option value="vip">VIP</option>
                          </select>
                          <select value={editForma} onChange={e => setEditForma(e.target.value as NonNullable<Mesa['forma']>)} className="text-[10px] p-1.5 border border-stone-300 rounded-lg bg-stone-50 cursor-pointer">
                            <option value="redonda">Redonda</option>
                            <option value="rectangular">Rectangular</option>
                          </select>
                          <input type="number" min={1} max={20} value={editCapacidad} onChange={e => setEditCapacidad(parseInt(e.target.value) || 1)} className="text-[10px] p-1.5 border border-stone-300 rounded-lg bg-stone-50" placeholder="Pax" />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={handleSaveEdit} className="flex-1 min-h-9 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors">Guardar</button>
                          <button onClick={() => setEditingMesaId(null)} className="min-h-9 py-1.5 px-3 bg-stone-200 hover:bg-stone-300 text-stone-600 text-[11px] font-bold rounded-xl cursor-pointer transition-colors">X</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${estilo.bg} ${estilo.color} shadow-sm border ${estilo.border}`}>
                              <Armchair className="w-5 h-5" />
                            </div>
                            <div>
                              <strong className="text-base font-black text-stone-800 block">{m.numero_mesa}</strong>
                               <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{m.sector}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${estilo.bg} ${estilo.color} border ${estilo.border} shadow-xs`}>
                            {estilo.label}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
                            <Users className="w-4 h-4 text-stone-500" />
                            <span className="text-sm font-black text-stone-700">{m.capacidad} pax</span>
                            {isParent && <span className="text-[10px] text-[#624A3E] font-black ml-1">(+{m.mesas_unidas?.length})</span>}
                            {isChild && <span className="text-[10px] text-stone-400 font-black ml-1">(unida)</span>}
                          </div>
                          {unionMode ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelectForUnion(m.id_mesa); }}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                                selectedIds.includes(m.id_mesa) ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              {selectedIds.includes(m.id_mesa) ? 'Seleccionada' : 'Seleccionar'}
                            </button>
                          ) : (
                            !isChild && (
                              <button
                                onClick={() => handleToggleEstadoMesa(m.id_mesa)}
                                className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer transition-colors"
                              >
                                Cambiar
                              </button>
                            )
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-stone-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(m); }}
                            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="Editar mesa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isParent ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSepararMesas(m.id_mesa); }}
                              className="p-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition-colors"
                              title="Separar mesas"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              {deleteConfirmId === m.id_mesa ? (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMesa(m.id_mesa); }} className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="p-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-600 cursor-pointer transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(m.id_mesa); }}
                                  className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                  title="Eliminar mesa"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#FDF8E2] text-[#856404] p-3 rounded-xl border border-[#FFEBAA] text-xs">
                <span className="font-semibold">
                  {isEditMode 
                    ? '🔧 MODO DISEÑO ACTIVO: Arrastrá las mesas para acomodar la distribución del salón.' 
                    : '💡 Habilitá el modo diseño para reordenar las coordenadas de las mesas.'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isEditMode 
                      ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700' 
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 shadow-xs'
                  }`}
                >
                  {isEditMode ? 'Guardar Cambios' : 'Modo Diseño'}
                </button>
              </div>

              <div 
                ref={containerRef}
                className="relative w-full h-[620px] bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center bg-[radial-gradient(#3c3c3c_1.5px,transparent_1.5px)] [background-size:24px_24px]"
              >
                {filteredMesas.map(m => {
                  const estilo = getEstadoStyle(m.estado);
                  const isParent = (m.mesas_unidas?.length ?? 0) > 0;
                  const isChild = !!m.parent_id;
                  
                  const isRound = m.forma === 'redonda';
                  const shapeClass = isRound ? 'rounded-full' : 'rounded-2xl';

                  const w = m.width || (m.forma === 'rectangular' ? 12 : 8);
                  const h = m.height || (m.forma === 'rectangular' ? 6 : 8);

                  return (
                    <div
                      key={m.id_mesa}
                      onMouseDown={(e) => handleMouseDown(e, m.id_mesa)}
                      style={{
                        left: `${m.x ?? 50}%`,
                        top: `${m.y ?? 50}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${w * 12}px`,
                        height: `${h * 12}px`,
                      }}
                      className={`absolute select-none cursor-pointer p-2 text-center flex flex-col justify-center items-center shadow-md border-2 ${
                        draggingId === m.id_mesa ? 'ring-4 ring-amber-500 scale-105 z-50 border-amber-500 shadow-2xl' : ''
                      } ${
                        isEditMode ? 'cursor-move border-dashed hover:border-amber-400' : ''
                      } ${estilo.bg} ${estilo.color} ${estilo.border} ${shapeClass} transition-transform active:scale-95`}
                    >
                      <strong className="text-sm font-black tracking-tight">{m.numero_mesa}</strong>
                      <span className="text-[10px] opacity-75 font-black uppercase tracking-wider">{m.capacidad} pax</span>
                      {isParent && <span className="text-[8px] font-black uppercase text-[#624A3E]">(Principal)</span>}
                      {isChild && <span className="text-[8px] font-black uppercase text-stone-500">(Unida)</span>}
                      
                      <span className={`w-3.5 h-3.5 rounded-full ${estilo.dot} absolute top-1 right-1 border-2 border-white ring-1 ring-black/5 shadow-xs`} />
                      
                      {!isEditMode && !isChild && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEstadoMesa(m.id_mesa);
                          }}
                          className="absolute -bottom-2 bg-stone-950 hover:bg-stone-900 border border-white/10 hover:scale-105 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md transition-all active:scale-90"
                        >
                          Cambiar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
