import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/rides');
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 pt-6 lg:pt-12 min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold mb-8">Past trips</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-black" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-lg font-medium">No past trips yet</p>
          <p className="text-sm mt-1">When you take a ride, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((trip) => (
            <div key={trip._id} className="bg-white border text-black border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="h-32 w-full bg-gray-200 relative">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600&h=300" alt="Route" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 sm:p-5 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-bold text-lg">{new Date(trip.createdAt).toLocaleDateString()}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-medium">{trip.price}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 text-black px-2 py-0.5 rounded font-medium">{trip.vehicleType}</span>
                    {trip.status === 'Canceled' && <span className="text-red-600 font-medium mx-2">{trip.status}</span>}
                  </div>
                  
                  <div className="space-y-2 relative">
                    <div className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-black rounded-full mr-3 text-white" />
                      <span className="text-sm font-medium">{trip.pickupName}</span>
                    </div>
                    <div className="absolute left-[-12px] top-4 bottom-4 w-0.5 bg-gray-300 pointer-events-none" style={{ marginLeft: '16px' }} />
                    <div className="flex items-center text-gray-700">
                      <div className="w-2.5 h-2.5 bg-black mr-2.5" />
                      <span className="text-sm font-medium">{trip.dropoffName}</span>
                    </div>
                  </div>

                </div>
                <ChevronRight className="text-gray-400 self-center" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
