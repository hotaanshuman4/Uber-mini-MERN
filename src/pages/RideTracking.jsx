import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Star, MessageCircle, Phone, Shield, X, Copy, Check } from 'lucide-react';
import { apiClient } from '../lib/api';
import L from 'leaflet';
import { fetchOsrmRoute } from '../lib/osrm';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const carIcon = L.divIcon({
  html: '<div style="background-color:#111;width:26px;height:14px;border-radius:4px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:rotate(-45deg);"></div>',
  className: '',
  iconSize: [26, 14],
  iconAnchor: [13, 7],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions?.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }, [map, positions]);
  return null;
}

export default function RideTracking({ isDriver }) {
  const locationState = useLocation().state;
  const navigate = useNavigate();
  const { rideId: paramRideId } = useParams();

  const rideId = locationState?.rideId || paramRideId;
  const initialOtp = locationState?.otp;
  const vehicle = locationState?.vehicle || { name: 'GoCab' };
  
  const [ride, setRide] = useState(null);
  const [routeToPickup, setRouteToPickup] = useState(null);
  const [routeToDest, setRouteToDest] = useState(null);
  const [copied, setCopied] = useState(false);
  const [driverOtpInput, setDriverOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pickupName = locationState?.pickupName || ride?.pickupName || 'Pickup';
  const dropoffName = locationState?.dropoffName || ride?.dropoffName || 'Destination';
  const pickupPos = locationState?.pickupPos || (ride?.pickupCoords ? [ride.pickupCoords[0], ride.pickupCoords[1]] : null);
  const dropoffPos = locationState?.dropoffPos || (ride?.dropoffCoords ? [ride.dropoffCoords[0], ride.dropoffCoords[1]] : null);

  const loadRide = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await apiClient.get(`/rides/detail/${rideId}`);
      setRide(res.data);
    } catch (e) {
      console.error(e);
    }
  }, [rideId]);

  useEffect(() => {
    if (!rideId) {
      navigate('/');
      return;
    }
    const loadRideInitial = async () => {
      try {
        const res = await apiClient.get(`/rides/detail/${rideId}`);
        setRide(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (!pickupPos || !dropoffPos) {
       loadRideInitial();
    }
    loadRide();
    const interval = setInterval(loadRide, 2500);
    return () => clearInterval(interval);
  }, [rideId, navigate, loadRide, pickupPos, dropoffPos]);

  const status = ride?.status;

  // For driver, their own location is driverLoc. For rider, it's fetched from DB
  const [driverLiveLoc, setDriverLiveLoc] = useState(null);
  
  useEffect(() => {
    if (isDriver) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setDriverLiveLoc([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isDriver]);

  const loc = ride?.driverId?.location;
  const dbDriverLoc = loc?.lat != null && loc?.lng != null ? [loc.lat, loc.lng] : null;
  const driverLoc = isDriver ? driverLiveLoc || dbDriverLoc : dbDriverLoc;

  const otp = ride?.otp || initialOtp;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pickupPos || !dropoffPos) return;
      if (status === 'otp_verified' || status === 'completed') {
        // En route to target Destination
        const r = await fetchOsrmRoute(driverLoc || pickupPos, dropoffPos);
        if (!cancelled) {
          setRouteToDest(r || [driverLoc || pickupPos, dropoffPos]);
          setRouteToPickup(null);
        }
        return;
      }
      if (driverLoc) {
        // En route to Pickup Passenger
        const r = await fetchOsrmRoute(driverLoc, pickupPos);
        if (!cancelled) {
          setRouteToPickup(r || [driverLoc, pickupPos]);
          setRouteToDest(null);
        }
      } else {
        setRouteToPickup(null);
        setRouteToDest(null);
      }
    })();
    return () => { cancelled = true; };
  }, [status, driverLoc, pickupPos, dropoffPos]);

  const mapLine = routeToDest?.length ? routeToDest : routeToPickup;
  const center = pickupPos || driverLoc || [20.5937, 78.9629];

  const statusLabel = (() => {
    if (!ride) return 'Connecting…';
    if (isDriver) {
      if (ride.status === 'accepted') return 'Drive to Pickup and Enter OTP';
      if (ride.status === 'otp_verified') return 'Drive to Destination';
    }
    switch (ride.status) {
      case 'pending_driver': return 'Waiting for captain to accept';
      case 'accepted': return 'Captain accepted — share the OTP below';
      case 'otp_verified': return 'OTP verified — following route to destination';
      default: return ride.status || '';
    }
  })();

  const copyOtp = () => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyOtpSubmit = async () => {
    if (driverOtpInput.length !== 6) return alert("OTP must be 6 digits");
    setIsVerifying(true);
    try {
      await apiClient.post(`/rides/${rideId}/verify-otp`, { otp: driverOtpInput });
      loadRide(); // Refresh ride status to trigger navigation
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteRide = async () => {
    try {
      await apiClient.post(`/rides/${rideId}/complete`);
      navigate('/driver'); 
    } catch (err) {
      console.error("Could not complete:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50 relative">
      <div className="w-full lg:flex-1 h-[60vh] lg:h-full relative z-10 custom-map-wrapper">
        <MapContainer center={center} zoom={14} className="w-full h-full z-0" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
          />
          {mapLine?.length >= 2 && <FitBounds positions={mapLine} />}
          {mapLine?.length >= 2 && (
            <Polyline
              positions={mapLine}
              color={status === 'otp_verified' ? '#111827' : '#2563eb'}
              weight={6}
              opacity={0.88}
            />
          )}
          {pickupPos && (
            <Marker position={pickupPos}>
              <Popup>Pickup: {pickupName}</Popup>
            </Marker>
          )}
          {dropoffPos && (
            <Marker position={dropoffPos}>
              <Popup>Destination: {dropoffName}</Popup>
            </Marker>
          )}
          {driverLoc && (
            <Marker position={driverLoc} icon={carIcon}>
              <Popup>Captain</Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 max-w-[min(100%,360px)]">
          <button
            type="button"
            onClick={() => isDriver ? navigate('/driver') : navigate('/')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
          >
            <X size={20} className="text-black" />
          </button>
          {!isDriver && otp && status !== 'otp_verified' && status !== 'completed' && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip OTP</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black tracking-[0.3em] text-black">{otp}</span>
                <button
                  type="button"
                  onClick={copyOtp}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  aria-label="Copy OTP"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share with your captain after they accept.</p>
            </div>
          )}

          {isDriver && status === 'accepted' && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verify OTP</p>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={driverOtpInput}
                  onChange={(e) => setDriverOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button 
                onClick={verifyOtpSubmit} 
                disabled={isVerifying || driverOtpInput.length !== 6}
                className="w-full mt-3 bg-yellow-400 text-black py-2 rounded-lg font-bold disabled:opacity-50"
              >
                  {isVerifying ? 'Verifying...' : 'Verify OTP & Start Trip'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[420px] bg-white flex flex-col h-[40vh] lg:h-full z-20 absolute bottom-0 lg:relative rounded-t-3xl lg:rounded-none shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 lg:hidden" />
        
        <div className="p-5 flex-1 overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">{isDriver ? `Earnings: ₹${ride?.price || '--'}` : vehicle.name}</h2>
              <p className="text-green-600 font-bold text-sm mt-1">{statusLabel}</p>
            </div>
          </div>

          {isDriver && status === 'accepted' && (
            <div className="bg-blue-50 p-5 rounded-2xl mb-4 text-center border border-blue-100">
              <h3 className="font-bold text-lg mb-2 text-blue-900">Enter Rider's OTP</h3>
              <p className="text-sm text-blue-700 mb-4">Ask the rider for their 6-digit OTP to start the trip.</p>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={driverOtpInput}
                  onChange={(e) => setDriverOtpInput(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="flex-1 px-4 py-3 rounded-xl border border-blue-200 text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleVerifyOtp}
                  disabled={driverOtpInput.length < 4}
                  className="bg-blue-600 text-white px-6 font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
              {errorMsg && <p className="text-red-500 text-sm mt-2 font-medium">{errorMsg}</p>}
            </div>
          )}

          {isDriver && status === 'otp_verified' && (
            <button 
              onClick={handleCompleteRide}
              className="w-full bg-green-500 text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-green-600 mb-6 transition-colors"
            >
              Complete Trip & Dropoff
            </button>
          )}

          {!isDriver && (
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={`https://i.pravatar.cc/150?u=${ride?.driverId?._id || 'driver'}`}
                    alt="Captain"
                    className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1 shadow-sm flex items-center border border-gray-100 text-[10px] font-bold">
                    4.9 <Star size={10} className="ml-0.5 fill-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{ride?.driverId?.name || 'Your captain'}</h3>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">GoCab Driver</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-around mt-6 border-y border-gray-100 py-4 mb-4">
            <button className="flex flex-col items-center space-y-2 text-gray-600 hover:text-black">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Shield size={20} /></div>
              <span className="text-xs font-medium">Safety</span>
            </button>
            <button className="flex flex-col items-center space-y-2 text-gray-600 hover:text-black">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-black"><MessageCircle size={20} className="fill-current" /></div>
              <span className="text-xs font-medium text-black">Message</span>
            </button>
            <button className="flex flex-col items-center space-y-2 text-gray-600 hover:text-black">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><Phone size={20} /></div>
              <span className="text-xs font-medium">Call</span>
            </button>
          </div>

          <div className="space-y-3 pb-8">
            <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{pickupName}</p>
                <p className="text-sm text-gray-500">Pickup</p>
              </div>
            </div>
            <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-2.5 h-2.5 bg-black rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{dropoffName}</p>
                <p className="text-sm text-gray-500">Destination</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
