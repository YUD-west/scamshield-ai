"""Threat intelligence interface and boundary for external feed lookups.

Abstracts external intelligence (Google Safe Browsing, VirusTotal, PhishTank)
to ensure testability, graceful degradation when offline, and no fake detection claims.
"""

from abc import ABC, abstractmethod
from typing import Optional, Tuple


class ThreatIntelProvider(ABC):
    @abstractmethod
    def lookup_domain(self, domain: str) -> Tuple[bool, Optional[str]]:
        """Check domain against threat intelligence records.

        Returns (is_known_malicious, source_attribution_or_reason).
        """
        pass

    @abstractmethod
    def lookup_url(self, url: str) -> Tuple[bool, Optional[str]]:
        """Check specific URL against threat intelligence records."""
        pass


class MockThreatIntelProvider(ThreatIntelProvider):
    """Local, auditable threat intelligence mock provider for testing and offline environments.

    Populated with representative test signatures.
    """

    KNOWN_MALICIOUS_DOMAINS = {
        "evil-phish-bank.com": "Known Phishing Campaign DB (Ref #7741)",
        "paypal-account-recovery-center.xyz": "Active Credential Harvester (Ref #8812)",
        "verify-appleid-support.live": "Observed Apple ID Impersonation (Ref #9923)",
        "free-crypto-doubler-giveaway.top": "Cryptocurrency Investment Scam Cluster (Ref #4102)"
    }

    def lookup_domain(self, domain: str) -> Tuple[bool, Optional[str]]:
        clean = domain.lower().strip()
        if clean in self.KNOWN_MALICIOUS_DOMAINS:
            return True, self.KNOWN_MALICIOUS_DOMAINS[clean]
        return False, None

    def lookup_url(self, url: str) -> Tuple[bool, Optional[str]]:
        for domain, reason in self.KNOWN_MALICIOUS_DOMAINS.items():
            if domain in url.lower():
                return True, reason
        return False, None


# Default instance
threat_intel_service: ThreatIntelProvider = MockThreatIntelProvider()
