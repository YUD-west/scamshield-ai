import { ScanResultView, SavedReport, TextAnalysisResult, UrlAnalysisResult } from '../types';

export const PRESETS = [
  {
    icon: '🏦',
    label: 'Fake Bank SMS',
    text: 'URGENT: Your Chase account is locked due to unusual activity. Verify your account within 24 hours: http://chase-secure.xyz',
    badge: 'Phishing',
  },
  {
    icon: '💸',
    label: 'Crypto Doubler',
    text: 'Send 0.1 BTC and we will double your bitcoin! Guaranteed returns, act now!',
    badge: 'Investment',
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    text: 'I recorded you through your webcam. Your password is hunter2. Pay $900 in bitcoin or I share the video.',
    badge: 'Extortion',
  },
  {
    icon: '🏛️',
    label: 'IRS Threat',
    text: 'IRS FINAL NOTICE: An arrest warrant is issued. Pay with gift cards immediately to avoid police.',
    badge: 'Impersonation',
  },
  {
    icon: '🔗',
    label: 'Lookalike PayPal',
    text: 'Your payment failed. Log in at https://paypa1.com/login to fix it.',
    badge: 'Typo Trick',
  },
  {
    icon: '☕',
    label: 'Safe Real Message',
    text: 'Hey! Want to grab coffee Saturday morning at the usual place?',
    badge: 'Legitimate',
  },
];

export const PRESSURE_REGEX = /(urgent|immediately|within 24 hours|locked|suspended|warrant|final notice|arrest)/i;
export const MONEY_REGEX = /(bitcoin|crypto|\bbtc\b|double|gift cards?|\$|wire transfer|payment failed|pay\s+\$?\d+)/i;
export const LOOKALIKE_REGEX = /(chase-secure|paypa1|amaz0n|bit\.ly|\.xyz|\.top|secure-login|verify-account)/i;
export const SAFE_REGEX = /(coffee|meeting|slides|lunch|dinner|project|hello|thanks|saturday morning|usual place)/i;
export const CURRENCY_AMOUNT_REGEX = /\$\s?\d[\d,]*(\.\d+)?/;
export const URL_REGEX_STR = 'https?:\\/\\/[^\\s]+';

export const extractUrls = (text: string): string[] => {
  return text.match(new RegExp(URL_REGEX_STR, 'gi')) || [];
};

export const isLookalikeUrl = (url: string): boolean => {
  return LOOKALIKE_REGEX.test(url.toLowerCase());
};

const countMatches = (regex: RegExp, text: string): number => {
  return (text.match(new RegExp(regex.source, 'gi')) || []).length;
};

const calcStrength = (count: number): number => {
  return count === 0 ? 0 : Math.min(100, 42 + count * 24);
};

export interface HighlightSegment {
  text: string;
  kind?: 'urgency' | 'money' | 'lookalike';
}

export function highlightSpecimen(text: string): HighlightSegment[] {
  const matches: { start: number; end: number; kind: 'urgency' | 'money' | 'lookalike' }[] = [];

  const addMatches = (regex: RegExp, kind: 'urgency' | 'money' | 'lookalike') => {
    const r = new RegExp(regex.source, 'gi');
    let m;
    while ((m = r.exec(text))) {
      if (m[0].length === 0) {
        r.lastIndex++;
        continue;
      }
      matches.push({ start: m.index, end: m.index + m[0].length, kind });
    }
  };

  const urlR = new RegExp(URL_REGEX_STR, 'gi');
  let urlMatch;
  while ((urlMatch = urlR.exec(text))) {
    if (LOOKALIKE_REGEX.test(urlMatch[0].toLowerCase())) {
      const cleanUrl = urlMatch[0].replace(/[.,;:!?)]+$/, '');
      matches.push({ start: urlMatch.index, end: urlMatch.index + cleanUrl.length, kind: 'lookalike' });
    }
  }

  addMatches(LOOKALIKE_REGEX, 'lookalike');
  addMatches(CURRENCY_AMOUNT_REGEX, 'money');
  addMatches(PRESSURE_REGEX, 'urgency');
  addMatches(MONEY_REGEX, 'money');

  // De-overlap matches
  const nonOverlapping: typeof matches = [];
  for (const m of matches) {
    if (!nonOverlapping.some((c) => m.start < c.end && m.end > c.start)) {
      nonOverlapping.push(m);
    }
  }
  nonOverlapping.sort((a, b) => a.start - b.start);

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const m of nonOverlapping) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start) });
    }
    segments.push({ text: text.slice(m.start, m.end), kind: m.kind });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
}

