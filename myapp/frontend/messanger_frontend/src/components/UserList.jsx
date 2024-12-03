import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserList({ onUserClick }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');

  // Загружаем список контактов текущего пользователя
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get('/api/contactList');
        if (response.data.success) {
          setUsers(response.data.contacts);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, []);

  const handleAddUser = async () => {
    try {
      const response = await axios.post('/addUser', { name });
      if (response.data.success) {
        setUsers([...users, { name }]); // Обновляем список контактов
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <div>
      <h2>User List</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleAddUser}>Add User</button>
      <ul>
        {users.map((user, index) => (
          <li
            key={index}
            onClick={() => onUserClick(user)}
            style={{ cursor: 'pointer', color: 'blue' }}
          >
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
