export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type ThreatCategory =
  | 'BENIGN'
  | 'PHISHING'
  | 'IMPERSONATION'
  | 'FINANCIAL_FRAUD'
  | 'COERCION_EXTORTION'
  | 'VIOLENT_THREAT'
  | 'CREDENTIAL_HARVESTING'
  | 'MALICIOUS_LINK'
  | 'SUSPICIOUS_URGENCY';

export type IndicatorType =
  | 'KEYWORD_PATTERN'
  | 'HOMOGLYPH_DECEPTION'
  | 'SUSPICIOUS_TLD'
  | 'IP_HOST'
  | 'HIGH_ENTROPY_URL'
  | 'PRESSURE_TACTIC'
  | 'FINANCIAL_TRIGGER'
  | 'AUTHORITY_CLAIM'
  | 'THREAT_LANGUAGE'
  | 'LOOKALIKE_DOMAIN';

export interface EvidenceItem {
  indicator_type: IndicatorType;
  title: string;
  description: string;
  matched_pattern?: string | null;
  severity_contribution: RiskSeverity;
}

export interface ProtectionRecommendation {
  priority: 'URGENT' | 'RECOMMENDED' | 'ADVISORY' | string;
  action: string;
  rationale: string;
}

export interface TextAnalysisRequest {
  content: string;
  sender_hint?: string;
  platform?: string;
}

export interface TextAnalysisResult {
  is_threat: boolean;
  primary_category: ThreatCategory;
  secondary_categories: ThreatCategory[];
  severity: RiskSeverity;
  confidence: number;
  summary: string;
  evidence: EvidenceItem[];
  recommendations: ProtectionRecommendation[];
  extracted_urls: string[];
  disclaimer: string;
  analyzed_at: string;
}

export interface UrlAnalysisRequest {
  url: string;
}

export interface UrlAnalysisResult {
  is_threat: boolean;
  original_input: string;
  normalized_url: string;
  domain: string;
  is_ip_address: boolean;
  has_homoglyphs: boolean;
  punycode_decoded?: string | null;
  is_suspicious_tld: boolean;
  shannon_entropy: number;
  severity: RiskSeverity;
  confidence: number;
  primary_category: ThreatCategory;
  summary: string;
  evidence: EvidenceItem[];
  recommendations: ProtectionRecommendation[];
  threat_intel_match: boolean;
  threat_intel_source?: string | null;
  disclaimer: string;
  analyzed_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  analyzers_ready: boolean;
  active_services: string[];
  timestamp: string;
}

// --- Simulation Types ---

export interface AttackStage {
  stage_number: number;
  title: string;
  attacker_objective: string;
  realistic_action: string;
  warning_signs: string[];
  prevention_gate: string;
}

export interface SimulationRequest {
  category?: ThreatCategory;
  observed_text?: string;
  domain_or_url?: string;
}

export interface SimulationResponse {
  scenario_name: string;
  threat_category: ThreatCategory;
  attack_vector: string;
  hypothetical_progression: AttackStage[];
  potential_consequences: string[];
  critical_warning_signs: string[];
  recommended_prevention_gates: string[];
  safety_disclaimer: string;
  simulated_at: string;
}

// --- Incident Response & Vault Types ---

export interface ConsentLocation {
  user_consent_granted: boolean;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  captured_at?: string;
}

export interface IncidentCreateRequest {
  title: string;
  category: ThreatCategory;
  severity: RiskSeverity;
  description: string;
  raw_evidence: string;
  sender_information?: string | null;
  consent_location?: ConsentLocation | null;
  financial_loss_amount?: number | null;
}

export interface IncidentRecord {
  incident_id: string;
  title: string;
  category: ThreatCategory;
  severity: RiskSeverity;
  description: string;
  raw_evidence: string;
  evidence_sha256: string;
  sender_information?: string | null;
  consent_location?: ConsentLocation | null;
  financial_loss_amount?: number | null;
  status: string;
  created_at: string;
}

export interface OfficialReportExport {
  incident_id: string;
  docket_number: string;
  markdown_report: string;
  json_bundle: any;
  verification_signature: string;
  transmission_status: string;
}

// --- Multimedia Types ---

export interface MultimediaInspectRequest {
  filename: string;
  content_base64: string;
  mime_type: string;
}

export interface MultimediaInspectResult {
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_checksum: string;
  extracted_text?: string | null;
  extracted_urls: string[];
  threat_assessment?: TextAnalysisResult | null;
  integration_status: string;
  is_suspicious_extension: boolean;
  disclaimer: string;
}
