import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { UtensilsCrossed, Plus, Search, Edit2, Check, Copy, X, DollarSign, Image, AlertTriangle, Percent, Trash2, RotateCcw } from 'lucide-react';
import BulkPriceEditor from './BulkPriceEditor';
import { CardSkeleton } from './Skeleton';
import { ProductoMenu, EventoLog, RecetaEscandallo, Insumo } from '../types';
import { menuService } from '../services/menuService';
import { useCategories } from '../hooks/useCategories';
import { menuItemSchema } from '../lib/validations';
import { ToastContainer, useToast } from './ToastContainer';
import { calculateRecipeCost, calculateMarginPct, getMarginLevel } from '../lib/recetas';

interface MenuModuleProps {
  productosMenu: ProductoMenu[];
  onProductosChange: (productos: ProductoMenu[]) => void;
  recetas: RecetaEscandallo[];
  insumos: Insumo[];
  addLog: (tipo: EventoLog['tipo'], mensaje: string) => void;
}

type PendingAction = 'create' | `toggle_${string}` | `edit_${string}` | `duplicate_${string}` | `delete_${string}`;

const ALLERGENS_LIST = [
  { id: 'gluten', label: 'Gluten 🌾' },
  { id: 'lactosa', label: 'Lácteos 🥛' },
  { id: 'huevo', label: 'Huevo 🥚' },
  { id: 'frutos_secos', label: 'Frutos Secos 🥜' },
  { id: 'pescado', label: 'Pescado 🐟' },
  { id: 'soja', label: 'Soja 🫘' }
];

const normalizeText = (value: string) => value.trim().toLowerCase();

const inferTipo = (categoria: string): ProductoMenu['tipo'] => {
  const normalized = normalizeText(categoria);
  if (normalized === 'bebidas') return 'bebida';
  if (normalized === 'bodega') return 'vino';
  if (normalized === 'postres') return 'postre';
  return 'plato';
};

