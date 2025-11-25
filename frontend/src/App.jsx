import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskDetails from './pages/TaskDetails';
import { ThemeProvider } from './contexts/ThemeContext';

const App = () => {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [userId]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={userId ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setUserId={setUserId} />} />
          <Route path="/dashboard" element={userId ? <Dashboard userId={userId} onLogout={() => setUserId(null)} /> : <Navigate to="/login" />} />
          <Route path="/task/:taskId" element={userId ? <TaskDetails /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
