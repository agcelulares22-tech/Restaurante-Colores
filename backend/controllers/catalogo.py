import os
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from backend.models import SessionLocal, Producto

router = APIRouter()

# Resolve templates folder relative to backend path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates_path = os.path.join(current_dir, "templates")
templates = Jinja2Templates(directory=templates_path)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_class=HTMLResponse)
def get_carta(request: Request, db: Session = Depends(get_db)):
    productos = db.query(Producto).filter(Producto.activo == True).all()
    
    # Group products by category matching user definitions
    categorias = {
        "NUESTRAS PROMOS": [],
        "Pizzas Tradicionales": [],
        "Bebidas": []
    }
    
    for p in productos:
        if p.categoria == "promos":
            categorias["NUESTRAS PROMOS"].append(p)
        elif p.categoria == "tradicionales":
            categorias["Pizzas Tradicionales"].append(p)
        elif p.categoria == "bebidas":
            categorias["Bebidas"].append(p)
            
    # Filter out empty categories
    categorias = {k: v for k, v in categorias.items() if len(v) > 0}
            
    return templates.TemplateResponse(request, "index.html", {"categorias": categorias})
