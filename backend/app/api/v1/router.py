"""API v1 master router."""

from fastapi import APIRouter
from app.api.v1.endpoints import analyze, health, incident, multimedia, simulate

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(analyze.router)
api_router.include_router(simulate.router)
api_router.include_router(incident.router)
api_router.include_router(multimedia.router)
