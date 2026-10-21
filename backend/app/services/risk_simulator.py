"""Safe hypothetical attack scenario simulator for ScamShield AI.

Generates structured progression stages, warning signs, consequence models,
and defensive prevention gates. Never executes offensive actions or claims
to predict the future with absolute certainty.
"""

from typing import List, Optional
from app.models.schemas import AttackStage, SimulationRequest, SimulationResponse
from app.models.threat_types import ThreatCategory


class RiskSimulator:
    """Models realistic social engineering and cyber attack progressions for defensive awareness."""

    def simulate(self, request: SimulationRequest) -> SimulationResponse:
        # Determine category from request or infer from text/URL
        category = request.category or self._infer_category(request.observed_text, request.domain_or_url)

        if category == ThreatCategory.PHISHING or category == ThreatCategory.CREDENTIAL_HARVESTING:
            return self._model_phishing_scenario(request)
        elif category == ThreatCategory.FINANCIAL_FRAUD:
            return self._model_financial_fraud_scenario(request)
        elif category == ThreatCategory.COERCION_EXTORTION:
            return self._model_extortion_scenario(request)
        elif category == ThreatCategory.IMPERSONATION:
            return self._model_impersonation_scenario(request)
        elif category == ThreatCategory.VIOLENT_THREAT:
            return self._model_violent_threat_scenario(request)
        else:
            return self._model_generic_social_engineering_scenario(request)

    def _infer_category(self, text: Optional[str], url: Optional[str]) -> ThreatCategory:
        if not text and not url:
            return ThreatCategory.PHISHING

        combined = f"{text or ''} {url or ''}".lower()
        if any(w in combined for w in ["kill", "murder", "kidnap", "hostage"]):
            return ThreatCategory.VIOLENT_THREAT
        if any(w in combined for w in ["webcam", "recorded you", "leak", "dirty video", "blackmail"]):
            return ThreatCategory.COERCION_EXTORTION
        if any(w in combined for w in ["invest", "bitcoin doubler", "guaranteed returns", "lottery", "gift card"]):
            return ThreatCategory.FINANCIAL_FRAUD
        if any(w in combined for w in ["irs", "fbi", "police", "arrest warrant", "law enforcement"]):
            return ThreatCategory.IMPERSONATION
        return ThreatCategory.PHISHING

    def _model_phishing_scenario(self, request: SimulationRequest) -> SimulationResponse:
        domain = request.domain_or_url or "suspicious-portal-verify.net"
        stages = [
            AttackStage(
                stage_number=1,
                title="Stage 1: Deceptive Urgent Lure",
                attacker_objective="Induce panic or artificial urgency so the target bypasses deliberate skepticism.",
                realistic_action="Attacker transmits an SMS, email, or chat notice warning that an account is locked or about to be deleted.",
                warning_signs=[
                    "Generic greetings or unsolicited security warnings",
                    "Artificial deadlines ('Act within 24 hours or lose access')",
                    "Unverified sender domain",
                ],
                prevention_gate="Out-of-band verification: Check the account directly in the official app or official bookmark without clicking the link."
            ),
            AttackStage(
                stage_number=2,
                title="Stage 2: Lookalike Credential Harvesting Portal",
                attacker_objective="Trick the user into submitting primary login credentials on a spoofed domain.",
                realistic_action=f"Target clicks through to '{domain}', which visually clones the legitimate brand login page.",
                warning_signs=[
                    "Discrepancies in the URL bar (unexpected TLD, typos, or homoglyphs)",
                    "Browser warning flags or missing EV certificate metadata",
                    "Immediate demand for password re-entry",
                ],
                prevention_gate="Domain inspection & Password Managers: A reputable password manager will refuse to autofill credentials on unverified domains."
            ),
            AttackStage(
                stage_number=3,
                title="Stage 3: Real-Time 2FA / Session Interception",
                attacker_objective="Bypass multi-factor authentication by relaying the user's OTP to the genuine service in real time.",
                realistic_action="The fake portal prompts for a one-time SMS verification code and immediately enters it into the legitimate portal.",
                warning_signs=[
                    "SMS OTP arrived with text saying 'Use this to authorize password reset' instead of login",
                    "Multiple OTP requests in rapid succession",
                ],
                prevention_gate="FIDO2 / WebAuthn Hardware Keys: Hardware security keys cryptographically bind authentication to the origin URL, defeating phishing proxies."
            ),
            AttackStage(
                stage_number=4,
                title="Stage 4: Account Takeover & Secondary Exploitation",
                attacker_objective="Lock out the genuine owner, change recovery emails/phone numbers, and exploit stored payment methods.",
                realistic_action="Attacker establishes persistence, drains wallet/stored balances, and messages friends/contacts for emergency loans.",
                warning_signs=[
                    "Sudden logout from authenticated mobile apps",
                    "Email notifications regarding changed recovery information",
                ],
                prevention_gate="Immediate Account Freeze: Promptly contact provider fraud prevention to initiate an emergency security hold on the account."
            ),
        ]

        return SimulationResponse(
            scenario_name="Adversary-in-the-Middle (AiTM) Credential Phishing Attack",
            threat_category=ThreatCategory.PHISHING,
            attack_vector="Deceptive SMS/Email Link leading to Reverse-Proxy Credential Harvesting",
            hypothetical_progression=stages,
            potential_consequences=[
                "Complete loss of primary account access and cloud storage contents",
                "Unauthorized financial transactions via linked payment methods",
                "Secondary spear-phishing targeting friends, family, and colleagues from your genuine handle",
                "Exposure of private messages, identity documents, and sensitive correspondence"
            ],
            critical_warning_signs=[
                "Messages requesting urgent action to prevent account termination",
                "Demands to share or re-enter one-time verification passcodes (OTPs)",
                "URL hostnames that slightly differ from standard provider domains"
            ],
            recommended_prevention_gates=[
                "Never click links inside unexpected security alerts; navigate to accounts independently",
                "Transition authentication from SMS-based OTPs to FIDO2 passkeys or authenticator apps",
                "Set up transaction and login notification alerts on critical accounts"
            ]
        )

    def _model_financial_fraud_scenario(self, request: SimulationRequest) -> SimulationResponse:
        stages = [
            AttackStage(
                stage_number=1,
                title="Stage 1: Extraordinary Windfall or Investment Pitch",
                attacker_objective="Bait the target with high-return, zero-risk financial offers or lottery windfalls.",
                realistic_action="Threat actor shares screenshots of fake trading accounts, luxury lifestyles, or algorithmic trading returns.",
                warning_signs=[
                    "Guarantees of fixed daily/weekly returns on volatile assets",
                    "Unsolicited investment opportunities from social media contacts",
                ],
                prevention_gate="Regulatory Verification: Check if the financial entity is registered with SEC, FINRA, or national regulatory registries."
            ),
            AttackStage(
                stage_number=2,
                title="Stage 2: Fabricated Platform Dashboard & Initial Deposit",
                attacker_objective="Build confidence by showing simulated profits on a fraudulent dashboard.",
                realistic_action="User creates an account and deposits a modest initial sum; the platform displays artificial rapid balance growth.",
                warning_signs=[
                    "Dashboard hosted on newly registered disposable domain",
                    "Refusal to provide audited custody or cold storage addresses",
                ],
                prevention_gate="Independent Balance Audit: Verify whether purported transactions appear on public blockchain explorers."
            ),
            AttackStage(
                stage_number=3,
                title="Stage 3: Advance-Fee Withdrawal Lockout",
                attacker_objective="Extract maximal capital before terminating communications.",
                realistic_action="When the user attempts withdrawal, the platform demands upfront 'liquidity fees', 'taxes', or 'gas fees'.",
                warning_signs=[
                    "Inability to deduct withdrawal fees directly from account balance",
                    "Demands to wire additional funds to separate unverified wallets",
                ],
                prevention_gate="Advance-Fee Refusal: Legitimate financial platforms never require external payments to unlock existing balances."
            ),
            AttackStage(
                stage_number=4,
                title="Stage 4: Complete Disappearance & Secondary Recovery Scam",
                attacker_objective="Target the victim a second time through a fake asset recovery firm.",
                realistic_action="The original site shuts down, and a purported 'hacker recovery specialist' contacts the victim offering to recover funds for a fee.",
                warning_signs=[
                    "Unsolicited outreach from third-party recovery agencies claiming to trace crypto",
                    "Demands for upfront retainer fees to execute 'recovery algorithms'",
                ],
                prevention_gate="Zero Engagement with Recovery Scams: Report incidents exclusively to certified official fraud agencies (FTC/IC3)."
            ),
        ]

        return SimulationResponse(
            scenario_name="High-Yield Investment Fraud & Advance-Fee Extraction Chain",
            threat_category=ThreatCategory.FINANCIAL_FRAUD,
            attack_vector="Cryptocurrency Investment Pig-Butchering / Advance-Fee Fraud",
            hypothetical_progression=stages,
            potential_consequences=[
                "Permanent loss of deposited cryptocurrency or wire funds",
                "Additional losses through deceptive withdrawal unlock fees",
                "Subsequent targeting by secondary asset-recovery fraud rings",
                "Compromised financial identity and bank account vulnerability"
            ],
            critical_warning_signs=[
                "Promises of guaranteed returns on cryptocurrency or forex trading",
                "Requests to pay external fees before withdrawing your own funds",
                "Payment methods limited strictly to non-refundable cryptocurrency or gift cards"
            ],
            recommended_prevention_gates=[
                "Never invest through private messages or unvetted web applications",
                "Refuse any demand to send additional money to withdraw existing capital",
                "Document all wallet addresses and communication transcripts for official filing"
            ]
        )

    def _model_extortion_scenario(self, request: SimulationRequest) -> SimulationResponse:
        stages = [
            AttackStage(
                stage_number=1,
                title="Stage 1: Shock Lure & Compromise Bluff",
                attacker_objective="Paralyze the target with shame and fear using leaked credential artifacts.",
                realistic_action="Threat actor sends an email displaying an old breached password, claiming spyware or Pegasus webcam control.",
                warning_signs=[
                    "Extortion emails citing an old password from public breach databases",
                    "Vague technical claims of 'controlling your screen and camera'",
                ],
                prevention_gate="Credential Origin Check: Verify that the cited password originated from a historical third-party breach via haveibeenpwned."
            ),
            AttackStage(
                stage_number=2,
                title="Stage 2: Threat of Public Exposure & Artificial Countdown",
                attacker_objective="Prevent target from seeking advice by creating extreme time sensitivity.",
                realistic_action="Attacker sets a 48-hour deadline to leak purported videos to family and employer contacts.",
                warning_signs=[
                    "Artificial urgency and demands for complete secrecy",
                    "Refusal to provide actual proof of recorded footage",
                ],
                prevention_gate="Camera & Process Inspection: Review system camera access permissions; verify no active unauthorized connections exist."
            ),
            AttackStage(
                stage_number=3,
                title="Stage 3: Irreversible Cryptocurrency Demand",
                attacker_objective="Obtain untraceable payment while keeping identity concealed.",
                realistic_action="Threat actor provides a Bitcoin wallet address, claiming they will delete all records upon payment confirmation.",
                warning_signs=[
                    "Payment demanded exclusively via Bitcoin or privacy coins",
                    "Standard copypasta text matching mass-campaign sextortion templates",
                ],
                prevention_gate="Do Not Pay: Paying extortionists does not delete records and reliably flags the victim for aggressive repeat demands."
            ),
            AttackStage(
                stage_number=4,
                title="Stage 4: Post-Incident Re-extortion (If Paid) or Disappearance (If Ignored)",
                attacker_objective="Exploit paying victims for recurring income, or move on to other targets if ignored.",
                realistic_action="If victim pays, attacker demands double to 'finish the deletion'. If ignored, attacker abandons template.",
                warning_signs=[
                    "Escalating follow-up demands following compliance",
                ],
                prevention_gate="Cease All Contact & Update Credentials: Change reused passwords across all accounts and report email headers."
            ),
        ]

        return SimulationResponse(
            scenario_name="Mass-Campaign Sextortion & Digital Coercion Threat",
            threat_category=ThreatCategory.COERCION_EXTORTION,
            attack_vector="Credential-Breach Bluff & Psychological Sextortion",
            hypothetical_progression=stages,
            potential_consequences=[
                "Severe emotional distress and psychological exhaustion",
                "Financial depletion if ransom payments are initiated",
                "Persistent targeting once marked as an active paying victim"
            ],
            critical_warning_signs=[
                "Extortion letters referencing leaked passwords without real footage proof",
                "Demands to transfer cryptocurrency to avert public humiliation",
                "Strict demands to hide the situation from family or tech support"
            ],
            recommended_prevention_gates=[
                "Never pay the extortion demand under any circumstances",
                "Change passwords on any account where the cited password was ever used",
                "Enable hardware/authenticator two-factor authentication on all email and primary accounts"
            ]
        )

    def _model_impersonation_scenario(self, request: SimulationRequest) -> SimulationResponse:
        stages = [
            AttackStage(
                stage_number=1,
                title="Stage 1: False Authority Contact",
                attacker_objective="Establish immediate authority by masquerading as a government, law enforcement, or bank official.",
                realistic_action="Caller or message claims to be an agent from the IRS, FBI, or Bank Fraud Investigation division.",
                warning_signs=[
                    "Caller ID spoofing displaying official agency phone numbers",
                    "Claims of criminal charges, arrest warrants, or bank account compromise",
                ],
                prevention_gate="Independent Callback: Hang up and call the agency's official, verified 1-800 phone number from their authentic .gov or corporate portal."
            ),
            AttackStage(
                stage_number=2,
                title="Stage 2: Isolation & Psychological Pressure",
                attacker_objective="Sever target's support network to prevent third parties from pointing out the scam.",
                realistic_action="Actor commands the victim to stay on the phone and strictly forbids talking to bank tellers, friends, or family.",
                warning_signs=[
                    "Demands to keep the phone call active during banking transactions",
                    "Instructions to fabricate false stories if bank tellers question cash withdrawals",
                ],
                prevention_gate="Immediate Third-Party Verification: Consult a trusted friend, family member, or branch manager before moving money."
            ),
            AttackStage(
                stage_number=3,
                title="Stage 3: Unconventional Payment / 'Safe Account' Transfer",
                attacker_objective="Direct the victim to convert liquid assets into irreversible instruments.",
                realistic_action="Actor directs victim to purchase gift cards, transfer to a 'safe government locker account', or use a Bitcoin ATM.",
                warning_signs=[
                    "Government agency demanding payment via Target/Apple gift cards or Bitcoin ATM",
                    "Instructions to wire funds to an unfamiliar personal or overseas account",
                ],
                prevention_gate="Instrument Check: Government agencies and reputable banks never accept gift cards, Bitcoin, or wire to third parties."
            ),
            AttackStage(
                stage_number=4,
                title="Stage 4: Capital Extraction & Continued Exploitation",
                attacker_objective="Drain remaining lines of credit or loans until the victim recognizes the fraud.",
                realistic_action="Attacker invents further 'fines' or 'bail fees' until funds are exhausted.",
                warning_signs=[
                    "Ongoing demands following initial payment",
                ],
                prevention_gate="Law Enforcement & Bank Fraud Filing: Report the crime immediately to local police and your bank's fraud unit."
            ),
        ]

        return SimulationResponse(
            scenario_name="Authority Impersonation & Coerced Liquidation Attack",
            threat_category=ThreatCategory.IMPERSONATION,
            attack_vector="Government / Bank Security Impersonation & Social Engineering",
            hypothetical_progression=stages,
            potential_consequences=[
                "Catastrophic financial loss through irreversible wire transfers or gift cards",
                "Potential legal disruption if fraudulent loans were taken out under coercion",
                "Severe breach of confidential personal identifying information (SSN, banking records)"
            ],
            critical_warning_signs=[
                "Threats of immediate arrest or police dispatch unless payment is made instantly",
                "Instructions not to disclose the call to bank employees or relatives",
                "Demands to pay fines or protect funds using gift cards or cryptocurrency machines"
            ],
            recommended_prevention_gates=[
                "Remember: Real government agencies notify by physical mail and never demand phone payments",
                "Hang up immediately on aggressive callers and verify independently",
                "Alert bank personnel if someone is coaching you on how to answer withdrawal questions"
            ]
        )

    def _model_violent_threat_scenario(self, request: SimulationRequest) -> SimulationResponse:
        stages = [
            AttackStage(
                stage_number=1,
                title="Stage 1: Explicit Intimidation & Danger Signal",
                attacker_objective="Inflict intense fear and establish psychological dominance through violent language.",
                realistic_action="Threat actor sends explicit statements of bodily harm, death threats, or claims of kidnapping.",
                warning_signs=[
                    "Direct threats to physical safety, life, or family members",
                    "Aggressive coercion demanding immediate reply or payment",
                ],
                prevention_gate="Immediate Law Enforcement Engagement: Dial emergency services (911 or local emergency number) immediately."
            ),
            AttackStage(
                stage_number=2,
                title="Stage 2: Panic Exploitation & Demands",
                attacker_objective="Force the victim into immediate panic compliance.",
                realistic_action="Actor pairs violent threats with demands for money, location sharing, or compliance with extortion.",
                warning_signs=[
                    "Attempts to prevent calling police or checking on family members",
                ],
                prevention_gate="Evidence Preservation & Third-Party Check: Screenshot messages with sender info and verify family safety independently."
            ),
            AttackStage(
                stage_number=3,
                title="Stage 3: Protective Intervention & Containment",
                attacker_objective="Evade law enforcement tracking while maintaining intimidation.",
                realistic_action="Threat actor frequently uses VoIP or spoofed messaging proxies to obscure location.",
                warning_signs=[
                    "Unlisted or burner phone numbers with rapid number rotations",
                ],
                prevention_gate="Digital & Physical Safety Protocol: Do not reply, stay in secure surroundings, and coordinate with police."
            ),
        ]

        return SimulationResponse(
            scenario_name="Violent Threat & Physical Safety Coercion Protocol",
            threat_category=ThreatCategory.VIOLENT_THREAT,
            attack_vector="Direct Intimidation / Physical Coercion",
            hypothetical_progression=stages,
            potential_consequences=[
                "Immediate threat to personal physical safety and peace of mind",
                "Psychological trauma and severe distress"
            ],
            critical_warning_signs=[
                "Language explicitly threatening death, bodily violence, kidnapping, or physical assault"
            ],
            recommended_prevention_gates=[
                "Contact local emergency law enforcement immediately",
                "Preserve all original message timestamps, phone numbers, and screenshots",
                "Do not engage, negotiate, or antagonize the sender"
            ]
        )

    def _model_generic_social_engineering_scenario(self, request: SimulationRequest) -> SimulationResponse:
        return self._model_phishing_scenario(request)


risk_simulator = RiskSimulator()
