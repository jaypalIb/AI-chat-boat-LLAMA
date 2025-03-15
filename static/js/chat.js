const messagesDiv = document.getElementById("messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// function addMessage(sender, text, cssClass) {
//     const messageDiv = document.createElement("div");
//     messageDiv.className = `message ${cssClass}`;
//     messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
//     messagesDiv.appendChild(messageDiv);
//     messagesDiv.scrollTop = messagesDiv.scrollHeight;
//     return messageDiv; // Return the message div to update it later
// }

function addMessage(sender, text, cssClass) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${cssClass}`;

    // Create the sender label or icon
    if (sender === "Ai") {
        const icon = document.createElement("img");
        icon.src = "/static/images/avatar.png"; // Path to your chatbot icon
        icon.alt = "Ai";
        icon.className = "chat-icon"; // Add a class for styling
        messageDiv.appendChild(icon);
    } else {
        const senderLabel = document.createElement("strong");
        senderLabel.textContent = `${sender}: `;
        messageDiv.appendChild(senderLabel);
    }

    // Add the message text
    const textSpan = document.createElement("span");
    textSpan.innerHTML = text;
    messageDiv.appendChild(textSpan);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function addTypingEffect(sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message bot`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> <span class="dots">Analyzing</span>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return messageDiv;
}

function updateDots(messageDiv) {
    const dotsSpan = messageDiv.querySelector(".dots");
    if (!dotsSpan) return;

    let dots = 0;
    const interval = setInterval(() => {
        dotsSpan.textContent = "Analyzing" + ".".repeat(dots % 4); // Cycles between 0 to 3 dots
        dots++;
    }, 500);

    return () => clearInterval(interval); // Return a function to stop the animation
}

function showTypingEffect(messageDiv, fullResponse) {
    let index = 0;
    const typingInterval = setInterval(() => {
        if (index < fullResponse.length) {
            // const icon = document.createElement("img");
        // icon.src = "/static/images/avatar.png"; // Path to your chatbot icon
        // icon.alt = "DOAi";
        // icon.className = "chat-icon"; // Add a class for styling
        // messageDiv.appendChild(icon);
            messageDiv.innerHTML = `<strong>Ai:</strong> ${fullResponse.slice(0, index + 1)}`;
            index++;
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // Keep scrolling down
        } else {
            clearInterval(typingInterval); // Stop typing animation
        }
    }, 5); // Adjust speed of typing (milliseconds per character)
}

function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add the user's message to the chat
    addMessage("You", userMessage, "user");
    userInput.value = "";

    // Show "Analyzing..." message with dots
    const thinkingMessageDiv = addTypingEffect("Ai");
    const stopDotsAnimation = updateDots(thinkingMessageDiv);

    // Fetch the bot's response
    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Stop the dots animation and replace the "thinking..." message with typing
            stopDotsAnimation();
            thinkingMessageDiv.innerHTML = ""; // Clear the "Analyzing..." message
            showTypingEffect(thinkingMessageDiv, data.response); // Show response as typing
        })
        .catch((error) => {
            stopDotsAnimation();
            thinkingMessageDiv.innerHTML = `<strong>Ai:</strong> Error: Could not connect to the server.`;
        });
}

sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});
