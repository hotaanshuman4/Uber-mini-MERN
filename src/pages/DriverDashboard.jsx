import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { MapPin, Power, CheckCircle, Navigation2 } from 'lucide-react';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const socket = io('http://localhost:5000');

export default function DriverDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Protect Route
  useEffect(() => {
    if (user && user.role !== 'driver') {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle Geolocation ping
  useEffect(() => {
    if (!isOnline) {
      apiClient.patch('/auth/driver', { available: false }).catch(() => {});
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Update Backend
        apiClient.patch('/auth/driver', { 
          available: true, 
          lat: latitude, 
          lng: longitude 
        }).catch(err => console.error("Could not update driver location"));
        
        // Update Sockets
        socket.emit('driver_online', { driverId: user.id, location: { lat: latitude, lng: longitude } });
      },
      (err) => {
        setError('Location access required to go online.');
        setIsOnline(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      apiClient.patch('/auth/driver', { available: false }).catch(() => {});
    };
  }, [isOnline, user]);

  // Fetch Pending Rides Assigned to Driver
  const fetchPending = async () => {
    if (!isOnline) {
      setPendingRides([]);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get('/rides/driver/pending');
      setPendingRides(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isOnline) {
      fetchPending();
      interval = setInterval(fetchPending, 5000); // Check every 5s for new rides
    }
    return () => clearInterval(interval);
  }, [isOnline]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    setError('');
  };

  const handleAccept = async (rideId) => {
    try {
      await apiClient.post(`/rides/${rideId}/accept`);
      // Ride Accepted, navigate to OTP prompt
      navigate(`/driver/tracking/${rideId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept ride.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center">
      <div className="w-full bg-black text-white p-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Captain Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, {user.name}</p>
        </div>
        <button 
          onClick={toggleOnline}
          className={`px-6 py-3 rounded-full font-bold flex items-center space-x-2 transition-all ${isOnline ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}
        >
          <Power size={20} />
          <span>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</span>
        </button>
      </div>

      <div className="w-full max-w-2xl px-4 py-8">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">{error}</div>}
        
        {!isOnline ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="text-gray-400 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">You are offline</h2>
            <p className="text-gray-500">Go online to start receiving ride requests.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center space-x-3 border border-blue-100 shadow-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <p className="font-medium">You are online. Waiting for ride requests...</p>
            </div>

            {location && (
              <div className="w-full h-[250px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 z-10 custom-map-wrapper relative">
                <MapContainer center={[location.lat, location.lng]} zoom={15} className="w-full h-full z-0" zoomControl={false}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; CARTO"
                  />
                  <Marker position={[location.lat, location.lng]}>
                    <Popup>Your current location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {loading && pendingRides.length === 0 && (
              <p className="text-center text-gray-500 py-8">Scanning area...</p>
            )}

            {pendingRides.length === 0 && !loading && (
              <div className="text-center bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
                 <Navigation2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-500 font-medium">No pending requests right now.</p>
              </div>
            )}

            {pendingRides.map(ride => (
              <div key={ride._id} className="bg-white rounded-2xl shadow-lg border border-yellow-100 overflow-hidden">
                <div className="bg-yellow-400 p-4 text-center">
                  <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">New Request</span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">₹{ride.price}</h3>
                      <p className="text-gray-500 font-medium">{ride.vehicleType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">~ 5 km away</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative mb-8">
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <div className="w-3 h-3 bg-black rounded-full mr-4 flex-shrink-0" />
                      <p className="font-medium text-gray-900 text-sm truncate">{ride.pickupName}</p>
                    </div>
                    <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-gray-300 pointer-events-none" />
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <div className="w-3 h-3 border-2 border-black bg-white mr-4 flex-shrink-0" />
                      <p className="font-medium text-gray-900 text-sm truncate">{ride.dropoffName}</p>
                    </div>
                  </div>

                  {ride.status === 'accepted' ? (
                     <button 
                       onClick={() => navigate(`/driver/tracking/${ride._id}`)}
                       className="w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-bold shadow-md hover:bg-blue-600 transition-colors"
                     >
                       Resume Trip
                     </button>
                  ) : (
                     <button 
                       onClick={() => handleAccept(ride._id)}
                       className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all flex justify-center items-center space-x-2"
                     >
                       <CheckCircle size={20} className="text-yellow-400" />
                       <span>Accept Passenger</span>
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
