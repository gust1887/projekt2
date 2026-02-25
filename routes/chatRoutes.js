const express = require('express');
const router = express.Router();

const { db } = require('../db');
const requireLogin = require('../middleware/requireLogin');


// GET /api/chat/conversations
// Hent alle samtaler hvor den loggede bruger er med

router.get('/conversations', requireLogin, (req, res) => { //Hver route starter sådan - requireLogin (fra requireLogin) gør: if (!req.session || !req.session.user) - Det betyder: Hvis ingen session → 401, Kun loggede brugere må kalde API - 👉 Authentication
    const userId = req.session.user.id; // “Hent alle samtaler hvor den loggede bruger deltager.” - UserId hentes fra session.

    db.all(
        `
        SELECT 
          c.id,
          CASE // Det betyder: Hvis jeg er host → vis participant som “other user”, Hvis jeg er participant → vis host som “other user” - Det er smart rollelogik.
            WHEN c.hostId = ? THEN p.name      -- hvis jeg er vært, så er "other" participant
            ELSE h.name                        -- hvis jeg er deltager, så er "other" vært
          END AS otherUserName,
          CASE 
            WHEN c.hostId = ? THEN p.role
            ELSE h.role
          END AS otherUserRole
        FROM conversations c
        JOIN users h ON c.hostId = h.id       -- h = host user
        JOIN users p ON c.participantId = p.id -- p = participant user
        WHERE c.hostId = ? OR c.participantId = ? // Det betyder: Samtaler hvor jeg er vært, ELLER deltager
        ORDER BY c.id ASC
        `,
        [userId, userId, userId, userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json(rows); // Hver række har: id, otherUserName, otherUserRole
        }
    );
});



// POST /api/chat/conversations
// Opret en ny samtale mellem current user og otherUserId
// Body: { "otherUserId": 2 }

router.post('/conversations', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const { otherUserId } = req.body;

    if (!otherUserId) {
        return res.status(400).json({ error: "otherUserId mangler" });
    }

    let hostId, participantId;

    if (role === 'host') { // Det betyder: Kun én er host, Den anden er participant - Det er domænelogik.
        hostId = userId;
        participantId = otherUserId;
    } else {
        hostId = otherUserId;
        participantId = userId;
    }

    // 1) Tjek om samtalen allerede findes
    db.get( // Hvis findes → returner den. - Hvis ikke → INSERT.
        `SELECT id, hostId, participantId
         FROM conversations
         WHERE hostId = ? AND participantId = ?`,
        [hostId, participantId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row) {
                // Hvis samtale allerede findes, returner den i stedet for at lave en ny
                return res.json({
                    id: row.id,
                    hostId: row.hostId,
                    participantId: row.participantId
                });
            }

            // Ellers opret ny samtale
            db.run(
                `INSERT INTO conversations (hostId, participantId) VALUES (?, ?)`,
                [hostId, participantId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    res.status(201).json({
                        id: this.lastID,
                        hostId,
                        participantId
                    });
                }
            );
        }
    );
});


// Hjælper til at tjekke om bruger må se/skriv i samtalen
const assertUserInConversation = (conversationId, userId, callback) => {
    db.get(
        `SELECT id FROM conversations 
         WHERE id = ? AND (hostId = ? OR participantId = ?)`,
        [conversationId, userId, userId],
        (err, row) => {
            if (err) return callback(err);
            if (!row) return callback(null, false);
            callback(null, true);
        }
    );
}


// GET /api/chat/conversations/:id/messages
// Hent alle beskeder i en samtale (hvis bruger er deltager)

router.get('/conversations/:id/messages', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const conversationId = req.params.id;

    assertUserInConversation(conversationId, userId, (err, allowed) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!allowed) return res.status(403).json({ error: "Ingen adgang til denne samtale" });

        db.all( // Her viser I: Foreign keys, JSON, Sortering, Relationel struktur
            `SELECT m.id, m.content, m.timestamp, m.senderId, u.name AS senderName
             FROM messages m
             JOIN users u ON m.senderId = u.id
             WHERE m.conversationId = ?
             ORDER BY m.timestamp ASC`,
            [conversationId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                const messages = rows.map(row => ({
                    id: row.id,
                    content: row.content,
                    timestamp: row.timestamp,
                    senderId: row.senderId,
                    senderName: row.senderName,
                    isYou: row.senderId === userId
                }));

                res.json(messages);
            }
        );
    });
});

// POST /api/chat/conversations/:id/messages
// Send en ny besked i en samtale
// Body: { "content": "Hej med dig" }

router.post('/conversations/:id/messages', requireLogin, (req, res) => {
    const userId = req.session.user.id;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) { // Beskytter mod tomme beskeder.
        return res.status(400).json({ error: "content mangler" });
    }

    assertUserInConversation(conversationId, userId, (err, allowed) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!allowed) return res.status(403).json({ error: "Ingen adgang til denne samtale" });

        db.run(
            `INSERT INTO messages (conversationId, senderId, content) VALUES (?, ?, ?)`,
            [conversationId, userId, content.trim()],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.status(201).json({
                    id: this.lastID,
                    conversationId,
                    senderId: userId,
                    content: content.trim()
                });
            }
        );
    });
});

module.exports = router;


/*🧠 Hvad viser denne fil ift. læringsmål?

Den viser:

✔ REST API design
✔ HTTP GET/POST
✔ Session-baseret state
✔ Autorisation
✔ Database relationer
✔ Distribueret arkitektur
✔ Separation of concerns
✔ Middleware design*/

/*🎯 Hvis du skal forklare chatRoutes på 30 sekunder

ChatRoutes håndterer samtaler og beskeder via REST endpoints. Alle routes er beskyttet af session-baseret authentication, 
og vi bruger en autorisationsfunktion der sikrer at kun deltagere i en samtale kan læse eller skrive beskeder. 
Data gemmes i en relationel SQLite-database med foreign keys mellem conversations og messages.

Hvis du kan sige det roligt → meget stærkt.


