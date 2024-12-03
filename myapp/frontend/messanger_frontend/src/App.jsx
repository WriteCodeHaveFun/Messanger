// src/App.jsx
import React, { useState, useEffect } from 'react';
import UserList from './components/UserList';
import ChatRoom from './components/ChatRoom';
import axios from 'axios';

function App() {
  const [selectedUser, setSelectedUser] = useState(null); // Для хранения выбранного пользователя
  const [currentUser, setCurrentUser] = useState(null);
  //TODO: replace test with proper name or remove this function at all
  const test = async () => {
    try {
      const currentUser = (await axios.get('/api/currentUser')).data.user.name;
      console.log('currentUser: ', currentUser);
      setCurrentUser(currentUser);
    } catch (error) {
      console.error('Error adding user', error);
    }
  };
  test();

  // Обработчик кнопки "Назад" в браузере
  useEffect(() => {
    const handlePopState = () => setSelectedUser(null);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user); // Устанавливаем выбранного пользователя
    window.history.pushState({}, 'ChatRoom'); // Добавляем запись в историю
  };

  return (
    <div className="App">
      <h1>Chat Application</h1>
      {selectedUser ? (
        <ChatRoom selectedUser={selectedUser.name} currentUser={currentUser} onBack={() => setSelectedUser(null)} />
      ) : (
        <UserList onUserClick={handleUserClick} />
      )}
    </div>
  );
}

export default App;
