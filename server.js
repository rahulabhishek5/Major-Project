require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname)));

// ---------------------------------------------------------
// REST API ENDPOINTS
// ---------------------------------------------------------

// POST upload PDF document and extract text
app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } else {
            text = req.file.buffer.toString('utf-8');
        }
        
        // Return extracted text to the frontend so it can be analyzed
        res.json({ success: true, text: text, filename: req.file.originalname });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

// POST upload Internal Policy PDF and extract metadata using Gemini
app.post('/api/upload-policy', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        let documentText = '';
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            documentText = data.text;
        } else {
            documentText = req.file.buffer.toString('utf-8');
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not set." });
        }

        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const prompt = `You are a compliance AI. Extract the following details from this internal policy document text and return ONLY a valid JSON object.
Fields required:
- "title": A short string for the policy title.
- "department": The department (e.g., Information Security, HR, Finance).
- "summary": A 2-sentence summary of the policy.
- "rules": An array of 3-5 strings, each representing a key rule or clause.

Text to parse:
${documentText.substring(0, 10000)}
`;
        
        const response = await groq.chat.completions.create({
            model: 'qwen/qwen3.8-27b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });
        
        const jsonText = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonText);
        
        // Default fallbacks
        const policy_id = "POL-AUTO-" + Math.floor(Math.random() * 10000);
        const title = parsed.title || req.file.originalname;
        const department = parsed.department || 'General';
        const summary = parsed.summary || 'Uploaded policy document.';
        const rules = parsed.rules || [];
        const status = 'active';
        const owner = 'System Auto-Gen';
        const last_updated = new Date().toISOString().split('T')[0];
        const next_review_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
        const version = '1.0';
        
        // For 'sections', map rules to section objects
        const sections = rules.map((r, i) => ({ title: `Rule ${i+1}`, content: r }));
        const sections_json = JSON.stringify(sections);
        
        db.run(
            `INSERT INTO policies (policy_id, title, department, status, owner, last_updated, next_review_date, version, summary, sections) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [policy_id, title, department, status, owner, last_updated, next_review_date, version, summary, sections_json],
            function(err) {
                if (err) {
                    console.error("DB Error:", err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({
                    success: true,
                    policy: {
                        id: this.lastID,
                        policy_id, title, department, status, owner, last_updated, next_review_date, version, summary, sections
                    }
                });
            }
        );

    } catch (err) {
        console.error('Upload Policy Error:', err);
        res.status(500).json({ error: 'Failed to process document' });
    }
});

// GET live scraped regulatory news
app.get('/api/scrape-regulations', async (req, res) => {
    try {
        // Scrape HackerNews (as a reliable mock for news/tech updates)
        // In a real scenario, this would be SEC.gov or similar
        const { data } = await axios.get('https://news.ycombinator.com/');
        const $ = cheerio.load(data);
        const articles = [];
        
        $('.athing').each((i, el) => {
            if (i >= 10) return false; // Get top 10
            const title = $(el).find('.titleline > a').text();
            const link = $(el).find('.titleline > a').attr('href');
            
            // Map the headline to a simulated regulatory context
            let severity = 'info';
            if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('security') || title.toLowerCase().includes('data')) {
                severity = 'high';
            }
            if (title.toLowerCase().includes('breach') || title.toLowerCase().includes('hack') || title.toLowerCase().includes('ban')) {
                severity = 'critical';
            }

            articles.push({
                id: 'SCRAPE-' + (i + 1),
                title: title,
                url: link,
                source: 'Live Web Scrape',
                severity: severity,
                timestamp: new Date().toISOString()
            });
        });

        res.json({ success: true, count: articles.length, data: articles });
    } catch (error) {
        console.error('Scraping error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to scrape data' });
    }
});

// GET all policies (active only)
app.get('/api/policies', (req, res) => {
    db.all('SELECT * FROM policies WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY last_updated DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        
        // Parse sections JSON before sending
        const policies = rows.map(row => {
            let parsedRegion = [];
            try { parsedRegion = row.region ? JSON.parse(row.region) : []; } catch(e) {}
            return {
                ...row,
                region: parsedRegion,
                sections: row.sections_json ? JSON.parse(row.sections_json) : [],
                change_history: row.change_history_json ? JSON.parse(row.change_history_json) : []
            };
        });
        
        res.json(policies);
    });
});

// GET single policy by ID
app.get('/api/policies/:id', (req, res) => {
    db.get('SELECT * FROM policies WHERE policy_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', [req.params.id], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        let parsedRegion = [];
        try { parsedRegion = row.region ? JSON.parse(row.region) : []; } catch(e) {}
        const policy = {
            ...row,
            region: parsedRegion,
            sections: row.sections_json ? JSON.parse(row.sections_json) : [],
            change_history: row.change_history_json ? JSON.parse(row.change_history_json) : []
        };
        res.json(policy);
    });
});

// POST a new policy (Used for Native PDF, OCR PDF, or Manual Entry)
app.post('/api/policies', (req, res) => {
    const { policy_id, title, department, status, version, summary, sections } = req.body;
    
    // Auto-fill missing values
    const owner = req.body.owner || 'System Auto-Gen';
    const last_updated = new Date().toISOString().split('T')[0];
    const review_cycle = req.body.review_cycle || 'Annual';
    const next_review_date = req.body.next_review_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    
    const sections_json = JSON.stringify(sections || []);

    const sql = `INSERT INTO policies (policy_id, title, department, status, version, summary, owner, last_updated, review_cycle, next_review_date, sections_json) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [policy_id, title, department, status, version, summary, owner, last_updated, review_cycle, next_review_date, sections_json], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Policy saved successfully', policy_id: policy_id });
    });
});

// PUT to update an existing policy (Automated AI Remediation / Manual Fix)
app.put('/api/policies/:id', (req, res) => {
    const policyId = req.params.id;
    const { title, version, summary, status, sections, change_history } = req.body;
    
    const last_updated = new Date().toISOString().split('T')[0];
    const sections_json = sections ? JSON.stringify(sections) : null;
    const change_history_json = change_history ? JSON.stringify(change_history) : null;

    let updates = ['last_updated = ?'];
    let params = [last_updated];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (version !== undefined) { updates.push('version = ?'); params.push(version); }
    if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (sections_json !== null) { updates.push('sections_json = ?'); params.push(sections_json); }
    if (change_history_json !== null) { updates.push('change_history_json = ?'); params.push(change_history_json); }

    params.push(policyId);
    const sql = `UPDATE policies SET ${updates.join(', ')} WHERE policy_id = ?`;

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Policy updated successfully', policy_id: policyId, status: status });
    });
});

