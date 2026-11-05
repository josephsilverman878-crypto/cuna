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
import Feed from './pages/Feed'
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
import NewToNY from './pages/NewToNY'
import NewToNYResults from './pages/NewToNYResults'
import AgentPage from './pages/AgentPage'
import Leads from './pages/Leads'
import Team from './pages/Team'
import Demand from './pages/Demand'
import BulkUpload from './pages/BulkUpload'
import Help from './pages/Help'
import Building from './pages/Building'
import Market from './pages/Market'
import Neighborhoods from './pages/Neighborhoods'
import Neighborhood from './pages/Neighborhood'
import AuthCallback from './pages/AuthCallback'
import Application from './pages/Application'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>
  // Signed out: go to sign-in and come back here afterwards (Login.jsx reads ?next=).
  if (!user) return <Navigate to={'/login?next=' + encodeURIComponent(location.pathname + location.search)} replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  const publicPaths = ['/reset-password', '/terms', '/privacy', '/new-to-ny', '/new-to-ny/results', '/help', '/market', '/neighborhoods', '/auth/callback']
  const publicPrefixes = ['/listing/', '/agent/', '/building/', '/neighborhoods/']
  if (user && !profile && !publicPaths.includes(location.pathname) && !publicPrefixes.some(p => location.pathname.startsWith(p))) {
    return <CompleteProfile />
  }

  return (
    <Routes>
      <Route path="/" element={
        user
          ? (profile?.role === 'renter' ? <Navigate to="/feed" /> : <Navigate to="/dashboard" />)
          : <Landing />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/register/pro" element={user ? <Navigate to="/" /> : <RegisterPro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/listing/:id" element={<ListingDetail />} />
      <Route path="/agent/:id" element={<AgentPage />} />
      <Route path="/building/:bbl" element={<Building />} />
      <Route path="/help" element={<Help />} />
      <Route path="/market" element={<Market />} />
      <Route path="/neighborhoods" element={<Neighborhoods />} />
      <Route path="/neighborhoods/:slug" element={<Neighborhood />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/new-to-ny" element={<NewToNY />} />
      <Route path="/new-to-ny/results" element={<NewToNYResults />} />

      <Route path="/feed" element={
        <ProtectedRoute role="renter"><Feed /></ProtectedRoute>
      } />
      <Route path="/swipe" element={<Navigate to="/feed" replace />} />
      <Route path="/history" element={
        <ProtectedRoute role="renter"><SwipeHistory /></ProtectedRoute>
      } />
      <Route path="/application" element={
        <ProtectedRoute role="renter"><Application /></ProtectedRoute>
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
      <Route path="/leads" element={
        <ProtectedRoute role="poster"><Leads /></ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute role="poster"><Team /></ProtectedRoute>
      } />
      <Route path="/demand" element={
        <ProtectedRoute role="poster"><Demand /></ProtectedRoute>
      } />
      <Route path="/bulk" element={
        <ProtectedRoute role="poster"><BulkUpload /></ProtectedRoute>
      } />

      <Route path="/matches" element={<Navigate to="/history" replace />} />
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
