import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import init_db
from backend.controllers import catalogo, pedidos, admin, delivery

app = FastAPI(
    title="Pizzería Colores - Backend de Carta Digital & Pedidos",
    description="API robusta en Python para el catálogo interactivo, validación y confirmación de pedidos vía WhatsApp.",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include controllers
app.include_router(catalogo.router)
app.include_router(pedidos.router)
app.include_router(admin.router)
app.include_router(delivery.router)

@app.on_event("startup")
def startup_db():
    print("Inicializando base de datos SQLite y semillas...")
    init_db()

if __name__ == "__main__":
    print("Iniciando servidor de desarrollo en http://localhost:8000")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
