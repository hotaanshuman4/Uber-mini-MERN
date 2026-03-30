import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import RideBooking from './pages/RideBooking';
import RideTracking from './pages/RideTracking';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import DriverDashboard from './pages/DriverDashboard';
import { AuthProvider, AuthContext } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/signin" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (user) return <Navigate to="/" />;
  return children;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes with stunning animations */}
        <Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<RideBooking />} />
          <Route path="/tracking" element={<RideTracking />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<PaymentPage />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/tracking/:rideId" element={<RideTracking isDriver={true} />} />
          <Route path="/services" element={<div className="p-8 text-center text-gray-500 font-medium mt-20">Services Coming Soon...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
