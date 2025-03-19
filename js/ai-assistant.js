class HeroHealthAssistant {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.setupUI();
    }

    setupUI() {
        // Create floating chat button
        const chatButton = document.createElement('button');
        chatButton.innerHTML = `
            <img src="images/chatbot.png" alt="Hero AI">
            <span class="chat-button-tooltip">Chat with Hero</span>
        `;
        chatButton.classList.add('hero-chat-button');
        
        // Create chat modal
        const chatModal = document.createElement('div');
        chatModal.id = 'heroChatModal';
        chatModal.innerHTML = `
            <div class="hero-chat-container">
                <div class="hero-chat-header">
                    <img src="images/chatbot.png" alt="Hero AI" class="hero-avatar">
                    <h3>Hero: Your Health Assistant</h3>
                </div>
                <div class="hero-chat-messages" id="chatMessages">
                    <div class="message ai-message welcome-message">
                        Hi there! I'm <strong>Hero</strong>! your personal health companion. 
                        What would you like to know about:
                        <br>• Nutrition advice
                        <br>• Recovery strategies
                        <br>• Exercise guidance
                        <br>• Wellness tips
                    </div>
                </div>
                <div class="hero-chat-input">
                    <input type="text" id="userInput" placeholder="Ask Hero a health question...">
                    <button id="sendBtn">Send</button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(chatButton);
        document.body.appendChild(chatModal);

        // Set up interactions
        this.setupInteractions(chatButton, chatModal);
    }

    setupInteractions(button, modal) {
        // Toggle modal
        button.addEventListener('click', () => {
            modal.classList.toggle('show');
        });

        // Send message
        const sendBtn = modal.querySelector('#sendBtn');
        const input = modal.querySelector('#userInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage(input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage(input);
        });
    }

    async sendMessage(input) {
        const message = input.value.trim();
        if (!message) return;

        // Display user message
        this.displayMessage(message, 'user');
        input.value = '';

        try {
            // Generate AI response
            const response = await this.getAIResponse(message);
            this.displayMessage(response, 'ai');
        } catch (error) {
            this.displayMessage('Sorry, Hero is taking a quick break. Try again soon!', 'error');
        }
    }

    async getAIResponse(message) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are Hero, a friendly health assistant for a rehabilitation platform. 
                            Provide concise, supportive advice about: ${message}
                            Focus on wellness, recovery, and general health guidance.
                            Respond in a caring, motivational tone.`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    displayMessage(text, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${type}-message`);
        
        // Add name for AI messages
        if (type === 'ai') {
            messageElement.innerHTML = `<strong>Hero says:</strong> ${text}`;
        } else {
            messageElement.textContent = text;
        }

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new HeroHealthAssistant('AIzaSyC6xIaxr-de-a-tX8kPkQkassk6biv-Cg4');
});