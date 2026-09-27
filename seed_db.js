const fs = require('fs');
const path = require('path');
const db = require('./database');

// Read the JS file
const content = fs.readFileSync(path.join(__dirname, 'js/data/policies.js'), 'utf-8');

// Strip out the 'window.APP_DATA = window.APP_DATA || {}; window.APP_DATA.policies = ' part
// and the trailing semicolon.
let jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);

try {
    // Note: since it's JS objects (unquoted keys), we might need to eval it.
    let policiesData;
    eval('policiesData = ' + jsonStr + ';');
    
    console.log(`Found ${policiesData.length} policies in js/data/policies.js`);
    
    db.serialize(() => {
        const stmt = db.prepare(`INSERT OR REPLACE INTO policies 
            (policy_id, title, department, status, version, summary, owner, last_updated, review_cycle, next_review_date, sections_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
        let count = 0;
        
        policiesData.forEach(p => {
            const sections = p.sections ? p.sections.map(s => ({
                id: s.section_id,
                title: s.title,
                text: s.content,
                status: 'compliant'
            })) : [];
            
            stmt.run(
                p.policy_id, 
                p.title, 
                p.department || 'General', 
                p.status || 'active', 
                p.version || '1.0', 
                p.summary || '', 
                p.owner || 'System Auto-Gen', 
                p.last_updated || new Date().toISOString().split('T')[0], 
                p.review_cycle || 'Annual', 
                p.next_review_date || '2025-01-01', 
                JSON.stringify(sections)
            );
            count++;
        });
        
        stmt.finalize(() => {
            console.log(`Successfully seeded ${count} policies into the database.`);
            process.exit(0);
        });
    });

} catch (err) {
    console.error("Error parsing or seeding:", err);
    process.exit(1);
}
