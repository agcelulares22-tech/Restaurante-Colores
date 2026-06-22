import os
from supabase import create_client, Client

supabase_url = ""
supabase_key = ""

if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("VITE_SUPABASE_URL="):
                supabase_url = line.split("=")[1].strip().strip('"').strip("'")
            elif line.startswith("VITE_SUPABASE_ANON_KEY="):
                supabase_key = line.split("=")[1].strip().strip('"').strip("'")

if not supabase_url or not supabase_key:
    print("Credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

try:
    res = supabase.from_("categorias").select("*").execute()
    print("SUCCESS: table 'categorias' exists! Rows count:", len(res.data))
    for r in res.data:
        print(f"  - {r['nombre']} (slug: {r['slug']})")
except Exception as e:
    print("ERROR querying 'categorias':", e)

try:
    res2 = supabase.from_("productos_menu").select("id_producto, nombre, categoria").limit(5).execute()
    print("\nSample products from DB:")
    for p in res2.data:
        print(f"  - {p['nombre']} (categoria: {p['categoria']})")
except Exception as e:
    print("ERROR querying 'productos_menu':", e)
