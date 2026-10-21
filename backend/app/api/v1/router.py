"""API v1 master router."""

from fastapi import APIRouter
from app.api.v1.endpoints import analyze, health, simulate

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(analyze.router)
api_router.include_router(simulate.router)
