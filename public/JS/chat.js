let currentConversationId = null;
let pollInterval = null;

// DOM references
const conversationList = document.getElementById("conversation-list");
const messagesDiv = document.getElementById("messages");
const chatTitle = document.getElementById("chat-title");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");


// Hent samtaler
async function loadConversations() {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) {
        alert("Du er ikke logget ind");
        window.location.href = "/login";
        return;
    }

    const conversations = await res.json();

    conversationList.innerHTML = "";

    conversations.forEach(conv => {
        const div = document.createElement("div");
        div.classList.add("conversation");
        div.textContent = "Samtale #" + conv.id;
        div.onclick = () => openConversation(conv.id);
        conversationList.appendChild(div);
    });
}


// Åbn en samtale

async function openConversation(id) {
    currentConversationId = id;
    chatTitle.textContent = "Samtale #" + id;

    // marker aktiv
    document.querySelectorAll(".conversation").forEach(c => c.classList.remove("active"));
    const convDiv = [...document.querySelectorAll(".conversation")].find(c => c.textContent === "Samtale #" + id);
    if (convDiv) convDiv.classList.add("active");

    loadMessages();

    // stop tidligere polling
    if (pollInterval) clearInterval(pollInterval);

    // poll hvert 2 sek.
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

        div.textContent = msg.content;
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

// ---------------
loadConversations();
