import os
import requests
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Configuration and base rates (Argentine Pesos ARS)
TARIFA_BASE = 1000.0       # Initial flat base fee
COSTO_POR_KM = 500.0       # Fee per kilometer traveled

# Restaurant coordinates (Pizzería Colores - Río Cuarto)
ORIGEN_LAT = -33.123284
ORIGEN_LNG = -64.349123
ORIGEN_DIRECCION = "Colores Pizzería (Alvear 1362, Río Cuarto)"

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
    route_geojson: dict

@router.post("/api/delivery/quote", response_model=QuoteResponse)
def get_delivery_quote(request: QuoteRequest):
    if not request.address.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La dirección no puede estar vacía."
        )

    t_base = request.tarifa_base if request.tarifa_base is not None else TARIFA_BASE
    c_km = request.costo_por_km if request.costo_por_km is not None else COSTO_POR_KM
    r_pct = request.recargo_porcentaje if request.recargo_porcentaje is not None else 20.0

    # 1. Geocode destination address using OpenStreetMap Nominatim
    search_query = request.address
    if "río cuarto" not in search_query.lower() and "rio cuarto" not in search_query.lower():
         search_query += ", Río Cuarto, Córdoba, Argentina"
    else:
         search_query += ", Argentina"

    headers = {"User-Agent": "PizzeriColoresDeliveryCalculator/1.0"}
    nominatim_url = f"https://nominatim.openstreetmap.org/search?q={search_query}&format=json&limit=1"
    
    try:
        geo_response = requests.get(nominatim_url, headers=headers, timeout=10)
        geo_data = geo_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail=f"Error al conectar con el geocodificador Nominatim: {str(e)}"
        )

    if not geo_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No se pudo encontrar la dirección de destino especificada en Río Cuarto."
        )

    dest_lat = float(geo_data[0]["lat"])
    dest_lng = float(geo_data[0]["lon"])
    dest_display_name = geo_data[0]["display_name"]

    # 2. Calculate street route using OSRM
    osrm_url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{ORIGEN_LNG},{ORIGEN_LAT};{dest_lng},{dest_lat}"
        f"?overview=full&geometries=geojson"
    )

    try:
        route_response = requests.get(osrm_url, timeout=10)
        route_data = route_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail=f"Error al conectar con la API de rutas OSRM: {str(e)}"
        )

    if "routes" not in route_data or not route_data["routes"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No se pudo calcular una ruta de conducción válida hasta el destino."
        )

    route = route_data["routes"][0]
    distance_meters = route["distance"]
    duration_seconds = route["duration"]
    route_geojson = route["geometry"]

    distancia_km = round(distance_meters / 1000.0, 2)
    duracion_min = round(duration_seconds / 60.0, 1)

    # 3. Apply business rules for pricing (e.g. 1.2x multiplier during dinner peak hours 20:00 - 23:59)
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
