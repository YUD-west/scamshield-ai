"""Risk simulation endpoint for hypothetical attack modeling."""

from fastapi import APIRouter, HTTPException, status
from app.core.logging import get_logger
from app.models.schemas import SimulationRequest, SimulationResponse
from app.services.risk_simulator import risk_simulator

router = APIRouter(prefix="/simulate", tags=["Risk Simulation"])
logger = get_logger("scamshield.api.simulate")


@router.post("/scenario", response_model=SimulationResponse, status_code=status.HTTP_200_OK)
def simulate_scenario(request: SimulationRequest) -> SimulationResponse:
    """Generate a safe, hypothetical attack scenario based on detected indicators or threat category.

    Explains the threat actor's probable progression stages, critical warning signs,
    concrete consequences, and strategic prevention gates.
    """
    try:
        logger.info(
            f"Simulating attack scenario: category={request.category or 'auto-inferred'}, "
            f"has_text={bool(request.observed_text)}, has_url={bool(request.domain_or_url)}"
        )
        scenario = risk_simulator.simulate(request)
        logger.info(f"Generated simulation scenario: {scenario.scenario_name}")
        return scenario
    except Exception as exc:
        logger.error(f"Scenario simulation error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while modeling the risk simulation scenario."
        )
