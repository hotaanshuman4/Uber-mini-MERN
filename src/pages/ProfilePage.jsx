import React, { useContext } from 'react';
import { User, Star, Settings, CreditCard, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 pt-6 lg:pt-12 min-h-screen bg-gray-50 pb-24 lg:pb-8">
      
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden relative border-4 border-white shadow-sm">
          <img src="https://i.pravatar.cc/150?u=current_user" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user?.name || 'John Doe'}</h1>
          <div className="flex items-center space-x-1 mt-1 bg-white shadow-sm px-2 py-1 rounded-full text-sm font-bold border border-gray-100 max-w-max">
            <Star size={14} className="fill-black text-black inline" />
            <span>4.95</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-100 hover:bg-gray-200 transition-colors p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer">
          <HelpCircle size={24} className="mb-2" />
          <span className="font-medium text-sm">Help</span>
        </div>
        <div className="bg-gray-100 hover:bg-gray-200 transition-colors p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer">
          <CreditCard size={24} className="mb-2" />
          <span className="font-medium text-sm">Payment</span>
        </div>
        <div className="bg-gray-100 hover:bg-gray-200 transition-colors p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer">
          <Settings size={24} className="mb-2" />
          <span className="font-medium text-sm">Settings</span>
        </div>
      </div>

      {user?.role === 'driver' && (
        <Link
          to="/driver"
          className="flex items-center justify-between p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors rounded-2xl border border-yellow-200 shadow-sm mb-6"
        >
          <div>
            <h3 className="font-bold text-lg">Captain dashboard</h3>
            <p className="text-sm text-gray-600">Go online, share location, accept trips</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
      )}

      <div className="space-y-4">
        {[
          { icon: User, title: 'Manage active vehicles', subtitle: 'Earn by driving or delivering' },
          { icon: Star, title: 'Uber One', subtitle: 'Members get better prices' },
          { icon: Settings, title: 'Preferences', subtitle: 'Manage your settings' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors rounded-2xl cursor-pointer border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-4">
                <Icon size={24} className="text-gray-700" />
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" />
            </div>
          );
        })}
      </div>

      <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-red-600 bg-red-50 hover:bg-red-100 py-4 rounded-xl font-bold mt-12 transition-colors">
        <LogOut size={20} />
        <span>Log out</span>
      </button>

    </div>
  );
}
