import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SwipeDeck from './pages/SwipeDeck'
import PostListing from './pages/PostListing'
import Matches from './pages/Matches'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import PosterDashboard from './pages/PosterDashboard'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  return (
    <Routes>
      <Route path="/" element={
        user
          ? (profile?.role === 'renter' ? <Navigate to="/swipe" /> : <Navigate to="/dashboard" />)
          : <Landing />
      } />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      <Route path="/swipe" element={
        <ProtectedRoute role="renter"><SwipeDeck /></ProtectedRoute>
      } />
      <Route path="/matches" element={
        <ProtectedRoute role="renter"><Matches /></ProtectedRoute>
      } />
      <Route path="/messages/:matchId" element={
        <ProtectedRoute><Messages /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute role="poster"><PosterDashboard /></ProtectedRoute>
      } />
      <Route path="/post-listing" element={
        <ProtectedRoute role="poster"><PostListing /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#2C2420',
              color: '#FDFBF8',
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)