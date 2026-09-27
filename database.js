const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeSchema();
    }
});

function initializeSchema() {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS policies (
        policy_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT,
        status TEXT,
        version TEXT,
        summary TEXT,
        owner TEXT,
        last_updated TEXT,
        review_cycle TEXT,
        next_review_date TEXT,
        sections_json TEXT,
        change_history_json TEXT,
        is_deleted INTEGER DEFAULT 0
    )`);

    // Simple schema migrations for existing DB
    db.run("ALTER TABLE policies ADD COLUMN change_history_json TEXT", (err) => {});
    db.run("ALTER TABLE policies ADD COLUMN is_deleted INTEGER DEFAULT 0", (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT,
        status TEXT,
        description TEXT,
        jurisdiction TEXT,
        assigned_to TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS gaps (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        policy_id TEXT,
        policy_title TEXT,
        section_idx INTEGER,
        regulation_ref TEXT,
        severity TEXT,
        description TEXT,
        original_text TEXT,
        proposed_text TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT
    )`);

    // Tracks which regulatory feed items have been auto-processed (prevents re-processing)
    db.run(`CREATE TABLE IF NOT EXISTS processed_updates (
        update_id TEXT PRIMARY KEY,
        document_title TEXT,
        jurisdiction TEXT,
        source_authority TEXT,
        processed_at TEXT NOT NULL,
        matched_policy_ids TEXT,
        action_taken TEXT,
        status TEXT DEFAULT 'completed'
    )`);

    // Full audit trail of every automated policy change
    db.run(`CREATE TABLE IF NOT EXISTS remediation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        update_id TEXT NOT NULL,
        policy_id TEXT NOT NULL,
        policy_title TEXT,
        section_title TEXT,
        original_text TEXT,
        new_text TEXT,
        rationale TEXT,
        confidence REAL,
        old_version TEXT,
        new_version TEXT,
        triggered_by TEXT DEFAULT 'auto_monitor',
        created_at TEXT NOT NULL
    )`);

    db.get('SELECT COUNT(*) as count FROM policies', (err, row) => {
        if (!err && row.count === 0) {
            seedData();
        }
    });

    db.get('SELECT COUNT(*) as count FROM gaps', (err, row) => {
        if (!err && row.count === 0) {
            seedGaps();
        }
    });
}

function seedGaps() {
    console.log("Seeding initial gaps data into database...");
    
    const seedGapsData = [
        {
            id: 'GAP-001',
            title: 'Digital Lending APR Cap & Cooling-Off Clause',
            policy_id: 'POL-LEND-001',
            policy_title: 'Retail Credit Policy',
            section_idx: 1,
            regulation_ref: 'RBI Digital Lending Guidelines (2022)',
            severity: 'high',
            description: 'The policy does not define the mandate for specifying an all-inclusive Annual Percentage Rate (APR) in the Key Fact Statement (KFS) or the mandatory 3-day cooling-off period for retail loans.',
            original_text: 'Section 2. Key Fact Statement (KFS) Requirements:\nThe Key Fact Statement must list all interest rates and processing fees associated with the retail lending product clearly. Standard interest rates shall be determined by the treasury desk.',
            proposed_text: 'Section 2. Key Fact Statement (KFS) Requirements:\nThe Key Fact Statement must list all interest rates, processing fees, and include a clear, all-inclusive Annual Percentage Rate (APR). In compliance with regulatory standards, borrowers must be granted a mandatory 3-day cooling-off period during which they can exit the loan without penalty.',
            status: 'pending',
            created_at: new Date().toISOString()
        },
        {
            id: 'GAP-002',
            title: 'Mandatory 6-Hour Cyber Incident Reporting Window',
            policy_id: 'POL-SEC-002',
            policy_title: 'IT Security & Incident Response Policy',
            section_idx: 2,
            regulation_ref: 'SEC Cybersecurity Incident Disclosure Directive (2024)',
            severity: 'critical',
            description: 'Current security response procedures specify a 24-hour window for notifying business stakeholders. Regulatory standards mandate critical incidents be reported within 6 hours of discovery.',
            original_text: 'Section 3. Incident Escalation Protocol:\nUpon discovering a security breach or system compromise, the incident response team must contain the threat and notify internal business owners within 24 hours of threat validation.',
            proposed_text: 'Section 3. Incident Escalation Protocol:\nUpon discovering a security breach or system compromise, the incident response team must contain the threat and notify internal business owners. In accordance with SEC directives, any critical incident affecting financial data systems must be reported to the executive committee and external authorities within 6 hours of discovery.',
            status: 'pending',
            created_at: new Date().toISOString()
        }
    ];

    const insertGap = db.prepare(`INSERT INTO gaps (id, title, policy_id, policy_title, section_idx, regulation_ref, severity, description, original_text, proposed_text, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    seedGapsData.forEach(g => {
        insertGap.run(g.id, g.title, g.policy_id, g.policy_title, g.section_idx, g.regulation_ref, g.severity, g.description, g.original_text, g.proposed_text, g.status, g.created_at);
    });
    insertGap.finalize();
}

function seedData() {
    console.log("Seeding initial mock data into database...");
    
    const seedPolicies = [
        {
            policy_id: 'POL-IT-001',
            title: 'Data Privacy and Protection Standard',
            department: 'Information Technology',
            status: 'active',
            version: '2.4',
            summary: 'Defines the minimum baseline requirements for the protection of personal and client data across all regions.',
            owner: 'Sarah Jenkins (CISO)',
            last_updated: '2023-11-15',
            review_cycle: 'Annual',
            next_review_date: '2024-11-15',
            sections_json: JSON.stringify([
                { id: 'sec-1', title: '1. Scope and Applicability', text: 'This policy applies to all employees, contractors, and third-party vendors handling personal data.', status: 'compliant' },
                { id: 'sec-2', title: '2. Encryption Standards', text: 'All data at rest must be encrypted using AES-256 or higher. Data in transit must utilize TLS 1.3.', status: 'compliant' }
            ])
        }
    ];

    const insertPolicy = db.prepare(`INSERT INTO policies (policy_id, title, department, status, version, summary, owner, last_updated, review_cycle, next_review_date, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    seedPolicies.forEach(p => {
        insertPolicy.run(p.policy_id, p.title, p.department, p.status, p.version, p.summary, p.owner, p.last_updated, p.review_cycle, p.next_review_date, p.sections_json);
    });
    insertPolicy.finalize();
}

module.exports = db;
