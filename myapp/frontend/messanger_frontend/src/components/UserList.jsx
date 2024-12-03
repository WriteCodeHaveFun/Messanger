// src/components/UserList.jsx
import React, { useState } from 'react';
import axios from 'axios';

function UserList({ onUserClick }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');

  const handleAddUser = async () => {
    try {
      const response = await axios.post('/addUser', { name });
      if (response.data.success) {
        setUsers([...users, { name }]);
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
