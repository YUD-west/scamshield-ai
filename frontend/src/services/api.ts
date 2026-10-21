import {
  HealthResponse,
  IncidentCreateRequest,
  IncidentRecord,
  MultimediaInspectRequest,
  MultimediaInspectResult,
  OfficialReportExport,
  SimulationRequest,
  SimulationResponse,
  TextAnalysisRequest,
  TextAnalysisResult,
  UrlAnalysisRequest,
  UrlAnalysisResult,
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An error occurred while communicating with the analysis engine.';
    try {
      const data = await res.json();
      if (data.detail) {
        if (typeof data.detail === 'string') {
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorDetail = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
        }
      }
    } catch {
      // Use fallback
    }
    throw new ApiError(res.status, errorDetail);
  }
  return res.json();
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async analyzeText(payload: TextAnalysisRequest): Promise<TextAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<TextAnalysisResult>(res);
  },

  async analyzeUrl(payload: UrlAnalysisRequest): Promise<UrlAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<UrlAnalysisResult>(res);
  },

  async simulateScenario(payload: SimulationRequest): Promise<SimulationResponse> {
    const res = await fetch(`${API_BASE}/simulate/scenario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<SimulationResponse>(res);
  },

  async recordIncident(payload: IncidentCreateRequest): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incident/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<IncidentRecord>(res);
  },

  async listIncidents(): Promise<IncidentRecord[]> {
    const res = await fetch(`${API_BASE}/incident/vault`);
    return handleResponse<IncidentRecord[]>(res);
  },

  async getIncident(incidentId: string): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incident/${incidentId}`);
    return handleResponse<IncidentRecord>(res);
  },

  async exportIncidentReport(incidentId: string): Promise<OfficialReportExport> {
    const res = await fetch(`${API_BASE}/incident/${incidentId}/export`);
    return handleResponse<OfficialReportExport>(res);
  },

  async inspectMedia(payload: MultimediaInspectRequest): Promise<MultimediaInspectResult> {
    const res = await fetch(`${API_BASE}/media/inspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<MultimediaInspectResult>(res);
  },
};
