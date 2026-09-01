import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import TestRun from './pages/TestRun';
import BoosterPumps from './pages/BoosterPumps';
import DailyInspection from './pages/DailyInspection';
import UserManagement from './pages/UserManagement';
import './App.css';

function AppContent() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/home" /> : <Login />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testrun"
        element={
          <ProtectedRoute>
            <TestRun />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boosterpumps"
        element={
          <ProtectedRoute>
            <BoosterPumps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dailyinspection"
        element={
          <ProtectedRoute>
            <DailyInspection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
