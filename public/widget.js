(function () {
  'use strict';
    var BOT_URL = 'https://alba-bot-balidao-production.up.railway.app';
  var BOT_NAME = 'Alba';
  var BOT_AVATAR = '🛡️';
  var PRIMARY = '#F4600C';
  var PRIMARY_DARK = '#d94e08';
  var WELCOME = 'Bonjour ! Je suis Alba, votre assistante Balidao.
Comment puis-je vous aider ?';
  var sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now();

  var style = document.createElement('style');
  style.textContent = [
    '#alba-wrapper * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }',
    '#alba-bubble { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: ' + PRIMARY + '; box-shadow: 0 4px 16px rgba(244,96,12,0.45); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; z-index: 99998; transition: transform .2s; border: none; }',
    '#alba-bubble:hover { transform: scale(1.1); }',
    '#alba-bubble .alba-notif { position: absolute; top: -3px; right: -3px; width: 16px; height: 16px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }',
    '#alba-window { position: fixed; bottom: 90px; right: 24px; width: 360px; max-height: 540px; border-radius: 16px; background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.18); display: flex; flex-direction: column; z-index: 99999; overflow: hidden; transform-origin: bottom right; transition: transform .25s, opacity .25s; }',
    '#alba-window.hidden { transform: scale(0.85); opacity: 0; pointer-events: none; }',
    '#alba-header { background: ' + PRIMARY + '; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }',
    '#alba-header .alba-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 18px; }',
    '#alba-header .alba-info { flex: 1; }',
    '#alba-header .alba-name { color: #fff; font-weight: 700; font-size: 15px; }',
    '#alba-header .alba-status { color: rgba(255,255,255,0.85); font-size: 12px; }',
    '#alba-header .alba-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 0; opacity: .8; }',
    '#alba-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; }',
    '.alba-msg { max-width: 82%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; word-break: break-word; }',
    '.alba-msg.bot { background: #fff; border: 1px solid #e8e8e8; border-radius: 14px 14px 14px 4px; color: #222; align-self: flex-start; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }',
    '.alba-msg.user { background: ' + PRIMARY + '; color: #fff; border-radius: 14px 14px 4px 14px; align-self: flex-end; }',
    '.alba-msg a { color: ' + PRIMARY + '; }',
    '.alba-typing { display: flex; gap: 5px; align-items: center; padding: 10px 14px; }',
    '.alba-typing span { width: 7px; height: 7px; border-radius: 50%; background: #ccc; animation: alba-bounce 1.2s infinite; }',
    '.alba-typing span:nth-child(2) { animation-delay: .2s; }',
    '.alba-typing span:nth-child(3) { animation-delay: .4s; }',
    '@keyframes alba-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }',
    '#alba-footer { padding: 10px 12px; border-top: 1px solid #eee; display: flex; gap: 8px; background: #fff; }',
    '#alba-input { flex: 1; border: 1px solid #e0e0e0; border-radius: 20px; padding: 9px 14px; font-size: 14px; outline: none; height: 40px; transition: border-color .2s; }',
    '#alba-input:focus { border-color: ' + PRIMARY + '; }',
    '#alba-send { width: 40px; height: 40px; border-radius: 50%; background: ' + PRIMARY + '; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; flex-shrink: 0; }',
    '#alba-send:hover { background: ' + PRIMARY_DARK + '; }',
    '#alba-send svg { width: 18px; height: 18px; fill: #fff; }',
    '@media (max-width: 420px) { #alba-window { width: calc(100vw - 16px); right: 8px; } #alba-bubble { right: 12px; bottom: 12px; } }',
  ].join('');
  document.head.appendChild(style);

  var wrapper = document.createElement('div');
  wrapper.id = 'alba-wrapper';
  wrapper.innerHTML = '<button id="alba-bubble" aria-label="Chat avec Alba"><span>💬</span><span class="alba-notif" style="display:none"></span></button><div id="alba-window" class="hidden"><div id="alba-header"><div class="alba-avatar">' + BOT_AVATAR + '</div><div class="alba-info"><div class="alba-name">' + BOT_NAME + ' — Balidao</div><div class="alba-status">🟢 En ligne</div></div><button class="alba-close">✕</button></div><div id="alba-messages"></div><div id="alba-footer"><input id="alba-input" type="text" placeholder="Posez votre question..." maxlength="500" autocomplete="off"><button id="alba-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div></div>';
  document.body.appendChild(wrapper);

  var bubble = document.getElementById('alba-bubble');
  var win = document.getElementById('alba-window');
  var msgs = document.getElementById('alba-messages');
  var input = document.getElementById('alba-input');
  var notif = bubble.querySelector('.alba-notif');
  var open = false;

  function linkify(t) { return t.replace(/(https?://[^s]+)/g,'<a href="$1" target="_blank">$1</a>'); }
  function addMsg(text, role) {
    var d = document.createElement('div');
    d.className = 'alba-msg ' + role;
    d.innerHTML = linkify(text.replace(/
/g,'<br>'));
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function showTyping() {
    var d = document.createElement('div');
    d.className = 'alba-msg bot alba-typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function toggleWindow() {
    open = !open;
    win.classList.toggle('hidden', !open);
    notif.style.display = 'none';
    if (open && msgs.children.length === 0) addMsg(WELCOME, 'bot');
    if (open) input.focus();
  }
  async function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    var typing = showTyping();
    try {
      var resp = await fetch(BOT_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId }),
      });
      var data = await resp.json();
      typing.remove();
      addMsg(data.reply || 'Desolee, reessayez.', 'bot');
    } catch(e) {
      typing.remove();
      addMsg('Probleme de connexion. WhatsApp : https://wa.me/22899231818', 'bot');
    }
  }
  bubble.addEventListener('click', toggleWindow);
  win.querySelector('.alba-close').addEventListener('click', toggleWindow);
  document.getElementById('alba-send').addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e) { if(e.key==='Enter') { e.preventDefault(); sendMessage(); } });
  setTimeout(function() { if(!open) notif.style.display = 'block'; }, 8000);
})();
