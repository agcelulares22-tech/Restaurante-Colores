# El Patrón - Sistema Gestor Gastronómico

Aplicación web para administrar la operación diaria de un restaurante: menú principal, mesas, comandas, cocina, caja, inventario, recetas por escandallo, proveedores, promociones, reservas, facturación, tickets PDF, backups y sincronización opcional con Supabase.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- Supabase JS para persistencia remota opcional
- jsPDF para comprobantes descargables
- Datos iniciales locales para modo demo/offline

## Requisitos

- Node.js 22 (la misma versión fijada para Vercel)
- Proyecto Supabase opcional si se quiere sincronizar datos en la nube

## Instalación

```bash
npm install
```

## Configuración

La app puede ejecutarse sin Supabase usando los datos locales de demostración en desarrollo. En Vercel Production, el build exige variables de Supabase explícitas para evitar desplegar contra una base equivocada.

Para conectar Supabase:

1. Copiar `.env.example` a `.env.local`.
2. Completar:

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
VITE_ENABLE_DEMO_LOGIN="false"
```

3. Ejecutar la migración SQL ubicada en `supabase/migrations/20260612000000_create_schema.sql`.
4. Abrir el módulo `Sistema` dentro de la app para probar conexión, sembrar datos o descargar datos remotos.

## Desarrollo

```bash
npm run dev
```

La app levanta en:

```text
http://localhost:3000
```

Credenciales demo:

```text
Usuario: sistema
Contraseña: restaurante
```

Estas credenciales deben configurarse en `.env.local` mediante `VITE_DEMO_USER` y
`VITE_DEMO_PASSWORD`. El repositorio no incluye contraseñas operativas.

Para comprobar la conectividad de todas las tablas sin modificar registros:

```bash
npx tsx scripts/diagnose_supabase_tables.ts
```

## Preparación de producción

1. Crear las cuentas del personal en Supabase Auth.
2. Asegurar que el email del primer superadmin coincida con `usuarios.username`.
3. Ejecutar `supabase/SECURITY_HARDENING.sql`. El script usa una transacción y
   aborta sin cambios si no encuentra un superadmin correctamente vinculado.
4. Configurar en Vercel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y
   `VITE_ENABLE_DEMO_LOGIN=false`.
5. Ejecutar `npm run verify` antes de publicar.

## Verificación

```bash
npm run lint
npm test
npm run check:deploy-config
npm run build
```

`npm run check:deploy-config` bloquea únicamente despliegues de Vercel Production con configuración insegura. En desarrollo local muestra un warning si el login demo está activo, pero no corta el flujo.

## Hooks locales

Para correr chequeos antes de cada `git push`:

```bash
npm run hooks:install
```

El hook ejecuta:

```bash
npm run prepush
```

Esto valida TypeScript, el guard JSX de `RecetasModule.tsx` y el build local antes de consumir tiempo de CI/CD.

## Limpieza

```bash
npm run clean
```

## Módulos

- Menú principal operativo
- Mozo / Salón
- Cocina
- Caja y cierres
- Facturación y PDF
- Menú y carta
- Recetas / escandallos
- Inventario y movimientos
- Mesas
- Reservas
- Proveedores
- Promociones
- Reportes / BI
- Sistema y Supabase
- Backups

## Notas de seguridad

- Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` por separado en Production, Preview y Development.
- Configurar `VITE_DEMO_USER` y `VITE_DEMO_PASSWORD` en Vercel mientras el acceso demo esté habilitado.
- Desactivar el acceso demo con `VITE_ENABLE_DEMO_LOGIN=false` cuando Supabase Auth esté operativo.
- El build de Vercel falla en Production si faltan variables Supabase o si `VITE_ENABLE_DEMO_LOGIN` no está en `false`.
- Si Vercel muestra el error de configuración de Production, corregir las variables en Project Settings > Environment Variables y redistribuir el último commit.
- Las migraciones base conservan políticas abiertas para desarrollo/demo. Antes de publicar, ejecutar `supabase/SECURITY_HARDENING.sql` para exigir Supabase Auth y eliminar contraseñas heredadas.
