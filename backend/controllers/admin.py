from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models import SessionLocal, Pedido

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.put("/api/admin/pedidos/{id_pedido}/confirmar-pago")
def confirmar_pago(id_pedido: str, db: Session = Depends(get_db)):
    # 1. Fetch order from db
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el pedido con ID '{id_pedido}'."
        )

    # 2. Update states
    pedido.estado_pago = True
    pedido.estado_pedido = "en_cocina"
    
    db.commit()
    db.refresh(pedido)

    return {
        "status": "success",
        "message": "Pago verificado. La comanda fue enviada a la cocina.",
        "pedido_id": pedido.id_pedido,
        "estado_pago": pedido.estado_pago,
        "estado_pedido": pedido.estado_pedido
    }
