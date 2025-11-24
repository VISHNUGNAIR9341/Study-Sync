import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RoutineSetup from './pages/RoutineSetup';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-gray-900">
          <Routes>
            <Route path="/login" element={<Login setUserId={setUserId} />} />
            <Route
              path="/setup"
              element={userId ? <RoutineSetup userId={userId} /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={userId ? <Dashboard userId={userId} onLogout={() => setUserId(null)} /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
