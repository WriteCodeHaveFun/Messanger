// src/components/ChatComponent.jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Connect to WebSocket server

function ChatComponent() {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [roomJoined, setRoomJoined] = useState(false);

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  // Join room based on sender and receiver
  const joinRoom = () => {
    if (sender && receiver) {
      socket.emit('joinRoom', { sender, receiver });
      setRoomJoined(true);
    }
  };

  // Send a message
  const sendMessage = () => {
    if (!sender || !receiver || !message) {
      alert('Please enter a sender, receiver, and message');
      return;
    }

    const msg = { sender, receiver, content: message };
    socket.emit('sendMessage', msg);
    setChatHistory((prev) => [...prev, { ...msg, isSentByCurrentUser: true }]);
    setMessage('');
  };

  return (
    <div>
      <h2>Chat Component</h2>
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
      <button onClick={joinRoom} disabled={roomJoined}>
        Join Chat Room
      </button>

      <div className="chat-history" style={{ border: '1px solid #ddd', padding: '10px', height: '300px', overflowY: 'auto', marginTop: '10px' }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.isSentByCurrentUser ? 'right' : 'left' }}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>

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
