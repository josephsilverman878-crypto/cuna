import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Register from './pages/Register'
import RegisterPro from './pages/RegisterPro'
import SwipeDeck from './pages/SwipeDeck'
import SwipeHistory from './pages/SwipeHistory'
import PostListing from './pages/PostListing'
import EditListing from './pages/EditListing'
import Profile from './pages/Profile'
import PosterDashboard from './pages/PosterDashboard'
import CompleteProfile from './pages/CompleteProfile'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Admin from './pages/Admin'
import ListingDetail from './pages/ListingDetail'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  const publicPaths = ['/reset-password', '/terms', '/privacy']
  if (user && !profile && !publicPaths.includes(location.pathname) && !location.pathname.startsWith('/listing/')) {
    return <CompleteProfile />
  }

  return (
    <Routes>
      <Route path="/" element={
        user
          ? (profile?.role === 'renter' ? <Navigate to="/swipe" /> : <Navigate to="/dashboard" />)
          : <Landing />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/register/pro" element={user ? <Navigate to="/" /> : <RegisterPro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/listing/:id" element={<ListingDetail />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="/swipe" element={
        <ProtectedRoute role="renter"><SwipeDeck /></ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute role="renter"><SwipeHistory /></ProtectedRoute>
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
      <Route path="/admin" element={
        <ProtectedRoute><Admin /></ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute role="poster"><PosterDashboard /></ProtectedRoute>
      } />
      <Route path="/edit-listing/:id" element={
        <ProtectedRoute role="poster"><EditListing /></ProtectedRoute>
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
