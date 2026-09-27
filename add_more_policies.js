const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const policies = [
    {
        policy_id: 'POL-IT-401',
        title: 'Acceptable Use of IT Resources',
        department: 'Information Technology',
        status: 'Active',
        version: '4.1',
        summary: 'Defines the acceptable and unacceptable use of company-owned computing systems, networks, and communication tools.',
        owner: 'IT Director',
        last_updated: '2025-08-11',
        review_cycle: 'Annual',
        next_review_date: '2026-08-11',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. General Use and Ownership', content: 'All computing devices, network infrastructure, and communication tools provided by the company remain the sole property of the company. Users should have no expectation of privacy when using corporate systems.', text: 'All computing devices, network infrastructure, and communication tools provided by the company remain the sole property of the company. Users should have no expectation of privacy when using corporate systems.' },
            { id: 'sec2', title: '2. Security and Proprietary Information', content: 'Employees must take all necessary steps to prevent unauthorized access to proprietary information. Passwords must be at least 14 characters long and rotated every 90 days. Screen locks must activate after 5 minutes of inactivity.', text: 'Employees must take all necessary steps to prevent unauthorized access to proprietary information. Passwords must be at least 14 characters long and rotated every 90 days. Screen locks must activate after 5 minutes of inactivity.' },
            { id: 'sec3', title: '3. Unacceptable Use', content: 'Under no circumstances is an employee authorized to engage in any activity that is illegal under local, state, federal or international law while utilizing company-owned resources. Introduction of malicious programs into the network or server (e.g., viruses, worms, Trojan horses, e-mail bombs, etc.) is strictly prohibited.', text: 'Under no circumstances is an employee authorized to engage in any activity that is illegal under local, state, federal or international law while utilizing company-owned resources. Introduction of malicious programs into the network or server (e.g., viruses, worms, Trojan horses, e-mail bombs, etc.) is strictly prohibited.' }
        ]),
        change_history_json: JSON.stringify([])
    },
    {
        policy_id: 'POL-COMP-505',
        title: 'Anti-Bribery and Corruption Policy',
        department: 'Compliance',
        status: 'Active',
        version: '2.0',
        summary: 'Establishes the organizations commitment to conducting business with integrity and zero tolerance for bribery.',
        owner: 'Chief Compliance Officer',
        last_updated: '2025-11-01',
        review_cycle: 'Annual',
        next_review_date: '2026-11-01',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Policy Statement', content: 'The company operates a zero-tolerance approach to bribery and corruption. We are committed to acting professionally, fairly, and with integrity in all our business dealings and relationships wherever we operate.', text: 'The company operates a zero-tolerance approach to bribery and corruption. We are committed to acting professionally, fairly, and with integrity in all our business dealings and relationships wherever we operate.' },
            { id: 'sec2', title: '2. Gifts and Hospitality', content: 'This policy does not prohibit normal and appropriate hospitality (given and received) to or from third parties. However, any gift over $100 must be declared in the Gift Register and approved by a line manager.', text: 'This policy does not prohibit normal and appropriate hospitality (given and received) to or from third parties. However, any gift over $100 must be declared in the Gift Register and approved by a line manager.' },
            { id: 'sec3', title: '3. Facilitation Payments', content: 'We do not make, and will not accept, facilitation payments or "kickbacks" of any kind. Facilitation payments are typically small, unofficial payments made to secure or expedite a routine government action by a government official.', text: 'We do not make, and will not accept, facilitation payments or "kickbacks" of any kind. Facilitation payments are typically small, unofficial payments made to secure or expedite a routine government action by a government official.' }
        ]),
        change_history_json: JSON.stringify([])
    },
    {
        policy_id: 'POL-RISK-610',
        title: 'Vendor Risk Management',
        department: 'Risk Management',
        status: 'Active',
        version: '1.5',
        summary: 'Outlines the procedures for assessing and monitoring risks associated with third-party vendors and service providers.',
        owner: 'Head of Vendor Management',
        last_updated: '2026-02-15',
        review_cycle: 'Biannual',
        next_review_date: '2026-08-15',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Vendor Due Diligence', content: 'Before onboarding any new vendor, a comprehensive risk assessment must be completed. This includes evaluating their financial stability, information security posture, and compliance history.', text: 'Before onboarding any new vendor, a comprehensive risk assessment must be completed. This includes evaluating their financial stability, information security posture, and compliance history.' },
            { id: 'sec2', title: '2. Contractual Requirements', content: 'All vendor contracts must include right-to-audit clauses, specific Service Level Agreements (SLAs), and explicit data protection addendums (DPAs) if the vendor will handle personally identifiable information (PII).', text: 'All vendor contracts must include right-to-audit clauses, specific Service Level Agreements (SLAs), and explicit data protection addendums (DPAs) if the vendor will handle personally identifiable information (PII).' },
            { id: 'sec3', title: '3. Continuous Monitoring', content: 'High-risk vendors must be audited annually. Any vendor experiencing a data breach must notify the company within 24 hours of discovery.', text: 'High-risk vendors must be audited annually. Any vendor experiencing a data breach must notify the company within 24 hours of discovery.' }
        ]),
        change_history_json: JSON.stringify([])
    },
    {
        policy_id: 'POL-OPS-720',
        title: 'Business Continuity and Disaster Recovery',
        department: 'Operations',
        status: 'Active',
        version: '3.2',
        summary: 'Provides the framework for maintaining business operations during unexpected disruptions and restoring IT services.',
        owner: 'VP of Operations',
        last_updated: '2025-12-10',
        review_cycle: 'Annual',
        next_review_date: '2026-12-10',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Recovery Time Objectives (RTO)', content: 'Tier 1 (Mission Critical) systems must have an RTO of 4 hours. Tier 2 systems have an RTO of 24 hours. Tier 3 systems have an RTO of 72 hours.', text: 'Tier 1 (Mission Critical) systems must have an RTO of 4 hours. Tier 2 systems have an RTO of 24 hours. Tier 3 systems have an RTO of 72 hours.' },
            { id: 'sec2', title: '2. Data Backup Strategy', content: 'Full system backups must be performed weekly, with incremental backups performed daily. All backups must be encrypted at rest and stored in a geographically isolated secondary region.', text: 'Full system backups must be performed weekly, with incremental backups performed daily. All backups must be encrypted at rest and stored in a geographically isolated secondary region.' },
            { id: 'sec3', title: '3. Testing and Drills', content: 'A full disaster recovery failover drill must be conducted annually. Tabletop exercises for the incident response team must occur bi-annually.', text: 'A full disaster recovery failover drill must be conducted annually. Tabletop exercises for the incident response team must occur bi-annually.' }
        ]),
        change_history_json: JSON.stringify([])
    }
];

db.serialize(() => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO policies 
        (policy_id, title, department, status, version, summary, owner, last_updated, review_cycle, next_review_date, sections_json, change_history_json, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`);
    
    policies.forEach(p => {
        stmt.run([p.policy_id, p.title, p.department, p.status, p.version, p.summary, p.owner, p.last_updated, p.review_cycle, p.next_review_date, p.sections_json, p.change_history_json]);
        console.log(`Added ${p.policy_id} - ${p.title}`);
    });
    
    stmt.finalize();
});

db.close();
