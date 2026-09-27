/* ═══════════════════════════════════════════════════════════
   AI DOCUMENT ANALYZER
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.analyzer = {
  chatHistory: [],
  extractedText: "",

  render: function(container) {
    var html = '<div class="analyzer-container animate-fade-in" style="display:flex; height: calc(100vh - 120px); gap: 32px; padding: 24px 32px; box-sizing: border-box;">';
    
    // LEFT PANEL: Upload & Document Preview
    html += '<div class="glass-panel" style="flex: 1.2; display:flex; flex-direction:column; padding:0; gap:0; border:1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; background: linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">';
    
    // Header
    html += '<div style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); display:flex; align-items:center; gap:12px; background: rgba(255,255,255,0.02);">';
    html += '<div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), #818cf8); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(99,102,241,0.3);"><i data-lucide="file-text" style="color:white; width:20px; height:20px;"></i></div>';
    html += '<div>';
    html += '<h2 style="margin:0; font-size:20px; font-weight:700; color:white; letter-spacing: -0.02em;">Document Analyzer</h2>';
    html += '<p style="margin:4px 0 0 0; font-size:13px; color:var(--text-muted);">Securely parse and extract intelligence from PDFs or text files.</p>';
    html += '</div>';
    html += '</div>';
    
    // Dropzone
    html += '<div id="dropzone-container" style="flex: 1; display:flex; flex-direction:column; padding: 32px;">';
    html += '<div class="analyzer-dropzone" style="flex: 1; border: 2px dashed rgba(255,255,255,0.15); border-radius:16px; padding: 48px 32px; text-align:center; background: rgba(0,0,0,0.2); transition: all 0.3s ease; cursor: pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 16px;" onmouseover="this.style.borderColor=\'var(--accent)\'; this.style.background=\'rgba(99,102,241,0.05)\';" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.15)\'; this.style.background=\'rgba(0,0,0,0.2)\';" onclick="document.getElementById(\'doc-upload\').click()">';
    html += '<div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; margin-bottom: 8px;"><i data-lucide="upload-cloud" style="color:var(--accent); width:32px; height:32px;"></i></div>';
    html += '<input type="file" id="doc-upload" accept=".pdf,.txt" style="display:none;" onchange="window.AppCore.Views.analyzer.handleUpload(this)">';
    html += '<div style="font-size: 16px; font-weight: 600; color: white;">Drag & drop your document here</div>';
    html += '<div style="font-size: 13px; color: var(--text-muted); max-width: 300px; line-height: 1.5;">Supported formats: PDF, TXT (Max size: 10MB)</div>';
    html += '<button class="btn btn--primary" style="margin-top: 16px; border-radius: 100px; padding: 8px 24px; font-weight: 600; font-size: 13px;" onclick="event.stopPropagation(); document.getElementById(\'doc-upload\').click()">Browse Files</button>';
    html += '</div>';
    html += '</div>';
    
    // Extracted Text Preview
    html += '<div id="doc-preview-container" style="flex:1; display:none; flex-direction:column; background: #0f172a; border-top:1px solid rgba(255,255,255,0.05); overflow:hidden; position: relative;">';
    html += '<div style="padding:12px 20px; background: rgba(0,0,0,0.2); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:12px; color:rgba(255,255,255,0.5); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; gap: 8px;">';
    html += '<div style="display:flex; gap: 6px;"><div style="width:10px;height:10px;border-radius:50%;background:#ef4444;"></div><div style="width:10px;height:10px;border-radius:50%;background:#eab308;"></div><div style="width:10px;height:10px;border-radius:50%;background:#22c55e;"></div></div>';
    html += '<span style="margin-left: 12px; font-weight: 500; letter-spacing: 0.05em;">EXTRACTED_BUFFER.TXT</span>';
    html += '</div>';
    html += '<div id="doc-preview" style="flex:1; padding:24px; overflow-y:auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:13px; color:rgba(255,255,255,0.75); line-height:1.7; white-space:pre-wrap; background: repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(255,255,255,0.01) 27px, rgba(255,255,255,0.01) 28px); background-attachment: local;">Awaiting document payload...</div>';
    html += '</div>';
    
    html += '</div>'; // End Left Panel
    
    // RIGHT PANEL: AI Chat
    html += '<div class="glass-panel" style="flex:1; display:flex; flex-direction:column; padding:0; border:1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; background: linear-gradient(145deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">';
    
    // Chat Header
    html += '<div style="padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display:flex; align-items:center; gap:16px; background: rgba(255,255,255,0.02); backdrop-filter: blur(10px);">';
    html += '<div style="position:relative;">';
    html += '<div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 16px rgba(16,185,129,0.3); border: 2px solid rgba(255,255,255,0.1);"><i data-lucide="bot" style="color:white; width:22px; height:22px;"></i></div>';
    html += '<div style="position:absolute; bottom:0; right:0; width:12px; height:12px; background:#10b981; border-radius:50%; border:2px solid #0f172a;"></div>';
    html += '</div>';
    html += '<div>';
    html += '<div style="font-weight:700; font-size:17px; color:white; letter-spacing:-0.01em;">Lex AI Copilot</div>';
    html += '<div style="font-size:12px; color:var(--success); font-weight: 500; display:flex; align-items:center; gap:4px;"><div class="pulse-dot" style="width:6px;height:6px;background:var(--success);border-radius:50%;"></div> Model Ready</div>';
    html += '</div>';
    html += '</div>';
    
    // Chat Area
    html += '<div id="chat-history" style="flex:1; padding: 24px; overflow-y:auto; display:flex; flex-direction:column; gap:20px;">';
    html += '</div>'; // chat history will be populated by renderChat()
    
    // Input Area
    html += '<div style="padding: 20px 24px; border-top:1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1);">';
    html += '<div style="display:flex; align-items:center; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 6px 6px 6px 20px; transition: all 0.2s ease;" onfocusin="this.style.borderColor=\'var(--accent)\'; this.style.background=\'rgba(0,0,0,0.4)\'; box-shadow: 0 0 0 4px rgba(99,102,241,0.1);" onfocusout="this.style.borderColor=\'rgba(255,255,255,0.1)\'; this.style.background=\'rgba(0,0,0,0.3)\'; box-shadow: none;">';
    html += '<input type="text" id="chat-input" style="flex:1; background:transparent; border:none; color:white; font-size:14px; outline:none;" placeholder="Ask Lex to summarize risks, draft reports..." onkeypress="if(event.key===\'Enter\') window.AppCore.Views.analyzer.sendMessage()">';
    html += '<button style="width:36px; height:36px; border-radius:50%; background:var(--accent); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; transition: transform 0.2s ease, background 0.2s ease;" onmouseover="this.style.transform=\'scale(1.05)\'; this.style.background=\'#818cf8\';" onmouseout="this.style.transform=\'none\'; this.style.background=\'var(--accent)\';" onclick="window.AppCore.Views.analyzer.sendMessage()"><i data-lucide="send" style="width:16px;height:16px; margin-left:-2px; margin-top:2px;"></i></button>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>'; // End Right Panel
    
    html += '</div>'; // End Container
    
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    
    this.renderChat();
  },

  handleUpload: function(input) {
    var file = input.files[0];
    if (!file) return;
    
    if (window.AppCore.log) window.AppCore.log("[FILE_IO] Initializing upload for " + file.name, "info");
    
    var preview = document.getElementById('doc-preview');
    var previewContainer = document.getElementById('doc-preview-container');
    var dropzoneContainer = document.getElementById('dropzone-container');
    
    previewContainer.style.display = 'flex';
    dropzoneContainer.style.flex = 'none'; // stop it from taking up all space
    
    preview.innerHTML = "Parsing document... Please wait.";
    
    var formData = new FormData();
    formData.append('document', file);
    
    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.extractedText = data.text;
        preview.textContent = data.text.substring(0, 2000) + (data.text.length > 2000 ? "...\n\n[Document truncated for preview]" : "");
        this.addChatMsg("bot", "I have successfully parsed **" + file.name + "**! It contains " + data.text.length + " characters. What would you like me to do with it?");
        if (window.AppCore.log) window.AppCore.log("[FILE_IO] Successfully parsed " + data.text.length + " characters from " + file.name, "success");
      } else {
        preview.textContent = "Error parsing document.";
      }
    })
    .catch(err => {
      console.error(err);
      preview.textContent = "Network error during upload.";
    });
  },

  sendMessage: function() {
    var input = document.getElementById('chat-input');
    var msg = input.value.trim();
    if (!msg) return;
    
    input.value = "";
    this.addChatMsg("user", msg);
    
    var botIndex = this.chatHistory.length;
    this.addChatMsg("bot", "Lex is thinking...");
    
    var payload = {
      userMessage: msg,
      history: this.chatHistory.slice(0, -1) // Send history excluding the "thinking" message
    };
    
    if (this.extractedText) {
      payload.userMessage = "Regarding this document context: \n" + this.extractedText.substring(0, 30000) + "\n\nUser Question: " + msg;
    }
    
    if (window.AppCore.log) window.AppCore.log("[AI_ENGINE] Querying Lex AI...", "system");
    
    fetch('/api/lex/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        this.updateChatMsg(botIndex, "⚠️ Error: " + data.error);
        if (window.AppCore.log) window.AppCore.log("[AI_ENGINE] Error generating response: " + data.error, "critical");
      } else {
        this.updateChatMsg(botIndex, data.text || data.response);
        if (window.AppCore.log) window.AppCore.log("[AI_ENGINE] Successfully generated response.", "success");
      }
    })
    .catch(err => {
      this.updateChatMsg(botIndex, "⚠️ Network error connecting to AI.");
    });
  },
  
  addChatMsg: function(role, text) {
    this.chatHistory.push({ role: role, text: text });
    this.renderChat();
  },
  
  updateChatMsg: function(index, text) {
    if (this.chatHistory[index]) {
      this.chatHistory[index].text = text;
      this.renderChat();
    }
  },

  renderChat: function() {
    var container = document.getElementById('chat-history');
    if (!container) return;
    
    // Keep first welcome message static in HTML
    var html = '<div style="align-self:flex-start; background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); padding:16px 20px; border-radius:18px; border-top-left-radius:4px; max-width:85%; font-size:14px; line-height:1.6; color: rgba(255,255,255,0.9); box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 4px;">Hello! Upload a document on the left, and I will analyze it. You can ask me to extract policies, summarize risks, or draft compliance reports based on the file.</div>';
    
    this.chatHistory.forEach(msg => {
      var isUser = msg.role === 'user';
      var align = isUser ? 'align-self:flex-end;' : 'align-self:flex-start;';
      var bg = isUser ? 'background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%); color:white; border: 1px solid rgba(255,255,255,0.1);' : 'background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.9);';
      var radius = isUser ? 'border-radius:18px; border-top-right-radius:4px;' : 'border-radius:18px; border-top-left-radius:4px;';
      
      // Simple markdown parser for bold and line breaks
      var formattedText = msg.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
        
      html += '<div style="' + align + bg + radius + ' max-width:85%; padding:14px 20px; font-size:14px; line-height:1.6; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 4px; letter-spacing: -0.01em;">' + formattedText + '</div>';
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }
};
