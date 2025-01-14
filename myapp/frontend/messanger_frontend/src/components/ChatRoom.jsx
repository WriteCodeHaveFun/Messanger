import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000'); // Adjust to match your server's address

function ChatRoom({ selectedUser, currentUser, onBack }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Track if the other user is typing
  const typingTimeout = useRef(null); // Timeout reference for typing logic
  const observerRef = useRef(null); // Reference for the IntersectionObserver

  useEffect(() => {
    if (selectedUser && currentUser) {
      const room = [currentUser, selectedUser].sort().join('_');
      setRoomName(room);

      socket.emit('joinRoom', { sender: currentUser, receiver: selectedUser });

      const fetchChatHistory = async () => {
        try {
          const response = await axios.get(`/api/chatHistory/${selectedUser}`);
          const updatedHistory = response.data.chatHistory.map((msg) => {
            // Ensure 'read' status is respected on initial load
            if (msg.status === 'read' && msg.sender !== currentUser) {
              return { ...msg, status: 'read' };
            }
            return msg;
          });
          setChatHistory(updatedHistory);
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };

      fetchChatHistory();
    }

    socket.on('receiveMessage', (msg) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    socket.on('typing', ({ sender }) => {
      if (sender === selectedUser) setIsTyping(true);
    });

    socket.on('stopTyping', ({ sender }) => {
      if (sender === selectedUser) setIsTyping(false);
    });

    socket.on('messageStatusUpdate', ({ ids, status }) => {
      // TODO баг: если один из участников чата обновил страницу или переподключился к чату, может некорректно отображаться статус "получил\прочитал"
      setChatHistory((prev) =>
        prev.map((msg) => 
          ids.some(
            (id) =>
              id.timestamp === msg.timestamp &&
              id.sender === msg.sender &&
              id.receiver === msg.receiver
          )
            ? { ...msg, status }
            : msg
        )
      );
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messageStatusUpdate');
    };
  }, [selectedUser, currentUser]);

  useEffect(() => {
    // Set up IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msg = entry.target.dataset.message;
            const parsedMsg = JSON.parse(msg);
            console.log('parsedMsg: ', parsedMsg);

            // Trigger messageRead event only for messages sent by the other user
            if (parsedMsg.status === 'delivered' && parsedMsg.sender !== currentUser) {
              socket.emit('messageRead', {
                ids: [parsedMsg], // Pass the message details
                sender: parsedMsg.sender,
                receiver: currentUser,
              });
            }
          }
        });
      },
      { threshold: 1.0 } // Trigger when the entire element is in view
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    // Observe all delivered messages not sent by the current user
    const container = document.querySelectorAll('[data-message]');
    container.forEach((element) => {
      const msg = JSON.parse(element.dataset.message);
      if (msg.sender !== currentUser) {
        observerRef.current.observe(element);
      }
    });
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!message.trim() && !file) return;

    const formData = new FormData();
    formData.append('sender', currentUser);
    formData.append('receiver', selectedUser);
    formData.append('content', message);
    if (file) formData.append('file', file);

    try {
      await axios.post('/api/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      socket.emit('sendMessage', {
        sender: currentUser,
        receiver: selectedUser,
        content: message,
        file: file ? { filename: file.name } : null,
        status: 'delivered',
      });

      setChatHistory((prev) => [
        ...prev,
        { sender: currentUser, content: message, file, status: 'delivered', timestamp: new Date().toISOString() },
      ]);

      setMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Notify the server that the user is typing
    socket.emit('typing', { sender: currentUser, receiver: selectedUser });

    // Set a timeout to emit the stopTyping event if the user stops typing
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { sender: currentUser, receiver: selectedUser });
    }, 1000); // 1 second delay
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
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
            data-message={JSON.stringify(msg)} // Pass message details for IntersectionObserver
            style={{ textAlign: msg.sender === currentUser ? 'right' : 'left' }}
          >
            <strong>
              {msg.sender} ({msg.status === 'read' ? 'r' : 'd'}):
            </strong>{' '}
            {msg.content || (
              <a
                href={`/api/messages/file/${msg.file?.filename}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {msg.file?.filename}
              </a>
            )}
            <small> {new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
        {isTyping && <p style={{ fontStyle: 'italic', color: 'gray' }}>{selectedUser} is typing...</p>}
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '1px dashed #ccc',
          padding: '10px',
          margin: '10px 0',
          textAlign: 'center',
        }}
      >
        Drag and drop a file here or select one below.
      </div>
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={handleInputChange}
        style={{ marginTop: '10px', width: '80%' }}
      />
      <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
        Send
      </button>
    </div>
  );
}

export default ChatRoom;
