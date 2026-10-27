import {
  AuthTokenResponse,
  HealthResponse,
  IncidentCreateRequest,
  IncidentRecord,
  LoginRequest,
  MultimediaInspectRequest,
  MultimediaInspectResult,
  OfficialReportExport,
  RegisterRequest,
  SimulationRequest,
  SimulationResponse,
  TextAnalysisRequest,
  TextAnalysisResult,
  UrlAnalysisRequest,
  UrlAnalysisResult,
  User,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '') + '/api/v1';
const TOKEN_STORAGE_KEY = 'scamshield:auth_token:v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {}
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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
  getStoredToken,
  setStoredToken,
  clearStoredToken,

  // --- Auth & Account Methods ---

  async register(payload: RegisterRequest): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthTokenResponse>(res);
    setStoredToken(data.token);
    return data;
  },

  async login(payload: LoginRequest): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthTokenResponse>(res);
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<User>(res);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } finally {
      clearStoredToken();
    }
  },

  // --- Threat Analysis & Operations ---

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async analyzeText(payload: TextAnalysisRequest): Promise<TextAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/text`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TextAnalysisResult>(res);
  },

  async analyzeUrl(payload: UrlAnalysisRequest): Promise<UrlAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/url`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<UrlAnalysisResult>(res);
  },

  async simulateScenario(payload: SimulationRequest): Promise<SimulationResponse> {
    const res = await fetch(`${API_BASE}/simulate/scenario`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<SimulationResponse>(res);
  },

  async recordIncident(payload: IncidentCreateRequest): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incident/record`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<IncidentRecord>(res);
  },

  async listIncidents(): Promise<IncidentRecord[]> {
    const res = await fetch(`${API_BASE}/incident/vault`, {
      headers: getHeaders(),
    });
    return handleResponse<IncidentRecord[]>(res);
  },

  async getIncident(incidentId: string): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incident/${incidentId}`, {
      headers: getHeaders(),
    });
    return handleResponse<IncidentRecord>(res);
  },

  async deleteIncident(incidentId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/incident/${incidentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async clearIncidentVault(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch(`${API_BASE}/incident/vault/clear`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; count: number; message: string }>(res);
  },

  async exportIncidentReport(incidentId: string): Promise<OfficialReportExport> {
    const res = await fetch(`${API_BASE}/incident/${incidentId}/export`, {
      headers: getHeaders(),
    });
    return handleResponse<OfficialReportExport>(res);
  },

  async inspectMedia(payload: MultimediaInspectRequest): Promise<MultimediaInspectResult> {
    const res = await fetch(`${API_BASE}/media/inspect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<MultimediaInspectResult>(res);
  },
};