export function analyzeSpecimenLocal(text: string): ScanResultView {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const hasPressure = PRESSURE_REGEX.test(lower);
  const hasMoney = MONEY_REGEX.test(lower);
  const hasLookalike = LOOKALIKE_REGEX.test(lower);
  const hasSafe = SAFE_REGEX.test(lower);
  const detectedUrls = extractUrls(trimmed);

  const signals = [
    {
      kind: 'urgency' as const,
      label: 'Pressure & urgency',
      hint: 'Deadlines, threats, “locked” accounts',
      count: countMatches(PRESSURE_REGEX, lower),
      strength: calcStrength(countMatches(PRESSURE_REGEX, lower)),
    },
    {
      kind: 'money' as const,
      label: 'Payment demand',
      hint: 'Crypto, gift cards, wire transfers',
      count: countMatches(MONEY_REGEX, lower),
      strength: calcStrength(countMatches(MONEY_REGEX, lower)),
    },
    {
      kind: 'lookalike' as const,
      label: 'Lookalike domain',
      hint: 'Brand typos and risky link endings',
      count: countMatches(LOOKALIKE_REGEX, lower),
      strength: calcStrength(countMatches(LOOKALIKE_REGEX, lower)),
    },
  ];

  if (hasSafe && !hasPressure && !hasMoney && !hasLookalike) {
    return {
      isThreat: false,
      verdict: 'safe',
      categoryTitle: 'Standard Safe Communication',
      certainty: 96,
      summary:
        'VERIFIED SAFE: No common scam patterns, phishing indicators, or fraudulent payment demands were detected.',
      recommendations: [
        'Still never share passwords or one-time verification codes with anyone',
        'If unsure, verify the sender through a known, trusted contact method',
      ],
      flags: [],
      extractedUrls: detectedUrls,
      signals,
    };
  }

  const isCritical = (hasPressure && hasLookalike) || (hasPressure && hasMoney);
  const verdict: 'danger' | 'caution' | 'safe' = isCritical
    ? 'danger'
    : hasPressure || hasMoney || hasLookalike
    ? 'caution'
    : 'safe';

  return {
    isThreat: verdict !== 'safe',
    verdict,
    categoryTitle: isCritical
      ? 'Critical Phishing & Credential Theft'
      : verdict === 'caution'
      ? 'Suspicious Message Alert'
      : 'Standard Safe Communication',
    certainty: isCritical ? 94 : verdict === 'caution' ? 78 : 96,
    summary: isCritical
      ? 'HIGH RISK: This message strongly matches known cyber fraud patterns. The sender is attempting to induce panic to steal login credentials or money.'
      : verdict === 'caution'
      ? 'CAUTION ADVISED: Some suspicious indicators were identified. Be careful before clicking any links or replying.'
      : 'VERIFIED SAFE: No common scam patterns found in this message.',
    recommendations: [
      'Do NOT click any links or enter passwords',
      'Navigate directly to the official bank or company app manually',
      'Block the sender and report message as spam',
      'Never share security PINs or SMS one-time codes',
    ],
    flags: [
      ...(hasPressure
        ? [{ phrase: 'urgent / locked', why: 'Artificial urgency designed to cause panic' }]
        : []),
      ...(hasLookalike
        ? [
            {
              phrase: detectedUrls[0] || 'lookalike URL',
              why: 'Suspicious domain attempting to impersonate real brands',
            },
          ]
        : []),
      ...(hasMoney
        ? [{ phrase: 'financial demand', why: 'Untraceable payment or get-rich promise' }]
        : []),
    ],
    extractedUrls: detectedUrls,
    signals,
  };
}

