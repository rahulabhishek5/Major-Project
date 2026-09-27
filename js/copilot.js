/**
 * UBS — Copilot Interactive RAG Assistant
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};

  function Copilot() {
    this.isOpen = false;
    this.isTyping = false;
    
    // Load past conversations sorted in date and time
    var savedHistory = localStorage.getItem('lex_ai_history');
    if (savedHistory) {
      this.messages = JSON.parse(savedHistory);
      // Ensure they are sorted by date and time
      this.messages.sort(function(a, b) {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
    } else {
      this.messages = [
        { role: 'bot', text: 'Hello! I am Lex, your AI compliance assistant. You can ask me about regulatory updates, internal policies, or the reasoning behind my decisions.', timestamp: new Date() }
      ];
    }
  }

  Copilot.prototype.init = function() {
    this._renderWidget();
    this._bindEvents();
  };

  Copilot.prototype._renderWidget = function() {
    const container = document.createElement('div');
    container.className = 'copilot-widget';
    container.id = 'copilot-widget';
    
    let html = `
      <div class="copilot-panel" id="copilot-panel">
        <div class="copilot-header">
          <div class="copilot-header__icon"><i data-lucide="bot" style="width:20px;height:20px"></i></div>
          <div class="copilot-header__title">
            <div class="copilot-header__name">Lex AI</div>
            <div class="copilot-header__status">Online</div>
          </div>
          <button id="copilot-new-chat" title="New Chat" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;cursor:pointer;padding:4px 8px;border-radius:4px;font-size:11px;margin-left:auto;display:flex;align-items:center;gap:4px;"><i data-lucide="plus-circle" style="width:12px;height:12px;"></i> New</button>
          <button id="copilot-close" title="Close" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;margin-left:12px;padding:4px;"><i data-lucide="x" style="width:16px;height:16px;"></i></button>
        </div>
        <div class="copilot-messages scroll-area" id="copilot-messages"></div>
        <div class="copilot-suggestions" id="copilot-suggestions">
          <div class="copilot-suggestion">What does the DPDP Act require?</div>
          <div class="copilot-suggestion">How does the new lending rule affect us?</div>
          <div class="copilot-suggestion">Show me high risk updates</div>
        </div>
        <form class="copilot-input-area" id="copilot-form" style="display:flex; align-items:center;">
          <input type="file" id="copilot-file-input" accept=".pdf,.txt" style="display:none;">
          <button type="button" class="copilot-attach" id="copilot-attach" title="Attach Document" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0 8px;"><i data-lucide="paperclip" style="width:18px;height:18px;"></i></button>
          <input type="text" class="copilot-input" id="copilot-input" placeholder="Ask about regulations or policies..." autocomplete="off" style="flex:1;">
          <button type="button" class="copilot-mic" id="copilot-mic" title="Voice Input" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0 8px;"><i data-lucide="mic" style="width:18px;height:18px;"></i></button>
          <button type="submit" class="copilot-send">➤</button>
        </form>
      </div>
      <button class="copilot-toggle" id="copilot-toggle"><i data-lucide="bot" style="width:28px;height:28px"></i></button>
    `;
    container.innerHTML = html;
    document.body.appendChild(container);
    this._renderMessages();
    if (window.lucide) window.lucide.createIcons();
  };

  Copilot.prototype._bindEvents = function() {
    const self = this;
    const toggle = document.getElementById('copilot-toggle');
    const panel = document.getElementById('copilot-panel');
    const form = document.getElementById('copilot-form');
    const input = document.getElementById('copilot-input');
    const suggestions = document.getElementById('copilot-suggestions');

    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      toggle.classList.toggle('open', this.isOpen);
      panel.classList.toggle('open', this.isOpen);
      if (this.isOpen) {
        toggle.innerHTML = '<i data-lucide="x" style="width:28px;height:28px"></i>';
        setTimeout(() => input.focus(), 300);
      } else {
        toggle.innerHTML = '<i data-lucide="bot" style="width:28px;height:28px"></i>';
      }
      if (window.lucide) window.lucide.createIcons();
    });

    const closeBtn = document.getElementById('copilot-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        toggle.classList.remove('open');
        panel.classList.remove('open');
        toggle.innerHTML = '<i data-lucide="bot" style="width:28px;height:28px"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        self.sendMessage(text);
        input.value = '';
      }
    });

    suggestions.addEventListener('click', (e) => {
      if (e.target.classList.contains('copilot-suggestion')) {
        self.sendMessage(e.target.textContent);
      }
    });

    const newChatBtn = document.getElementById('copilot-new-chat');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        self.messages = [
          { role: 'bot', text: 'Hello! I am Lex, your AI compliance assistant. You can ask me about regulatory updates, internal policies, or the reasoning behind my decisions.', timestamp: new Date() }
        ];
        localStorage.removeItem('lex_ai_history');
        if (suggestions) suggestions.style.display = 'block';
        self._renderMessages();
        
        // Also re-render dashboard if active to sync up history
        if (window.AppCore.Router && window.AppCore.Router.currentView === 'dashboard' && window.AppCore.Views.dashboard) {
          var dashboardContainer = document.getElementById('view-container');
          if (dashboardContainer) window.AppCore.Views.dashboard.render(dashboardContainer);
        }
      });
    }

    const micBtn = document.getElementById('copilot-mic');
    if (micBtn) {
      let recognition = null;
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
          micBtn.style.color = 'var(--accent)';
          micBtn.innerHTML = '<i data-lucide="mic" style="width:18px;height:18px;animation: pulse 1s infinite;"></i>';
          if (window.lucide) window.lucide.createIcons();
          input.placeholder = "Listening...";
        };
        
        recognition.onresult = function(event) {
          const transcript = event.results[0][0].transcript;
          input.value += (input.value ? ' ' : '') + transcript;
          micBtn.style.color = 'var(--text-muted)';
          micBtn.innerHTML = '<i data-lucide="mic" style="width:18px;height:18px;"></i>';
          if (window.lucide) window.lucide.createIcons();
          input.placeholder = "Ask about regulations or policies...";
          
          // Auto-submit after voice input
          setTimeout(() => {
            if (input.value.trim()) {
              self.sendMessage(input.value.trim());
              input.value = '';
            }
          }, 500);
        };
        
        recognition.onerror = function(event) {
          console.error("Mic error:", event.error);
          micBtn.style.color = 'var(--danger)';
          micBtn.innerHTML = '<i data-lucide="mic-off" style="width:18px;height:18px;"></i>';
          if (window.lucide) window.lucide.createIcons();
          input.placeholder = "Mic error: " + event.error;
          setTimeout(() => {
            micBtn.style.color = 'var(--text-muted)';
            micBtn.innerHTML = '<i data-lucide="mic" style="width:18px;height:18px;"></i>';
            input.placeholder = "Ask about regulations or policies...";
            if (window.lucide) window.lucide.createIcons();
          }, 3000);
        };
        
        recognition.onend = function() {
          micBtn.style.color = 'var(--text-muted)';
          micBtn.innerHTML = '<i data-lucide="mic" style="width:18px;height:18px;"></i>';
          if (window.lucide) window.lucide.createIcons();
          input.placeholder = "Ask about regulations or policies...";
        };

        micBtn.addEventListener('click', () => {
          try {
            recognition.start();
          } catch(e) {
            console.error(e);
            if (window.AppCore && window.AppCore.App) {
              window.AppCore.App.showToast('error', 'Microphone Error', 'Could not access microphone.');
            }
          }
        });
      } else {
        micBtn.style.display = 'none'; // Hide if not supported
      }
    }

    const attachBtn = document.getElementById('copilot-attach');
    const fileInput = document.getElementById('copilot-file-input');
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        if (window.AppCore && window.AppCore.App) {
          window.AppCore.App.showToast('info', 'Uploading Document', 'Extracting text from ' + file.name + '...');
        }
        
        const formData = new FormData();
        formData.append('document', file);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Upload failed');
          
          input.value += (input.value ? '\n\n' : '') + '[Document Attached: ' + file.name + ']\n' + data.text.substring(0, 5000);
          
          if (window.AppCore && window.AppCore.App) {
            window.AppCore.App.showToast('success', 'Document Processed', 'Ready to analyze ' + file.name);
          }
        } catch (err) {
          console.error(err);
          if (window.AppCore && window.AppCore.App) {
            window.AppCore.App.showToast('error', 'Upload Error', err.message);
          }
        }
        
        fileInput.value = ''; // reset
      });
    }
  };

  Copilot.prototype._renderMessages = function() {
    // If full page copilot view is active, update it too
    if (window.AppCore.Router && window.AppCore.Router.currentView === 'copilot' && window.AppCore.Views.copilot && window.AppCore.Views.copilot.renderMessages) {
      window.AppCore.Views.copilot.renderMessages();
      var pageTyping = document.getElementById('copilot-page-typing');
      if (pageTyping) {
        pageTyping.style.display = this.isTyping ? 'flex' : 'none';
      }
    }

    const container = document.getElementById('copilot-messages');
    if (!container) return;
    
    let html = '';
    this.messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      const now = new Date();
      const isToday = msgDate.getDate() === now.getDate() && msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear();
      const dateOptions = { month: 'short', day: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit' };
      const timeStr = isToday ? msgDate.toLocaleTimeString([], timeOptions) : msgDate.toLocaleDateString([], dateOptions) + ', ' + msgDate.toLocaleTimeString([], timeOptions);
      
      let htmlText = msg.text;
      htmlText = htmlText.replace(/\[\[(POL-[A-Z0-9-]+)\]\]/g, '<a href="#policy" onclick="window.AppCore.Router.navigate(\'policy\')" style="color:var(--accent); text-decoration:underline;">$1</a>');
      htmlText = htmlText.replace(/\[\[(GAP-[A-Z0-9-]+)\]\]/g, '<a href="#gap-analysis" onclick="window.AppCore.Router.navigate(\'gap-analysis\')" style="color:var(--accent); text-decoration:underline;">$1</a>');
      // basic markdown bold
      htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      let copyBtn = '';
      if (msg.role === 'bot') {
        const safeText = msg.text.replace(/"/g, '&quot;');
        copyBtn = `<span style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; margin-left:8px; opacity:0.8; transition:opacity 0.2s;" onclick="navigator.clipboard.writeText(this.dataset.text); const self=this; const old=self.innerHTML; self.innerHTML='<i data-lucide=\\'check\\' style=\\'width:12px;height:12px;\\'></i> Copied!'; if(window.lucide) window.lucide.createIcons(); setTimeout(()=>self.innerHTML=old, 2000);" data-text="${safeText}"><i data-lucide="copy" style="width:12px;height:12px;"></i> Copy</span>`;
      }
      html += `
        <div class="copilot-msg copilot-msg--${msg.role}">
          <div class="copilot-msg__bubble">${htmlText}</div>
          <div class="copilot-msg__time" style="display:flex; align-items:center;">${timeStr} ${copyBtn}</div>
        </div>
      `;
    });

    if (this.isTyping) {
      html += `
        <div class="copilot-msg copilot-msg--bot">
          <div class="copilot-typing">
            <div class="copilot-typing__dot"></div>
            <div class="copilot-typing__dot"></div>
            <div class="copilot-typing__dot"></div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
  };

  Copilot.prototype.sendMessage = function(text) {
    this.messages.push({ role: 'user', text: text, timestamp: new Date() });
    localStorage.setItem('lex_ai_history', JSON.stringify(this.messages));
    this.isTyping = true;
    this._renderMessages();

    // Hide suggestions after first message
    const suggestions = document.getElementById('copilot-suggestions');
    if (suggestions) suggestions.style.display = 'none';

    // Also re-render dashboard if active to show User message in history
    if (window.AppCore.Router && window.AppCore.Router.currentView === 'dashboard' && window.AppCore.Views.dashboard) {
      var dashboardContainer = document.getElementById('view-container');
      if (dashboardContainer) window.AppCore.Views.dashboard.render(dashboardContainer);
    }

    // Simulate RAG query processing
    this._processQuery(text);
  };

  Copilot.prototype._processQuery = function(query) {
    const self = this;
    
    // Capture current website state to give the AI context about everything
    let appContext = {};
    if (window.AppCore && window.AppCore.State) {
        appContext = {
            escalations: window.AppCore.State.getState('escalationQueue') || [],
            regulatory_feed: window.AppCore.State.getState('updates') || [],
            active_view: window.AppCore.Router ? window.AppCore.Router.currentView : 'unknown'
        };
    }
    
    // Capture conversation history (excluding the very first generic greeting and the current query we just added)
    // We send up to the last 10 messages for memory.
    const history = this.messages.slice(-11, -1).map(m => ({ role: m.role === 'bot' ? 'bot' : 'user', text: m.text }));
    
    fetch('http://localhost:3000/api/lex/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userMessage: query,
        history: history,
        currentContext: window.location.hash,
        stream: true
      })
    })
    .then(async function(res) { 
      if (!res.ok) throw new Error("Server returned " + res.status);
      
      self.isTyping = false;
      let botMsg = { role: 'bot', text: '', timestamp: new Date() };
      self.messages.push(botMsg);
      self._renderMessages();

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('data: ')) {
            const dataStr = lines[i].substring(6);
            if (dataStr.trim() === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                botMsg.text += data.text;
                self._renderMessages(); // Trigger DOM update for streaming effect
              }
            } catch (e) {}
          }
        }
      }
      
      localStorage.setItem('lex_ai_history', JSON.stringify(self.messages));

      // Notify the full-page copilot view that we got a response
      var typingDiv = document.getElementById('copilot-page-typing');
      if (typingDiv) typingDiv.style.display = 'none';
      if (window.AppCore.Views && window.AppCore.Views.copilot) {
        window.AppCore.Views.copilot.renderMessages();
        if (typeof window.AppCore.Views.copilot._saveCurrentSession === 'function') {
          window.AppCore.Views.copilot._saveCurrentSession();
          window.AppCore.Views.copilot.renderPastChats();
        }
      }

      // Also re-render dashboard if active to show Bot response in history
      if (window.AppCore.Router && window.AppCore.Router.currentView === 'dashboard' && window.AppCore.Views.dashboard) {
        var dashboardContainer = document.getElementById('view-container');
        if (dashboardContainer) window.AppCore.Views.dashboard.render(dashboardContainer);
      }
    })
    .catch(function(err) {
      console.error(err);
      self.isTyping = false;
      self.messages.push({ role: 'bot', text: "Sorry, I'm having trouble connecting to the AI backend. Please make sure the server is running.", timestamp: new Date() });
      localStorage.setItem('lex_ai_history', JSON.stringify(self.messages));
      self._renderMessages();

      // Notify the full-page copilot view
      var typingDiv = document.getElementById('copilot-page-typing');
      if (typingDiv) typingDiv.style.display = 'none';
      if (window.AppCore.Views && window.AppCore.Views.copilot) {
        window.AppCore.Views.copilot.renderMessages();
        if (typeof window.AppCore.Views.copilot._saveCurrentSession === 'function') {
          window.AppCore.Views.copilot._saveCurrentSession();
          window.AppCore.Views.copilot.renderPastChats();
        }
      }

      // Also re-render dashboard if active to show Bot response in history
      if (window.AppCore.Router && window.AppCore.Router.currentView === 'dashboard' && window.AppCore.Views.dashboard) {
        var dashboardContainer = document.getElementById('view-container');
        if (dashboardContainer) window.AppCore.Views.dashboard.render(dashboardContainer);
      }
    });
  };

  // Initialize once DOM is ready (but don't render widget until logged in)
  window.addEventListener('DOMContentLoaded', () => {
    window.AppCore.Copilot = new Copilot();
    // Widget will be rendered by _bootApp() in index.html
  });

})();
