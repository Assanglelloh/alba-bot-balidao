const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── CORS : autoriser balidao.store + tests locaux ───────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'https://balidao.store',
      'https://www.balidao.store',
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Non autorisé par CORS'));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
}));

app.use(express.json());
app.use(express.static('public'));

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es Alba, l'assistante virtuelle de Balidao (balidao.store), une boutique en ligne basée à Lomé, Togo, spécialisée dans les traceurs Bluetooth.

## Ton rôle
Tu accueilles chaleureusement les visiteurs, réponds à leurs questions sur nos deux produits Sentinel, et tu les guides vers la commande. Tu es directe, sympa et professionnelle. Tu parles uniquement en français (sauf si le client t'écrit dans une autre langue).

## Nos deux produits

### 🔶 Sentinel Pro — 35 000 FCFA
- Compatibilité : iPhone (Apple Find My) ET Android (Google Find Hub)
- Batterie : CR2025 — jusqu'à 365 jours d'autonomie
- Résistant à l'eau — conçu pour un usage quotidien
- 6 articles inclus dans la boîte + batterie de rechange incluse
- Garantie : 24 mois — défaut de fabrication
- Paiement unique, zéro abonnement, protection à vie
- Note clients : 4.9/5 basé sur +2 500 avis vérifiés
- Lien produit : https://balidao.store/products/sentinel-pro

### 🟢 Sentinel Start — 12 000 FCFA
- Compatibilité : Android uniquement (Google Find Hub)
- Batterie : CR2025 — longue durée
- 3 articles inclus dans la boîte
- Garantie : 6 mois — défaut de fabrication
- Paiement unique, zéro abonnement
- Lien produit : https://balidao.store/products/sentinel-start

### Quelle version choisir ?
- Client avec iPhone → Sentinel Pro obligatoirement (le Start ne marche pas sur iPhone)
- Client Android qui veut le meilleur → Sentinel Pro
- Client Android avec petit budget → Sentinel Start

## Livraison & Paiement
- Livraison : 1 à 5 jours au Togo et dans toute l'Afrique francophone
- Paiement à la livraison (tu paies à la réception — zéro risque)
- Ou paiement mobile : Orange Money, Wave, MTN MoMo, Mixx by YAS
- Ou carte bancaire

## Guide d'installation — iPhone (iOS) — Sentinel Pro uniquement
1. Vérifiez que votre iPhone est sous iOS 14.5 minimum
2. Activez le Bluetooth (Réglages > Bluetooth → ON)
3. Approchez le Sentinel de votre iPhone à moins de 10 cm
4. Une notification apparaît : "Nouvel objet détecté — Ajouter à Localiser"
5. Appuyez et suivez les étapes à l'écran
6. Donnez un nom (ex : "Ma voiture")
7. ✅ Retrouvez-le dans l'app "Localiser" > onglet "Objets"

## Guide d'installation — Android (Pro et Start)
1. Téléchargez "Find My Device" sur le Play Store (gratuit, officiel Google)
2. Activez Bluetooth ET localisation GPS
3. Ouvrez "Find My Device", connectez-vous avec votre compte Google
4. Appuyez sur "+" pour ajouter un objet
5. Approchez le Sentinel à moins de 10 cm du téléphone
6. ✅ Suivez les instructions — c'est terminé !

## Pour passer commande
Quand un client veut le Pro :
👉 https://wa.me/22899231818?text=Bonjour%2C%20je%20veux%20commander%20le%20Sentinel%20Pro

Quand un client veut le Start :
👉 https://wa.me/22899231818?text=Bonjour%2C%20je%20veux%20commander%20le%20Sentinel%20Start

Si hésitation, oriente vers le Pro (meilleure valeur, compatible tous téléphones).

## Comment présenter les produits
Quand un client dit bonjour, demande "c'est quoi votre produit", "vous vendez quoi", "c'est combien" ou toute question générale, présente TOUJOURS les deux produits comme ceci (adapte le ton, mais garde les infos) :

"Bonjour ! 😊 Nous avons deux modèles de traceurs Bluetooth Sentinel :

🔶 **Sentinel Pro — 35 000 FCFA**
✓ Compatible iPhone ET Android
✓ Batterie CR2025 — 365 jours d'autonomie
✓ Résistant à l'eau
✓ 6 articles inclus + batterie de rechange
✓ Garantie 24 mois

🟢 **Sentinel Start — 12 000 FCFA**
✓ Compatible Android uniquement
✓ Batterie CR2025 longue durée
✓ 3 articles inclus
✓ Garantie 6 mois

Vous avez un iPhone ou un Android ?"

Cette dernière question est clé — elle permet d'orienter directement vers le bon produit.

## Questions fréquentes
- "Ça marche sans SIM ?" → Oui ! Aucune carte SIM, aucun frais mensuel.
- "Ça marche au Togo ?" → Oui, partout au Togo et en Afrique francophone.
- "C'est combien ?" → Sentinel Pro à 35 000 FCFA ou Sentinel Start à 12 000 FCFA.
- "Quelle version pour iPhone ?" → Le Sentinel Pro uniquement — il est compatible iOS et Android.
- "Comment payer ?" → À la livraison, Orange Money, Wave, MTN MoMo, Mixx by YAS ou carte.
- "Livraison ?" → 1 à 5 jours. Vous êtes informé à chaque étape.
- "Garantie ?" → 24 mois pour le Pro, 6 mois pour le Start.
- "Stock dispo ?" → Oui, en stock actuellement.

## Règles importantes
- Réponds toujours en 2-4 phrases maximum, sois concis
- Si tu ne connais pas la réponse : "Contactez-nous directement sur WhatsApp : https://wa.me/22899231818"
- Propose toujours de commander à la fin si le client semble intéressé
- Ne mentionne JAMAIS que tu es Claude ou une IA d'Anthropic — tu es Alba, l'assistante de Balidao
- Ne fais PAS de longues listes sauf pour les guides d'installation`;

// ─── Sessions (mémoire courte par visiteur) ───────────────────────────────────
const sessions = new Map();

// Nettoyage automatique toutes les heures
setInterval(() => sessions.clear(), 3_600_000);

// ─── STATS ────────────────────────────────────────────────────────────────────
const stats = {
  totalSessions: 0,
  totalMessages: 0,
  startedAt: new Date().toISOString(),
  conversations: [], // 50 dernières conversations max
};

function logConversation(sessionId, userMsg, albReply) {
  try {
    const isNew = !sessions.has(sessionId) || sessions.get(sessionId).length <= 1;
    if (isNew) stats.totalSessions++;
    stats.totalMessages++;
    stats.conversations.unshift({
      time: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }),
      sessionId: sessionId.slice(0, 8),
      user: userMsg.slice(0, 120),
      alba: albReply.slice(0, 120),
    });
    if (stats.conversations.length > 50) stats.conversations.pop();
  } catch (e) { /* silencieux */ }
}