// POST /api/policies/:id/approve — Mark policy as active and compliant
app.post('/api/policies/:id/approve', (req, res) => {
    const policyId = req.params.id;
    db.get('SELECT * FROM policies WHERE policy_id = ?', [policyId], (err, policy) => {
        if (err || !policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        let sections = [];
        try {
            sections = policy.sections_json ? JSON.parse(policy.sections_json) : [];
        } catch(e) { sections = []; }
        
        // Mark all sections as compliant
        sections = sections.map(s => ({
            ...s,
            status: 'compliant'
        }));

        let changeHistory = [];
        try {
            changeHistory = policy.change_history_json ? JSON.parse(policy.change_history_json) : [];
        } catch(e) { changeHistory = []; }

        changeHistory.push({
            date: new Date().toISOString().split('T')[0],
            reason: '[OFFICER APPROVAL] Policy reviewed, validated, and published to Active production baseline.',
            original_text: 'Status: ' + (policy.status || 'under_review'),
            new_text: 'Status: active'
        });

        const today = new Date().toISOString().split('T')[0];
        const sql = `UPDATE policies 
                     SET status = 'active', last_updated = ?, sections_json = ?, change_history_json = ? 
                     WHERE policy_id = ?`;

        db.run(sql, [today, JSON.stringify(sections), JSON.stringify(changeHistory), policyId], function(upErr) {
            if (upErr) {
                console.error(upErr);
                return res.status(500).json({ error: upErr.message });
            }

            // Log to remediation_log
            db.run(
                `INSERT INTO remediation_log (update_id, policy_id, policy_title, section_title, original_text, new_text, rationale, confidence, old_version, new_version, triggered_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ['USER-APPROVAL', policyId, policy.title, 'Full Policy Approval', policy.status || 'under_review', 'active', 'Approved and published to production by compliance officer', 1.0, policy.version, policy.version, 'officer_review', new Date().toISOString()]
            );

            res.json({
                success: true,
                message: 'Policy approved and published to active production baseline',
                policy_id: policyId,
                status: 'active',
                last_updated: today
            });
        });
    });
});

// POST /api/policies/:id/revert — Revert AI addendums and restore previous version
app.post('/api/policies/:id/revert', (req, res) => {
    const policyId = req.params.id;
    db.get('SELECT * FROM policies WHERE policy_id = ?', [policyId], (err, policy) => {
        if (err || !policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        let sections = [];
        try {
            sections = policy.sections_json ? JSON.parse(policy.sections_json) : [];
        } catch(e) { sections = []; }

        // Filter out sections added by AI or flagged for review
        const revertedSections = sections.filter(s => s.status !== 'needs_review' && s.status !== 'added_by_ai');

        let changeHistory = [];
        try {
            changeHistory = policy.change_history_json ? JSON.parse(policy.change_history_json) : [];
        } catch(e) { changeHistory = []; }

        changeHistory.push({
            date: new Date().toISOString().split('T')[0],
            reason: '[DRAFT REVERTED] AI amendments discarded and rolled back to baseline by compliance officer.',
            original_text: 'Under Review Version',
            new_text: 'Restored baseline version'
        });

        const today = new Date().toISOString().split('T')[0];
        const sql = `UPDATE policies 
                     SET status = 'active', last_updated = ?, sections_json = ?, change_history_json = ? 
                     WHERE policy_id = ?`;

        db.run(sql, [today, JSON.stringify(revertedSections), JSON.stringify(changeHistory), policyId], function(upErr) {
            if (upErr) {
                return res.status(500).json({ error: upErr.message });
            }

            res.json({
                success: true,
                message: 'Policy reverted to previous clean baseline',
                policy_id: policyId,
                status: 'active'
            });
        });
    });
});

// GET /api/policies/:id/diff — Get detailed change log and diff records for a policy
app.get('/api/policies/:id/diff', (req, res) => {
    const policyId = req.params.id;
    db.all('SELECT * FROM remediation_log WHERE policy_id = ? ORDER BY created_at DESC', [policyId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});


// GET deleted policies
app.get('/api/policies/deleted', (req, res) => {
    db.all('SELECT * FROM policies WHERE is_deleted = 1 ORDER BY last_updated DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        
        // Parse sections JSON before sending
        const policies = rows.map(row => ({
            ...row,
            sections: row.sections_json ? JSON.parse(row.sections_json) : [],
            change_history: row.change_history_json ? JSON.parse(row.change_history_json) : []
        }));
        
        res.json(policies);
    });
});

// DELETE a policy (Soft Delete)
app.delete('/api/policies/:id', (req, res) => {
    const policyId = req.params.id;
    db.run(`UPDATE policies SET is_deleted = 1 WHERE policy_id = ?`, [policyId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Policy moved to trash' });
    });
});

// RESTORE a policy
app.put('/api/policies/:id/restore', (req, res) => {
    const policyId = req.params.id;
    db.run(`UPDATE policies SET is_deleted = 0 WHERE policy_id = ?`, [policyId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Policy restored successfully' });
    });
});

// ---------------------------------------------------------
// CALENDAR ENDPOINTS
// ---------------------------------------------------------

// POST auto-extract deadlines via AI
app.post('/api/calendar/auto-extract', async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: "GROQ_API_KEY not configured. Cannot perform AI extraction." });
        }
        
        // Fetch recent updates
        db.all('SELECT update_id, document_title, summary, full_text FROM regulatory_updates ORDER BY ingested_at DESC LIMIT 15', [], async (err, updates) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!updates || updates.length === 0) return res.json({ events: [] });
            
            let contextText = updates.map(u => `Title: ${u.document_title}\nSummary: ${u.summary}`).join('\n\n');
            
            const prompt = `You are a compliance AI. Analyze the following recent regulatory updates and extract any explicit compliance enforcement deadlines, effective dates, or comment period deadlines.
Return ONLY valid JSON in this exact format:
{
  "events": [
    {
      "title": "Short event title (e.g. SEC Rule 10b-5 Compliance Deadline)",
      "date": "YYYY-MM-DD",
      "description": "Brief description of what is required by this date."
    }
  ]
}
If no explicit dates are found, return {"events": []}.

Regulatory Updates Context:
${contextText}`;

            try {
                const response = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'openai/gpt-oss-20b',
                    response_format: { type: "json_object" }
                });

                const parsed = JSON.parse(response.choices[0]?.message?.content || '{"events":[]}');
                const events = parsed.events || [];
                
                // Insert extracted events into DB
                let added = 0;
                for (const ev of events) {
                    if (ev.title && ev.date) {
                        db.run(
                            `INSERT INTO calendar_events (title, date, type, status, description, jurisdiction, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [ev.title, ev.date, 'deadline', 'warning', ev.description || '', 'Global', 'Compliance Team']
                        );
                        added++;
                    }
                }
                
                res.json({ message: `Successfully extracted ${added} deadlines.`, events: events });
            } catch (aiErr) {
                console.error("AI Extraction Error:", aiErr);
                res.status(500).json({ error: "Failed to extract deadlines via AI." });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all calendar events
app.get('/api/calendar', (req, res) => {
    db.all('SELECT * FROM calendar_events ORDER BY date ASC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST new calendar event
app.post('/api/calendar', (req, res) => {
    const { title, date, type, status, description, jurisdiction, assigned_to } = req.body;
    db.run(
        `INSERT INTO calendar_events (title, date, type, status, description, jurisdiction, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, date, type, status, description, jurisdiction, assigned_to],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        }
    );
});

// PUT update calendar event
app.put('/api/calendar/:id', (req, res) => {
    const eventId = req.params.id;
    const { title, date, type, status, description, jurisdiction, assigned_to } = req.body;
    db.run(
        `UPDATE calendar_events SET title = ?, date = ?, type = ?, status = ?, description = ?, jurisdiction = ?, assigned_to = ? WHERE id = ?`,
        [title, date, type, status, description, jurisdiction, assigned_to, eventId],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Event updated successfully' });
        }
    );
});

// DELETE calendar event
app.delete('/api/calendar/:id', (req, res) => {
    const eventId = req.params.id;
    db.run(`DELETE FROM calendar_events WHERE id = ?`, [eventId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Event deleted successfully' });
    });
});

// ---------------------------------------------------------
// GAP ANALYSIS ENDPOINTS
// ---------------------------------------------------------

// GET all gaps
app.get('/api/gaps', (req, res) => {
    db.all('SELECT * FROM gaps ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST new gap
app.post('/api/gaps', (req, res) => {
    const { id, title, policy_id, policy_title, section_idx, regulation_ref, severity, description, original_text, proposed_text } = req.body;
    const created_at = new Date().toISOString();
    
    db.run(
        `INSERT INTO gaps (id, title, policy_id, policy_title, section_idx, regulation_ref, severity, description, original_text, proposed_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, policy_id, policy_title, section_idx, regulation_ref, severity, description, original_text, proposed_text, created_at],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Gap created successfully', id: id });
        }
    );
});

// PUT resolve gap
app.put('/api/gaps/:id/resolve', (req, res) => {
    const gapId = req.params.id;
    // We mark the gap as resolved
    db.run(`UPDATE gaps SET status = 'resolved' WHERE id = ?`, [gapId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        // In a real application, we might also update the actual policy section here
        // using the policy_id and proposed_text.
        res.json({ message: 'Gap resolved successfully' });
    });
});

// DELETE gap
app.delete('/api/gaps/:id', (req, res) => {
    const gapId = req.params.id;
    db.run(`DELETE FROM gaps WHERE id = ?`, [gapId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Gap deleted successfully' });
    });
});

// POST chat (Groq AI RAG Integration)
app.post('/api/chat', async (req, res) => {
    const { message, history, appContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Ensure API Key exists
    if (!process.env.GROQ_API_KEY) {
        return res.json({ 
            response: "⚠️ **API Key Missing!**\n\nI need a Groq API Key to become truly intelligent! Please open the `.env` file in your project, paste your API Key, and restart the server." 
        });
    }

    try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Build context from SQLite database
        db.all('SELECT title, summary, sections_json FROM policies', [], async (err, rows) => {
            if (err) throw err;

            let contextText = "--- INTERNAL COMPANY POLICIES ---\n";
            rows.forEach(row => {
                contextText += `\nPOLICY: ${row.title}\nSUMMARY: ${row.summary}\n`;
                if (row.sections_json) {
                    const sections = JSON.parse(row.sections_json);
                    sections.forEach(sec => {
                        contextText += `- ${sec.title}: ${sec.text}\n`;
                    });
                }
            });
            
            // Add live application state context if provided!
            if (appContext) {
                contextText += "\n\n--- LIVE WEBSITE STATE (WHAT THE USER SEES RIGHT NOW) ---\n";
                contextText += `The user is currently viewing the "${appContext.active_view}" page.\n`;
                
                if (appContext.regulatory_feed && appContext.regulatory_feed.length > 0) {
                    contextText += `\nLatest Regulatory Feed Updates (Live):\n`;
                    appContext.regulatory_feed.slice(0, 5).forEach(feed => {
                        contextText += `- [${feed.jurisdiction}] ${feed.document_title} (Status: ${feed.status}, Priority: ${feed.priority})\n`;
                    });
                }
                
                if (appContext.escalations && appContext.escalations.length > 0) {
                    contextText += `\nCurrent Escalation Queue (Action Required):\n`;
                    appContext.escalations.slice(0, 3).forEach(esc => {
                        contextText += `- [${esc.type}] ${esc.title} - ${esc.description}\n`;
                    });
                }
            }

            const systemPrompt = `You are Lex AI, a highly intelligent regulatory compliance assistant for UBS. 
Your goal is to answer user questions based on their internal company policies and the live website state.
You know exactly what the user is looking at because the LIVE WEBSITE STATE is provided to you below.
Be extremely professional, concise, and format your responses nicely in Markdown (with bullet points and bold text where helpful).
If a user asks about something not in the context, use your vast general knowledge to help them, but clarify what is and isn't company policy.

Here is all the data present on the website:
${contextText}`;

            // Build full message array with history
            const messages = [{ role: 'system', content: systemPrompt }];
            if (history && Array.isArray(history)) {
                history.forEach(msg => {
                    if (msg.content && msg.content.trim() !== "Lex is typing...") {
                        messages.push({ role: msg.role, content: msg.content });
                    }
                });
            }
            messages.push({ role: 'user', content: message });

            try {
                const result = await groq.chat.completions.create({
                    messages: messages,
                    model: 'openai/gpt-oss-20b',
                    temperature: 0.2,
                });
                
                res.json({ response: result.choices[0]?.message?.content || "No response generated." });
            } catch (aiErr) {
                console.error("Groq API Error:", aiErr);
                res.status(500).json({ error: "Failed to connect to Groq AI." });
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

let cachedLiveFeed = { data: null, timestamp: 0 };
const LIVE_FEED_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// GET Live Regulatory Feed
app.get('/api/live-feed', async (req, res) => {
    try {
        // Return cached feed if valid
        if (cachedLiveFeed.data && Date.now() - cachedLiveFeed.timestamp < LIVE_FEED_CACHE_TTL) {
            return res.json(cachedLiveFeed.data);
        }

        const Parser = require('rss-parser');
        const parser = new Parser();
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        // 1. Query DB for distinct departments of active policies
        db.all("SELECT DISTINCT department FROM policies WHERE is_deleted = 0", [], async (err, rows) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            
            const departments = rows.map(r => r.department);
            
            // 2. Map departments to RSS feeds
            const feedsToFetch = [];
            
            // Always add SEC for Finance/Legal
            feedsToFetch.push({ url: 'https://www.sec.gov/news/pressreleases.rss', name: 'US SEC', prefix: 'SEC-' });
            
            // Federal Reserve instead of broken FTC feed
            feedsToFetch.push({ url: 'https://www.federalreserve.gov/feeds/press_all.xml', name: 'US Fed', prefix: 'FED-' });
            
            // CFPB for consumer/operations
            feedsToFetch.push({ url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', name: 'US CFPB', prefix: 'CFPB-' });
            
            let allUpdates = [];
            
            // 3. Fetch from all mapped feeds concurrently
            for (const source of feedsToFetch) {
                try {
                    const feed = await parser.parseURL(source.url);
                    // Take top 4 items per feed to balance load
                    const rawItems = feed.items.slice(0, 4);
                    
                    const updates = await Promise.all(rawItems.map(async (item) => {
                        const deterministicId = source.prefix + require('crypto').createHash('md5').update(item.link || item.title).digest('hex').substring(0, 10).toUpperCase();
                        let fullText = item.contentSnippet || item.content || item.title;
                        
                        try {
                            if (item.link) {
                                const response = await axios.get(item.link, { 
                                    timeout: 10000,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                        'Accept-Language': 'en-US,en;q=0.5'
                                    }
                                });
                                const $ = cheerio.load(response.data);
                                // Remove scripts, styles, and junk from DOM first!
                                $('script, style, noscript, nav, footer, header, .nav, .footer, .menu, .sidebar, iframe').remove();
                                
                                let articleText = $('article').text() || $('.article-content').text() || $('main').text() || $('#content').text() || $('body').text();
                                articleText = articleText.replace(/\s+/g, ' ').trim();
                                // Clean up common Federal Reserve / SEC breadcrumb junk
                                articleText = articleText.replace(/^Home\s+News\s+&\s+Events\s+Press\s+Releases\s+Press\s+Release\s+[a-zA-Z]+\s+\d{1,2},\s+\d{4}\s*/i, '');
                                
                                if (articleText.length > 200) {
                                    fullText = articleText.substring(0, 5000);
                                }
                            }
                        } catch (scrapeErr) {
                            console.warn(`Scraping failed for ${item.link}:`, scrapeErr.message);
                        }
                        
                        // Try to parse valid date
                        let pubDate = new Date();
                        if (item.pubDate) {
                            const parsed = new Date(item.pubDate);
                            if (!isNaN(parsed)) pubDate = parsed;
                        }
                        
                        // Generate a smart, non-truncated summary from the full text
                        let cleanSummary = item.title;
                        if (fullText && fullText.length > 50) {
                            // Extract first 2-3 sentences
                            const sentences = fullText.split(/(?<=[.!?])\s+/);
                            cleanSummary = sentences.slice(0, 3).join(' ').trim();
                            // Fallback if the first 3 sentences are absurdly long
                            if (cleanSummary.length > 400) {
                                cleanSummary = cleanSummary.substring(0, 400).trim() + '...';
                            }
                        }

                        // Determine dummy business lines based on keywords
                        let bLines = [];
                        const lowerTitle = item.title.toLowerCase();
                        if (lowerTitle.includes('bank') || lowerTitle.includes('credit')) bLines.push('Retail Banking');
                        if (lowerTitle.includes('fund') || lowerTitle.includes('advisors')) bLines.push('Asset Management');
                        if (lowerTitle.includes('trade') || lowerTitle.includes('securities')) bLines.push('Global Markets');
                        if (bLines.length === 0) bLines = ['General Compliance', 'All Business Lines'];

                        return {
                            update_id: deterministicId,
                            document_title: item.title,
                            jurisdiction: source.name,
                            date: pubDate.toISOString().split('T')[0],
                            publication_timestamp: pubDate.toISOString(),
                            effective_date: 'Immediate / Pending Review',
                            document_format: 'Press Release (HTML)',
                            business_line_scope: bLines,
                            status: 'pending',
                            priority: lowerTitle.includes('charge') || lowerTitle.includes('enforce') || lowerTitle.includes('penalty') ? 'high' : 'medium',
                            summary: cleanSummary,
                            extracted_text: fullText,
                            source_authority: source.name
                        };
                    }));
                    allUpdates = allUpdates.concat(updates);
                } catch (feedErr) {
                    console.error(`Error fetching feed ${source.url}:`, feedErr.message);
                }
            }
            
            // Fetch processed updates to correctly reflect status
            db.all("SELECT update_id, status FROM processed_updates", [], (err, pRows) => {
                if (!err && pRows) {
                    const processedMap = {};
                    pRows.forEach(r => processedMap[r.update_id] = r.status);
                    
                    allUpdates.forEach(u => {
                        if (processedMap[u.update_id]) {
                            u.status = processedMap[u.update_id];
                        }
                    });
                }
                
                // Sort combined updates by date descending
                allUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const responseData = allUpdates.slice(0, 15);
                cachedLiveFeed.data = responseData;
                cachedLiveFeed.timestamp = Date.now();
                
                res.json(responseData);
            });
        });
    } catch (e) {
        console.error("Live Feed Error:", e);
        res.status(500).json({ error: "Failed to fetch live feed" });
    }
});

// POST /api/lex/chat for Lex AI Assistant
app.post('/api/lex/chat', async (req, res) => {
    const { history, userMessage, currentContext, stream } = req.body;
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not set in the environment variables." });
        }
        
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        // 1. Keyword Extraction (basic)
        const keywords = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        // 2. Fetch Context from multiple domains
        const [policies, gaps, updates] = await Promise.all([
            new Promise((resolve) => {
                db.all("SELECT policy_id, title, summary, sections_json FROM policies", [], (err, rows) => {
                    if (err) resolve([]);
                    else resolve(rows);
                });
            }),
            new Promise((resolve) => {
                db.all("SELECT gap_id, title, description, status FROM gaps", [], (err, rows) => {
                    if (err) resolve([]);
                    else resolve(rows);
                });
            }),
            new Promise((resolve) => {
                db.all("SELECT update_id, document_title, summary FROM processed_updates LIMIT 20", [], (err, rows) => {
                    if (err) resolve([]);
                    else resolve(rows);
                });
            })
        ]);
        
        // Basic Scoring
        const scoreItem = (item, textFields) => {
            let score = 0;
            const text = textFields.map(f => (item[f]||'').toLowerCase()).join(' ');
            keywords.forEach(kw => { if (text.includes(kw)) score++; });
            return { item, score };
        };
        
        const topPolicies = policies.map(p => scoreItem(p, ['title', 'summary'])).sort((a,b) => b.score - a.score).slice(0, 3).map(x => x.item);
        const topGaps = gaps.map(g => scoreItem(g, ['title', 'description', 'gap_id'])).sort((a,b) => b.score - a.score).slice(0, 3).map(x => x.item);
        
        let contextText = "You are Lex, an expert AI compliance assistant at PolicyPilot. Keep answers professional, crisp, and helpful. Format your responses in markdown. Use [[ID]] (e.g. [[POL-IT-001]] or [[GAP-002]]) when citing to create clickable links.\n\n";
        
        if (currentContext) {
            contextText += `[System Note: The user is currently viewing the page/section: ${currentContext}]\n\n`;
        }
        
        contextText += "### Relevant Policies\n";
        topPolicies.forEach(p => {
            let contentText = "No detailed content available.";
            if (p.sections_json) {
                try {
                    const sections = JSON.parse(p.sections_json);
                    contentText = sections.map(s => s.title + ": " + s.content).join("\n");
                } catch (e) {}
            }
            contextText += `[${p.policy_id}] ${p.title}\nSummary: ${p.summary}\nContent: ${contentText}\n\n`;
        });
        
        contextText += "### Relevant Gaps\n";
        topGaps.forEach(g => {
            contextText += `[${g.gap_id}] ${g.title}\nStatus: ${g.status}\nDesc: ${g.description}\n\n`;
        });
        
        const messages = [{ role: 'system', content: contextText }];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                if (msg.role === 'user') messages.push({ role: 'user', content: msg.text });
                else if (msg.role === 'bot') messages.push({ role: 'assistant', content: msg.text });
            });
        }
        messages.push({ role: 'user', content: userMessage });

        const tools = [
            {
                type: "function",
                function: {
                    name: "update_gap_status",
                    description: "Update the status of a compliance gap. Use this when the user asks to mark a gap as closed or mitigated.",
                    parameters: {
                        type: "object",
                        properties: {
                            gap_id: { type: "string", description: "The ID of the gap, e.g. GAP-002" },
                            status: { type: "string", enum: ["open", "mitigated", "resolved"], description: "The new status" }
                        },
                        required: ["gap_id", "status"]
                    }
                }
            }
        ];

        let response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: messages,
            tools: tools,
            tool_choice: "auto"
        });

        // Handle tool calls
        let responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;
        
        if (toolCalls) {
            messages.push(responseMessage);
            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'update_gap_status') {
                    const args = JSON.parse(toolCall.function.arguments);
                    await new Promise((resolve) => {
                        db.run("UPDATE gaps SET status = ?, date_updated = ? WHERE gap_id = ?", [args.status, new Date().toISOString(), args.gap_id], resolve);
                    });
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "update_gap_status",
                        content: `Success. Gap ${args.gap_id} is now ${args.status}.`
                    });
                }
            }
            response = await groq.chat.completions.create({
                model: 'openai/gpt-oss-20b',
                messages: messages,
                stream: stream
            });
        } else if (stream) {
            // Need to recreate the request with stream: true since first request can't be streamed if we want tools
            response = await groq.chat.completions.create({
                model: 'openai/gpt-oss-20b',
                messages: messages,
                stream: true
            });
        }

        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            res.json({ text: response.choices[0]?.message?.content || "No response." });
        }
    } catch (err) {
        console.error("Lex AI Error:", err);
        res.status(500).json({ error: "Failed to generate AI response.", details: err.message });
    }
});

// POST /api/analyze-gap
app.post('/api/analyze-gap', async (req, res) => {
    const { regulatoryText, policyText } = req.body;
    if (!regulatoryText || !policyText) return res.status(400).json({ error: "Missing text inputs" });

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "GROQ_API_KEY is not set." });
    }

    try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const prompt = `You are a compliance AI analyzing a regulatory requirement against an internal policy.
Regulatory Source Text:
${regulatoryText}

Internal Policy Text:
${policyText}

Analyze the texts and identify exactly what needs to be added to the internal policy to comply with the regulatory source.
Return ONLY a valid JSON object with the following fields:
- "gapSummary": A concise summary of the gap (1-2 sentences).
- "suggestedAddendum": The exact paragraph of text that should be added to the internal policy to close the gap.`;

        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const jsonText = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonText);
        res.json(parsed);
    } catch (err) {
        console.error("Analysis Error:", err);
        res.status(500).json({ error: "Analysis failed", details: err.message });
    }
});

