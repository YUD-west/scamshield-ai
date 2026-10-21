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
