import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./colores.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    precio = Column(Float, nullable=False)
    categoria = Column(String, nullable=False) # 'promos', 'tradicionales', 'bebidas'
    activo = Column(Boolean, default=True)
    url_imagen = Column(String, nullable=True)

class Pedido(Base):
    __tablename__ = "pedidos"

    id_pedido = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    cliente_nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    modalidad = Column(String, nullable=False) # 'delivery' o 'retiro'
    direccion = Column(String, nullable=True)
    detalle_items = Column(Text, nullable=False) # JSON string of items ordered
    total = Column(Float, nullable=False)
    estado_pago = Column(Boolean, default=False)
    estado_pedido = Column(String, default="pendiente") # 'pendiente', 'en_cocina', 'listo', 'en_camino'
    fecha_hora = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed initial products if none exist
        if db.query(Producto).count() == 0:
            seed_productos = [
                # Promociones
                Producto(
                    id_producto="promo_combo_familiar",
                    nombre="Promo Combo Familiar",
                    descripcion="2 Pizzas Grandes de Muzzarella + 1 Gaseosa de 1.5L a elección.",
                    precio=28000.0,
                    categoria="promos",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80"
                ),
                Producto(
                    id_producto="promo_individual",
                    nombre="Promo Combo Individual",
                    descripcion="1 Pizza Individual a elección + 1 Cerveza en lata de 473ml.",
                    precio=14000.0,
                    categoria="promos",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1536680465769-2365207b035e?w=400&q=80"
                ),
                # Pizzas Tradicionales
                Producto(
                    id_producto="pizza_comun_grande",
                    nombre="Pizza Común Grande",
                    descripcion="Salsa de tomate casera, queso muzzarella y aceitunas verdes.",
                    precio=22000.0,
                    categoria="tradicionales",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80"
                ),
                Producto(
                    id_producto="pizza_5_quesos_grande",
                    nombre="Pizza 5 Quesos Grande",
                    descripcion="Mezcla especial de muzzarella, provolone, queso azul, parmesano y reggianito.",
                    precio=25000.0,
                    categoria="tradicionales",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80"
                ),
                Producto(
                    id_producto="pizza_pepperoni_grande",
                    nombre="Pizza Pepperoni Grande",
                    descripcion="Salsa de tomate, muzzarella y abundantes rodajas de salame cantimpalo crocante.",
                    precio=26000.0,
                    categoria="tradicionales",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80"
                ),
                # Bebidas
                Producto(
                    id_producto="bebida_coca_cola_15",
                    nombre="Coca-Cola 1.5L",
                    descripcion="Gaseosa Coca-Cola sabor original de 1.5 litros descartable.",
                    precio=3000.0,
                    categoria="bebidas",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80"
                ),
                Producto(
                    id_producto="bebida_patagonia_ipa_730",
                    nombre="Cerveza Patagonia IPA 730ml",
                    descripcion="Cerveza Patagonia 24.7 Session IPA en botella de 730ml.",
                    precio=4500.0,
                    categoria="bebidas",
                    activo=True,
                    url_imagen="https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80"
                )
            ]
            db.add_all(seed_productos)
            db.commit()
            print("Base de datos inicializada con productos semilla con éxito.")
    finally:
        db.close()