// POST /api/send-email for Notifications
app.post('/api/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;
    try {
        const nodemailer = require('nodemailer');
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"PolicyPilot Auto-Remediation" <no-reply@policypilot.ai>',
            to: to || "compliance-team@ubs.com",
            subject: subject || "Automated Policy Update Notice",
            text: text,
            html: html || `<p>${text}</p>`,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        
        res.json({ success: true, previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (err) {
        console.error("Email Error:", err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// POST /api/upload-document for AI PDF Ingestion
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }
        
        // 1. Parse the PDF
        const data = await pdfParse(req.file.buffer);
        const documentText = data.text;
        
        // 2. Fetch policies for context
        const policies = await new Promise((resolve, reject) => {
            db.all("SELECT policy_id, title, summary FROM policies LIMIT 10", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        let policyContext = "";
        policies.forEach(p => {
            policyContext += `- [${p.policy_id}] ${p.title}: ${p.summary}\n`;
        });

        // 3. Analyze with Groq
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not set." });
        }
        
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const prompt = `You are a strict regulatory compliance AI. 
I have extracted text from a newly uploaded regulatory document (PDF).
Please do the following:
1. Provide a concise 2-3 sentence Executive Summary of the document.
2. Cross-reference the document against the following internal policies:
${policyContext}
3. List any Identified Gaps or Action Items required to stay compliant. Format your response clearly in Markdown.

--- NEW DOCUMENT TEXT ---
${documentText.substring(0, 15000)}`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-20b',
        });

        res.json({ 
            success: true, 
            filename: req.file.originalname,
            analysis: response.choices[0]?.message?.content || "No analysis generated." 
        });

    } catch (err) {
        console.error("Document Upload Error:", err);
        res.status(500).json({ error: "Failed to process the document.", details: err.message });
    }
});
// POST /api/ai-triage for Severity Prediction and Similar Cases
app.post('/api/ai-triage', async (req, res) => {
    try {
        const { update } = req.body;
        if (!update) return res.status(400).json({ error: "No update provided." });

        if (!process.env.GROQ_API_KEY) {
            // ── Local fallback: deterministic triage without external API ──
            const title = (update.document_title || '').toLowerCase();
            const source = (update.source_authority || '').toLowerCase();
            const text = (update.extracted_text || title).toLowerCase();
            const priority = (update.priority || 'medium').toLowerCase();

            // Keyword-based severity estimation
            let severity = 'Medium';
            const criticalKw = ['enforcement', 'violation', 'penalty', 'fine', 'cease', 'sanction', 'fraud', 'ban', 'suspend', 'revoke'];
            const highKw = ['rule', 'amendment', 'mandate', 'requirement', 'deadline', 'compliance', 'capital', 'liquidity', 'stress test', 'rescind'];
            const lowKw = ['guidance', 'advisory', 'comment', 'proposal', 'exemption', 'relief', 'workshop', 'invitation'];

            if (priority === 'high' || criticalKw.some(k => title.includes(k) || text.includes(k))) {
                severity = 'Critical';
            } else if (highKw.some(k => title.includes(k) || text.includes(k))) {
                severity = 'High';
            } else if (lowKw.some(k => title.includes(k) || text.includes(k))) {
                severity = 'Low';
            }

            // Build contextual reasoning
            const sourceLabel = source.includes('sec') ? 'U.S. Securities and Exchange Commission (SEC)' :
                                source.includes('fed') ? 'Federal Reserve System' :
                                source.includes('cfpb') ? 'Consumer Financial Protection Bureau (CFPB)' :
                                source.includes('rbi') ? 'Reserve Bank of India (RBI)' :
                                (update.source_authority || 'the issuing regulatory body');

            const reasoning = `This regulatory notice from ${sourceLabel} has been assessed as ${severity} urgency. ` +
                `The notice "${update.document_title || 'Untitled'}" pertains to regulatory developments that ` +
                (severity === 'Critical' ? 'may impose immediate compliance obligations, enforcement actions, or financial penalties on affected institutions. Urgent review by Legal, Compliance, and relevant business line heads is recommended within 24-48 hours.' :
                 severity === 'High' ? 'introduce new requirements or amend existing regulatory frameworks. Affected business lines should initiate a gap analysis against current internal policies and controls within 1-2 weeks.' :
                 severity === 'Medium' ? 'represent evolving regulatory expectations. The compliance team should monitor developments and assess potential downstream impacts to existing policy frameworks during the next quarterly review cycle.' :
                 'are informational or propose future changes for public comment. No immediate operational impact is anticipated, but the regulatory affairs team should track for final rule issuance.');

            // Generate realistic similar cases based on source
            const similarCasesMap = {
                sec: [
                    { title: 'SEC v. Goldman Sachs (2010) — ABACUS CDO Enforcement', resolution: 'Goldman Sachs settled for $550M after SEC alleged misleading investors on a synthetic CDO. The firm implemented enhanced disclosure controls, independent compliance reviews, and a dedicated structured products oversight committee.' },
                    { title: 'SEC Rule 613 — Consolidated Audit Trail (CAT) Implementation', resolution: 'Broker-dealers were required to implement comprehensive order tracking systems. Firms that proactively engaged with industry working groups and phased implementation timelines avoided late-filing penalties and regulatory censure.' }
                ],
                fed: [
                    { title: 'Federal Reserve SR 11-7 — Model Risk Management Supervisory Guidance', resolution: 'Large banking organizations established independent model validation units, formalized model inventories, and implemented ongoing monitoring frameworks. Banks that delayed compliance faced MRAs and restrictions on model-dependent activities.' },
                    { title: 'Fed Stress Test Capital Planning (CCAR 2019) — Qualitative Objections', resolution: 'Several BHCs received conditional non-objections requiring remediation of capital planning processes within 90 days. Institutions strengthened scenario analysis capabilities, board governance, and risk-appetite frameworks.' }
                ],
                cfpb: [
                    { title: 'CFPB v. Wells Fargo (2016) — Unauthorized Accounts Enforcement', resolution: 'Wells Fargo paid $185M in penalties and undertook a comprehensive remediation program including customer refunds, enhanced sales practice monitoring, independent audits, and executive accountability changes.' },
                    { title: 'CFPB Payday Lending Rule (2017) — Ability-to-Repay Provisions', resolution: 'Affected lenders restructured underwriting processes to include full-payment tests, implemented borrower notification systems, and adjusted product offerings to comply with successive payment restrictions.' }
                ],
                default: [
                    { title: 'Basel III Capital Adequacy — CET1 Ratio Enhancement (2015)', resolution: 'Global banks increased Common Equity Tier 1 capital buffers through retained earnings, RWA optimization, and strategic divestitures. Institutions meeting requirements ahead of schedule gained favorable supervisory treatment.' },
                    { title: 'AML/CFT Compliance — FinCEN BSA Enforcement Action (2020)', resolution: 'The institution paid a $390M civil money penalty and entered into a consent order requiring complete overhaul of its BSA/AML compliance program, including transaction monitoring, suspicious activity reporting, and customer due diligence processes.' }
                ]
            };

            const caseKey = source.includes('sec') ? 'sec' : source.includes('fed') ? 'fed' : source.includes('cfpb') ? 'cfpb' : 'default';
            const similarCases = similarCasesMap[caseKey];

            return res.json({ severity, reasoning, similarCases });
        }
        
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const prompt = `You are an expert Regulatory Compliance AI. 
Analyze the following regulatory alert/update and provide triage information.
Format your output as valid JSON matching this schema exactly, with NO markdown formatting around it:
{
  "severity": "Critical" | "High" | "Medium" | "Low",
  "reasoning": "Detailed explanation of why this severity was chosen, highlighting key risk factors and regulatory impact.",
  "similarCases": [
    { "title": "Title of similar historical case", "resolution": "How it was resolved" }
  ]
}

Alert Details:
Title: ${update.document_title || update.update_id}
Source: ${update.source_authority}
Jurisdiction: ${update.jurisdiction}
Summary/Text: ${update.extracted_text || update.update_id}

For the similarCases array, please generate 2 highly realistic historical examples of similar regulatory violations or compliance alerts that a bank might have faced in the past related to this topic, and how they were remediated.`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-20b',
            response_format: { type: "json_object" }
        });

        const jsonStr = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonStr);
        res.json(parsed);
    } catch (err) {
        console.error("AI Triage Error:", err);
        res.status(500).json({ error: "Failed to generate AI triage prediction.", details: err.message });
    }
});

