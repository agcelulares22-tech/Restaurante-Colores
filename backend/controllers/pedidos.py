import json
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.models import SessionLocal, Pedido, Producto

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas for request validation
class ItemPedidoSchema(BaseModel):
    id_producto: str
    cantidad: int = Field(..., gt=0, description="La cantidad del producto debe ser mayor a cero")

class PedidoCreateSchema(BaseModel):
    cliente_nombre: str = Field(..., min_length=2, max_length=100)
    telefono: str = Field(..., min_length=5, max_length=55)
    modalidad: Literal['delivery', 'retiro']
    direccion: str | None = None
    detalle_items: list[ItemPedidoSchema]
    total: float = Field(..., ge=0)

@router.post("/api/pedidos/registrar")
def registrar_pedido(pedido_in: PedidoCreateSchema, db: Session = Depends(get_db)):
    # 1. Validate that the order has items
    if not pedido_in.detalle_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pedido debe contener al menos un producto."
        )

    # 2. Recalculate price total to prevent client-side price manipulation
    recalculated_total = 0.0
    items_summary = []

    for item in pedido_in.detalle_items:
        prod = db.query(Producto).filter(Producto.id_producto == item.id_producto, Producto.activo == True).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto con ID '{item.id_producto}' no existe o no se encuentra activo."
            )
        
        item_cost = prod.precio * item.cantidad
        recalculated_total += item_cost
        items_summary.append({
            "id_producto": prod.id_producto,
            "nombre": prod.nombre,
            "cantidad": item.cantidad,
            "precio_unitario": prod.precio,
            "subtotal": item_cost
        })

    # 3. Verify total matches recalculated sum (allow small float margin)
    if abs(recalculated_total - pedido_in.total) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El total enviado (${pedido_in.total}) no coincide con los precios actuales de la carta (${recalculated_total})."
        )

    # 4. Create and save Pedido
    new_pedido = Pedido(
        cliente_nombre=pedido_in.cliente_nombre,
        telefono=pedido_in.telefono,
        modalidad=pedido_in.modalidad,
        direccion=pedido_in.direccion if pedido_in.modalidad == 'delivery' else None,
        detalle_items=json.dumps(items_summary, ensure_ascii=False),
        total=recalculated_total,
        estado_pago=False,
        estado_pedido="pendiente"
    )

    db.add(new_pedido)
    db.commit()
    db.refresh(new_pedido)

    return {
        "status": "success",
        "pedido_id": new_pedido.id_pedido
    }
