/**
 * UBS Continuous Regulatory Change Manager
 * Regulatory Updates Mock Data
 *
 * Contains 6 regulatory update objects representing different ingestion scenarios:
 *   1. DPDP Act Consent Management (Clearly Applicable)
 *   2. RBI Digital Lending Circular (Clearly Applicable)
 *   3. EU AI Act Cross-Border (Multi-Jurisdiction)
 *   4. Ambiguous Tax Reform (Requires Escalation)
 *   5. Duplicate SEBI Circular (Duplicate Detection)
 *   6. Malformed RBI Notification (Partial/Malformed)
 */

window.APP_DATA = window.APP_DATA || {};

window.APP_DATA.regulatoryUpdates = [
  // ────────────────────────────────────────────────────────────────
  // UPDATE 1 — DPDP Act: Consent Management (CLEARLY APPLICABLE)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-001',
    source_authority: 'Ministry of Electronics and Information Technology (MeitY)',
    source_type: 'Act / Primary Legislation',
    source_url: 'https://www.meity.gov.in/dpdp-act-2023',
    publication_timestamp: '2024-01-15T10:00:00Z',
    effective_date: '2024-06-01',
    jurisdiction: 'APAC',
    document_title: 'Digital Personal Data Protection Act, 2023 — Section 6: Consent Requirements',
    document_format: 'PDF',
    extracted_text:
      'Section 6 of the Digital Personal Data Protection Act, 2023 establishes comprehensive requirements for the collection and processing of consent from Data Principals. ' +
      'Every Data Fiduciary shall, before processing any personal data of a Data Principal, obtain the free, specific, informed, unconditional, and unambiguous consent of the Data Principal. ' +
      'Consent must be sought for a specified purpose and shall be limited to such personal data as is necessary for that specified purpose. ' +
      'The request for consent shall be presented in clear and plain language, accompanied by an itemised description of the personal data sought to be collected, the purpose of processing, and the manner in which the Data Principal may exercise her rights under this Act. ' +
      'Where a Data Fiduciary engages a Consent Manager registered with the Data Protection Board, the Consent Manager shall act as a single point of contact to enable the Data Principal to give, manage, review, and withdraw consent through an accessible, transparent, and interoperable platform.\n\n' +

      'Withdrawal of consent shall be made as easy as the giving of consent. Upon receipt of a clear and specific notice of withdrawal, the Data Fiduciary shall cease processing the personal data of the Data Principal within a reasonable period not exceeding seven working days, ' +
      'unless such processing is required under any law for the time being in force or for compliance with any order of a court or tribunal. The Data Fiduciary shall, upon cessation of processing, cause the erasure of the personal data unless retention is required by law. ' +
      'The burden of demonstrating that valid consent was obtained from the Data Principal shall rest upon the Data Fiduciary at all times. ' +
      'A Data Fiduciary that processes personal data without valid consent or beyond the scope of consent granted shall be subject to penalties as specified in Section 33, which may extend to two hundred and fifty crore rupees per instance of contravention.\n\n' +

      'Financial institutions acting as Data Fiduciaries shall implement auditable consent trails that record the timestamp, scope, purpose, and medium of each consent interaction. ' +
      'The consent mechanism must support granular, purpose-specific permissions and must not bundle consent for unrelated processing activities. ' +
      'Where existing customer relationships predate the commencement of this Act, Data Fiduciaries shall undertake a re-consent exercise within twelve months of the effective date, ' +
      'providing Data Principals with a clear itemisation of all ongoing processing activities and an opportunity to grant or withhold consent for each activity independently.\n\n' +

      'The Data Protection Board may, by notification, specify standards for consent artefacts, including machine-readable formats, interoperability requirements, and minimum information elements. ' +
      'Significant Data Fiduciaries, as notified by the Central Government, shall additionally appoint a Data Protection Officer who shall oversee consent management practices, ' +
      'conduct periodic audits of consent records, and submit compliance reports to the Board at such intervals as may be prescribed.',

    referenced_regulations: [
      'DPDP Act 2023 Section 4',
      'DPDP Act 2023 Section 5',
      'RBI Master Direction on IT Governance'
    ],
    business_line_scope: ['Retail Banking', 'Wealth Management', 'Digital Banking'],
    existing_internal_policy_refs: ['POL-DP-001', 'POL-DP-003'],
    status: 'pending',
    priority: 'high'
  },

  // ────────────────────────────────────────────────────────────────
  // UPDATE 2 — RBI Digital Lending Circular (CLEARLY APPLICABLE)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-002',
    source_authority: 'Reserve Bank of India (RBI)',
    source_type: 'Circular / Regulatory Direction',
    source_url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
    publication_timestamp: '2024-02-20T14:30:00Z',
    effective_date: '2024-04-01',
    jurisdiction: 'APAC',
    document_title: 'Guidelines on Digital Lending — Enhanced Disclosure Requirements',
    document_format: 'PDF',
    extracted_text:
      'In exercise of the powers conferred under Sections 21 and 35A of the Banking Regulation Act, 1949, the Reserve Bank of India hereby issues the following supplementary guidelines on digital lending disclosures. ' +
      'All Regulated Entities (REs) engaged in digital lending, whether directly or through Lending Service Providers (LSPs), shall ensure that the Key Fact Statement (KFS) provided to borrowers at the time of loan sanction includes the following mandatory disclosures: ' +
      '(a) the Annual Percentage Rate (APR) computed on a standardised basis as specified in Annex-I; ' +
      '(b) the all-inclusive cost of the loan expressed both as an absolute amount and as an annualised percentage, inclusive of processing fees, insurance charges, documentation charges, and any other charges levied by the RE or its LSPs; ' +
      '(c) the cooling-off or look-up period, during which the borrower may exit the loan without penalty, which shall not be less than three working days from the date of disbursement; ' +
      '(d) the name, address, and contact details of the grievance redressal officer of the RE, along with the escalation matrix and the timelines for resolution of complaints.\n\n' +

      'Where lending is facilitated through a Lending Service Provider, the RE shall ensure that the LSP prominently discloses its role as an agent of the RE, along with the name and registration details of the RE. ' +
      'The LSP shall not, at any point during the customer journey, represent itself as the lender or create an impression that the credit decision rests with the LSP. ' +
      'All fees and charges payable to the LSP shall be paid by the RE and not by the borrower directly. Any deviation from this requirement shall be treated as a violation of fair practices and shall attract regulatory action. ' +
      'The RE shall maintain a real-time registry of all active LSPs and Digital Lending Apps (DLAs) associated with it, which shall be published on the RE\'s website and updated within seven days of any change.\n\n' +

      'With effect from the date of this circular, all REs shall implement a standardised digital consent framework for digital lending that captures borrower acknowledgement of the KFS prior to disbursement. ' +
      'The consent framework shall generate an auditable trail and shall be integrated with the RE\'s core banking system. ' +
      'REs that fail to comply with the enhanced disclosure requirements by the effective date shall be subject to supervisory action, ' +
      'including restrictions on fresh digital lending operations until compliance is demonstrated to the satisfaction of the Reserve Bank.\n\n' +

      'The existing guidelines issued vide Circular DOR.FIN.REC.85/03.10.038/2022-23 dated September 2, 2022, shall be read in conjunction with the provisions of this circular. ' +
      'In case of any inconsistency between the earlier circular and this circular, the provisions of this circular shall prevail. ' +
      'REs shall submit a compliance certificate to the Department of Regulation within sixty days of the effective date of this circular, ' +
      'signed by the Chief Compliance Officer, certifying that all systems, processes, and customer-facing disclosures have been updated in accordance with these guidelines.',

    referenced_regulations: [
      'RBI Circular DOR.FIN.REC.85/03.10.038/2022-23',
      'Fair Practices Code'
    ],
    business_line_scope: ['Retail Banking', 'Consumer Lending', 'Digital Banking'],
    existing_internal_policy_refs: ['POL-DL-001'],
    status: 'pending',
    priority: 'high'
  },

  // ────────────────────────────────────────────────────────────────
  // UPDATE 3 — EU AI Act Cross-Border (MULTI-JURISDICTION)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-003',
    source_authority: 'European Parliament & Council',
    source_type: 'Regulation',
    source_url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    publication_timestamp: '2024-03-13T09:00:00Z',
    effective_date: '2025-08-02',
    jurisdiction: 'EU',
    document_title: 'Regulation (EU) 2024/1689 — Artificial Intelligence Act: High-Risk AI Systems in Financial Services',
    document_format: 'PDF',
    extracted_text:
      'Regulation (EU) 2024/1689 of the European Parliament and of the Council, commonly referred to as the AI Act, establishes harmonised rules for the development, placing on the market, and use of artificial intelligence systems within the Union. ' +
      'Annex III of the Regulation identifies AI systems used in the evaluation of creditworthiness of natural persons, the assessment of insurance risk, and the pricing of life and health insurance as high-risk AI systems pursuant to Article 6(2). ' +
      'Financial institutions deploying such systems shall comply with the requirements laid down in Chapter III, Section 2, including: ' +
      '(a) the implementation of a risk management system that is established, documented, and maintained throughout the entire lifecycle of the AI system; ' +
      '(b) the use of training, validation, and testing data sets that are relevant, sufficiently representative, and to the greatest extent possible free of errors and biases; ' +
      '(c) the provision of transparency to deployers, including comprehensive technical documentation and instructions of use; and ' +
      '(d) the design of the system to allow effective human oversight, including the ability for the human overseer to understand the system\'s capabilities and limitations, ' +
      'to correctly interpret its output, and to override or reverse its decisions.\n\n' +

      'Article 27 requires deployers of high-risk AI systems to conduct a fundamental rights impact assessment prior to deployment, evaluating the potential effects on the rights to non-discrimination, privacy, data protection, consumer protection, and due process. ' +
      'For AI systems used in credit scoring, the impact assessment shall specifically address the risk of discriminatory outcomes across protected characteristics including gender, racial or ethnic origin, disability, and age. ' +
      'Deployers shall implement appropriate mitigation measures and shall make the results of the impact assessment available to the relevant market surveillance authority upon request. ' +
      'The financial supervisory authority of each Member State may impose additional requirements on the deployment of AI systems in the financial sector, consistent with existing sectoral legislation including CRD IV and MiFID II.\n\n' +

      'Third-country financial institutions that deploy high-risk AI systems whose output is used within the territory of the Union shall be considered deployers for the purposes of this Regulation. ' +
      'This provision has significant implications for Indian banks and financial institutions with branches, subsidiaries, or EU-facing operations, ' +
      'as they will be required to comply with the full set of requirements for high-risk AI systems when those systems are used to make decisions affecting individuals located in the European Union. ' +
      'The compliance timeline provides for a phased approach: prohibited AI practices take effect twelve months after entry into force, ' +
      'codes of practice for general-purpose AI systems take effect after nine months, and obligations for high-risk AI systems listed in Annex III take full effect thirty-six months after entry into force.\n\n' +

      'Financial institutions are advised to undertake a comprehensive inventory of all AI systems currently in use or in development across their EU operations, ' +
      'classify each system according to the risk categories established by the Regulation, and develop a remediation roadmap for systems identified as high-risk. ' +
      'Penalties for non-compliance may reach up to 35 million euros or 7% of total worldwide annual turnover, whichever is higher, for the use of prohibited AI practices, ' +
      'and up to 15 million euros or 3% of total worldwide annual turnover for other infringements.',

    referenced_regulations: [
      'GDPR Article 22',
      'MiFID II',
      'CRD IV'
    ],
    business_line_scope: ['Investment Banking', 'Wealth Management', 'Risk Management', 'Retail Banking EU'],
    existing_internal_policy_refs: ['POL-AI-001', 'POL-EU-002'],
    status: 'pending',
    priority: 'medium'
  },

  // ────────────────────────────────────────────────────────────────
  // UPDATE 4 — Ambiguous Tax Reform (REQUIRES ESCALATION)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-004',
    source_authority: 'Central Board of Direct Taxes (CBDT)',
    source_type: 'Notification',
    source_url: 'https://incometaxindia.gov.in/communications/notification/notification-2024.htm',
    publication_timestamp: '2024-04-05T16:00:00Z',
    effective_date: '2024-07-01',
    jurisdiction: 'APAC',
    document_title: 'Amendment to Section 194-O: TDS on E-Commerce Transactions — Applicability to Banking Platforms',
    document_format: 'PDF',
    extracted_text:
      'In exercise of the powers conferred by sub-section (1) of Section 194-O read with Section 295 of the Income-tax Act, 1961, the Central Board of Direct Taxes hereby notifies the following amendment. ' +
      'The definition of "e-commerce operator" under Explanation (a) to Section 194-O shall be deemed to include any person who owns, operates, or manages a digital or electronic facility or platform for electronic commerce, ' +
      'including any platform that facilitates the sale of goods or provision of services, or both, by one or more participants to one or more buyers. ' +
      'For the purposes of this notification, the expression "platform that facilitates" may include, but is not limited to, banking platforms, marketplace aggregators, payment intermediaries, ' +
      'and other digital interfaces where transactions between participants and buyers are concluded or settled, directly or indirectly, whether or not the platform operator takes title to the goods or services. ' +
      'The applicability of this provision to platforms operated by banking companies as defined under Section 5(c) of the Banking Regulation Act, 1949, ' +
      'shall be determined based on the predominant nature of the transactions facilitated, having regard to such factors as may be prescribed by the Board from time to time.\n\n' +

      'Where a banking platform offers a marketplace feature enabling third-party merchants to offer products or services to the bank\'s customers, ' +
      'the question of whether the bank is acting as an e-commerce operator or merely as a payment processor shall depend on the degree of control, commercial participation, and facilitation services provided by the bank. ' +
      'The Board may, at a future date, issue clarificatory guidelines specifying the criteria for distinguishing between passive payment processing and active marketplace facilitation. ' +
      'Until such clarificatory guidelines are issued, banking companies shall exercise due diligence and adopt a prudent interpretation of their obligations under this section, ' +
      'taking into account the purpose and objects of Section 194-O, the nature and substance of the transactions, and any relevant judicial pronouncements or advance rulings.',

    referenced_regulations: [
      'Income Tax Act Section 194-O',
      'Finance Act 2024'
    ],
    business_line_scope: ['Digital Banking', 'Payment Services'],
    existing_internal_policy_refs: [],
    status: 'pending',
    priority: 'medium'
  },

  // ────────────────────────────────────────────────────────────────
  // UPDATE 5 — Duplicate SEBI Circular (DUPLICATE DETECTION)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-005',
    source_authority: 'Securities and Exchange Board of India (SEBI)',
    source_type: 'Circular',
    source_url: 'https://www.sebi.gov.in/legal/circulars/mar-2024/kyc-requirements-mutual-fund-distributors_82145.html',
    publication_timestamp: '2024-03-15T11:00:00Z',
    effective_date: '2024-06-01',
    jurisdiction: 'APAC',
    document_title: 'SEBI Circular on KYC Requirements for Mutual Fund Distributors',
    document_format: 'PDF',
    extracted_text:
      'In continuation of SEBI\'s ongoing efforts to strengthen the Know Your Customer (KYC) framework applicable to intermediaries, this circular reiterates and consolidates the existing KYC requirements for mutual fund distributors registered with the Association of Mutual Funds in India (AMFI). ' +
      'All mutual fund distributors and their employees who interact with investors shall undergo KYC verification in accordance with the SEBI (KYC Registration Agency) Regulations, 2011, read with the Prevention of Money Laundering Act, 2002, ' +
      'and the Rules framed thereunder. The KYC process shall include verification of identity through officially valid documents, address verification, in-person verification or video-based identification where applicable, ' +
      'and periodic re-verification at intervals not exceeding two years. Distributors shall maintain updated records and shall immediately notify the registrar of any change in their particulars.\n\n' +

      'Asset Management Companies and their registrars and transfer agents shall ensure that no commission or brokerage is credited to a distributor whose KYC status is expired, incomplete, or under review. ' +
      'The existing SEBI Master Circular on KYC norms, as amended from time to time, shall continue to apply. This circular is issued in the interest of investors and of the securities market and shall come into effect from June 1, 2024. ' +
      'All Asset Management Companies and mutual fund distributors are advised to take necessary steps to ensure compliance with these requirements within the stipulated timelines.',

    referenced_regulations: [
      'SEBI KYC Registration Agency Regulations 2011',
      'PMLA 2002'
    ],
    business_line_scope: ['Wealth Management', 'Asset Management'],
    existing_internal_policy_refs: ['POL-KYC-001'],
    status: 'pending',
    priority: 'low',
    is_duplicate_of: 'REG-2023-042'
  },

  // ────────────────────────────────────────────────────────────────
  // UPDATE 6 — Malformed RBI Notification (PARTIAL / MALFORMED)
  // ────────────────────────────────────────────────────────────────
  {
    update_id: 'REG-2024-006',
    source_authority: 'Reserve Bank of India (RBI)',
    source_type: 'Notification',
    source_url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12590',
    publication_timestamp: '2024-04-10T08:45:00Z',
    effective_date: null,
    jurisdiction: 'APAC',
    document_title: '',
    document_format: 'PDF (Corrupted)',
    extracted_text:
      '[OCR EXTRACTION PARTIAL] ...banks shall ensure that all branches and digital channels maintain... compliance with the revised framework for... ' +
      '[UNREADABLE] ...within 90 days of the issuance of this notification, Regulated Entities shall submit... ' +
      '[PAGE MISSING — Pages 2 through 4 could not be extracted due to document corruption] ...penalties as specified in Section... ' +
      '[EXTRACTION FAILED — Remaining content unrecoverable. Confidence score: 0.23. Recommend manual retrieval from source authority.]',

    referenced_regulations: [],
    business_line_scope: [],
    existing_internal_policy_refs: [],
    status: 'pending',
    priority: 'unknown',
    extraction_confidence: 0.23,
    extraction_errors: [
      'Page 2-4 corrupted',
      'OCR confidence below threshold',
      'Missing document title',
      'Missing effective date'
    ]
  }
];
