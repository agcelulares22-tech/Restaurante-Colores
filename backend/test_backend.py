from fastapi.testclient import TestClient
from backend.main import app
from backend.models import SessionLocal, Pedido, init_db

# Ensure tables are created for tests
init_db()

client = TestClient(app)

def test_get_carta():
    # Request the digital menu page
    response = client.get("/")
    assert response.status_code == 200
    assert "Pizzería Colores" in response.text
    assert "NUESTRAS PROMOS" in response.text
    assert "Pizzas Tradicionales" in response.text

def test_registrar_pedido_exito():
    # Seed data has been loaded by startup
    payload = {
        "cliente_nombre": "Enzo Fernández",
        "telefono": "3584123456",
        "modalidad": "delivery",
        "direccion": "Alvear 1362, Río Cuarto",
        "detalle_items": [
            {"id_producto": "pizza_comun_grande", "cantidad": 1},
            {"id_producto": "bebida_coca_cola_15", "cantidad": 2}
        ],
        "total": 28000.0  # $22,000 + 2 * $3,000
    }
    
    response = client.post("/api/pedidos/registrar", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "pedido_id" in data
    
    # Check states in database
    db = SessionLocal()
    pedido = db.query(Pedido).filter(Pedido.id_pedido == data["pedido_id"]).first()
    assert pedido is not None
    assert pedido.cliente_nombre == "Enzo Fernández"
    assert pedido.estado_pago is False
    assert pedido.estado_pedido == "pendiente"
    db.close()

def test_registrar_pedido_total_incorrecto():
    # Attempting to send a modified price (manipulation)
    payload = {
        "cliente_nombre": "Cliente Astuto",
        "telefono": "3584000000",
        "modalidad": "retiro",
        "detalle_items": [
            {"id_producto": "pizza_comun_grande", "cantidad": 1}
        ],
        "total": 1500.0  # Real price is $22,000
    }
    
    response = client.post("/api/pedidos/registrar", json=payload)
    assert response.status_code == 400
    assert "El total enviado" in response.json()["detail"]

def test_confirmar_pago_exito():
    # 1. Register a valid order
    payload = {
        "cliente_nombre": "Cliente Pago",
        "telefono": "3584111222",
        "modalidad": "retiro",
        "detalle_items": [
            {"id_producto": "bebida_patagonia_ipa_730", "cantidad": 2}
        ],
        "total": 9000.0  # 2 * $4,500
    }
    reg_response = client.post("/api/pedidos/registrar", json=payload)
    pedido_id = reg_response.json()["pedido_id"]
    
    # 2. Confirm payment
    confirm_response = client.put(f"/api/admin/pedidos/{pedido_id}/confirmar-pago")
    assert confirm_response.status_code == 200
    confirm_data = confirm_response.json()
    assert confirm_data["status"] == "success"
    assert confirm_data["estado_pago"] is True
    assert confirm_data["estado_pedido"] == "en_cocina"
    
    # 3. Assert values updated in DB
    db = SessionLocal()
    pedido = db.query(Pedido).filter(Pedido.id_pedido == pedido_id).first()
    assert pedido.estado_pago is True
    assert pedido.estado_pedido == "en_cocina"
    db.close()

def test_confirmar_pago_no_existente():
    response = client.put("/api/admin/pedidos/uuid-inexistente-1234/confirmar-pago")
    assert response.status_code == 404
    assert "No se encontró" in response.json()["detail"]
