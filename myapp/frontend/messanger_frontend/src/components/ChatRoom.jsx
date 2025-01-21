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

  const [userStatus, setUserStatus] = useState({ online: false, lastSeen: null });

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Show confirmation dialog for deleting history

  const userStatusRef = useRef(userStatus); // Create a ref to hold the status
  // userStatusRef.current = userStatus; // Keep the ref updated with the latest status

  const one_minute_in_milliseconds = 6000; // TODO: now its 6 sec for test

  // Sync userStatusRef whenever userStatus changes
  // useEffect(() => {
  //   userStatusRef.current = userStatus;
  // }, [userStatus]);

  const deleteChatHistory = async () => {
    try {
      await axios.delete(`/api/deleteChatHistory/${selectedUser}`, {
        data: { sender: currentUser, receiver: selectedUser },
      });
      socket.emit('deleteChatHistory', { sender: currentUser, receiver: selectedUser });
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  useEffect(() => {
    socket.on('chatHistoryDeleted', ({ sender, receiver }) => {
      // Clear the chat history for the current room
      const currentRoom = [currentUser, selectedUser].sort().join('_');
      const notificationRoom = [sender, receiver].sort().join('_');
      if (currentRoom === notificationRoom) {
        console.log("DELETED")
        setChatHistory([]);
      } 
    });

    return () => socket.off('chatHistoryDeleted');
  }, [currentUser, selectedUser]);

  useEffect(() => {
    
    const fetchLastSeen = async () => {
      try {
        const response = await axios.get(`/api/userStatus/${selectedUser}`);
        userStatusRef.current = {
          online: response.data.online,
          lastSeen: response.data.lastSeen,
        };
        setUserStatus({
          online: response.data.online,
          lastSeen: response.data.lastSeen,
        });
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };
  
    fetchLastSeen(); // Fetch initial status
  },[]);
  //   if (currentUser) {
  //     socket.emit('setUserOnline', { username: currentUser });
  
  //     let afkTimer;
  //     const resetAfkTimer = () => {
  //       clearTimeout(afkTimer);
  //       afkTimer = setTimeout(() => {
  //         socket.emit('setAfk', { username: currentUser });
  //       }, 60000); // 1 minute inactivity
  //     };
  
  //     window.addEventListener('mousemove', resetAfkTimer);
  //     window.addEventListener('keydown', resetAfkTimer);
  //     resetAfkTimer();
  
  //     return () => {
  //       clearTimeout(afkTimer);
  //       socket.emit('setAfk', { username: currentUser });
  //       window.removeEventListener('mousemove', resetAfkTimer);
  //       window.removeEventListener('keydown', resetAfkTimer);
  //     };
  //   }
  // }, [currentUser]);
  
  useEffect(() => {
    if (currentUser) {
      socket.emit('setUserOnline', { username: currentUser });
      // console.log(`user ${currentUser} in now online`)
      // console.log('current status: ', userStatusRef.current?.online);

  
      let afkTimer;
  
      const setAfk = () => {
        socket.emit('setAfk', { username: currentUser });
        // console.log(`${currentUser} is now AFK`);
      // console.log('current status: ', userStatusRef.current?.online);

      };
  
      const resetAfkTimer = () => {
        if (!userStatusRef.current?.online) { // TODO: fix bug: this condition is alwayse true because useEffect() don't watch for userStatus.online
          // console.log(`${currentUser} is back online`)
        }
        socket.emit('setUserOnline', { username: currentUser });
        // console.log('current status: ', userStatusRef.current?.online);
        clearTimeout(afkTimer);
        afkTimer = setTimeout(setAfk, one_minute_in_milliseconds); // 1 minute of inactivity
      };
  
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setAfk(); // Set user as AFK when the tab is hidden
        } else {
          resetAfkTimer(); // Reset the AFK timer when the tab is active again
          socket.emit('setUserOnline', { username: currentUser });
        }
      };
  
      // Add event listeners
      window.addEventListener('mousemove', resetAfkTimer);
      window.addEventListener('keydown', resetAfkTimer);
      document.addEventListener('visibilitychange', handleVisibilityChange);
  
      resetAfkTimer(); // Start the AFK timer on component mount
  
      return () => {
        clearTimeout(afkTimer);
        socket.emit('setAfk', { username: currentUser }); // Ensure AFK is sent on unmount
        window.removeEventListener('mousemove', resetAfkTimer);
        window.removeEventListener('keydown', resetAfkTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    socket.on('userStatusUpdate', ({ username, online, lastSeen }) => {
      if (username === selectedUser) {
        userStatusRef.current = { online, lastSeen };
        setUserStatus({ online, lastSeen });
      }
    });
  
    return () => {
      socket.off('userStatusUpdate');
    };
  }, [selectedUser]);

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
      setChatHistory((prev) =>
        prev.map((msg) => 
          ids.some(
            (id) =>
              // id.timestamp === msg.timestamp &&
              id.sender === msg.sender 
              &&
              id.messageID === msg.messageID
              // &&
              // id.receiver === msg.receiver 
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

            // Trigger messageRead event only for messages sent by the other user
            if (parsedMsg.status === 'delivered' && parsedMsg.sender !== currentUser) {
              socket.emit('messageRead', {
                ids: [{...parsedMsg}], // Pass the message details
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

    const messageID = new Date().toISOString();

    const formData = new FormData();
    formData.append('sender', currentUser);
    formData.append('receiver', selectedUser);
    formData.append('content', message);
    formData.append('messageID', messageID);

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
        messageID: messageID,
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
      {/* <h2>Chat with {selectedUser}</h2> */}
      <h2>
        Chat with {selectedUser}{' '}
        {userStatus.online ? (
          <span style={{ color: 'green' }}>Online</span>
        ) : (
          <span style={{ color: 'gray' }}>
            Last seen: {userStatus.lastSeen ? new Date(userStatus.lastSeen).toLocaleString() : 'Never'}
          </span>
        )}
      </h2>

      <button
        style={{ marginBottom: '10px', backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px' }}
        onClick={() => setShowDeleteConfirmation(true)}
      >
        Delete History
      </button>

      {showDeleteConfirmation && (
        <div style={{ border: '1px solid gray', padding: '10px', backgroundColor: '#f9f9f9' }}>
          <p>Are you sure you want to delete the chat history?</p>
          <button onClick={() => setShowDeleteConfirmation(false)}>No</button>
          <button onClick={() => {
            deleteChatHistory();
            setShowDeleteConfirmation(false);
          }} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
            Yes
          </button>
        </div>
      )}

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
