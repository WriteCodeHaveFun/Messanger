import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000'); // Adjust to match your server's address

function ChatRoom({ selectedUser, currentUser, onBack }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    if (selectedUser && currentUser) {
      // Join a room with the sorted names
      const room = [currentUser, selectedUser].sort().join('_');
      setRoomName(room);

      socket.emit('joinRoom', { sender: currentUser, receiver: selectedUser });

      console.log(`${currentUser} joined room: ${room}`);
      
      // Fetch chat history
      const fetchChatHistory = async () => {
        try {
          const response = await axios.get(`/api/chatHistory/${selectedUser}`);
          setChatHistory(response.data.chatHistory);
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };

      fetchChatHistory();
    }

    socket.on('receiveMessage', (msg) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [selectedUser, currentUser]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = {
      sender: currentUser,
      receiver: selectedUser,
      content: message,
    };

    // Emit message to the server
    socket.emit('sendMessage', msg);

    // Save the message to the database
    try {
      await axios.post('/api/messages/send', msg);
    } catch (error) {
      console.error('Error saving message:', error);
    }

    // Append the sent message to the chat history
    setChatHistory((prev) => [
      ...prev,
      { ...msg, isSentByCurrentUser: true, timestamp: new Date() },
    ]);

    setMessage('');
  };

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '10px' }}>
        Back
      </button>
      <h2>Chat with {selectedUser}</h2>
      <div
        className="chat-history"
        style={{
          border: '1px solid #ddd',
          padding: '10px',
          height: '300px',
          overflowY: 'auto',
          marginTop: '10px',
        }}
      >
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            style={{ textAlign: msg.isSentByCurrentUser ? 'right' : 'left' }}
          >
            <strong>{msg.sender}:</strong> {msg.content}{' '}
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
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
      <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
        Send
      </button>
    </div>
  );
}

export default ChatRoom;
