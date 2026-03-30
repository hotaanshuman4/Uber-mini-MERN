import React, { useState } from 'react';
import { Clock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedVehicle from '../components/vehicles/AnimatedVehicles';

export default function LandingPage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loading, setLoading] = useState(false);

  const geocode = async (query) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (pickup && dropoff) {
      setLoading(true);
      const pickupData = await geocode(pickup);
      const dropoffData = await geocode(dropoff);
      setLoading(false);
      
      navigate('/book', { 
        state: { 
          pickupName: pickup, 
          dropoffName: dropoff,
          pickupCoords: pickupData ? [pickupData.lat, pickupData.lon] : null,
          dropoffCoords: dropoffData ? [dropoffData.lat, dropoffData.lon] : null
        } 
      });
    } else if (pickup || dropoff) {
      navigate('/book', { state: { pickupName: pickup, dropoffName: dropoff } });
    }
  };

  const navigateToBook = () => navigate('/book');

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-black overflow-hidden">
        
        {/* Realistic Animated Tire Background */}
        <motion.div
          animate={{ x: ['-70vw', '70vw', '-70vw'], rotate: [0, 1080, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute z-0 w-[400px] h-[400px] rounded-full flex items-center justify-center pointer-events-none"
          style={{
            background: '#ffffff',
            border: '38px solid #fafafa',
            boxShadow:
              'inset 0 0 45px rgba(0,0,0,0.18), 0 28px 55px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.95)',
          }}
        >
          {/* Rubber tread: white base with dark grooves for contrast on black */}
          <div
            className="absolute inset-[-38px] rounded-full pointer-events-none"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, rgba(0,0,0,0.9) 0deg 5deg, #ffffff 5deg 11deg)',
              opacity: 1,
            }}
          />
          {/* Alloy Rim */}
          <div className="w-[260px] h-[260px] bg-gradient-to-br from-gray-100 to-gray-300 rounded-full z-10 border-[16px] border-white flex items-center justify-center relative shadow-[inset_0_20px_40px_rgba(0,0,0,0.15)]">
             {/* Rim Spokes */}
             {[0, 45, 90, 135].map((deg, i) => (
                <div key={i} className="absolute w-full h-10 bg-gradient-to-b from-gray-100 to-gray-400 shadow-md" style={{ transform: `rotate(${deg}deg)` }} />
             ))}
             {/* Center Hubcap */}
             <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full z-20 border-4 border-gray-300 shadow-xl flex items-center justify-center">
               <div className="w-10 h-10 bg-gray-800 rounded-full shadow-[inset_0_5px_15px_rgba(255,255,255,0.5)]" />
             </div>
          </div>
        </motion.div>
        
        <div className="container mx-auto px-4 z-10 flex flex-col items-center lg:items-start lg:w-3/4 max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center lg:text-left leading-tight drop-shadow-lg">
            Go anywhere with <br /> <span className="text-yellow-400">GoCab</span>
          </h1>
          
          {/* Main Search Box */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-md lg:max-w-lg border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-black">Request a ride</h2>
            
            <form onSubmit={handleSearch} className="space-y-4 relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full" />
                <input 
                  type="text" 
                  placeholder="Enter pickup location" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-transparent focus:bg-white"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              
              <div className="absolute left-4 top-[38px] bottom-[38px] w-0.5 bg-gray-300" style={{ marginLeft: '3px' }}/>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-black bg-white" />
                <input 
                  type="text" 
                  placeholder="Enter destination" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-transparent focus:bg-white"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={navigateToBook} className="flex-1 flex justify-center items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-xl font-bold transition-colors">
                  <Clock size={18} />
                  <span>Leave now</span>
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-3 rounded-xl font-bold transition-colors flex justify-center items-center shadow-lg">
                  {loading ? <Loader2 className="animate-spin w-5 h-5 text-black" /> : "Search"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Promotions / Cards Section */}
      <section className="py-16 bg-white px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div onClick={navigateToBook} className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between hover:scale-[1.03] transition-transform cursor-pointer shadow-sm border border-gray-100 group">
              <div>
                <h3 className="font-bold text-lg">Ride</h3>
                <p className="text-sm text-gray-500 mt-1">Go anywhere with GoCab</p>
                <button className="mt-4 w-10 h-10 rounded-full bg-black text-white flex justify-center items-center transition-transform group-hover:bg-yellow-400 group-hover:text-black">
                  <ArrowRight size={20} />
                </button>
              </div>
              <AnimatedVehicle type="auto" className="w-24 h-24" />
            </div>
            
            <div onClick={navigateToBook} className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between hover:scale-[1.03] transition-transform cursor-pointer shadow-sm border border-gray-100 group">
              <div>
                <h3 className="font-bold text-lg">Reserve Moto</h3>
                <p className="text-sm text-gray-500 mt-1">Beat the traffic safely</p>
                <button className="mt-4 w-10 h-10 rounded-full bg-black text-white flex justify-center items-center transition-transform group-hover:bg-yellow-400 group-hover:text-black">
                  <ArrowRight size={20} />
                </button>
              </div>
              <AnimatedVehicle type="bike" className="w-24 h-24" />
            </div>

            <div onClick={navigateToBook} className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between hover:scale-[1.03] transition-transform cursor-pointer shadow-sm border border-gray-100 group">
              <div>
                <h3 className="font-bold text-lg">Package</h3>
                <p className="text-sm text-gray-500 mt-1">Send and receive items</p>
                <button className="mt-4 w-10 h-10 rounded-full bg-black text-white flex justify-center items-center transition-transform group-hover:bg-yellow-400 group-hover:text-black">
                  <ArrowRight size={20} />
                </button>
              </div>
              <AnimatedVehicle type="package" className="w-24 h-24" />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
