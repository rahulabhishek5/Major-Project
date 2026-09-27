/**
 * UBS Continuous Regulatory Change Manager
 * Internal Policies Mock Data
 */
window.APP_DATA = window.APP_DATA || {};

window.APP_DATA.policies = [
  {
    policy_id: 'POL-DP-001',
    title: 'Data Privacy & Protection Policy',
    version: '3.2',
    last_updated: '2023-11-15',
    owner: 'Priya Sharma, Chief Data Protection Officer',
    department: 'Compliance & Legal',
    region: ['APAC', 'EU'],
    status: 'active',
    applicable_regulations: ['DPDP Act 2023', 'RBI IT Governance Direction', 'GDPR'],
    summary: 'Governs the collection, processing, storage, and disposal of personal data across all business lines. Establishes consent management frameworks, data subject rights procedures, and breach notification protocols in compliance with the DPDP Act 2023.',
    business_lines: ['Retail Banking', 'Wealth Management', 'Digital Banking', 'Corporate Banking'],
    review_cycle: 'Annual',
    next_review_date: '2024-11-15',
    sections: [
      {
        section_id: 'POL-DP-001-S1',
        title: '1. Consent Management Framework',
        content: 'All personal data processing activities shall be conducted only upon obtaining free, specific, informed, and unambiguous consent from the Data Principal, unless processing falls under the legitimate use exceptions defined in Section 7 of the DPDP Act. Consent must be recorded with timestamp, scope, purpose, and medium. The bank shall implement granular consent mechanisms that allow Data Principals to provide or withhold consent for each distinct processing purpose independently. Bundled consent requests that combine unrelated processing activities are prohibited. Consent withdrawal mechanisms shall be accessible through all customer-facing channels including mobile banking, internet banking, and branch operations, and must be operationally as simple as the consent provision mechanism.'
      },
      {
        section_id: 'POL-DP-001-S2',
        title: '2. Data Subject Rights',
        content: 'The bank shall establish and maintain procedures to facilitate the exercise of Data Principal rights including: (a) Right to access a summary of personal data being processed and the processing purposes; (b) Right to correction and completion of inaccurate or incomplete data within 15 working days of request; (c) Right to erasure of data upon withdrawal of consent, subject to regulatory retention requirements; (d) Right to grievance redressal through a designated Data Protection Officer. All rights requests shall be logged in the compliance tracking system and resolved within the timelines specified by the Data Protection Board.'
      },
      {
        section_id: 'POL-DP-001-S3',
        title: '3. Data Breach Response',
        content: 'In the event of a personal data breach, the bank shall: (a) Notify the Data Protection Board of India within 72 hours of becoming aware of the breach; (b) Notify affected Data Principals without undue delay through their registered communication channels; (c) Conduct a root cause analysis and implement corrective measures within 30 days; (d) Maintain a breach register documenting all incidents, response actions, and outcomes. The Chief Data Protection Officer shall brief the Board of Directors on all significant breaches within 24 hours.'
      },
      {
        section_id: 'POL-DP-001-S4',
        title: '4. Third-Party Data Processing',
        content: 'All third-party processors engaged by the bank shall be bound by Data Processing Agreements (DPAs) that include: mandatory security standards, breach notification obligations, audit rights, data localization requirements per RBI mandates, and restrictions on sub-processing. The bank retains full accountability for data processed by third parties and shall conduct annual compliance audits of all critical data processors.'
      }
    ],
    change_history: [
      {
        version: '1.2',
        date: '2023-08-20',
        regulatory_trigger: 'DPDP Act 2023 Draft Notification',
        reason: 'Initial alignment with DPDP Draft requirements',
        summary: 'Introduced basic consent management protocols and updated definitions of Data Principal.'
      },
      {
        version: '1.8',
        date: '2023-10-05',
        regulatory_trigger: 'RBI IT Governance Direction',
        reason: 'Mandatory breach notification timeline',
        summary: 'Updated breach response SLA to strict 72 hours as mandated by RBI IT Governance framework.'
      },
      {
        version: '2.5',
        date: '2023-11-01',
        regulatory_trigger: 'GDPR Equivalency Guidelines',
        reason: 'Cross-border data processing updates',
        summary: 'Added detailed third-party processor requirements and audit rights.'
      },
      {
        version: '3.2',
        date: '2023-11-15',
        regulatory_trigger: 'DPDP Act 2023 Final Enactment',
        reason: 'Finalized consent withdrawal mechanisms',
        summary: 'Ensured consent withdrawal is operationally as simple as consent provision.'
      }
    ]
  },
  {
    policy_id: 'POL-DP-003',
    title: 'Customer Data Handling Standard Operating Procedure',
    version: '2.1',
    last_updated: '2024-01-08',
    owner: 'Rajesh Kumar, Head of Operations',
    department: 'Operations',
    region: ['APAC'],
    status: 'active',
    applicable_regulations: ['DPDP Act 2023', 'RBI KYC Directions'],
    summary: 'Defines operational procedures for handling customer data across all touchpoints including branches, digital channels, and call centres. Covers data collection, classification, storage, access controls, and disposal.',
    business_lines: ['Retail Banking', 'Digital Banking'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-07-08',
    sections: [
      {
        section_id: 'POL-DP-003-S1',
        title: '1. Data Classification',
        content: 'Customer data shall be classified into four tiers: Tier 1 (Restricted) — Aadhaar, biometrics, financial PINs; Tier 2 (Confidential) — account details, transaction history, credit scores; Tier 3 (Internal) — contact information, demographics, preferences; Tier 4 (Public) — publicly available information. Access controls, encryption standards, and retention periods are determined by classification tier.'
      },
      {
        section_id: 'POL-DP-003-S2',
        title: '2. Data Collection Procedures',
        content: 'Customer data shall be collected only through authorized channels and forms. All collection points shall display the mandatory privacy notice as per Section 5 of the DPDP Act. Staff handling data collection must complete the annual Data Protection Awareness certification. Digital collection forms must implement purpose limitation by design, collecting only the minimum data necessary for the stated purpose.'
      },
      {
        section_id: 'POL-DP-003-S3',
        title: '3. Data Retention and Disposal',
        content: 'Personal data shall be retained only for the period necessary to fulfil the purpose for which it was collected, or as required by applicable laws (RBI mandates 10-year retention for transaction records). Upon expiry of the retention period, data shall be securely disposed of using approved methods: cryptographic erasure for digital records, cross-cut shredding for physical documents. Disposal shall be documented and certified by the Data Custodian.'
      }
    ],
    change_history: [
      {
        version: '1.5',
        date: '2023-03-12',
        regulatory_trigger: 'RBI KYC Directions Update',
        reason: 'Enhanced KYC data storage',
        summary: 'Updated storage protocols for high-risk customer demographics.'
      },
      {
        version: '1.8',
        date: '2023-06-05',
        regulatory_trigger: 'Data Protection Bill Draft',
        reason: 'Pre-emptive compliance',
        summary: 'Introduced 4-tier data classification system.'
      },
      {
        version: '2.0',
        date: '2023-11-20',
        regulatory_trigger: 'DPDP Act 2023',
        reason: 'Purpose limitation enforcement',
        summary: 'Mandated purpose limitation by design for all digital forms.'
      },
      {
        version: '2.1',
        date: '2024-01-08',
        regulatory_trigger: 'RBI Audit Observations',
        reason: 'Stricter data disposal',
        summary: 'Specified cryptographic erasure standards for digital records.'
      }
    ]
  },
  {
    policy_id: 'POL-DL-001',
    title: 'Digital Lending Compliance Framework',
    version: '1.4',
    last_updated: '2023-09-20',
    owner: 'Ananya Mehta, Head of Digital Lending',
    department: 'Digital Banking',
    region: ['APAC'],
    status: 'under_review',
    applicable_regulations: ['RBI Digital Lending Guidelines 2022', 'Fair Practices Code'],
    summary: 'Establishes the compliance framework for all digital lending operations conducted directly or through Lending Service Providers. Covers disclosure requirements, customer protection measures, and LSP governance.',
    business_lines: ['Retail Banking', 'Consumer Lending', 'Digital Banking'],
    review_cycle: 'Annual',
    next_review_date: '2024-09-20',
    sections: [
      {
        section_id: 'POL-DL-001-S1',
        title: '1. Key Fact Statement Requirements',
        content: 'All digital loan products shall provide a Key Fact Statement (KFS) to borrowers prior to loan agreement execution. The KFS must include: Annual Percentage Rate, all-inclusive cost breakdown, repayment schedule, cooling-off period details (minimum 3 working days), penal charges, and grievance redressal information. The KFS format must comply with the standardized template issued by RBI.'
      },
      {
        section_id: 'POL-DL-001-S2',
        title: '2. Lending Service Provider Governance',
        content: 'All Lending Service Providers and Digital Lending Apps associated with the bank must be registered in the bank\'s LSP registry and published on the bank website. LSPs shall not represent themselves as lenders. All fees and charges payable to LSPs shall be paid by the bank, not the borrower. The bank shall conduct quarterly reviews of LSP practices and annual compliance audits.'
      },
      {
        section_id: 'POL-DL-001-S3',
        title: '3. Customer Protection',
        content: 'Borrowers shall be provided a cooling-off period of not less than 3 working days during which they may exit the loan without penalty. All loan disbursements and repayments must flow through the borrower\'s bank account — direct fund transfers to third parties or LSPs are prohibited. Data collected from borrower\'s device must be limited to the minimum necessary and must have explicit consent.'
      }
    ],
    change_history: [
      {
        version: '1.1',
        date: '2023-01-15',
        regulatory_trigger: 'RBI Draft Digital Lending Framework',
        reason: 'Initial alignment with draft guidelines',
        summary: 'Introduced basic definitions for Lending Service Providers.'
      },
      {
        version: '1.2',
        date: '2023-04-10',
        regulatory_trigger: 'Consumer Protection Act Amendments',
        reason: 'Enhanced grievance redressal',
        summary: 'Added mandatory grievance officer details in all lending apps.'
      },
      {
        version: '1.3',
        date: '2023-07-22',
        regulatory_trigger: 'RBI Data Localization Updates',
        reason: 'Device data collection restrictions',
        summary: 'Restricted DLAs from accessing media, contacts, and call logs without explicit consent.'
      },
      {
        version: '1.4',
        date: '2023-09-20',
        regulatory_trigger: 'RBI Digital Lending Guidelines 2022',
        reason: 'Finalized Key Fact Statement requirements',
        summary: 'Mandated strict 3-day cooling-off periods and standardized KFS templates.'
      }
    ]
  },
  {
    policy_id: 'POL-CB-001',
    title: 'Cross-Border Data Transfer Policy',
    version: '2.0',
    last_updated: '2023-12-01',
    owner: 'Vikram Desai, Head of International Operations',
    department: 'International Banking',
    region: ['APAC', 'EU', 'North America'],
    status: 'active',
    applicable_regulations: ['DPDP Act 2023 Section 16', 'RBI Data Localization Directive', 'GDPR'],
    summary: 'Governs the transfer of personal and financial data across jurisdictions. Ensures compliance with RBI data localization mandates and DPDP Act cross-border provisions.',
    business_lines: ['International Banking', 'Wealth Management', 'Investment Banking'],
    review_cycle: 'Annual',
    next_review_date: '2024-12-01',
    sections: [
      {
        section_id: 'POL-CB-001-S1',
        title: '1. Data Localization',
        content: 'All payment system data including full end-to-end transaction details, customer information collected during payment processing, and payment system operational data must be stored in systems located within India. Copies may be shared with overseas regulators and counterparties only after maintaining the primary data store in India.'
      },
      {
        section_id: 'POL-CB-001-S2',
        title: '2. Permitted Transfers',
        content: 'Cross-border data transfers are permitted only to jurisdictions notified by the Central Government as providing adequate data protection, or where the transfer is necessary for the performance of a contract with the Data Principal. All transfers must be documented with the legal basis, data categories, recipient details, and protective measures in the Cross-Border Transfer Register.'
      },
      {
        section_id: 'POL-CB-001-S3',
        title: '3. Transfer Safeguards',
        content: 'All cross-border transfers shall implement: encryption in transit (TLS 1.3 minimum), contractual safeguards through Standard Contractual Clauses or equivalent instruments, data minimization to transfer only the minimum necessary data, and access logging to track all cross-border data access. The CISO shall approve all new cross-border data flows.'
      }
    ],
    change_history: [
      {
        version: '1.2',
        date: '2022-09-10',
        regulatory_trigger: 'RBI Data Localization Circular',
        reason: 'Payment data localization',
        summary: 'Mandated primary storage of all payment system data within India.'
      },
      {
        version: '1.5',
        date: '2023-02-25',
        regulatory_trigger: 'GDPR Adequacy Decisions',
        reason: 'EU data transfer updates',
        summary: 'Updated standard contractual clauses for EU data transfers.'
      },
      {
        version: '1.8',
        date: '2023-08-14',
        regulatory_trigger: 'DPDP Act 2023 Section 16',
        reason: 'Alignment with new law',
        summary: 'Integrated DPDP Act requirements for permitted cross-border transfers.'
      },
      {
        version: '2.0',
        date: '2023-12-01',
        regulatory_trigger: 'Cybersecurity Framework V2',
        reason: 'Enhanced transit security',
        summary: 'Upgraded minimum transit encryption to TLS 1.3 for all cross-border flows.'
      }
    ]
  },
  {
    policy_id: 'POL-EMP-001',
    title: 'Employee Data Processing Guidelines',
    version: '1.8',
    last_updated: '2024-02-01',
    owner: 'Neha Gupta, Chief Human Resources Officer',
    department: 'Human Resources',
    region: ['APAC'],
    status: 'active',
    applicable_regulations: ['DPDP Act 2023 Section 7', 'Code on Wages 2019', 'OSHWC Code 2020'],
    summary: 'Establishes guidelines for processing employee personal data including recruitment, payroll, benefits, health records, and performance management. Updated to reflect the new Labour Code requirements.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-02-01',
    sections: [
      {
        section_id: 'POL-EMP-001-S1',
        title: '1. Lawful Basis for Processing',
        content: 'Employee personal data may be processed without explicit consent where processing is necessary for employment purposes or safeguarding the employer from loss or liability, as per DPDP Act Section 7(g). However, the bank shall provide clear notice to all employees regarding the categories of data processed, purposes, and retention periods. Processing of sensitive data (health records, biometrics) requires additional safeguards.'
      },
      {
        section_id: 'POL-EMP-001-S2',
        title: '2. Wage and Compensation Data',
        content: 'Under the Code on Wages 2019, the definition of "wages" includes basic pay and dearness allowance, with the 50% rule requiring that excluded components not exceed 50% of total remuneration. The HR department shall ensure payroll systems are configured to comply with the new wages definition for PF and gratuity calculations. Annual health checkup records for employees aged 40+ shall be maintained securely per OSHWC Code requirements.'
      },
      {
        section_id: 'POL-EMP-001-S3',
        title: '3. Retention and Access',
        content: 'Employee records shall be retained for the duration of employment plus 8 years post-separation for regulatory compliance. Access to employee data is restricted to HR personnel, direct supervisors (performance data only), and authorized compliance officers. All access shall be logged and auditable.'
      }
    ],
    change_history: [
      {
        version: '1.2',
        date: '2022-10-15',
        regulatory_trigger: 'OSHWC Code 2020 Draft Rules',
        reason: 'Occupational health data protection',
        summary: 'Introduced strict access controls for employee health records.'
      },
      {
        version: '1.5',
        date: '2023-04-22',
        regulatory_trigger: 'Labour Ministry Advisory',
        reason: 'Remote work monitoring',
        summary: 'Established guidelines for proportional monitoring of remote employees.'
      },
      {
        version: '1.7',
        date: '2023-09-10',
        regulatory_trigger: 'DPDP Act 2023 Section 7',
        reason: 'Employment exemptions update',
        summary: 'Updated consent requirements relying on employment legitimate use exemptions.'
      },
      {
        version: '1.8',
        date: '2024-02-01',
        regulatory_trigger: 'Internal Audit Review',
        reason: 'Background check protocols',
        summary: 'Strengthened data minimization in pre-employment background verification.'
      }
    ]
  },
  {
    policy_id: 'POL-RISK-001',
    title: 'Risk Assessment Framework',
    version: '4.0',
    last_updated: '2024-01-30',
    owner: 'Sunil Patel, Chief Risk Officer',
    department: 'Risk Management',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['RBI Risk Management Framework', 'Basel III', 'ICAAP Guidelines'],
    summary: 'Defines the enterprise-wide risk assessment methodology covering credit, market, operational, compliance, and emerging technology risks. Includes AI model risk assessment requirements.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-30',
    sections: [
      {
        section_id: 'POL-RISK-001-S1',
        title: '1. Risk Identification and Classification',
        content: 'All business units shall maintain a risk register documenting identified risks categorized by type (credit, market, operational, compliance, technology, strategic), likelihood (1-5 scale), impact (1-5 scale), and velocity (rate of onset). Emerging risks including AI/ML model risk, climate risk, and regulatory change risk shall be assessed quarterly.'
      },
      {
        section_id: 'POL-RISK-001-S2',
        title: '2. Regulatory Change Risk Assessment',
        content: 'Regulatory changes shall be assessed using the three-dimensional scoring model: (a) Compliance impact (scope of changes required to existing processes); (b) Financial impact (cost of implementation and potential penalties); (c) Timeline urgency (time available for compliance). Regulatory changes scoring above 70 on the composite scale require mandatory Board Risk Committee review.'
      },
      {
        section_id: 'POL-RISK-001-S3',
        title: '3. AI Model Risk Management',
        content: 'All AI/ML models used in credit decisioning, fraud detection, and customer segmentation shall undergo: pre-deployment validation, ongoing performance monitoring, annual independent review, and bias assessment. Models classified as high-risk under the EU AI Act shall additionally comply with the transparency and human oversight requirements of that regulation.'
      }
    ]
  },
  {
    policy_id: 'POL-IR-001',
    title: 'Incident Response Procedure',
    version: '3.1',
    last_updated: '2024-03-01',
    owner: 'Amit Joshi, Chief Information Security Officer',
    department: 'Information Security',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['RBI Cyber Security Framework', 'DPDP Act 2023', 'CERT-In Directions'],
    summary: 'Defines procedures for detecting, responding to, and recovering from security incidents including data breaches, cyberattacks, and system failures. Includes regulatory notification timelines.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-09-01',
    sections: [
      {
        section_id: 'POL-IR-001-S1',
        title: '1. Incident Classification',
        content: 'Incidents are classified into four severity levels: P1 (Critical) — active data breach, system compromise affecting customer data, ransomware; P2 (High) — attempted breach, significant vulnerability exploited, partial service outage; P3 (Medium) — policy violation, minor vulnerability, non-critical system issue; P4 (Low) — suspicious activity, policy inquiry, routine alerts.'
      },
      {
        section_id: 'POL-IR-001-S2',
        title: '2. Response Timelines',
        content: 'P1 incidents: Initial response within 15 minutes, CERT-In notification within 6 hours, DPB notification within 72 hours (for data breaches), Board notification within 24 hours. P2 incidents: Initial response within 1 hour, escalation within 4 hours. All incidents must be reported to RBI-CSITE within prescribed timelines.'
      },
      {
        section_id: 'POL-IR-001-S3',
        title: '3. Post-Incident Review',
        content: 'A post-incident review shall be conducted within 5 working days of incident closure. The review shall document: root cause analysis, timeline of events, effectiveness of response, lessons learned, and corrective actions. Corrective actions shall be tracked to completion and verified by Internal Audit.'
      }
    ]
  },
  {
    policy_id: 'POL-VND-001',
    title: 'Vendor Data Sharing Agreement Template',
    version: '2.3',
    last_updated: '2023-10-15',
    owner: 'Deepa Nair, Head of Procurement',
    department: 'Procurement & Vendor Management',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['DPDP Act 2023 Section 8', 'RBI Outsourcing Guidelines'],
    summary: 'Provides the standard template and requirements for data sharing agreements with third-party vendors. Ensures vendor compliance with data protection requirements and RBI outsourcing guidelines.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2024-10-15',
    sections: [
      {
        section_id: 'POL-VND-001-S1',
        title: '1. Mandatory Agreement Clauses',
        content: 'All vendor data sharing agreements must include: purpose limitation, data minimization requirements, security standards (ISO 27001 or equivalent), breach notification within 24 hours, right to audit, return/destruction of data upon contract termination, compliance with DPDP Act and RBI guidelines, prohibition on sub-processing without written consent, and indemnification for data protection violations.'
      },
      {
        section_id: 'POL-VND-001-S2',
        title: '2. Vendor Risk Assessment',
        content: 'All vendors processing personal or financial data shall undergo risk assessment prior to engagement. Assessment covers: data security maturity, business continuity preparedness, regulatory compliance history, financial stability, and geographic risk (data localization). High-risk vendors require CISO and CRO sign-off.'
      },
      {
        section_id: 'POL-VND-001-S3',
        title: '3. Ongoing Monitoring',
        content: 'Vendor compliance shall be monitored through: annual compliance certifications, periodic on-site/remote audits (frequency based on risk tier), continuous monitoring of security posture through automated tools, and quarterly review meetings. Non-compliance triggers remediation plans with 30-day cure periods.'
      }
    ]
  },
  {
    policy_id: 'POL-HR-002',
    title: 'Remote Work and BYOD Policy',
    version: '1.5',
    last_updated: '2024-01-10',
    owner: 'Sarah Jenkins, VP of Global HR',
    department: 'Human Resources & IT',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['GDPR', 'OSHWC Code 2020', 'CCPA'],
    summary: 'Governs the security, privacy, and operational requirements for employees working remotely or utilizing personal devices (Bring Your Own Device) for business purposes.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-10',
    sections: [
      {
        section_id: 'POL-HR-002-S1',
        title: '1. Device Enrollment and MDM',
        content: 'All personal devices used for accessing company systems must be enrolled in the corporate Mobile Device Management (MDM) solution. The MDM will enforce security policies, including full disk encryption, complex passcodes, and the ability to remotely wipe corporate data without affecting personal data.'
      },
      {
        section_id: 'POL-HR-002-S2',
        title: '2. Remote Work Data Privacy',
        content: 'Employees working remotely must ensure that confidential company and customer data is not visible to unauthorized individuals in their remote environment. Use of public Wi-Fi without the corporate VPN is strictly prohibited.'
      }
    ]
  },
  {
    policy_id: 'POL-AML-004',
    title: 'Anti-Money Laundering & KYC Directive',
    version: '4.2',
    last_updated: '2023-11-28',
    owner: 'Liam O\'Connor, Global Head of Financial Crime',
    department: 'Compliance & Legal',
    region: ['EU', 'UK'],
    status: 'active',
    applicable_regulations: ['EU AMLD6', 'UK Proceeds of Crime Act'],
    summary: 'Establishes the minimum standards for identifying and verifying customers (KYC), monitoring transactions, and reporting suspicious activities to combat money laundering and terrorist financing.',
    business_lines: ['Retail Banking', 'Corporate Banking', 'Wealth Management'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-05-28',
    sections: [
      {
        section_id: 'POL-AML-004-S1',
        title: '1. Enhanced Due Diligence (EDD)',
        content: 'Customers classified as High Risk, including Politically Exposed Persons (PEPs), require Enhanced Due Diligence (EDD). EDD includes establishing the Source of Wealth and Source of Funds, and requires senior management approval prior to account opening.'
      },
      {
        section_id: 'POL-AML-004-S2',
        title: '2. Suspicious Activity Reporting (SAR)',
        content: 'Any employee who suspects that a transaction is related to money laundering or terrorist financing must immediately file an internal Suspicious Activity Report (SAR) with the MLRO. "Tipping off" the customer that a SAR has been filed is a criminal offense.'
      }
    ]
  },
  {
    policy_id: 'POL-ESG-001',
    title: 'Corporate Sustainability & ESG Reporting Standards',
    version: '1.1',
    last_updated: '2024-04-05',
    owner: 'Elena Rostova, Chief Sustainability Officer',
    department: 'Corporate Governance',
    region: ['North America', 'EU'],
    status: 'under_review',
    applicable_regulations: ['SEC Climate Disclosure', 'CSRD', 'SFDR'],
    summary: 'Provides guidelines for measuring, tracking, and disclosing the firm\'s environmental, social, and governance (ESG) metrics in alignment with international standards and regulatory mandates.',
    business_lines: ['Corporate Banking', 'Investment Banking'],
    review_cycle: 'Annual',
    next_review_date: '2025-04-05',
    sections: [
      {
        section_id: 'POL-ESG-001-S1',
        title: '1. Scope 1, 2, and 3 Emissions Tracking',
        content: 'The firm shall quantify and report its Scope 1 (direct), Scope 2 (indirect from purchased energy), and Scope 3 (financed emissions) greenhouse gas emissions annually. Financed emissions calculations must adhere to the PCAF (Partnership for Carbon Accounting Financials) standard.'
      },
      {
        section_id: 'POL-ESG-001-S2',
        title: '2. Sustainability Disclosures',
        content: 'All public ESG disclosures must undergo external limited assurance prior to publication in the Annual Sustainability Report. Greenwashing—misrepresenting the sustainability profile of products or operations—is strictly prohibited and subject to disciplinary action.'
      }
    ]
  },
  {
    policy_id: 'POL-TREAS-001',
    title: 'Treasury & Liquidity Risk Management Policy',
    version: '3.0',
    last_updated: '2024-02-15',
    owner: 'Marcus Weber, Group Treasurer',
    department: 'Treasury',
    region: ['EU', 'North America'],
    status: 'active',
    applicable_regulations: ['Basel III', 'CRD V', 'Dodd-Frank Act'],
    summary: 'Defines the framework for managing liquidity risk, funding strategies, and capital adequacy ratios across all operating entities. Ensures compliance with Basel III Liquidity Coverage Ratio (LCR) and Net Stable Funding Ratio (NSFR) requirements.',
    business_lines: ['Treasury Operations', 'Corporate Banking'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-08-15',
    sections: [
      {
        section_id: 'POL-TREAS-001-S1',
        title: '1. Liquidity Coverage Ratio (LCR)',
        content: 'The bank shall maintain a minimum Liquidity Coverage Ratio of 100% at the consolidated level and 90% at each significant entity level. The stock of High-Quality Liquid Assets (HQLA) must consist of at least 60% Level 1 assets (cash, central bank reserves, sovereign bonds rated AA- or above).'
      },
      {
        section_id: 'POL-TREAS-001-S2',
        title: '2. Intraday Liquidity Management',
        content: 'Real-time monitoring of intraday liquidity positions across all currencies and payment systems is mandatory. The treasury desk shall maintain intraday buffers sufficient to meet peak settlement obligations and must report intraday liquidity metrics to regulators on a monthly basis as prescribed under BCBS 248.'
      }
    ]
  },
  {
    policy_id: 'POL-MKT-001',
    title: 'Marketing Communications & Fair Dealing Policy',
    version: '2.4',
    last_updated: '2024-03-01',
    owner: 'Isabella Chen, Chief Marketing Officer',
    department: 'Marketing & Communications',
    region: ['APAC', 'North America'],
    status: 'active',
    applicable_regulations: ['ASCI Code', 'FTC Guidelines', 'RBI Fair Practices Code'],
    summary: 'Governs all marketing communications, advertising, and promotional activities to ensure they are fair, transparent, and not misleading. Covers digital advertising, social media, influencer partnerships, and product promotions.',
    business_lines: ['Retail Banking', 'Wealth Management', 'Digital Banking'],
    review_cycle: 'Annual',
    next_review_date: '2025-03-01',
    sections: [
      {
        section_id: 'POL-MKT-001-S1',
        title: '1. Advertising Standards',
        content: 'All marketing materials must present product features, fees, interest rates, and risks in a clear, balanced, and non-misleading manner. Comparative advertising must be substantiated with verifiable data. All digital ads targeting financial products must include mandated risk disclaimers visible without additional user action.'
      },
      {
        section_id: 'POL-MKT-001-S2',
        title: '2. Social Media & Influencer Guidelines',
        content: 'Sponsored content and influencer partnerships must clearly disclose the commercial relationship using #Ad or #Sponsored tags. Influencers must not make return guarantees or risk-minimizing statements about financial products. All influencer content must be pre-approved by the Compliance team before publication.'
      }
    ]
  },
  {
    policy_id: 'POL-CREDIT-002',
    title: 'Commercial Credit Underwriting Standards',
    version: '5.1',
    last_updated: '2023-12-20',
    owner: 'James Harrington, Chief Credit Officer',
    department: 'Credit Risk',
    region: ['North America', 'EU'],
    status: 'active',
    applicable_regulations: ['OCC Lending Standards', 'EBA Guidelines on Loan Origination'],
    summary: 'Establishes minimum underwriting standards for commercial loans including credit assessment criteria, collateral valuation, concentration limits, and approval authorities across exposure tiers.',
    business_lines: ['Corporate Banking', 'Commercial Lending'],
    review_cycle: 'Annual',
    next_review_date: '2024-12-20',
    sections: [
      {
        section_id: 'POL-CREDIT-002-S1',
        title: '1. Credit Assessment Criteria',
        content: 'All commercial credit applications exceeding USD 500,000 shall undergo a full credit analysis including: financial statement analysis for the last 3 fiscal years, cash flow projections, industry risk assessment, management quality evaluation, and environmental risk screening. Debt Service Coverage Ratio (DSCR) must exceed 1.25x for standard facilities.'
      },
      {
        section_id: 'POL-CREDIT-002-S2',
        title: '2. Concentration Limits',
        content: 'Single borrower exposure shall not exceed 15% of Tier 1 capital. Sector concentration limits are set at 25% of total loan portfolio for any single industry. Geographic concentration in any single country (excluding home jurisdiction) shall not exceed 20% of international portfolio.'
      }
    ]
  },
  {
    policy_id: 'POL-OPSRISK-001',
    title: 'Operational Risk Management Framework',
    version: '3.3',
    last_updated: '2024-01-25',
    owner: 'Christine Dupont, Chief Risk Officer',
    department: 'Enterprise Risk Management',
    region: ['EU', 'North America', 'APAC'],
    status: 'active',
    applicable_regulations: ['Basel III Pillar II', 'EBA Operational Risk Guidelines', 'SOX'],
    summary: 'Defines the approach to identifying, assessing, monitoring, and mitigating operational risks including process failures, system outages, fraud, and external events across the enterprise.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-25',
    sections: [
      {
        section_id: 'POL-OPSRISK-001-S1',
        title: '1. Risk & Control Self-Assessment (RCSA)',
        content: 'Each business unit shall conduct a comprehensive Risk and Control Self-Assessment at least annually. RCSAs must identify all material operational risks, assess the effectiveness of existing controls, document residual risk levels, and define remediation plans for control gaps. Results are reported to the Operational Risk Committee quarterly.'
      },
      {
        section_id: 'POL-OPSRISK-001-S2',
        title: '2. Loss Data Collection',
        content: 'All operational risk loss events exceeding EUR 10,000 must be captured in the central Loss Data Collection System within 5 business days of discovery. Loss events are categorized per Basel event types. Near-miss events are also recorded for trend analysis. Monthly loss data reports are submitted to the CRO and Board Risk Committee.'
      }
    ]
  },
  {
    policy_id: 'POL-SANC-001',
    title: 'Sanctions Compliance Policy',
    version: '6.0',
    last_updated: '2024-04-01',
    owner: 'David Kim, Head of Sanctions Compliance',
    department: 'Compliance & Legal',
    region: ['North America', 'EU', 'UK', 'APAC'],
    status: 'active',
    applicable_regulations: ['OFAC Regulations', 'EU Sanctions Framework', 'UK Sanctions Act 2018'],
    summary: 'Establishes the framework for screening customers, transactions, and counterparties against global sanctions lists. Covers OFAC SDN, EU Consolidated List, UN Security Council lists, and HMT sanctions.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Quarterly',
    next_review_date: '2024-07-01',
    sections: [
      {
        section_id: 'POL-SANC-001-S1',
        title: '1. Real-Time Transaction Screening',
        content: 'All outgoing and incoming wire transfers, trade finance instruments, and correspondent banking transactions must be screened in real-time against OFAC SDN, EU Consolidated, UN, and HMT sanctions lists. Screening must cover originator, beneficiary, intermediary banks, and vessel/port information for trade finance.'
      },
      {
        section_id: 'POL-SANC-001-S2',
        title: '2. Hit Disposition and Escalation',
        content: 'Potential sanctions hits must be dispositioned within 4 hours of generation. True positive hits require immediate transaction blocking and escalation to the Head of Sanctions Compliance. Blocked transactions may only be released with documented OFAC license or equivalent regulatory authorization.'
      }
    ]
  },
  {
    policy_id: 'POL-BCP-001',
    title: 'Business Continuity & Disaster Recovery Policy',
    version: '4.0',
    last_updated: '2023-10-01',
    owner: 'Robert Tanaka, Head of Business Resilience',
    department: 'Operations',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['RBI BCP Guidelines', 'EBA Outsourcing Guidelines', 'FFIEC BCP Handbook'],
    summary: 'Defines the business continuity planning, disaster recovery, and crisis management framework to ensure critical business functions can continue during and after disruptive events.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2024-10-01',
    sections: [
      {
        section_id: 'POL-BCP-001-S1',
        title: '1. Recovery Time Objectives',
        content: 'Critical Tier 1 systems (core banking, payments, trading) must have a Recovery Time Objective (RTO) of 2 hours and Recovery Point Objective (RPO) of zero (synchronous replication). Tier 2 systems (CRM, HR, email) require RTO of 8 hours and RPO of 1 hour. All RTOs must be validated through annual DR testing.'
      },
      {
        section_id: 'POL-BCP-001-S2',
        title: '2. Crisis Management Protocol',
        content: 'A Crisis Management Team (CMT) shall be activated for any event classified as Severity 1 or 2. The CMT must convene (physically or virtually) within 30 minutes of activation. Communication trees must be tested quarterly. All crisis decisions and actions shall be documented in the Crisis Log for post-event review.'
      }
    ]
  },
  {
    policy_id: 'POL-FRAUD-002',
    title: 'Internal Fraud Prevention & Detection Policy',
    version: '2.7',
    last_updated: '2024-02-20',
    owner: 'Patricia Lagos, Head of Internal Investigations',
    department: 'Internal Audit',
    region: ['LATAM', 'North America'],
    status: 'active',
    applicable_regulations: ['SOX Section 302', 'Brazilian Anti-Corruption Act', 'FCPA'],
    summary: 'Establishes controls and detection mechanisms to prevent and identify internal fraud, embezzlement, and unauthorized activities by employees, contractors, and agents.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-02-20',
    sections: [
      {
        section_id: 'POL-FRAUD-002-S1',
        title: '1. Segregation of Duties',
        content: 'No single individual shall have the ability to initiate, approve, and reconcile a financial transaction. System access controls must enforce segregation between transaction initiation, authorization, and settlement functions. Exceptions require documented dual-control compensating controls approved by the Head of Internal Audit.'
      },
      {
        section_id: 'POL-FRAUD-002-S2',
        title: '2. Whistleblower Protection',
        content: 'The bank operates an independent, confidential whistleblower hotline available 24/7 in all operating jurisdictions. Reports may be made anonymously. Retaliation against whistleblowers is strictly prohibited and constitutes grounds for immediate termination. All reports are investigated by the Internal Investigations unit within 10 business days of receipt.'
      }
    ]
  },
  {
    policy_id: 'POL-CLOUD-001',
    title: 'Cloud Computing & Infrastructure Policy',
    version: '2.0',
    last_updated: '2024-03-15',
    owner: 'Kenji Nakamura, Chief Technology Officer',
    department: 'Information Technology',
    region: ['APAC', 'North America'],
    status: 'active',
    applicable_regulations: ['RBI Cloud Framework', 'MAS TRM Guidelines', 'FedRAMP'],
    summary: 'Governs the adoption, deployment, and management of cloud computing services including IaaS, PaaS, and SaaS. Covers security requirements, data residency, vendor assessment, and exit strategies.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-03-15',
    sections: [
      {
        section_id: 'POL-CLOUD-001-S1',
        title: '1. Cloud Service Provider Selection',
        content: 'Cloud providers hosting customer data or critical workloads must hold SOC 2 Type II, ISO 27001, and ISO 27017 certifications. Providers must offer data centers in jurisdictions approved by the bank and support customer-managed encryption keys (BYOK). Multi-cloud strategies are encouraged for Tier 1 workloads to avoid vendor lock-in.'
      },
      {
        section_id: 'POL-CLOUD-001-S2',
        title: '2. Data Residency & Sovereignty',
        content: 'Customer data classified as Restricted or Confidential must reside in cloud regions located within the jurisdiction of the data subjects unless explicit regulatory approval for cross-border hosting is obtained. Payment system data must remain in India per RBI directive. Configuration-as-code must enforce region restrictions programmatically.'
      }
    ]
  },
  {
    policy_id: 'POL-COND-001',
    title: 'Code of Conduct & Business Ethics Policy',
    version: '7.2',
    last_updated: '2024-01-01',
    owner: 'Maria Gonzalez, Chief Compliance Officer',
    department: 'Compliance & Legal',
    region: ['North America', 'EU', 'APAC', 'LATAM', 'Middle East'],
    status: 'active',
    applicable_regulations: ['SOX', 'UK Bribery Act 2010', 'FCPA', 'Indian Companies Act 2013'],
    summary: 'Sets forth the ethical principles and behavioral standards expected of all employees, officers, directors, and contingent workers. Covers conflicts of interest, gift policies, outside activities, and personal trading restrictions.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-01',
    sections: [
      {
        section_id: 'POL-COND-001-S1',
        title: '1. Conflicts of Interest',
        content: 'Employees must disclose all actual, potential, or perceived conflicts of interest to their line manager and the Compliance department annually and whenever circumstances change. This includes outside business activities, board memberships, family member employment at competitors or clients, and personal financial interests in entities with which the bank transacts.'
      },
      {
        section_id: 'POL-COND-001-S2',
        title: '2. Gifts & Entertainment',
        content: 'Employees may not offer or accept gifts or entertainment exceeding USD 100 (or local equivalent) per instance or USD 300 per year per counterparty without prior Compliance approval. Cash gifts are strictly prohibited regardless of value. All gifts given or received must be logged in the Gift & Entertainment Register within 5 business days.'
      }
    ]
  },
  {
    policy_id: 'POL-TRADE-001',
    title: 'Trade Surveillance & Market Abuse Prevention Policy',
    version: '3.5',
    last_updated: '2023-11-01',
    owner: 'Oliver Schmidt, Head of Trading Compliance',
    department: 'Capital Markets Compliance',
    region: ['EU', 'UK', 'North America'],
    status: 'active',
    applicable_regulations: ['MAR (EU 596/2014)', 'MiFID II', 'Dodd-Frank Title VII'],
    summary: 'Establishes the surveillance framework for detecting and preventing market abuse, insider dealing, and market manipulation across all trading activities.',
    business_lines: ['Investment Banking', 'Capital Markets', 'Wealth Management'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-05-01',
    sections: [
      {
        section_id: 'POL-TRADE-001-S1',
        title: '1. Insider Dealing Controls',
        content: 'All employees with access to inside information must be placed on the Insider List and acknowledge the restrictions on trading, tipping, and unlawful disclosure. The Compliance department maintains a Restricted List and Watch List updated daily. Personal account dealing in instruments on the Restricted List is prohibited.'
      },
      {
        section_id: 'POL-TRADE-001-S2',
        title: '2. Suspicious Transaction Reporting (STOR)',
        content: 'The trade surveillance team shall monitor all trading activity using automated pattern-detection algorithms covering spoofing, layering, wash trading, and front-running. Suspicious orders and transactions must be reported to the relevant National Competent Authority via STOR within the legally prescribed timelines (without delay for MAR; 24 hours for Dodd-Frank).'
      }
    ]
  },
  {
    policy_id: 'POL-ISLM-001',
    title: 'Islamic Banking & Shariah Compliance Policy',
    version: '2.1',
    last_updated: '2024-03-20',
    owner: 'Dr. Ahmed Al-Rashid, Head of Shariah Compliance',
    department: 'Islamic Banking',
    region: ['Middle East', 'APAC'],
    status: 'active',
    applicable_regulations: ['AAOIFI Standards', 'IFSB Guidelines', 'Central Bank of UAE Islamic Banking Regulations'],
    summary: 'Governs all Shariah-compliant banking products and services including Murabaha, Ijara, Sukuk, and Takaful. Ensures ongoing compliance with AAOIFI accounting and Shariah standards.',
    business_lines: ['Islamic Retail Banking', 'Islamic Corporate Finance', 'Takaful'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-09-20',
    sections: [
      {
        section_id: 'POL-ISLM-001-S1',
        title: '1. Shariah Board Governance',
        content: 'All Islamic banking products must receive Shariah Board approval before launch. The Shariah Board shall consist of a minimum of 3 qualified Islamic scholars and shall meet at least quarterly. Product modifications require re-certification. The Internal Shariah Audit unit conducts independent compliance reviews and reports directly to the Shariah Board.'
      },
      {
        section_id: 'POL-ISLM-001-S2',
        title: '2. Prohibition of Riba and Gharar',
        content: 'All financial contracts must be free from Riba (interest) and excessive Gharar (uncertainty). Profit rates must be determined through legitimate trade or asset-based structures. Income derived from non-compliant sources must be directed to the Charity Fund and reported in the annual Shariah compliance report.'
      }
    ]
  },
  {
    policy_id: 'POL-ACCREC-001',
    title: 'Account Reconciliation & Financial Controls Policy',
    version: '4.1',
    last_updated: '2023-09-15',
    owner: 'Linda Park, Chief Financial Officer',
    department: 'Finance',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['SOX Section 404', 'IFRS 9', 'Basel III Pillar III Disclosures'],
    summary: 'Establishes standards for daily, monthly, and quarterly account reconciliations across the general ledger, sub-ledgers, and third-party systems to ensure the integrity of financial reporting.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2024-09-15',
    sections: [
      {
        section_id: 'POL-ACCREC-001-S1',
        title: '1. Reconciliation Timeliness',
        content: 'Nostro and Vostro accounts must be reconciled daily with zero tolerance for unreconciled items older than 3 business days. General ledger to sub-ledger reconciliations must be completed within 5 business days of month-end. Suspense account balances must be cleared within 30 calendar days.'
      },
      {
        section_id: 'POL-ACCREC-001-S2',
        title: '2. Break Resolution and Escalation',
        content: 'Reconciliation breaks exceeding USD 50,000 must be escalated to the Financial Controller within 24 hours. Breaks exceeding USD 1 million require notification to the CFO and Head of Internal Audit. Aging breaks older than 60 days are reported to the Audit Committee. All breaks must be root-cause analyzed and documented.'
      }
    ]
  },
  {
    policy_id: 'POL-THRDP-002',
    title: 'Third-Party & Outsourcing Risk Management Policy',
    version: '3.0',
    last_updated: '2024-01-30',
    owner: 'Sarah Mitchell, Head of Third-Party Risk',
    department: 'Enterprise Risk Management',
    region: ['EU', 'UK'],
    status: 'active',
    applicable_regulations: ['EBA Outsourcing Guidelines', 'DORA', 'PRA SS2/21'],
    summary: 'Governs the risk assessment, due diligence, and ongoing monitoring of all third-party service providers including outsourced functions, sub-contractors, and intragroup arrangements.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-30',
    sections: [
      {
        section_id: 'POL-THRDP-002-S1',
        title: '1. Critical & Important Functions',
        content: 'Outsourcing of critical or important functions requires Board-level approval. A comprehensive risk assessment including concentration risk, geographic risk, and substitutability analysis must be completed prior to contracting. The bank must maintain documented exit strategies and transition plans for all critical outsourcing arrangements.'
      },
      {
        section_id: 'POL-THRDP-002-S2',
        title: '2. ICT Concentration Risk (DORA)',
        content: 'Under the Digital Operational Resilience Act (DORA), the bank shall identify and monitor ICT concentration risks arising from dependence on critical ICT third-party service providers. Multi-vendor strategies must be implemented for critical infrastructure services. Annual scenario testing shall simulate the sudden failure of a critical ICT provider.'
      }
    ]
  },
  {
    policy_id: 'POL-CONPROT-001',
    title: 'Consumer Protection & Complaints Handling Policy',
    version: '2.8',
    last_updated: '2024-02-10',
    owner: 'Fatima Al-Sayed, Head of Customer Experience',
    department: 'Customer Service',
    region: ['Middle East', 'APAC'],
    status: 'active',
    applicable_regulations: ['RBI Integrated Ombudsman Scheme 2021', 'CBUAE Consumer Protection Regulation'],
    summary: 'Defines the framework for handling customer complaints, grievance redressal, and fair treatment of consumers across all channels and product lines.',
    business_lines: ['Retail Banking', 'Digital Banking', 'Wealth Management'],
    review_cycle: 'Annual',
    next_review_date: '2025-02-10',
    sections: [
      {
        section_id: 'POL-CONPROT-001-S1',
        title: '1. Complaint Resolution Timelines',
        content: 'All customer complaints must be acknowledged within 24 hours of receipt. Standard complaints shall be resolved within 15 working days. Complex complaints requiring investigation may be extended to 30 working days with written notice to the customer. If the customer is not satisfied, they must be informed of their right to escalate to the Banking Ombudsman.'
      },
      {
        section_id: 'POL-CONPROT-001-S2',
        title: '2. Root Cause Analysis',
        content: 'Monthly root cause analysis of complaints data must be performed to identify systemic issues. Products or processes generating more than 50 complaints per month or showing a 20% month-on-month increase must be flagged for immediate review by the relevant business head and the Consumer Protection Committee.'
      }
    ]
  },
  {
    policy_id: 'POL-TAX-001',
    title: 'Global Tax Compliance & Reporting Policy',
    version: '3.4',
    last_updated: '2024-01-15',
    owner: 'Richard Mbeki, Group Head of Tax',
    department: 'Finance & Tax',
    region: ['North America', 'EU', 'Africa'],
    status: 'active',
    applicable_regulations: ['FATCA', 'CRS', 'BEPS Pillar Two', 'OECD MLI'],
    summary: 'Establishes the framework for global tax compliance, automatic exchange of information, transfer pricing, and adherence to the OECD Base Erosion and Profit Shifting (BEPS) framework including Pillar Two global minimum tax.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-15',
    sections: [
      {
        section_id: 'POL-TAX-001-S1',
        title: '1. FATCA & CRS Reporting',
        content: 'The bank shall identify all reportable accounts under FATCA and CRS through self-certification at onboarding and periodic remediation. Reportable information including account balances, interest, dividends, and gross proceeds must be submitted to the relevant tax authority by the prescribed deadline (March 31 for FATCA, June 30 for CRS in most jurisdictions).'
      },
      {
        section_id: 'POL-TAX-001-S2',
        title: '2. BEPS Pillar Two — Global Minimum Tax',
        content: 'The bank shall compute its effective tax rate (ETR) in each jurisdiction where it operates using the GloBE rules. Where the ETR falls below 15%, a top-up tax computation must be prepared and provisioned. Country-by-Country Reporting (CbCR) data must be maintained and filed in all applicable jurisdictions within 12 months of fiscal year-end.'
      }
    ]
  },
  {
    policy_id: 'POL-PRIV-002',
    title: 'Cookie Consent & Digital Tracking Policy',
    version: '1.6',
    last_updated: '2024-03-10',
    owner: 'Sophia Laurent, Data Privacy Manager',
    department: 'Digital Banking',
    region: ['EU', 'UK'],
    status: 'active',
    applicable_regulations: ['GDPR', 'ePrivacy Directive', 'UK PECR'],
    summary: 'Governs the use of cookies, web beacons, pixels, and other tracking technologies across the bank\'s digital properties. Ensures valid consent collection and provides granular opt-out mechanisms.',
    business_lines: ['Digital Banking', 'Retail Banking'],
    review_cycle: 'Annual',
    next_review_date: '2025-03-10',
    sections: [
      {
        section_id: 'POL-PRIV-002-S1',
        title: '1. Consent Management Platform',
        content: 'All websites and mobile applications must implement a Consent Management Platform (CMP) compliant with IAB TCF v2.2. Non-essential cookies must not be set until affirmative consent is obtained. Pre-ticked checkboxes do not constitute valid consent. Consent records must be stored for a minimum of 3 years for audit purposes.'
      },
      {
        section_id: 'POL-PRIV-002-S2',
        title: '2. Third-Party Trackers',
        content: 'No third-party tracking scripts (including analytics, advertising, and social media pixels) shall be deployed without Data Protection Impact Assessment (DPIA) review. All third-party trackers must be inventoried in the Cookie Register with their purpose, data collected, and retention period documented.'
      }
    ]
  },
  {
    policy_id: 'POL-ACCESS-001',
    title: 'Identity & Access Management Policy',
    version: '4.5',
    last_updated: '2024-02-28',
    owner: 'Yuki Tanabe, Head of IAM',
    department: 'Information Security',
    region: ['APAC', 'North America', 'EU'],
    status: 'active',
    applicable_regulations: ['NIST 800-53', 'ISO 27001 Annex A.9', 'RBI Cyber Security Framework'],
    summary: 'Defines the standards for managing digital identities, access provisioning, privileged access, and periodic access recertification across all systems and applications.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-08-28',
    sections: [
      {
        section_id: 'POL-ACCESS-001-S1',
        title: '1. Least Privilege & Role-Based Access',
        content: 'Access to systems and data shall be granted on a need-to-know, least-privilege basis using Role-Based Access Control (RBAC). All access requests must be approved by the data owner and line manager. Privileged accounts (system admin, DBA, root) require additional CISO approval and must use separate credentials from standard user accounts.'
      },
      {
        section_id: 'POL-ACCESS-001-S2',
        title: '2. Access Recertification',
        content: 'Access rights for all users must be recertified by their managers quarterly for critical systems and semi-annually for standard systems. Orphaned accounts (no associated active employee) must be disabled within 24 hours of detection. Terminated employee accounts must be revoked within 1 hour of employment termination notification.'
      }
    ]
  },
  {
    policy_id: 'POL-PAYMT-001',
    title: 'Payment Systems & Real-Time Settlement Policy',
    version: '2.2',
    last_updated: '2024-04-10',
    owner: 'Hans Mueller, Head of Payments',
    department: 'Payments & Transaction Banking',
    region: ['EU', 'UK'],
    status: 'under_review',
    applicable_regulations: ['PSD2', 'Instant Payments Regulation (EU)', 'UK PSR'],
    summary: 'Governs the operation of payment systems, real-time settlement, strong customer authentication, and open banking APIs in compliance with PSD2 and the EU Instant Payments Regulation.',
    business_lines: ['Retail Banking', 'Corporate Banking', 'Transaction Banking'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-10-10',
    sections: [
      {
        section_id: 'POL-PAYMT-001-S1',
        title: '1. Strong Customer Authentication (SCA)',
        content: 'All electronic payment transactions must apply Strong Customer Authentication (SCA) combining at least two independent factors from: knowledge (password/PIN), possession (phone/token), and inherence (biometric). Exemptions for low-value transactions (below EUR 30), trusted beneficiaries, and recurring payments must be applied in accordance with RTS on SCA.'
      },
      {
        section_id: 'POL-PAYMT-001-S2',
        title: '2. Instant Payment Reachability',
        content: 'The bank must be reachable for receiving instant SEPA credit transfers 24/7/365 with a maximum processing time of 10 seconds. IBAN verification services must be implemented to prevent misdirected payments. Instant payment fraud screening must operate within the 10-second processing window without introducing delays.'
      }
    ]
  },
  {
    policy_id: 'POL-WLTH-001',
    title: 'Suitability & Investment Advisory Standards',
    version: '3.8',
    last_updated: '2023-12-15',
    owner: 'Charles Beaumont, Head of Wealth Advisory',
    department: 'Wealth Management',
    region: ['North America', 'EU', 'APAC'],
    status: 'active',
    applicable_regulations: ['MiFID II', 'SEC Regulation Best Interest', 'SEBI PMS Regulations'],
    summary: 'Establishes suitability assessment standards for investment advisory and portfolio management services. Ensures client risk profiles are accurately assessed and investment recommendations are suitable.',
    business_lines: ['Wealth Management', 'Private Banking'],
    review_cycle: 'Annual',
    next_review_date: '2024-12-15',
    sections: [
      {
        section_id: 'POL-WLTH-001-S1',
        title: '1. Client Risk Profiling',
        content: 'Prior to providing investment advice, a comprehensive risk profiling assessment must be conducted covering: investment objectives, time horizon, risk tolerance, risk capacity (financial situation), knowledge and experience, and sustainability preferences (under MiFID II ESG amendments). Risk profiles must be reviewed annually or upon material life events.'
      },
      {
        section_id: 'POL-WLTH-001-S2',
        title: '2. Product Governance & Target Market',
        content: 'All investment products offered must have a defined target market based on client type, risk profile, investment horizon, and objectives. Products must not be distributed outside their target market. Negative target markets must be explicitly documented. Product manufacturers must share target market assessments with distributors.'
      }
    ]
  },
  {
    policy_id: 'POL-REC-001',
    title: 'Records Retention & Archival Policy',
    version: '5.0',
    last_updated: '2023-08-01',
    owner: 'Angela Wright, Head of Records Management',
    department: 'Operations',
    region: ['North America', 'EU', 'UK'],
    status: 'active',
    applicable_regulations: ['SEC Rule 17a-4', 'FCA SYSC 9', 'GDPR Art. 5(1)(e)'],
    summary: 'Defines the retention periods, storage requirements, and disposal procedures for all categories of business records including electronic communications, transaction records, and contractual documents.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2024-08-01',
    sections: [
      {
        section_id: 'POL-REC-001-S1',
        title: '1. Retention Schedule',
        content: 'Transaction records: 10 years. KYC/CDD documentation: 5 years after account closure. Electronic communications (emails, chat): 7 years. Board and committee minutes: permanent. Audit working papers: 7 years. Employment records: 6 years after termination. CCTV footage: 90 days unless related to an investigation.'
      },
      {
        section_id: 'POL-REC-001-S2',
        title: '2. Legal Hold',
        content: 'Upon receiving notification of litigation, regulatory investigation, or audit, a Legal Hold must be issued immediately to preserve all potentially relevant records. Legal Holds override standard retention schedules and disposal processes. Destruction of records subject to a Legal Hold constitutes obstruction and may result in severe sanctions.'
      }
    ]
  },
  {
    policy_id: 'POL-CYBER-003',
    title: 'Penetration Testing & Vulnerability Management Policy',
    version: '2.9',
    last_updated: '2024-04-15',
    owner: 'Victor Okafor, Head of Cyber Defense',
    department: 'Information Security',
    region: ['Africa', 'EU', 'North America'],
    status: 'active',
    applicable_regulations: ['PCI-DSS v4.0', 'NIST CSF', 'CBN Cybersecurity Framework'],
    summary: 'Establishes the requirements for periodic vulnerability assessments, penetration testing, and timely remediation of identified security vulnerabilities across all technology assets.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Semi-Annual',
    next_review_date: '2024-10-15',
    sections: [
      {
        section_id: 'POL-CYBER-003-S1',
        title: '1. Penetration Testing Frequency',
        content: 'External penetration tests must be conducted at least annually and after any significant infrastructure change. Internal penetration tests including red team exercises shall be performed semi-annually. Web application penetration tests are required before each major release and quarterly for internet-facing applications. All testing must be performed by CREST or OSCP certified testers.'
      },
      {
        section_id: 'POL-CYBER-003-S2',
        title: '2. Vulnerability Remediation SLAs',
        content: 'Critical vulnerabilities (CVSS 9.0+): remediation within 48 hours, compensating controls within 24 hours. High vulnerabilities (CVSS 7.0-8.9): remediation within 7 days. Medium vulnerabilities (CVSS 4.0-6.9): remediation within 30 days. Low vulnerabilities: remediation within 90 days. Vulnerabilities in internet-facing systems have SLAs reduced by 50%.'
      }
    ]
  },
  {
    policy_id: 'POL-MODVAL-001',
    title: 'Model Validation & Governance Policy',
    version: '2.3',
    last_updated: '2024-01-20',
    owner: 'Dr. Mei Zhang, Head of Model Risk',
    department: 'Quantitative Risk',
    region: ['North America', 'EU'],
    status: 'active',
    applicable_regulations: ['SR 11-7 (Fed)', 'ECB TRIM', 'PRA SS3/18'],
    summary: 'Defines the model risk management lifecycle including development, validation, approval, monitoring, and retirement of all quantitative models used for risk measurement, pricing, and capital calculations.',
    business_lines: ['Capital Markets', 'Credit Risk', 'Treasury'],
    review_cycle: 'Annual',
    next_review_date: '2025-01-20',
    sections: [
      {
        section_id: 'POL-MODVAL-001-S1',
        title: '1. Model Tiering & Validation Frequency',
        content: 'Models are tiered based on materiality and complexity: Tier 1 (regulatory capital models, pricing models for illiquid instruments) require independent validation annually. Tier 2 (management reporting models, stress testing) require validation every 18 months. Tier 3 (operational models, simple calculators) require validation every 3 years. All model changes require re-validation commensurate with the change significance.'
      },
      {
        section_id: 'POL-MODVAL-001-S2',
        title: '2. Model Inventory & Documentation',
        content: 'All models must be registered in the centralized Model Inventory with complete documentation including: theoretical basis, assumptions, limitations, data sources, implementation details, and performance metrics. Undocumented models are prohibited from production use. Shadow IT models discovered outside the inventory must be immediately reported and assessed.'
      }
    ]
  },
  {
    policy_id: 'POL-DIVER-001',
    title: 'Diversity, Equity & Inclusion Policy',
    version: '1.3',
    last_updated: '2024-03-08',
    owner: 'Aisha Patel, Chief Diversity Officer',
    department: 'Human Resources',
    region: ['North America', 'EU', 'APAC', 'UK'],
    status: 'active',
    applicable_regulations: ['UK Equality Act 2010', 'Title VII Civil Rights Act', 'EU Pay Transparency Directive'],
    summary: 'Establishes the firm\'s commitment to fostering an inclusive workplace, eliminating discrimination, and ensuring equitable representation, pay, and career progression opportunities.',
    business_lines: ['All Business Lines'],
    review_cycle: 'Annual',
    next_review_date: '2025-03-08',
    sections: [
      {
        section_id: 'POL-DIVER-001-S1',
        title: '1. Pay Equity & Transparency',
        content: 'The bank shall conduct annual pay equity analyses across gender, ethnicity, and other protected characteristics. Unexplained pay gaps exceeding 5% must trigger remediation plans within 6 months. Under the EU Pay Transparency Directive, pay ranges must be disclosed in job postings and employees have the right to request average pay information by gender for comparable roles.'
      },
      {
        section_id: 'POL-DIVER-001-S2',
        title: '2. Inclusive Hiring Practices',
        content: 'All interview panels for senior roles must include at least one member from an underrepresented group. Job descriptions must use gender-neutral language verified by bias-detection tools. Shortlists for leadership positions (VP and above) must include a minimum of 30% candidates from underrepresented groups (Rooney Rule equivalent). Hiring managers must complete unconscious bias training annually.'
      }
    ]
  }
];