const getFallbackImage = (categoria: string) => {
  const normalized = normalizeText(categoria);
  if (normalized === 'bebidas' || normalized === 'bodega') {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80';
  }
  if (normalized === 'postres') {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80';
};

function MenuModule({ productosMenu, onProductosChange, recetas, insumos, addLog }: MenuModuleProps) {
  const { categories } = useCategories(true);
  const [items, setItems] = useState<ProductoMenu[]>(productosMenu);
  const { toast, toasts, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(productosMenu);
  }, [productosMenu]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  // Selection & Delete Modal States
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductoMenu | null>(null);

  // Form states for creating or editing a menu item
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState<string>('Pizzas');
  const [imagenUrl, setImagenUrl] = useState('');
  const [tiempoPreparacion, setTiempoPreparacion] = useState('12');
  const [requiereCocina, setRequiereCocina] = useState(true);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isEspecialidad, setIsEspecialidad] = useState(false);
  const [detalleMasa, setDetalleMasa] = useState('');

  // Sorting state for the catalog
  const [sortBy, setSortBy] = useState<'nombre' | 'precio_asc' | 'precio_desc' | 'margen_desc'>('nombre');

  const normalizeCategorySlug = (categoriaName: string, nombreProducto = ''): string => {
    const normCat = (categoriaName || '').toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const normName = (nombreProducto || '').toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const hasSingleBebidasTab = categories.some(c => c.slug === 'bebidas');

    // 1. Food categories first (explicit check by category or name)
    if (normCat.includes('pizza') || normName.includes('pizza')) {
      return 'pizzas';
    }
    if (normCat.includes('calzone') || normCat.includes('empanada') || normName.includes('calzone') || normName.includes('empanada')) {
      return 'calzones-y-empanadas';
    }
    if (normCat.includes('postre') || normCat.includes('dulce') || normCat.includes('helado') || normName.includes('tiramisu') || normName.includes('tarta-de-ricotta')) {
      return 'postres';
    }
    if (
      normCat.includes('sandwich') || normCat.includes('focaccia') || normCat.includes('baguette') || normCat.includes('panuzzo') || normCat.includes('lomo') ||
      normName.includes('focaccia') || normName.includes('sandwich') || normName.includes('baguette') || normName.includes('panuzzo')
    ) {
      return 'sandwiches';
    }

    // 2. Alcoholic beverages
    if (
      normCat.includes('con-alcohol') || 
      normCat === 'bebidas-c-a' || 
      normCat === 'c-a' || 
      normCat.includes('cerveza') || 
      normCat.includes('bodega') || 
      normCat.includes('vino') || 
      normName.includes('cerveza') || 
      normName.includes('gius') || 
      normName.includes('stout') || 
      normName.includes('lager') || 
      normName.includes('ale') || 
      normName.includes('ipa') || 
      normName.includes('pinta') || 
      normName.includes('fernet') || 
      normName.includes('aperol') || 
      normName.includes('vino')
    ) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-con-alcohol';
    }

    // 3. Non-alcoholic beverages
    if (
      normCat.includes('sin-alcohol') || 
      normCat === 'bebidas-s-a' || 
      normCat === 's-a' || 
      normCat.includes('gaseosa') || 
      normCat.includes('agua') || 
      normCat.includes('jugo') || 
      normCat.includes('bebida') || 
      normName.includes('coca') || 
      normName.includes('sprite') || 
      normName.includes('fanta') || 
      normName.includes('bonaqua') || 
      normName.includes('gaseosa') || 
      normName.includes('agua-de-manantial') || 
      normName.includes('jugo')
    ) {
      return hasSingleBebidasTab ? 'bebidas' : 'bebidas-sin-alcohol';
    }

    return normCat;
  };

  const isBusy = pendingAction !== null;

  const syncItems = (next: ProductoMenu[]) => {
    setItems(next);
    onProductosChange(next);
  };

  const resetForm = () => {
    setSelectedDishId(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setImagenUrl('');
    setCategoria(categories[0]?.nombre || 'Pizzas');
    setTiempoPreparacion('12');
    setRequiereCocina(true);
    setSelectedAllergens([]);
    setIsEspecialidad(false);
    setDetalleMasa('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectDish = (item: ProductoMenu) => {
    if (isBusy) return;
    setSelectedDishId(item.id_producto);
    setNombre(item.nombre);
    setPrecio(item.precio_venta.toString());
    setDescripcion(item.descripcion || '');
    setCategoria(item.categoria);
    setImagenUrl(item.imagen || '');
    setTiempoPreparacion(item.tiempo_preparacion_estimado?.toString() || '12');
    setRequiereCocina(item.requiere_cocina ?? true);
    setSelectedAllergens(item.alergenos || []);
    setIsEspecialidad(item.subcategoria === 'especialidad');
    setDetalleMasa(item.consejo_emplatado || '');

    if (formRef.current && window.innerWidth < 1024) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasDuplicateName = (name: string, excludedId?: string) => (
    items.some(item => item.id_producto !== excludedId && normalizeText(item.nombre) === normalizeText(name))
  );

  // Resize and compress files to base64
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be created'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Invalid image file'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reader failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Procesando y comprimiendo imagen...');
      const base64 = await processImageFile(file);
      setImagenUrl(base64);
      toast.success('Imagen lista para guardar.');
    } catch {
      toast.error('Error al procesar la imagen. Intente con otra.');
    }
  };

  const handleAutoGenerateImage = (dishName: string, dishCategory: string) => {
    if (!dishName.trim()) {
      toast.warning('Ingrese primero el nombre del plato para buscar una imagen adecuada.');
      return;
    }
    
    const cleanName = encodeURIComponent(dishName.trim());
    const cleanCategory = encodeURIComponent(dishCategory.trim());
    const autoUrl = `https://images.unsplash.com/featured/500x500/?food,plated,${cleanCategory},${cleanName}`;
    setImagenUrl(autoUrl);
    toast.success('Imagen autogenerada con éxito.');
  };

  const buildMenuItem = (
    id: string,
    values: {
      nombre: string;
      descripcion: string;
      precio: string;
      categoria: string;
      imagen: string;
      tiempoPreparacion: string;
      requiereCocina: boolean;
      alergenos: string[];
      activo?: boolean;
      isEspecialidad?: boolean;
      detalleMasa?: string;
    }
  ): ProductoMenu | null => {
    const parsedPrice = Number.parseFloat(values.precio);
    const validation = menuItemSchema.safeParse({
      nombre: values.nombre,
      precio_venta: parsedPrice,
      categoria: values.categoria,
      descripcion: values.descripcion
    });

    if (!validation.success) {
      toast.error(validation.error.issues.map(i => i.message).join('. '));
      return null;
    }

    const clean = validation.data;
    const tipo = inferTipo(clean.categoria);
    const reqCocina = values.requiereCocina && !(tipo === 'bebida' || tipo === 'vino');

    return {
      id_producto: id,
      nombre: clean.nombre,
      descripcion: clean.descripcion?.trim() || `${clean.nombre} elaborado con ingredientes selectos.`,
      precio_venta: clean.precio_venta,
      categoria: clean.categoria,
      activo: values.activo ?? true,
      imagen: values.imagen.trim() || getFallbackImage(clean.categoria),
      tipo,
      requiere_cocina: reqCocina,
      tiempo_preparacion_estimado: reqCocina ? (Number(values.tiempoPreparacion) || 12) : undefined,
      alergenos: values.alergenos,
      subcategoria: values.isEspecialidad ? 'especialidad' : undefined,
      consejo_emplatado: values.detalleMasa?.trim() || undefined
    };
  };

  const handleCreateItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBusy) return;

    const tempId = `prod_custom_${Date.now()}`;
    const newItem = buildMenuItem(tempId, {
      nombre,
      descripcion,
      precio,
      categoria,
      imagen: imagenUrl,
      tiempoPreparacion,
      requiereCocina,
      alergenos: selectedAllergens,
      isEspecialidad,
      detalleMasa
    });
    if (!newItem) return;
    if (hasDuplicateName(newItem.nombre)) {
      toast.warning('Ya existe un producto con ese nombre en la carta.');
      return;
    }

    const previous = items;
    setPendingAction('create');
    syncItems([newItem, ...items]);

    try {
      const saved = await menuService.create(newItem);
      syncItems([saved, ...items]);
      addLog('sistema', `MENU: Creado '${saved.nombre}' con precio de venta $${saved.precio_venta}`);
      toast.success('Producto registrado en carta.');
      resetForm();
    } catch {
      syncItems(previous);
      toast.error('No se pudo registrar el producto. Se revirtió el cambio.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (isBusy) return;
    const target = items.find(item => item.id_producto === id);
    if (!target) return;

    const updated = buildMenuItem(id, {
      nombre,
      descripcion,
      precio,
      categoria,
      imagen: imagenUrl,
      tiempoPreparacion,
      requiereCocina,
      alergenos: selectedAllergens,
      activo: target.activo,
      isEspecialidad,
      detalleMasa
    });
    if (!updated) return;
    if (hasDuplicateName(updated.nombre, id)) {
      toast.warning('Ya existe otro producto con ese nombre.');
      return;
    }

    const previous = items;
    const optimistic = items.map(item => item.id_producto === id ? { ...item, ...updated } : item);

    setPendingAction(`edit_${id}`);
    syncItems(optimistic);

    try {
      const saved = await menuService.update(id, updated);
      syncItems(optimistic.map(item => item.id_producto === id ? { ...item, ...saved } : item));
      addLog('sistema', `MENU: Actualizado '${target.nombre}' a '${saved.nombre}' ($${saved.precio_venta})`);
      toast.success(`'${saved.nombre}' actualizado correctamente.`);
    } catch {
      syncItems(previous);
      toast.error('No se pudo guardar el producto. Se revirtió el cambio.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDishId) {
      await handleSaveEdit(selectedDishId);
    } else {
      await handleCreateItem(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || isBusy) return;
    const id = itemToDelete.id_producto;
    const targetName = itemToDelete.nombre;
    const previous = items;

    setPendingAction(`delete_${id}`);
    setItemToDelete(null);

    const optimistic = items.filter(item => item.id_producto !== id);
    syncItems(optimistic);

    if (selectedDishId === id) {
      resetForm();
    }

    try {
      const ok = await menuService.remove(id);
      if (ok) {
        addLog('sistema', `MENU: Eliminado '${targetName}' de la carta`);
        toast.success(`'${targetName}' eliminado de la carta.`);
      } else {
        throw new Error('Remove returned false');
      }
    } catch {
      syncItems(previous);
      toast.error('No se pudo eliminar el producto. Se revirtió el cambio.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleActivo = async (id: string) => {
    if (isBusy) return;
    const target = items.find(item => item.id_producto === id);
    if (!target) return;

    const previous = items;
    const nextState = !target.activo;
    const optimistic = items.map(item => item.id_producto === id ? { ...item, activo: nextState } : item);

    setPendingAction(`toggle_${id}`);
    syncItems(optimistic);

    try {
      const saved = await menuService.update(id, { activo: nextState });
      syncItems(optimistic.map(item => item.id_producto === id ? { ...item, ...saved } : item));
      addLog('sistema', `MENU: '${target.nombre}' ${nextState ? 'habilitado' : 'retirado'} de la carta`);
      toast.success(nextState ? 'Producto habilitado.' : 'Producto retirado de la carta.');
    } catch {
      syncItems(previous);
      toast.error('No se pudo cambiar el estado del producto. Se revirtió el cambio.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleDuplicateItem = async (item: ProductoMenu) => {
    if (isBusy) return;
    const dup: ProductoMenu = {
      ...item,
      id_producto: `prod_dup_${Date.now()}`,
      nombre: `${item.nombre} (copia)`,
      activo: true,
    };

    if (hasDuplicateName(dup.nombre)) {
      dup.nombre = `${item.nombre} (copia ${new Date().getHours()}${new Date().getMinutes()})`;
    }

    const previous = items;
    setPendingAction(`duplicate_${item.id_producto}`);
    syncItems([dup, ...items]);

    try {
      const saved = await menuService.create(dup);
      syncItems([saved, ...items]);
      addLog('sistema', `MENU: Duplicado '${item.nombre}' como '${saved.nombre}'`);
      toast.success('Producto duplicado.');
    } catch {
      syncItems(previous);
      toast.error('No se pudo duplicar el producto. Se revirtió el cambio.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleBulkItemsChange = (next: ProductoMenu[]) => {
    syncItems(next);
  };

  const filtered = useMemo(() => {
    const list = items.filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(debouncedSearch.toLowerCase());
      const targetSlug = selectedCategoria === 'todos' ? 'todos' : normalizeCategorySlug(selectedCategoria);
      const matchesCat = targetSlug === 'todos' || normalizeCategorySlug(item.categoria, item.nombre) === targetSlug;
      return matchesSearch && matchesCat;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'precio_asc') return a.precio_venta - b.precio_venta;
      if (sortBy === 'precio_desc') return b.precio_venta - a.precio_venta;
      if (sortBy === 'margen_desc') {
        const matchedRecipesA = recetas.filter(r => r.id_producto === a.id_producto);
        const costA = matchedRecipesA.length > 0 ? calculateRecipeCost(matchedRecipesA, insumos) : 0;
        const marginA = costA > 0 ? calculateMarginPct(a, costA) : -999;

        const matchedRecipesB = recetas.filter(r => r.id_producto === b.id_producto);
        const costB = matchedRecipesB.length > 0 ? calculateRecipeCost(matchedRecipesB, insumos) : 0;
        const marginB = costB > 0 ? calculateMarginPct(b, costB) : -999;

        return marginB - marginA;
      }
      return a.nombre.localeCompare(b.nombre);
    });
  }, [items, debouncedSearch, selectedCategoria, categories, sortBy, recetas, insumos]);

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergenId) ? prev.filter(x => x !== allergenId) : [...prev, allergenId]
    );
  };

  const selectedItemObject = items.find(it => it.id_producto === selectedDishId);

  return (
    <div className="space-y-4 md:space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* MODAL CONFIRMACION ELIMINAR PLATO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 leading-tight">¿Eliminar plato del menú?</h3>
                <p className="text-xs text-stone-500">Esta acción retirará el producto definitivamente.</p>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center gap-3">
              <img
                src={itemToDelete.imagen || getFallbackImage(itemToDelete.categoria)}
                alt={itemToDelete.nombre}
                className="w-12 h-12 rounded-lg object-cover border border-stone-200"
                onError={e => { (e.currentTarget as HTMLImageElement).src = getFallbackImage(itemToDelete.categoria); }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-stone-900 truncate">{itemToDelete.nombre}</h4>
                <p className="text-xs text-stone-500 font-mono font-bold">
                  ${itemToDelete.precio_venta.toLocaleString('es-AR')} • {itemToDelete.categoria}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong>"{itemToDelete.nombre}"</strong>? No estará disponible para mozos, comandas ni delivery.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isBusy}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isBusy}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {pendingAction === `delete_${itemToDelete.id_producto}` ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setShowBulkEditor(false)}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer border shrink-0 ${
            !showBulkEditor ? 'bg-[#624A3E] text-white border-[#624A3E]' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
          <UtensilsCrossed className="w-3.5 h-3.5 inline mr-1" /> Catalogo
        </button>
        <button onClick={() => setShowBulkEditor(true)}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer border shrink-0 ${
            showBulkEditor ? 'bg-[#624A3E] text-white border-[#624A3E]' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
          <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Precios masivos
        </button>
      </div>

      {showBulkEditor ? (
        <BulkPriceEditor items={items} onItemsChange={handleBulkItemsChange} addLog={addLog} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* PANEL LATERAL: CREAR / EDITAR PLATO */}
        <div ref={formRef} className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
                {selectedDishId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-600" />
                    Editar plato / bebida
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#624A3E]" />
                    Nuevo plato / bebida
                  </>
                )}
              </h3>
              {selectedDishId && (
                <p className="text-[10px] text-amber-700 font-bold truncate max-w-[200px] mt-0.5">
                  {selectedItemObject?.nombre || 'Plato seleccionado'}
                </p>
              )}
            </div>
            {selectedDishId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1 text-[10px] font-extrabold text-[#624A3E] bg-[#624A3E]/10 hover:bg-[#624A3E]/20 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                title="Volver a crear nuevo plato"
              >
                <Plus className="w-3 h-3" />
                Nuevo
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Nombre comercial</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Ojo de Bife Criollo"
                className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
                disabled={isBusy}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Precio de venta ($)</label>
              <input
                type="number"
                inputMode="decimal"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="Ej. 18500"
                className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
                disabled={isBusy}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Descripcion</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ingredientes u observaciones..."
                rows={2}
                className="w-full text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30 resize-none"
                disabled={isBusy}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30 cursor-pointer font-bold text-stone-700"
                disabled={isBusy}
              >
                {categories.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
              </select>
            </div>
            
            {/* Extended attributes: cooking time, kitchen requirement, and signature status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Min. Prep.</label>
                <input
                  type="number"
                  value={tiempoPreparacion}
                  onChange={e => setTiempoPreparacion(e.target.value)}
                  placeholder="12"
                  className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
                  disabled={isBusy || !requiereCocina}
                />
              </div>
              <div className="flex flex-col justify-center space-y-1.5 bg-stone-50/50 p-2.5 rounded-xl border border-stone-200/50">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-stone-700 text-xs">
                  <input
                    type="checkbox"
                    checked={requiereCocina}
                    onChange={e => setRequiereCocina(e.target.checked)}
                    className="w-4 h-4 rounded text-[#624A3E] focus:ring-[#624A3E]"
                    disabled={isBusy}
                  />
                  Cocina
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-stone-700 text-xs">
                  <input
                    type="checkbox"
                    checked={isEspecialidad}
                    onChange={e => setIsEspecialidad(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-550 focus:border-amber-550"
                    disabled={isBusy}
                  />
                  👑 Especialidad
                </label>
              </div>
            </div>

            {/* Allergen selector */}
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1.5">Alérgenos</label>
              <div className="flex flex-wrap gap-1">
                {ALLERGENS_LIST.map(alg => {
                  const active = selectedAllergens.includes(alg.id);
                  return (
                    <button
                      type="button"
                      key={alg.id}
                      onClick={() => toggleAllergen(alg.id)}
                      className={`px-2 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wide cursor-pointer transition-all ${
                        active
                          ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {alg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pizza Dough details input */}
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Detalles de Masa / Fermentación (Pizzería)</label>
              <input
                type="text"
                value={detalleMasa}
                onChange={e => setDetalleMasa(e.target.value)}
                placeholder="Ej. Masa madre, 48 hs de maduración en frío"
                className="w-full min-h-11 text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
                disabled={isBusy}
              />
            </div>

            {/* Canvas express image resize and uploader */}
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Imagen del plato (Manual / Auto)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={imagenUrl}
                  onChange={e => setImagenUrl(e.target.value)}
                  placeholder="Pegue una URL de imagen..."
                  className="w-full min-h-10 text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/30 focus:outline-none focus:ring-1 focus:ring-[#624A3E]/30"
                  disabled={isBusy}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-10 flex items-center justify-center gap-1 border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 rounded-xl text-[11px] font-bold text-stone-600 cursor-pointer"
                  >
                    <Image className="w-3.5 h-3.5 text-stone-450" />
                    Subir Archivo (Canvas)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateImage(nombre, categoria)}
                    className="flex-1 min-h-10 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    🪄 Auto Generar
                  </button>
                </div>
                {imagenUrl && (
                  <div className="relative w-16 h-16 rounded-xl border border-stone-200 overflow-hidden">
                    <img src={imagenUrl} className="w-full h-full object-cover" alt="Vista previa" />
                    <button
                      type="button"
                      onClick={() => setImagenUrl('')}
                      className="absolute -top-1 -right-1 bg-stone-850/80 text-white rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCION FORMULARIO */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <button
                type="submit"
                disabled={isBusy}
                className="w-full min-h-11 py-2.5 bg-[#624A3E] hover:bg-[#503C32] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#624A3E]/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  'Guardando...'
                ) : selectedDishId ? (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar cambios
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Registrar en carta
                  </>
                )}
              </button>

              {selectedDishId && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItemObject) setItemToDelete(selectedItemObject);
                    }}
                    disabled={isBusy}
                    className="flex-1 py-2 px-3 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar plato
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isBusy}
                    className="py-2 px-3 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* CATALOGO DE MENU */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#624A3E]" />
              Catalogo de menu ({filtered.length})
            </h3>

            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategoria('todos')}
                className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all border ${
                  selectedCategoria === 'todos'
                    ? 'bg-[#624A3E] text-white border-[#5d3a2e]'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.slug)}
                  className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all border ${
                    selectedCategoria === cat.slug
                      ? 'bg-[#624A3E] text-white border-[#5d3a2e]'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar platillo, vino o postre..."
                className="w-full min-h-11 text-sm pl-9 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30"
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full min-h-11 text-xs px-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#624A3E]/30 font-bold text-stone-605 cursor-pointer"
              >
                <option value="nombre">Ordenar por: Nombre (A-Z)</option>
                <option value="precio_asc">Ordenar por: Menor Precio ($)</option>
                <option value="precio_desc">Ordenar por: Mayor Precio ($)</option>
                <option value="margen_desc">Ordenar por: Mayor Margen (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {loading ? <div className="col-span-3"><CardSkeleton count={6} /></div> : filtered.map(item => {
              const isSelected = selectedDishId === item.id_producto;
              const itemBusy = pendingAction === `toggle_${item.id_producto}`
                || pendingAction === `edit_${item.id_producto}`
                || pendingAction === `duplicate_${item.id_producto}`
                || pendingAction === `delete_${item.id_producto}`;

              // Calculations for costs and margins
              const matchedRecipes = recetas.filter(r => r.id_producto === item.id_producto);
              const hasRecipe = matchedRecipes.length > 0;
              const recipeCost = hasRecipe ? calculateRecipeCost(matchedRecipes, insumos) : 0;
              const marginPct = hasRecipe ? calculateMarginPct(item, recipeCost) : null;
              const marginLevel = getMarginLevel(marginPct);

              return (
              <div
                key={item.id_producto}
                onClick={() => handleSelectDish(item)}
                className={`p-3 bg-white dark:bg-slate-800/40 border rounded-2xl flex flex-col justify-between gap-3 transition-all duration-300 hover:shadow-md cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-[#624A3E] border-[#624A3E] bg-[#624A3E]/5 shadow-md'
                    : !item.activo
                    ? 'border-rose-100 bg-rose-50/10 opacity-70'
                    : item.subcategoria === 'especialidad'
                    ? 'border-[#E8B800] bg-[#E8B800]/5 ring-1 ring-[#E8B800]/10 shadow-[0_0_12px_rgba(232,184,0,0.12)]'
                    : 'border-slate-200/65 dark:border-white/5 hover:border-stone-300'
                } ${itemBusy ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="flex gap-3">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    loading="lazy" decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-stone-100 border border-stone-200"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = getFallbackImage(item.categoria); }}
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black uppercase text-[#624A3E]">{item.categoria}</span>
                          {item.subcategoria === 'especialidad' && (
                            <span className="px-1.5 py-0.5 bg-[#E8B800] text-zinc-950 text-[7px] font-black uppercase rounded tracking-wider flex items-center gap-0.5 shadow-xs">
                              👑 Especialidad
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-1.5 py-0.5 bg-[#624A3E] text-white text-[7px] font-black uppercase rounded tracking-wider flex items-center gap-0.5 shadow-xs">
                              <Edit2 className="w-2 h-2" /> Editando
                            </span>
                          )}
                        </div>
                        {item.tiempo_preparacion_estimado && (
                          <span className="text-[8px] font-black text-stone-500 uppercase tracking-tight">⏱️ {item.tiempo_preparacion_estimado} min</span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-stone-900 tracking-tight leading-snug truncate" title={item.nombre}>{item.nombre}</h4>
                      {item.descripcion && (
                        <p className="text-[10px] sm:text-xs text-stone-500 leading-snug line-clamp-2 mt-0.5" title={item.descripcion}>
                          {item.descripcion}
                        </p>
                      )}

                      {/* Pizza Dough details if any */}
                      {item.consejo_emplatado && (
                        <div className="pt-0.5">
                          <p className="text-[9px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 p-1 px-1.5 rounded-lg inline-flex items-center gap-1 leading-none select-none">
                            <span>🌾 Masa:</span>
                            <span className="font-normal text-stone-600">{item.consejo_emplatado}</span>
                          </p>
                        </div>
                      )}

                      {/* Display allergen badges if any */}
                      {item.alergenos && item.alergenos.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {item.alergenos.map(alg => (
                            <span key={alg} className="px-1 py-0.5 bg-rose-50 border border-rose-100 rounded text-[7px] font-bold text-rose-600">
                              {ALLERGENS_LIST.find(x => x.id === alg)?.label || alg}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-black text-stone-850 font-mono tracking-tight">
                          ${item.precio_venta.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipe escandallo margin visual flags */}
                <div className={`mt-2 p-2 rounded-xl border flex items-center justify-between text-[9px] sm:text-[10px] font-bold ${
                  hasRecipe && marginPct !== null && marginPct < 45
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-stone-50 border-stone-200/60 text-stone-500'
                }`}>
                  {hasRecipe ? (
                    <>
                      <span className={marginPct !== null && marginPct < 45 ? 'text-rose-700 font-extrabold' : 'text-stone-500'}>
                        Costo: <strong className="font-mono">${recipeCost.toFixed(1)}</strong>
                      </span>
                      {marginPct !== null && (
                        <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-0.5 ${
                          marginPct < 45 ? 'bg-rose-600 text-white shadow-xs animate-pulse' :
                          marginLevel === 'high' ? 'bg-emerald-100 text-emerald-700' :
                          marginLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {marginPct < 45 && <AlertTriangle className="w-3 h-3 text-white shrink-0" />}
                          Margen {marginPct.toFixed(0)}% {marginPct < 45 && 'CRÍTICO'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Sin receta vinculada
                    </span>
                  )}
                </div>

                {/* BOTONES DE ACCION EN LA TARJETA */}
                <div 
                  className="flex items-center justify-between pt-2 border-t border-stone-200/40 mt-2 gap-1 flex-wrap" 
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectDish(item)}
                      disabled={isBusy}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#624A3E] text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                      title="Editar este plato"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDuplicateItem(item)}
                      disabled={isBusy}
                      className="text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors bg-stone-50 hover:bg-stone-100 text-stone-500 disabled:opacity-40 flex items-center gap-1"
                      title="Duplicar plato"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      disabled={isBusy}
                      className="text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-40 flex items-center gap-1"
                      title="Eliminar plato del menú"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[8.5px] font-bold ${item.activo ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {item.activo ? 'En carta' : 'Pausado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleToggleActivo(item.id_producto)}
                      disabled={isBusy}
                      className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-40 ${
                        item.activo
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {pendingAction === `toggle_${item.id_producto}` ? '...' : item.activo ? 'Retirar' : 'Habilitar'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default React.memo(MenuModule);
