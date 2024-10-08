// src/components/Chat.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // URL вашего сервера

function Chat() {
  const { userId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = () => {
    socket.emit('sendMessage', { sender: userId, receiver: 'targetUserId', content: message });
    setMessage('');
  };

  return (
    <div>
      <h2>Chat</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}</strong>: {msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
