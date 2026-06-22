import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(
    title="Pizzería Colores - Delivery Budget & Routing API",
    description="Backend en Python para calcular presupuestos de envíos basados en rutas reales de OSRM y OpenStreetMap.",
    version="1.0.0"
)

# Enable CORS so the Vite React frontend can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de tarifas (Modificable)
TARIFA_BASE = 1000.0       # Costo fijo inicial en pesos (ARS)
COSTO_POR_KM = 500.0       # Costo por kilómetro recorrido en pesos (ARS)

# Ubicación de origen por defecto: Centro de Buenos Aires (Pizzería Colores)
# Coordenadas aproximadas de la pizzería
ORIGEN_LAT = -34.6037
ORIGEN_LNG = -58.3816
ORIGEN_DIRECCION = "Colores Pizzería (Centro)"

class QuoteRequest(BaseModel):
    address: str
    tarifa_base: float | None = None
    costo_por_km: float | None = None
    recargo_porcentaje: float | None = None

class QuoteResponse(BaseModel):
    origen: str
    origen_coords: list[float]  # [lat, lng]
    destino: str
    destino_coords: list[float]  # [lat, lng]
    distancia_km: float
    duracion_minutos: float
    tarifa_base: float
    tarifa_distancia: float
    recargo_horario: float
    total: float
    route_geojson: dict  # Para dibujar la línea en Leaflet

@app.post("/api/delivery/quote", response_model=QuoteResponse)
def get_delivery_quote(request: QuoteRequest):
    if not request.address.strip():
        raise HTTPException(status_code=400, detail="La dirección no puede estar vacía.")

    # Usar valores del request o los por defecto
    t_base = request.tarifa_base if request.tarifa_base is not None else TARIFA_BASE
    c_km = request.costo_por_km if request.costo_por_km is not None else COSTO_POR_KM
    r_pct = request.recargo_porcentaje if request.recargo_porcentaje is not None else 20.0

    # 1. Geocodificar dirección de destino usando OpenStreetMap Nominatim
    # Agregamos "Buenos Aires, Argentina" para acotar búsquedas locales si es necesario
    search_query = request.address
    if "argentina" not in search_query.lower():
         search_query += ", Buenos Aires, Argentina"

    headers = {"User-Agent": "PizzeriColoresDeliveryCalculator/1.0"}
    nominatim_url = f"https://nominatim.openstreetmap.org/search?q={search_query}&format=json&limit=1"
    
    try:
        geo_response = requests.get(nominatim_url, headers=headers, timeout=10)
        geo_data = geo_response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al conectar con el geocodificador Nominatim: {str(e)}")

    if not geo_data:
        raise HTTPException(status_code=404, detail="No se pudo encontrar la dirección de destino especificada.")

    dest_lat = float(geo_data[0]["lat"])
    dest_lng = float(geo_data[0]["lon"])
    dest_display_name = geo_data[0]["display_name"]

    # 2. Calcular la ruta por calles terrestres usando OSRM
    # OSRM espera coordenadas en formato: {lng_origen},{lat_origen};{lng_destino},{lat_destino}
    osrm_url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{ORIGEN_LNG},{ORIGEN_LAT};{dest_lng},{dest_lat}"
        f"?overview=full&geometries=geojson"
    )

    try:
        route_response = requests.get(osrm_url, timeout=10)
        route_data = route_response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al conectar con la API de rutas OSRM: {str(e)}")

    if "routes" not in route_data or not route_data["routes"]:
        raise HTTPException(status_code=404, detail="No se pudo calcular una ruta de conducción válida hasta el destino.")

    route = route_data["routes"][0]
    distance_meters = route["distance"]
    duration_seconds = route["duration"]
    route_geojson = route["geometry"]

    distancia_km = round(distance_meters / 1000.0, 2)
    duracion_min = round(duration_seconds / 60.0, 1)

    # 3. Reglas de negocio para presupuesto
    # Recargo de hora pico/nocturno: 1.2x si es hora de cena (20:00 - 24:00)
    from datetime import datetime
    current_hour = datetime.now().hour
    es_hora_pico = 20 <= current_hour <= 23

    tarifa_distancia = round(distancia_km * c_km, 2)
    total_parcial = t_base + tarifa_distancia
    
    recargo = 0.0
    if es_hora_pico:
        recargo = round(total_parcial * (r_pct / 100.0), 2)
    
    total = round(total_parcial + recargo, 2)

    return QuoteResponse(
        origen=ORIGEN_DIRECCION,
        origen_coords=[ORIGEN_LAT, ORIGEN_LNG],
        destino=dest_display_name,
        destino_coords=[dest_lat, dest_lng],
        distancia_km=distancia_km,
        duracion_minutos=duracion_min,
        tarifa_base=t_base,
        tarifa_distancia=tarifa_distancia,
        recargo_horario=recargo,
        total=total,
        route_geojson=route_geojson
    )

if __name__ == "__main__":
    print("Iniciando API del estimador de delivery en http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