// POST /api/semantic-search for AI Semantic Search
app.post('/api/semantic-search', async (req, res) => {
    try {
        const { query, policies } = req.body;
        if (!query || !policies) return res.status(400).json({ error: "Query and policies required." });

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not set." });
        }
        
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const prompt = `You are a Semantic Search AI for a regulatory compliance platform.
The user is searching for: "${query}"

Here is the list of available policies (ID, Title, Summary):
${policies.map(p => `- [${p.id}] ${p.title}: ${p.summary}`).join('\n')}

Find the top 1 to 3 policies that semantically match the user's intent. 
Return your answer as valid JSON matching this schema exactly, with NO markdown formatting:
{
  "results": [
    { "id": "Policy_ID", "title": "Policy Title", "reason": "1-sentence explanation of why this matches the user's query." }
  ]
}
If no policies match the intent, return {"results":[]}.`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-20b',
            response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content || '{"results":[]}');
        res.json(parsed);
    } catch (err) {
        console.error("Semantic Search Error:", err);
        res.status(500).json({ error: "Failed to perform semantic search.", details: err.message });
    }
});

// ---------------------------------------------------------
// INTELLIGENT AUTO-UPDATE SYSTEM
// ---------------------------------------------------------

// Helper: fetch live feed data (reused by monitor and the existing endpoint)
async function fetchLiveRegulationFeed() {
    const Parser = require('rss-parser');
    const parser = new Parser();
    
    const feedSources = [
        { url: 'https://www.sec.gov/news/pressreleases.rss', name: 'US SEC', prefix: 'SEC-' },
        { url: 'https://www.federalreserve.gov/feeds/press_all.xml', name: 'US Fed', prefix: 'FED-' },
        { url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', name: 'US CFPB', prefix: 'CFPB-' }
    ];
    
    let allUpdates = [];
    
    for (const source of feedSources) {
        try {
            const feed = await parser.parseURL(source.url);
            const rawItems = feed.items.slice(0, 5);
            
            const updates = rawItems.map(item => {
                const deterministicId = source.prefix + require('crypto').createHash('md5').update(item.link || item.title).digest('hex').substring(0, 10).toUpperCase();
                let fullText = item.contentSnippet || item.content || item.title;
                
                let pubDate = new Date();
                if (item.pubDate) {
                    const parsed = new Date(item.pubDate);
                    if (!isNaN(parsed)) pubDate = parsed;
                }
                
                return {
                    update_id: deterministicId,
                    document_title: item.title,
                    jurisdiction: source.name,
                    date: pubDate.toISOString().split('T')[0],
                    publication_timestamp: pubDate.toISOString(),
                    effective_date: 'Immediate / Pending Review',
                    summary: item.contentSnippet || item.title,
                    extracted_text: fullText,
                    source_authority: source.name,
                    link: item.link,
                    status: 'pending',
                    priority: (item.title.toLowerCase().includes('charge') || item.title.toLowerCase().includes('enforce') || item.title.toLowerCase().includes('penalty')) ? 'high' : 'medium'
                };
            });
            allUpdates = allUpdates.concat(updates);
        } catch (feedErr) {
            console.error(`[Monitor] Error fetching feed ${source.url}:`, feedErr.message);
        }
    }
    
    allUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allUpdates;
}

// POST /api/auto-match-policies — LLM-powered semantic policy matching
app.post('/api/auto-match-policies', async (req, res) => {
    try {
        const { update } = req.body;
        if (!update) return res.status(400).json({ error: 'No regulatory update provided.' });

        // Fetch all active policies from DB
        const policies = await new Promise((resolve, reject) => {
            db.all('SELECT policy_id, title, department, summary, sections_json FROM policies WHERE is_deleted = 0 OR is_deleted IS NULL', [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        if (!process.env.GROQ_API_KEY) {
            // Fallback: basic keyword matching without AI
            const updateText = (update.document_title + ' ' + (update.extracted_text || '')).toLowerCase();
            const matched = policies.filter(p => {
                const pText = (p.title + ' ' + p.summary + ' ' + p.department).toLowerCase();
                const commonWords = updateText.split(/\s+/).filter(w => w.length > 4 && pText.includes(w));
                return commonWords.length >= 2;
            }).map(p => ({ policy_id: p.policy_id, title: p.title, reason: 'Keyword overlap detected' }));
            return res.json({ matched_policies: matched.slice(0, 5), method: 'keyword_fallback' });
        }

        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const policyList = policies.map(p => `- [${p.policy_id}] ${p.title} (${p.department}): ${p.summary}`).join('\n');

        const prompt = `You are a regulatory compliance AI. A new government regulation has been published. Determine which internal company policies are affected and need updating.

REGULATORY UPDATE:
Title: ${update.document_title}
Source: ${update.source_authority || update.jurisdiction}
Text: ${(update.extracted_text || update.summary || '').substring(0, 4000)}

INTERNAL POLICIES:
${policyList}

Return ONLY valid JSON matching this schema exactly:
{
  "matched_policies": [
    { "policy_id": "POL-XXX", "title": "Policy Title", "relevance_score": 0.85, "reason": "Brief explanation of why this policy is affected by the regulation" }
  ]
}
If no policies are affected, return {"matched_policies": []}.
Only include policies with relevance_score > 0.5.`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-20b',
            response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content || '{"matched_policies":[]}');
        res.json({ ...parsed, method: 'ai_semantic' });
    } catch (err) {
        console.error('Auto-Match Error:', err);
        res.status(500).json({ error: 'Failed to match policies.', details: err.message });
    }
});

// POST /api/auto-remediate — AI-powered policy rewriting
app.post('/api/auto-remediate', async (req, res) => {
    try {
        const { update, policy_id } = req.body;
        if (!update || !policy_id) return res.status(400).json({ error: 'Both update and policy_id are required.' });

        // Fetch the policy from DB
        const policy = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM policies WHERE policy_id = ?', [policy_id], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        if (!policy) return res.status(404).json({ error: `Policy ${policy_id} not found.` });

        const sections = policy.sections_json ? JSON.parse(policy.sections_json) : [];
        const changeHistory = policy.change_history_json ? JSON.parse(policy.change_history_json) : [];

        if (!process.env.GROQ_API_KEY) {
            // Fallback: add a generic addendum without AI
            const addendumSection = {
                id: 'sec-auto-' + Date.now(),
                title: 'Regulatory Addendum — ' + new Date().toISOString().split('T')[0],
                text: `This policy has been flagged for review due to a new regulatory update: "${update.document_title}" from ${update.source_authority || update.jurisdiction}. Please review and update relevant sections to ensure compliance.`,
                status: 'needs_review'
            };
            sections.push(addendumSection);
            
            const vParts = (policy.version || '1.0').split('.');
            const newVersion = vParts[0] + '.' + (parseInt(vParts[1] || 0) + 1);
            
            changeHistory.push({
                date: new Date().toISOString().split('T')[0],
                reason: '[AUTO-FLAGGED] New regulation detected: ' + (update.document_title || update.update_id),
                original_text: '(No AI key — addendum added for manual review)',
                new_text: addendumSection.text
            });
            
            db.run(
                `UPDATE policies SET version = ?, last_updated = ?, sections_json = ?, change_history_json = ? WHERE policy_id = ?`,
                [newVersion, new Date().toISOString().split('T')[0], JSON.stringify(sections), JSON.stringify(changeHistory), policy_id]
            );
            
            // Log the remediation
            db.run(
                `INSERT INTO remediation_log (update_id, policy_id, policy_title, section_title, original_text, new_text, rationale, confidence, old_version, new_version, triggered_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [update.update_id, policy_id, policy.title, addendumSection.title, '', addendumSection.text, 'No API key — flagged for manual review', 0.3, policy.version, newVersion, req.body.triggered_by || 'manual', new Date().toISOString()]
            );
            
            return res.json({
                success: true,
                method: 'fallback_addendum',
                policy_id: policy_id,
                new_version: newVersion,
                edits: [{ section_title: addendumSection.title, original_text: '', proposed_text: addendumSection.text, rationale: 'Flagged for manual review (no AI key)' }]
            });
        }

        // AI-powered remediation
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const sectionsText = sections.map((s, i) => `Section ${i + 1}: "${s.title}"\nContent: ${(s.text || s.content || '').substring(0, 1000)}`).join('\n\n');

        const prompt = `You are an expert regulatory compliance AI. A new government regulation has been published, and you must update an internal company policy to comply with it.

NEW GOVERNMENT REGULATION:
Title: ${update.document_title}
Source: ${update.source_authority || update.jurisdiction}
Full Text: ${(update.extracted_text || update.summary || '').substring(0, 5000)}

INTERNAL POLICY TO UPDATE:
Policy ID: ${policy.policy_id}
Title: ${policy.title}
Department: ${policy.department}
Current Version: ${policy.version}
Summary: ${policy.summary}

CURRENT POLICY SECTIONS:
${sectionsText}

INSTRUCTIONS:
1. Analyze the regulation and identify which sections of the internal policy need to be updated to comply.
2. For each section that needs changes, provide the original text and the proposed new text with the necessary changes incorporated.
3. If a completely new section is needed, set original_text to empty string.
4. Be specific and precise — write actual policy language, not vague suggestions.

Return ONLY valid JSON matching this schema:
{
  "edits": [
    {
      "section_title": "Exact title of the section to update (or new section title)",
      "original_text": "The exact original text being replaced (empty string if new section)",
      "proposed_text": "The complete new text for this section incorporating regulatory changes",
      "rationale": "Brief explanation of why this change is needed"
    }
  ],
  "updated_summary": "Updated 1-2 sentence summary for the policy reflecting the changes",
  "confidence": 0.85
}`;

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-20b',
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{"edits":[],"confidence":0}');
        const edits = result.edits || [];
        
        if (edits.length === 0) {
            return res.json({
                success: true,
                method: 'ai_analysis',
                policy_id: policy_id,
                new_version: policy.version,
                message: 'AI determined no changes are needed for this policy.',
                edits: []
            });
        }

        // Apply edits to the policy sections
        const vParts = (policy.version || '1.0').split('.');
        const newVersion = vParts[0] + '.' + (parseInt(vParts[1] || 0) + 1);
        
        edits.forEach(edit => {
            const existingIdx = sections.findIndex(s => s.title === edit.section_title);
            if (existingIdx >= 0) {
                sections[existingIdx].text = edit.proposed_text;
                sections[existingIdx].content = edit.proposed_text;
                sections[existingIdx].status = 'updated_by_ai';
            } else {
                // New section
                sections.push({
                    id: 'sec-ai-' + Date.now() + '-' + Math.random().toString(36).substring(7),
                    title: edit.section_title,
                    text: edit.proposed_text,
                    content: edit.proposed_text,
                    status: 'added_by_ai'
                });
            }
            
            // Add to change history
            changeHistory.push({
                date: new Date().toISOString().split('T')[0],
                reason: '[AI AUTO-REMEDIATION] Triggered by: ' + (update.document_title || update.update_id),
                original_text: edit.original_text || '(New section)',
                new_text: edit.proposed_text
            });

            // Log to remediation_log table
            db.run(
                `INSERT INTO remediation_log (update_id, policy_id, policy_title, section_title, original_text, new_text, rationale, confidence, old_version, new_version, triggered_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [update.update_id, policy_id, policy.title, edit.section_title, edit.original_text || '', edit.proposed_text, edit.rationale, result.confidence || 0.85, policy.version, newVersion, req.body.triggered_by || 'manual', new Date().toISOString()]
            );
        });

        // Save updated policy to DB
        const updatedSummary = result.updated_summary || policy.summary;
        db.run(
            `UPDATE policies SET version = ?, summary = ?, last_updated = ?, sections_json = ?, change_history_json = ? WHERE policy_id = ?`,
            [newVersion, updatedSummary, new Date().toISOString().split('T')[0], JSON.stringify(sections), JSON.stringify(changeHistory), policy_id]
        );

        res.json({
            success: true,
            method: 'ai_remediation',
            policy_id: policy_id,
            policy_title: policy.title,
            old_version: policy.version,
            new_version: newVersion,
            edits: edits,
            confidence: result.confidence || 0.85
        });

    } catch (err) {
        console.error('Auto-Remediate Error:', err);
        res.status(500).json({ error: 'Failed to auto-remediate policy.', details: err.message });
    }
});

// GET /api/remediation-log — Full audit trail
app.get('/api/remediation-log', (req, res) => {
    db.all('SELECT * FROM remediation_log ORDER BY created_at DESC LIMIT 100', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ---------------------------------------------------------
// BACKGROUND REGULATORY MONITOR
// ---------------------------------------------------------
const MONITOR_INTERVAL_HOURS = parseFloat(process.env.MONITOR_INTERVAL_HOURS || '6');
let monitorState = {
    isRunning: false,
    lastRunAt: null,
    nextRunAt: null,
    totalRunCount: 0,
    lastRunResult: null,
    intervalId: null
};

async function runRegulatoryMonitor() {
    if (monitorState.isRunning) {
        console.log('[Monitor] Already running, skipping...');
        return { skipped: true, reason: 'Already running' };
    }
    
    monitorState.isRunning = true;
    monitorState.lastRunAt = new Date().toISOString();
    monitorState.totalRunCount++;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 [REGULATORY MONITOR] Run #${monitorState.totalRunCount} started at ${monitorState.lastRunAt}`);
    console.log(`${'='.repeat(60)}`);
    
    const runResult = {
        run_number: monitorState.totalRunCount,
        started_at: monitorState.lastRunAt,
        new_updates_found: 0,
        policies_updated: 0,
        errors: [],
        details: []
    };
    
    try {
        // Step 1: Fetch live regulatory feed
        console.log('[Monitor] Step 1: Fetching live regulatory feeds...');
        const updates = await fetchLiveRegulationFeed();
        console.log(`[Monitor] Fetched ${updates.length} regulation items from feeds.`);
        
        // Step 2: Filter out already-processed updates
        const processedIds = await new Promise((resolve, reject) => {
            db.all('SELECT update_id FROM processed_updates', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.update_id));
            });
        });
        
        const newUpdates = updates.filter(u => !processedIds.includes(u.update_id));
        runResult.new_updates_found = newUpdates.length;
        console.log(`[Monitor] ${newUpdates.length} new updates to process (${processedIds.length} already processed).`);
        
        if (newUpdates.length === 0) {
            console.log('[Monitor] No new regulations. Done.');
            runResult.completed_at = new Date().toISOString();
            monitorState.lastRunResult = runResult;
            monitorState.isRunning = false;
            return runResult;
        }
        
        // Step 3: Process each new update
        for (const update of newUpdates.slice(0, 5)) { // Process max 5 per run to avoid overload
            console.log(`[Monitor] Processing: "${update.document_title}"`);
            
            try {
                // Step 3a: Match policies
                const policies = await new Promise((resolve, reject) => {
                    db.all('SELECT policy_id, title, department, summary, sections_json FROM policies WHERE is_deleted = 0 OR is_deleted IS NULL', [], (err, rows) => {
                        if (err) reject(err); else resolve(rows);
                    });
                });
                
                let matchedPolicies = [];
                
                if (process.env.GROQ_API_KEY) {
                    // Use AI matching
                    const Groq = require('groq-sdk');
                    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
                    
                    const policyList = policies.map(p => `- [${p.policy_id}] ${p.title} (${p.department}): ${p.summary}`).join('\n');
                    
                    const matchPrompt = `You are a regulatory compliance AI. Determine which internal policies are affected by this regulation.

REGULATION: ${update.document_title}
Text: ${(update.extracted_text || update.summary || '').substring(0, 3000)}

POLICIES:
${policyList}

Return JSON: {"matched_policies": [{"policy_id": "ID", "title": "Title", "relevance_score": 0.85, "reason": "Why"}]}
Only include policies with relevance > 0.5. If none match, return empty array.`;
                    
                    try {
                        const matchResponse = await groq.chat.completions.create({
                            messages: [{ role: 'user', content: matchPrompt }],
                            model: 'openai/gpt-oss-20b',
                            response_format: { type: 'json_object' },
                            temperature: 0.1
                        });
                        const matchResult = JSON.parse(matchResponse.choices[0]?.message?.content || '{"matched_policies":[]}');
                        matchedPolicies = matchResult.matched_policies || [];
                    } catch (aiErr) {
                        console.error(`[Monitor] AI matching failed for "${update.document_title}":`, aiErr.message);
                        runResult.errors.push({ update_id: update.update_id, step: 'matching', error: aiErr.message });
                    }
                } else {
                    // Fallback: keyword matching
                    const updateText = (update.document_title + ' ' + (update.extracted_text || '')).toLowerCase();
                    matchedPolicies = policies.filter(p => {
                        const pText = (p.title + ' ' + p.summary + ' ' + p.department).toLowerCase();
                        const commonWords = updateText.split(/\s+/).filter(w => w.length > 4 && pText.includes(w));
                        return commonWords.length >= 2;
                    }).map(p => ({ policy_id: p.policy_id, title: p.title, reason: 'Keyword overlap' }));
                    matchedPolicies = matchedPolicies.slice(0, 3);
                }
                
                console.log(`[Monitor]   → Matched ${matchedPolicies.length} policies.`);
                
                // Step 3b: Auto-remediate each matched policy
                for (const matched of matchedPolicies) {
                    try {
                        // Call our own auto-remediate logic inline (to avoid HTTP loopback)
                        const policy = await new Promise((resolve, reject) => {
                            db.get('SELECT * FROM policies WHERE policy_id = ?', [matched.policy_id], (err, row) => {
                                if (err) reject(err); else resolve(row);
                            });
                        });
                        
                        if (!policy) continue;
                        
                        const sections = policy.sections_json ? JSON.parse(policy.sections_json) : [];
                        const changeHistory = policy.change_history_json ? JSON.parse(policy.change_history_json) : [];
                        const vParts = (policy.version || '1.0').split('.');
                        const newVersion = vParts[0] + '.' + (parseInt(vParts[1] || 0) + 1);
                        
                        if (process.env.GROQ_API_KEY) {
                            const Groq = require('groq-sdk');
                            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
                            
                            const sectionsText = sections.map((s, i) => `Section ${i + 1}: "${s.title}"\nContent: ${(s.text || s.content || '').substring(0, 800)}`).join('\n\n');
                            
                            const remediatePrompt = `You are an expert regulatory compliance AI. Update the internal policy to comply with the new regulation.

REGULATION: ${update.document_title}
Source: ${update.source_authority}
Text: ${(update.extracted_text || update.summary || '').substring(0, 4000)}

POLICY: [${policy.policy_id}] ${policy.title}
${sectionsText}

Return JSON:
{
  "edits": [{"section_title": "Title", "original_text": "old text", "proposed_text": "new text with regulation compliance added", "rationale": "Why"}],
  "updated_summary": "New summary",
  "confidence": 0.85
}`;
                            
                            const remResponse = await groq.chat.completions.create({
                                messages: [{ role: 'user', content: remediatePrompt }],
                                model: 'openai/gpt-oss-20b',
                                response_format: { type: 'json_object' },
                                temperature: 0.1
                            });
                            
                            const remResult = JSON.parse(remResponse.choices[0]?.message?.content || '{"edits":[]}');
                            const edits = remResult.edits || [];
                            
                            if (edits.length > 0) {
                                edits.forEach(edit => {
                                    const existingIdx = sections.findIndex(s => s.title === edit.section_title);
                                    if (existingIdx >= 0) {
                                        sections[existingIdx].text = edit.proposed_text;
                                        sections[existingIdx].content = edit.proposed_text;
                                        sections[existingIdx].status = 'updated_by_ai';
                                    } else {
                                        sections.push({ id: 'sec-ai-' + Date.now(), title: edit.section_title, text: edit.proposed_text, content: edit.proposed_text, status: 'added_by_ai' });
                                    }
                                    changeHistory.push({ date: new Date().toISOString().split('T')[0], reason: '[AI AUTO-REMEDIATION] ' + update.document_title, original_text: edit.original_text || '(New section)', new_text: edit.proposed_text });
                                    
                                    db.run(`INSERT INTO remediation_log (update_id, policy_id, policy_title, section_title, original_text, new_text, rationale, confidence, old_version, new_version, triggered_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [update.update_id, policy.policy_id, policy.title, edit.section_title, edit.original_text || '', edit.proposed_text, edit.rationale, remResult.confidence || 0.85, policy.version, newVersion, 'auto_monitor', new Date().toISOString()]);
                                });
                                
                                db.run(`UPDATE policies SET version = ?, summary = ?, last_updated = ?, sections_json = ?, change_history_json = ? WHERE policy_id = ?`,
                                    [newVersion, remResult.updated_summary || policy.summary, new Date().toISOString().split('T')[0], JSON.stringify(sections), JSON.stringify(changeHistory), policy.policy_id]);
                                
                                runResult.policies_updated++;
                                console.log(`[Monitor]   ✅ Updated "${policy.title}" → v${newVersion} (${edits.length} edits)`);
                                
                                runResult.details.push({ update_id: update.update_id, policy_id: policy.policy_id, policy_title: policy.title, new_version: newVersion, edits_count: edits.length });
                            }
                        } else {
                            // Fallback without AI: add addendum
                            sections.push({
                                id: 'sec-auto-' + Date.now(),
                                title: 'Regulatory Addendum — ' + new Date().toISOString().split('T')[0],
                                text: `Flagged for review: "${update.document_title}" from ${update.source_authority || update.jurisdiction}.`,
                                status: 'needs_review'
                            });
                            changeHistory.push({ date: new Date().toISOString().split('T')[0], reason: '[AUTO-FLAGGED] ' + update.document_title, original_text: '', new_text: 'Addendum added for manual review' });
                            
                            db.run(`UPDATE policies SET version = ?, last_updated = ?, sections_json = ?, change_history_json = ? WHERE policy_id = ?`,
                                [newVersion, new Date().toISOString().split('T')[0], JSON.stringify(sections), JSON.stringify(changeHistory), policy.policy_id]);
                            
                            db.run(`INSERT INTO remediation_log (update_id, policy_id, policy_title, section_title, original_text, new_text, rationale, confidence, old_version, new_version, triggered_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [update.update_id, policy.policy_id, policy.title, 'Regulatory Addendum', '', 'Flagged for review', 'No AI key', 0.3, policy.version, newVersion, 'auto_monitor', new Date().toISOString()]);
                            
                            runResult.policies_updated++;
                        }
                        
                    } catch (remErr) {
                        console.error(`[Monitor]   ❌ Remediation failed for ${matched.policy_id}:`, remErr.message);
                        runResult.errors.push({ update_id: update.update_id, policy_id: matched.policy_id, step: 'remediation', error: remErr.message });
                    }
                }
                
                // Step 3c: Mark update as processed
                db.run(
                    `INSERT OR REPLACE INTO processed_updates (update_id, document_title, jurisdiction, source_authority, processed_at, matched_policy_ids, action_taken, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [update.update_id, update.document_title, update.jurisdiction, update.source_authority, new Date().toISOString(), JSON.stringify(matchedPolicies.map(m => m.policy_id)), matchedPolicies.length > 0 ? 'remediated' : 'no_match', 'completed']
                );
                
                // Step 3d: Send email notification if policies were updated
                if (matchedPolicies.length > 0) {
                    try {
                        const nodemailer = require('nodemailer');
                        const testAccount = await nodemailer.createTestAccount();
                        const transporter = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, secure: false, auth: { user: testAccount.user, pass: testAccount.pass } });
                        
                        const emailHtml = `
                            <h2>🤖 Automated Policy Update Notice</h2>
                            <p>The PolicyPilot Regulatory Monitor has detected a new government regulation and automatically updated your internal policies.</p>
                            <hr>
                            <h3>📜 Regulation</h3>
                            <p><strong>${update.document_title}</strong><br>Source: ${update.source_authority} | Date: ${update.date}</p>
                            <h3>📋 Policies Updated</h3>
                            <ul>${matchedPolicies.map(m => `<li><strong>${m.title}</strong> (${m.policy_id}) — ${m.reason}</li>`).join('')}</ul>
                            <hr>
                            <p><em>Please review the changes in the PolicyPilot Dashboard.</em></p>
                        `;
                        
                        const info = await transporter.sendMail({
                            from: '"PolicyPilot Auto-Monitor" <monitor@policypilot.ai>',
                            to: 'compliance-team@company.com',
                            subject: `🔔 [AUTO-UPDATE] ${matchedPolicies.length} policies updated — ${update.document_title}`,
                            html: emailHtml
                        });
                        console.log(`[Monitor]   📧 Email notification sent. Preview: ${nodemailer.getTestMessageUrl(info)}`);
                    } catch (emailErr) {
                        console.warn(`[Monitor]   ⚠️ Email notification failed:`, emailErr.message);
                    }
                }
                
            } catch (updateErr) {
                console.error(`[Monitor] Error processing "${update.document_title}":`, updateErr.message);
                runResult.errors.push({ update_id: update.update_id, error: updateErr.message });
                
                // Still mark as processed to avoid infinite retries
                db.run(`INSERT OR REPLACE INTO processed_updates (update_id, document_title, jurisdiction, source_authority, processed_at, action_taken, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [update.update_id, update.document_title, update.jurisdiction, update.source_authority, new Date().toISOString(), 'error', 'failed']);
            }
        }
        
    } catch (err) {
        console.error('[Monitor] Fatal error:', err);
        runResult.errors.push({ step: 'global', error: err.message });
    }
    
    runResult.completed_at = new Date().toISOString();
    monitorState.lastRunResult = runResult;
    monitorState.isRunning = false;
    monitorState.nextRunAt = new Date(Date.now() + MONITOR_INTERVAL_HOURS * 3600000).toISOString();
    
    console.log(`[Monitor] ✅ Run #${runResult.run_number} completed. ${runResult.new_updates_found} new updates, ${runResult.policies_updated} policies updated, ${runResult.errors.length} errors.`);
    console.log(`[Monitor] Next run scheduled at: ${monitorState.nextRunAt}\n`);
    
    return runResult;
}

// POST /api/impact-matrix — Generate a cross-reference matrix of impacts
app.post('/api/impact-matrix', async (req, res) => {
    try {
        const { regulations, policyIds } = req.body;
        if (!regulations || !policyIds || regulations.length === 0 || policyIds.length === 0) {
            return res.status(400).json({ error: "Must provide at least one regulation and one policyId" });
        }
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: "GROQ_API_KEY is required for this feature" });
        }

        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        // Fetch policies
        db.all(`SELECT policy_id, title, summary, sections_json FROM policies WHERE policy_id IN (${policyIds.map(id => `'${id}'`).join(',')})`, [], async (err, policies) => {
            if (err) return res.status(500).json({ error: err.message });

            let prompt = `You are a compliance AI. Analyze the cross-reference matrix between these Regulations and Internal Policies.
For each Policy, analyze if it is impacted by each Regulation.
Return ONLY valid JSON in this exact format:
{
  "matrix": [
    {
      "policy_id": "policy id here",
      "impacts": [
        {
          "regulation_id": "regulation id here",
          "severity": "high", // or "medium", "low", "none"
          "summary": "1 sentence explanation of why and what needs to change."
        }
      ]
    }
  ]
}

### Regulations:
`;
            regulations.forEach(r => {
                prompt += `ID: ${r.update_id}\nTitle: ${r.document_title}\nSummary: ${r.summary}\n\n`;
            });

            prompt += `### Internal Policies:\n`;
            policies.forEach(p => {
                let sections = [];
                try { sections = JSON.parse(p.sections_json); } catch(e){}
                let polText = sections.map(s => s.text).join(' ').substring(0, 1000); // limit context
                prompt += `ID: ${p.policy_id}\nTitle: ${p.title}\nContent Snippet: ${polText}\n\n`;
            });

            try {
                const response = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'openai/gpt-oss-20b',
                    response_format: { type: "json_object" }
                });

                const parsed = JSON.parse(response.choices[0]?.message?.content || '{"matrix":[]}');
                res.json(parsed);
            } catch (aiErr) {
                console.error("AI Matrix Error:", aiErr);
                res.status(500).json({ error: "Failed to generate matrix via AI." });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/monitor/status — Check monitor state
app.get('/api/monitor/status', (req, res) => {
    res.json({
        is_running: monitorState.isRunning,
        last_run_at: monitorState.lastRunAt,
        next_run_at: monitorState.nextRunAt,
        total_run_count: monitorState.totalRunCount,
        interval_hours: MONITOR_INTERVAL_HOURS,
        last_run_result: monitorState.lastRunResult,
        has_api_key: !!process.env.GROQ_API_KEY
    });
});

// POST /api/monitor/run-now — Manually trigger the monitor
app.post('/api/monitor/run-now', async (req, res) => {
    if (monitorState.isRunning) {
        return res.status(409).json({ error: 'Monitor is already running. Please wait for it to complete.' });
    }
    console.log('[Monitor] Manual trigger received.');
    const result = await runRegulatoryMonitor();
    res.json({ success: true, result });
});

// GET /api/processed-updates — View all processed updates
app.get('/api/processed-updates', (req, res) => {
    db.all('SELECT * FROM processed_updates ORDER BY processed_at DESC LIMIT 50', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 PolicyPilot Backend running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}/index.html`);
    console.log(`=========================================`);
    
    // Start the background regulatory monitor
    const intervalMs = MONITOR_INTERVAL_HOURS * 3600000;
    monitorState.nextRunAt = new Date(Date.now() + intervalMs).toISOString();
    console.log(`\n🔍 Regulatory Monitor active (interval: every ${MONITOR_INTERVAL_HOURS} hours)`);
    console.log(`   Next scheduled run: ${monitorState.nextRunAt}`);
    console.log(`   Manual trigger: POST http://localhost:${PORT}/api/monitor/run-now`);
    console.log(`   Status: GET http://localhost:${PORT}/api/monitor/status`);
    if (!process.env.GROQ_API_KEY) {
        console.log(`   ⚠️  No GROQ_API_KEY found — running in fallback mode (keyword matching + addendums)`);
        console.log(`   💡 Set GROQ_API_KEY in .env for full AI-powered remediation\n`);
    } else {
        console.log(`   ✅ GROQ_API_KEY detected — AI-powered remediation enabled\n`);
    }
    
    monitorState.intervalId = setInterval(runRegulatoryMonitor, intervalMs);
    
    // Run the first scan shortly after startup (30 seconds delay to let DB settle)
    setTimeout(() => {
        console.log('[Monitor] Running initial scan...');
        runRegulatoryMonitor();
    }, 30000);
});

// Hack for Node.js v25.8.0 dropping the event loop when idle on this port
setInterval(() => {
   // keepalive
}, 1000000);

