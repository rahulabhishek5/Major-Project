const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const policies = [
    {
        policy_id: 'POL-HR-101',
        title: 'Workplace Harassment Policy',
        department: 'Human Resources',
        status: 'Active',
        version: '1.2',
        summary: 'Guidelines to maintain a harassment-free workplace for all employees.',
        owner: 'HR Compliance',
        last_updated: '2025-10-15',
        review_cycle: 'Annual',
        next_review_date: '2026-10-15',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Purpose', content: 'To ensure a safe and respectful work environment.', text: 'To ensure a safe and respectful work environment.' },
            { id: 'sec2', title: '2. Reporting', content: 'All incidents must be reported to the HR department within 48 hours.', text: 'All incidents must be reported to the HR department within 48 hours.' }
        ]),
        change_history_json: JSON.stringify([])
    },
    {
        policy_id: 'POL-SEC-202',
        title: 'Data Privacy and Protection',
        department: 'Information Security',
        status: 'Active',
        version: '3.0',
        summary: 'Requirements for handling customer and internal sensitive data.',
        owner: 'CISO Office',
        last_updated: '2026-01-20',
        review_cycle: 'Biannual',
        next_review_date: '2026-07-20',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Data Classification', content: 'All data must be classified as Public, Internal, Confidential, or Restricted.', text: 'All data must be classified as Public, Internal, Confidential, or Restricted.' },
            { id: 'sec2', title: '2. Access Control', content: 'Access to Restricted data requires multi-factor authentication and role-based approval.', text: 'Access to Restricted data requires multi-factor authentication and role-based approval.' }
        ]),
        change_history_json: JSON.stringify([])
    },
    {
        policy_id: 'POL-FIN-305',
        title: 'Anti-Money Laundering (AML)',
        department: 'Finance',
        status: 'Active',
        version: '2.1',
        summary: 'Procedures to prevent, detect, and report money laundering activities.',
        owner: 'Compliance Officer',
        last_updated: '2026-03-10',
        review_cycle: 'Annual',
        next_review_date: '2027-03-10',
        sections_json: JSON.stringify([
            { id: 'sec1', title: '1. Customer Due Diligence', content: 'Identity verification is mandatory for all transactions above $10,000.', text: 'Identity verification is mandatory for all transactions above $10,000.' },
            { id: 'sec2', title: '2. Suspicious Activity Reporting', content: 'Any suspicious transaction must be escalated to the AML team immediately.', text: 'Any suspicious transaction must be escalated to the AML team immediately.' }
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
