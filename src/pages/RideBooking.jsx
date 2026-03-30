import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Clock, CreditCard, ChevronDown, Navigation2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import L from 'leaflet';
import { apiClient } from '../lib/api';
import AnimatedVehicle from '../components/vehicles/AnimatedVehicles';
import io from 'socket.io-client';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const socket = io('http://localhost:5000');
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MAX_TRIP_KM = 50;

function MapUpdater({ pickupPos, dropoffPos }) {
  const map = useMap();
  useEffect(() => {
    if (pickupPos && dropoffPos) {
      const bounds = L.latLngBounds([pickupPos, dropoffPos]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickupPos) {
      map.setView(pickupPos, 14);
    }
  }, [map, pickupPos, dropoffPos]);
  return null;
}

const baseVehicles = [
  { id: 'uberx', name: 'GoCab Mini', capacity: 4, time: '3 min', desc: 'Affordable, everyday rides' },
  { id: 'comfort', name: 'GoCab Moto', capacity: 1, time: '5 min', desc: 'Beat the traffic on a bike' },
  { id: 'uberxl', name: 'GoCab XL', capacity: 6, time: '8 min', desc: 'Affordable rides for groups up to 6' },
  { id: 'black', name: 'GoCab Premium', capacity: 4, time: '12 min', desc: 'Premium rides in luxury cars' },
];

async function nominatimGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    if (data?.length) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error('Geocoding failed', e);
  }
  return null;
}

