"""Incident recording, evidence preservation, and report export endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from app.core.logging import get_logger
from app.models.schemas import IncidentCreateRequest, IncidentRecord, OfficialReportExport
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incident", tags=["Incident Response"])
logger = get_logger("scamshield.api.incident")


@router.post("/record", response_model=IncidentRecord, status_code=status.HTTP_201_CREATED)
def record_incident(request: IncidentCreateRequest) -> IncidentRecord:
    """Record an incident, lock evidence with SHA-256 digest, and store consent location context."""
    try:
        logger.info(
            f"Recording incident: title='{request.title}', category={request.category.value}, "
            f"has_consent_location={bool(request.consent_location)}"
        )
        record = incident_service.record_incident(request)
        logger.info(f"Incident recorded: ID={record.incident_id}, SHA256={record.evidence_sha256[:12]}...")
        return record
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        logger.error(f"Failed to record incident: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while preserving the incident record."
        )


@router.get("/vault", response_model=List[IncidentRecord], status_code=status.HTTP_200_OK)
def list_incident_vault() -> List[IncidentRecord]:
    """Retrieve all preserved incident records in the user's local security vault."""
    return incident_service.list_incidents()


@router.get("/{incident_id}", response_model=IncidentRecord, status_code=status.HTTP_200_OK)
def get_incident(incident_id: str) -> IncidentRecord:
    """Retrieve a specific incident record by its unique identifier."""
    record = incident_service.get_incident(incident_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found."
        )
    return record


@router.get("/{incident_id}/export", response_model=OfficialReportExport, status_code=status.HTTP_200_OK)
def export_incident_report(incident_id: str) -> OfficialReportExport:
    """Generate a standardized official dispute filing package (Markdown & JSON bundle)."""
    try:
        export_bundle = incident_service.export_report(incident_id)
        logger.info(f"Exported incident report docket: {export_bundle.docket_number}")
        return export_bundle
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found."
        )
    except Exception as exc:
        logger.error(f"Failed to export incident report: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while compiling the official dispute report."
        )
