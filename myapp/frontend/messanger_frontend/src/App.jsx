// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './components/Chat';
import UserList from './components/UserList';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>here is react</h1>
        <UserList />
        <Routes>
          <Route path="/" element={<UserList />} />
          <Route path="/chat/:userId" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