export default function RideBooking() {
  const locationState = useLocation().state || {};
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [pricingError, setPricingError] = useState('');
  const [distance, setDistance] = useState(null);
  const [rideStatus, setRideStatus] = useState('selection');

  const [geoPos, setGeoPos] = useState(null);
  const [resolvedPickup, setResolvedPickup] = useState(null);
  const [resolvedDropoff, setResolvedDropoff] = useState(null);
  const [resolvingNames, setResolvingNames] = useState(false);

  const pickupName = locationState.pickupName || '';
  const dropoffName = locationState.dropoffName || '';

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasP = locationState.pickupCoords;
      const hasD = locationState.dropoffCoords;
      if (hasP && hasD) return;
      if (!pickupName.trim() || !dropoffName.trim()) return;
      setResolvingNames(true);
      const [p, d] = await Promise.all([
        hasP ? null : nominatimGeocode(pickupName),
        hasD ? null : nominatimGeocode(dropoffName),
      ]);
      if (cancelled) return;
      if (!hasP && p) setResolvedPickup([p.lat, p.lon]);
      if (!hasD && d) setResolvedDropoff([d.lat, d.lon]);
      setResolvingNames(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [locationState.pickupCoords, locationState.dropoffCoords, pickupName, dropoffName]);

  const pickupPos = useMemo(
    () => locationState.pickupCoords || resolvedPickup || geoPos,
    [locationState.pickupCoords, resolvedPickup, geoPos]
  );
  const dropoffPos = useMemo(
    () => locationState.dropoffCoords || resolvedDropoff,
    [locationState.dropoffCoords, resolvedDropoff]
  );

  const coordsReady = Boolean(pickupPos && dropoffPos);

  useEffect(() => {
    if (resolvingNames) {
      return;
    }
    if (!coordsReady) {
      setLoadingPrices(false);
      setPricingError(
        !pickupPos && !dropoffPos
          ? 'Set pickup and destination from home, or allow browser location for pickup.'
          : !dropoffPos
            ? 'Destination not found. Go back and enter a clearer address.'
            : 'Waiting for pickup location (allow location access or set pickup on home).'
      );
      return;
    }

    const fetchPricing = async () => {
      setLoadingPrices(true);
      setPricingError('');
      try {
        const res = await apiClient.post('/rides/calculate-fare', {
          pickupCoords: pickupPos,
          dropoffCoords: dropoffPos,
        });

        const apiPricing = res.data.pricing;
        setDistance(res.data.distance);

        const updatedVehicles = baseVehicles.map((base) => {
          let backendId = '';
          if (base.id === 'comfort') backendId = 'bike';
          else if (base.id === 'uberx') backendId = 'uberx';
          else if (base.id === 'black') backendId = 'black';
          else if (base.id === 'uberxl') backendId = 'uberxl';

          const match = apiPricing.find((p) => p.id === backendId);
          return {
            ...base,
            price: match ? `₹${match.price}` : '₹--',
            numericPrice: match ? match.price : 0,
          };
        });

        setVehicles(updatedVehicles);
        setSelectedVehicle(updatedVehicles[0]);
      } catch (error) {
        setPricingError(error.response?.data?.message || 'Failed to calculate fare. Ensure backend is running.');
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPricing();
  }, [pickupPos, dropoffPos, coordsReady, resolvingNames]);

  useEffect(() => {
    socket.on('ride_accepted', (data) => {
      console.log('Ride accepted by a driver!', data);
      setRideStatus('accepted');
      navigate('/tracking', { 
        state: { 
          vehicle: selectedVehicle,
          pickupPos,
          dropoffPos,
          pickupName,
          dropoffName,
          driverData: data
        } 
      });
    });

    return () => {
      socket.off('ride_accepted');
    };
  }, [navigate, pickupPos, dropoffPos, pickupName, dropoffName, selectedVehicle]);

  const mapCenter = pickupPos || geoPos || [20.5937, 78.9629];

  const handleConfirm = async () => {
    if (!selectedVehicle || !coordsReady) return;
    setIsConfirming(true);
    try {
      const res = await apiClient.post('/rides', {
        vehicleType: selectedVehicle.name,
        pickupName: pickupName || 'Pickup',
        dropoffName: dropoffName || 'Destination',
        pickupCoords: pickupPos,
        dropoffCoords: dropoffPos,
        price: selectedVehicle.price,
      });

      // Emitting an alert so Driver Dashboard can fast-poll
      socket.emit('request_ride', { rideId: res.data.ride._id });

      navigate('/tracking', {
        state: {
          rideId: res.data.ride._id,
          otp: res.data.otp, // backend generated 6-digit
          vehicle: selectedVehicle,
          pickupPos,
          dropoffPos,
          pickupName: pickupName || 'Pickup',
          dropoffName: dropoffName || 'Destination',
        },
      });
    } catch (error) {
      console.error('Booking failed', error);
      setPricingError(error.response?.data?.message || 'Could not book ride. Make sure a Captain is Online.');
    } finally {
      setIsConfirming(false);
    } 
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      <div className="w-full lg:flex-1 h-[45vh] lg:h-full relative order-1 lg:order-2 z-10 custom-map-wrapper">
        <MapContainer center={mapCenter} zoom={13} className="w-full h-full z-0" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
          />
          {coordsReady && <MapUpdater pickupPos={pickupPos} dropoffPos={dropoffPos} />}
          {pickupPos && (
            <Marker position={pickupPos}>
              <Popup>Pickup: {pickupName || 'Your pickup'}</Popup>
            </Marker>
          )}
          {dropoffPos && (
            <Marker position={dropoffPos}>
              <Popup>Dropoff: {dropoffName || 'Destination'}</Popup>
            </Marker>
          )}
          {coordsReady && (
            <Polyline positions={[pickupPos, dropoffPos]} color="black" weight={4} opacity={0.8} />
          )}
        </MapContainer>
        <button
          type="button"
          className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg z-[400] hover:bg-gray-100 transition-colors"
          aria-label="Navigation"
        >
          <Navigation2 size={24} className="text-black" />
        </button>
      </div>

      <div className="w-full lg:w-[420px] bg-white flex flex-col h-[55vh] lg:h-full order-2 lg:order-1 border-r border-gray-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-none z-20 rounded-t-3xl lg:rounded-none relative -mt-4 lg:mt-0">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 lg:hidden" />

        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-4 text-center lg:text-left">Choose a ride</h2>
          <p className="text-xs text-gray-500 mb-2">
            Trips are limited to {MAX_TRIP_KM} km. Map uses your real pickup and destination when available.
          </p>
          <div className="space-y-3 relative">
            <div className="flex items-center bg-gray-100/80 rounded-xl p-3">
              <div className="w-2.5 h-2.5 bg-black rounded-full mr-3 flex-shrink-0" />
              <input
                type="text"
                value={pickupName}
                readOnly
                className="bg-transparent font-medium text-gray-900 w-full outline-none text-sm"
              />
            </div>
            <div className="absolute left-[20px] top-7 bottom-7 w-px bg-gray-300 pointer-events-none" />
            <div className="flex items-center bg-gray-100/80 rounded-xl p-3">
              <div className="w-2.5 h-2.5 bg-black mr-3 flex-shrink-0" />
              <input
                type="text"
                value={dropoffName}
                readOnly
                className="bg-transparent font-medium text-gray-900 w-full outline-none text-sm"
              />
            </div>
          </div>
          {resolvingNames && (
            <p className="mt-2 text-xs text-gray-500">Resolving addresses on map…</p>
          )}
          {distance && !pricingError && coordsReady && (
            <p className="mt-3 text-sm text-gray-500 font-medium flex items-center">
              Est. distance: {distance} km (max {MAX_TRIP_KM} km)
            </p>
          )}
          {!pickupName && !dropoffName && (
            <p className="mt-3 text-sm">
              <Link to="/" className="text-blue-600 font-medium underline">
                Go home
              </Link>{' '}
              to enter pickup and destination.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto w-full px-3 py-2 space-y-1">
          {loadingPrices || resolvingNames ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Loader2 className="animate-spin w-8 h-8 mb-4 text-black" />
              <p>{resolvingNames ? 'Locating addresses…' : 'Calculating live fares…'}</p>
            </div>
          ) : pricingError ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 px-6 text-center">
              <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
              <p className="font-bold text-lg mb-2">Cannot price trip</p>
              <p className="text-sm">{pricingError}</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-6 px-4 py-2 bg-gray-100 text-black rounded-xl font-medium hover:bg-gray-200"
              >
                Back to home
              </button>
            </div>
          ) : (
            vehicles.map((v) => (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedVehicle(v)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedVehicle(v)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all',
                  selectedVehicle?.id === v.id
                    ? 'border-black bg-gray-50/80'
                    : 'border-transparent hover:bg-gray-50/80'
                )}
              >
                <div className="flex items-center w-full">
                  <div className="mr-4">
                    <AnimatedVehicle type={v.id} className="w-[54px] h-[54px]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{v.name}</span>
                      <span className="flex items-center text-xs text-gray-600 font-medium">
                        <Clock size={12} className="mr-1" /> {v.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{v.desc}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="font-bold text-lg">{v.price}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loadingPrices && !resolvingNames && !pricingError && coordsReady && (
          <div className="p-5 border-t border-gray-100 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 font-medium cursor-pointer hover:bg-gray-50 py-2 px-3 rounded-xl -ml-3 transition-colors">
                <div className="bg-[#1C1C1C] rounded p-1">
                  <CreditCard size={18} className="text-white" />
                </div>
                <span>Personal • Visa 1234</span>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming || !selectedVehicle}
              className="w-full bg-yellow-400 text-black py-4 rounded-xl text-lg font-bold hover:bg-yellow-500 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
            >
              {isConfirming ? 'Requesting captain…' : `Confirm ${selectedVehicle?.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
