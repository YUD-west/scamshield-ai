"""Incident recording, evidence preservation, and report export endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.endpoints.auth import get_current_user, UserResponse
from app.core.logging import get_logger
from app.models.schemas import IncidentCreateRequest, IncidentRecord, OfficialReportExport
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incident", tags=["Incident Response"])
logger = get_logger("scamshield.api.incident")


@router.post("/record", response_model=IncidentRecord, status_code=status.HTTP_201_CREATED)
def record_incident(
    request: IncidentCreateRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user)
) -> IncidentRecord:
    """Record an incident, lock evidence with SHA-256 digest, and store consent location context."""
    try:
        user_id = current_user.id if current_user else None
        logger.info(
            f"Recording incident: title='{request.title}', category={request.category.value}, "
            f"user_id={user_id}"
        )
        record = incident_service.record_incident(request, user_id=user_id)
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
def list_incident_vault(
    current_user: Optional[UserResponse] = Depends(get_current_user)
) -> List[IncidentRecord]:
    """Retrieve all preserved incident records in the user's local security vault."""
    user_id = current_user.id if current_user else None
    return incident_service.list_incidents(user_id=user_id)


@router.delete("/vault/clear", status_code=status.HTTP_200_OK)
def clear_incident_vault(
    current_user: Optional[UserResponse] = Depends(get_current_user)
):
    """Clear all preserved incident records from the vault."""
    user_id = current_user.id if current_user else None
    count = incident_service.clear_incidents(user_id=user_id)
    logger.info(f"Cleared {count} incidents from vault.")
    return {"success": True, "count": count, "message": f"Successfully cleared {count} incidents."}


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


@router.delete("/{incident_id}", status_code=status.HTTP_200_OK)
def delete_incident(
    incident_id: str,
    current_user: Optional[UserResponse] = Depends(get_current_user)
):
    """Delete a specific incident record from the vault."""
    user_id = current_user.id if current_user else None
    success = incident_service.delete_incident(incident_id, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found."
        )
    logger.info(f"Deleted incident with ID: {incident_id}")
    return {"success": True, "message": f"Incident '{incident_id}' successfully deleted."}


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