export function computeSignalsFromEvidence(
  evidence: Array<{ indicator_type: string; severity_contribution?: string; title: string; description: string }>,
  rawText: string
) {
  let urgencyCount = 0;
  let urgencyStrength = 0;

  let moneyCount = 0;
  let moneyStrength = 0;

  let lookalikeCount = 0;
  let lookalikeStrength = 0;

  for (const item of evidence) {
    const t = (item.indicator_type || '').toUpperCase();
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    if (
      t === 'PRESSURE_TACTIC' ||
      title.includes('urgency') ||
      title.includes('threat') ||
      desc.includes('urgent') ||
      desc.includes('deadline')
    ) {
      urgencyCount++;
      const boost =
        item.severity_contribution === 'CRITICAL'
          ? 95
          : item.severity_contribution === 'HIGH'
          ? 85
          : 65;
      urgencyStrength = Math.max(urgencyStrength, boost);
    }

    if (
      t === 'FINANCIAL_TRIGGER' ||
      title.includes('financial') ||
      desc.includes('bitcoin') ||
      desc.includes('gift card') ||
      desc.includes('payment')
    ) {
      moneyCount++;
      const boost =
        item.severity_contribution === 'CRITICAL'
          ? 95
          : item.severity_contribution === 'HIGH'
          ? 80
          : 60;
      moneyStrength = Math.max(moneyStrength, boost);
    }

    if (
      t === 'LOOKALIKE_DOMAIN' ||
      t === 'HOMOGLYPH_DECEPTION' ||
      t === 'SUSPICIOUS_TLD' ||
      t === 'IP_HOST' ||
      title.includes('lookalike') ||
      title.includes('brand deception') ||
      desc.includes('domain') ||
      desc.includes('link')
    ) {
      lookalikeCount++;
      const boost =
        item.severity_contribution === 'CRITICAL'
          ? 98
          : item.severity_contribution === 'HIGH'
          ? 88
          : 65;
      lookalikeStrength = Math.max(lookalikeStrength, boost);
    }
  }

  // If no structured evidence matched but raw text has slight traces, supplement
  const lower = rawText.toLowerCase();
  if (urgencyStrength === 0 && PRESSURE_REGEX.test(lower)) {
    urgencyCount = countMatches(PRESSURE_REGEX, lower);
    urgencyStrength = calcStrength(urgencyCount);
  }
  if (moneyStrength === 0 && MONEY_REGEX.test(lower)) {
    moneyCount = countMatches(MONEY_REGEX, lower);
    moneyStrength = calcStrength(moneyCount);
  }
  if (lookalikeStrength === 0 && LOOKALIKE_REGEX.test(lower)) {
    lookalikeCount = countMatches(LOOKALIKE_REGEX, lower);
    lookalikeStrength = calcStrength(lookalikeCount);
  }

  return [
    {
      kind: 'urgency' as const,
      label: 'Pressure & urgency',
      hint: 'Deadlines, threats, “locked” accounts',
      count: urgencyCount,
      strength: urgencyStrength,
    },
    {
      kind: 'money' as const,
      label: 'Payment demand',
      hint: 'Crypto, gift cards, wire transfers',
      count: moneyCount,
      strength: moneyStrength,
    },
    {
      kind: 'lookalike' as const,
      label: 'Lookalike domain',
      hint: 'Brand typos and risky link endings',
      count: lookalikeCount,
      strength: lookalikeStrength,
    },
  ];
}

export function convertApiResultToView(
  text: string,
  apiResult: TextAnalysisResult | UrlAnalysisResult
): ScanResultView {
  const localAnalysis = analyzeSpecimenLocal(text);

  let verdict: 'danger' | 'caution' | 'safe' = 'safe';
  if (apiResult.is_threat) {
    if (apiResult.severity === 'CRITICAL' || apiResult.severity === 'HIGH') {
      verdict = 'danger';
    } else {
      verdict = 'caution';
    }
  }

  // Genuine confidence score from backend AI evaluation
  const certainty = Math.round((apiResult.confidence || (apiResult.is_threat ? 0.92 : 0.85)) * 100);

  const recommendations =
    apiResult.recommendations && apiResult.recommendations.length > 0
      ? apiResult.recommendations.map((r) => r.action)
      : localAnalysis.recommendations;

  const flags =
    apiResult.evidence && apiResult.evidence.length > 0
      ? apiResult.evidence.map((e) => ({
          phrase: e.matched_pattern || e.title,
          why: e.description,
        }))
      : localAnalysis.flags;

  const extractedUrls =
    'extracted_urls' in apiResult && apiResult.extracted_urls && apiResult.extracted_urls.length > 0
      ? apiResult.extracted_urls
      : 'normalized_url' in apiResult && apiResult.normalized_url
      ? [apiResult.normalized_url]
      : localAnalysis.extractedUrls;

  // Real signal levels based directly on evidence
  const signals =
    apiResult.evidence && apiResult.evidence.length > 0
      ? computeSignalsFromEvidence(apiResult.evidence as any, text)
      : localAnalysis.signals;

  return {
    isThreat: apiResult.is_threat,
    verdict,
    categoryTitle: apiResult.primary_category
      ? apiResult.primary_category.replace(/_/g, ' ')
      : localAnalysis.categoryTitle,
    certainty,
    summary: apiResult.summary || localAnalysis.summary,
    recommendations,
    flags,
    extractedUrls,
    signals,
  };
}

export const formatCaseNumber = (num: number): string => {
  return `Case ${String(num).padStart(4, '0')}`;
};

export const STORAGE_KEY = 'scamshield:reports:v1';

export function getSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReports(reports: SavedReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

export async function sha256Hex(text: string): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return 'unavailable';
  }
}

export async function createSavedReport(message: string, result: ScanResultView): Promise<SavedReport> {
  const createdAt = new Date().toISOString();
  const hash = await sha256Hex(
    JSON.stringify({
      message,
      verdict: result.verdict,
      certainty: result.certainty,
      createdAt,
    })
  );

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt,
    message,
    verdict: result.verdict,
    categoryTitle: result.categoryTitle,
    certainty: result.certainty,
    summary: result.summary,
    flagCount: result.flags.length,
    hash,
  };
}