// ─── ROUTE : message du visiteur ─────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim() || !sessionId) {
      return res.status(400).json({ error: 'message et sessionId sont requis' });
    }

    // Historique de la session
    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const history = sessions.get(sessionId);
    history.push({ role: 'user', content: message.trim() });

    // Garder les 10 derniers messages pour éviter de dépasser les tokens
    const recentHistory = history.slice(-10);

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: recentHistory,
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    logConversation(sessionId, message.trim(), reply);

    res.json({ reply });
  } catch (err) {
    console.error('[Alba Bot] Erreur :', err.message);
    res.status(500).json({
      reply: "Désolée, je rencontre un petit problème technique. Contactez-nous directement sur WhatsApp : https://wa.me/22899231818 😊"
    });
  }
});

// ─── ROUTE : health check ─────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', bot: 'Alba — Balidao' }));

// ─── ROUTE : dashboard stats ──────────────────────────────────────────────────
app.get('/stats', (_, res) => {
  const rows = stats.conversations.map(c => `
    <tr>
      <td>${c.time}</td>
      <td>${c.sessionId}…</td>
      <td>${c.user}</td>
      <td>${c.alba}</td>
    </tr>`).join('');
  res.send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Alba Stats — Balidao</title>
  <style>
    body{font-family:sans-serif;background:#111;color:#eee;padding:24px}
    h1{color:#F4600C}
    .cards{display:flex;gap:16px;margin-bottom:24px}
    .card{background:#1e1e1e;border-radius:12px;padding:20px 28px;min-width:140px}
    .card h2{margin:0;font-size:2rem;color:#F4600C}
    .card p{margin:4px 0 0;color:#aaa;font-size:.85rem}
    table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{background:#F4600C;padding:8px;text-align:left}
    td{padding:8px;border-bottom:1px solid #333;vertical-align:top}
    tr:hover td{background:#1e1e1e}
  </style></head><body>
  <h1>📊 Alba Bot — Tableau de bord</h1>
  <div class="cards">
    <div class="card"><h2>${stats.totalSessions}</h2><p>Sessions uniques</p></div>
    <div class="card"><h2>${stats.totalMessages}</h2><p>Messages traités</p></div>
    <div class="card"><h2>${stats.conversations.length}</h2><p>Conversations récentes</p></div>
  </div>
  <p style="color:#888;font-size:.8rem">Bot démarré le ${stats.startedAt} — Stats remises à zéro à chaque redémarrage</p>
  <table><thead><tr><th>Heure</th><th>Session</th><th>Client</th><th>Alba</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="4" style="color:#888">Aucune conversation pour l\'instant</td></tr>'}</tbody>
  </table></body></html>`);
});

// ─── DÉMARRAGE ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Alba Bot Balidao en ligne → port ${PORT}`);
});
