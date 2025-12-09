let currentConversationId = null;
let pollInterval = null;
let allConversations = [];

// DOM references
const conversationList = document.getElementById("conversation-list");
const messagesDiv = document.getElementById("messages");
const chatTitle = document.getElementById("chat-title");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const userListDiv = document.getElementById("user-list");



// Hent samtaler
async function loadConversations() {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) {
        alert("Du er ikke logget ind");
        window.location.href = "/login";
        return;
    }

    const conversations = await res.json();
    allConversations = conversations; // gem globalt

    conversationList.innerHTML = "";

    conversations.forEach(conv => {
        const div = document.createElement("div");
        div.classList.add("conversation");

        // Rolle-oversættelse (engelsk → dansk)
        const roleMap = {
            host: "vært",
            participant: "deltager"
        };

        const roleLabel = roleMap[conv.otherUserRole] || conv.otherUserRole;

        // Den tekst vi viser
        div.textContent = `${conv.otherUserName} (${roleLabel})`;

        // Gem id, så vi kan markere aktiv samtale senere
        div.dataset.id = conv.id;

        div.onclick = () => openConversation(conv.id);
        conversationList.appendChild(div);
    });
}


// Åbn en samtale
async function openConversation(id) {
    currentConversationId = id;

    // Find navnet og rollen fra allConversations
    const convo = allConversations.find(c => c.id === id);

    if (convo) {
        const roleMap = {
            host: "vært",
            participant: "deltager"
        };

        const roleLabel = roleMap[convo.otherUserRole] || convo.otherUserRole;

        chatTitle.textContent = `${convo.otherUserName} (${roleLabel})`;
    } else {
        chatTitle.textContent = "Samtale";
    }

    // Markér aktiv samtale i venstre liste
    document.querySelectorAll(".conversation").forEach(c => c.classList.remove("active"));
    const convDiv = document.querySelector(`.conversation[data-id="${id}"]`);
    if (convDiv) convDiv.classList.add("active");

    loadMessages();

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(loadMessages, 2000);
}


// Hent beskeder
async function loadMessages() {
    if (!currentConversationId) return;

    const res = await fetch(`/api/chat/conversations/${currentConversationId}/messages`);
    const messages = await res.json();

    messagesDiv.innerHTML = "";

    messages.forEach(msg => {
        const div = document.createElement("div");
        div.classList.add("message");
        if (msg.isYou) div.classList.add("you");

        // simpelt timestamp: "HH:MM"
        let timeText = "";
        if (msg.timestamp) {
            // forventer format "YYYY-MM-DD HH:MM:SS"
            timeText = msg.timestamp.slice(11, 16);
        }

        // indhold + tidsstempel
        const contentP = document.createElement("div");
        contentP.textContent = msg.content;

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("message-time");
        timeSpan.textContent = timeText;

        div.appendChild(contentP);
        if (timeText) {
            div.appendChild(timeSpan);
        }

        messagesDiv.appendChild(div);
    });


    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send besked
sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
    if (!currentConversationId) return;
    const content = messageInput.value.trim();
    if (content === "") return;

    await fetch(`/api/chat/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });

    messageInput.value = "";
    loadMessages();
}

// Hent brugere til "Start ny samtale"
async function loadUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) {
        console.error("Kunne ikke hente brugere");
        return;
    }

    const users = await res.json();
    userListDiv.innerHTML = "";

    users.forEach(user => {
        const div = document.createElement("div");
        div.classList.add("user-item");
        const roleLabels = {
            host: 'vært',
            participant: 'deltager'
        };
        const roleLabel = roleLabels[user.role] || user.role;
        div.textContent = `${user.name} (${roleLabel})`;
        div.onclick = () => startConversation(user.id);
        userListDiv.appendChild(div);
    });
}

// Start en ny samtale med en anden bruger
async function startConversation(otherUserId) {
    try {
        const res = await fetch('/api/chat/conversations', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otherUserId })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Kunne ikke oprette samtale");
            return;
        }

        // hent samtaler igen og åbn den nye
        await loadConversations();
        openConversation(data.id);
    } catch (err) {
        console.error(err);
        alert("Serverfejl ved oprettelse af samtale");
    }
}



loadUsers();
loadConversations();
