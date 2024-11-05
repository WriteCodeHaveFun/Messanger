// src/components/ChatComponent.jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to the WebSocket server (replace with your server's URL if different)
const socket = io('http://localhost:3000');

function ChatComponent() {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Set up WebSocket listeners
  useEffect(() => {
    // Listen for incoming messages
    socket.on('receiveMessage', (msg) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    // Clean up when component unmounts
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  // Send a message
  const sendMessage = () => {
    if (!sender || !receiver || !message) {
      alert('Please enter a sender, receiver, and message');
      return;
    }

    const msg = { sender, receiver, content: message };
    socket.emit('sendMessage', msg); // Send message to the server

    // Display the sent message in the chat area
    setChatHistory((prev) => [...prev, { ...msg, isSentByCurrentUser: true }]);
    setMessage(''); // Clear the input field after sending
  };

  return (
    <div>
      <h2>Chat Component</h2>
      {/* Input fields for sender and receiver */}
      <input
        type="text"
        placeholder="Sender Name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />
      <input
        type="text"
        placeholder="Receiver Name"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />

      {/* Chat history area */}
      <div className="chat-history" style={{ border: '1px solid #ddd', padding: '10px', height: '300px', overflowY: 'auto', marginTop: '10px' }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.isSentByCurrentUser ? 'right' : 'left' }}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {/* Input field for typing messages */}
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ marginTop: '10px', width: '80%' }}
      />
      <button onClick={sendMessage} style={{ marginLeft: '10px' }}>Send</button>
    </div>
  );
}

export default ChatComponent;
