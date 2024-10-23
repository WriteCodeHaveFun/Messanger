// src/components/UserList.jsx
import React, { useState } from 'react';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  // const [email, setEmail] = useState('');

  const handleAddUser = async () => {
    try {
      // Обращение к серверу для добавления нового пользователя
      const response = await axios.post('/addUser', { name });
      if (response.data.success) {
        setUsers([...users, { name }]);
        console.log('users: ', users);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error('Error adding user', error);
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
      {/* <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /> */}
      <button onClick={handleAddUser}>Add User</button>

      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
