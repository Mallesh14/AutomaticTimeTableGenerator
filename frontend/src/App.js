import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginRegister from './pages/LoginRegister';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import PrivateRoute from './routes/PrivateRoute';

function App() {
  const [user, setUser] = useState(null);

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        // If userData is corrupted, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      // Clear any partial authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // On successful login
  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // On logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Redirect to correct dashboard based on role
  const getDashboardRoute = () => {
    if (!user) return <LoginRegister onLogin={handleLogin} />;
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      case 'faculty':
        return <Navigate to="/faculty" replace />;
      default:
        return <LoginRegister onLogin={handleLogin} />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={getDashboardRoute()} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Faculty */}
        <Route
          path="/faculty"
          element={
            <PrivateRoute allowedRoles={['faculty']}>
              <FacultyDashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
