import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black text-white z-50 flex items-center justify-between px-4 lg:px-8 shadow-md">
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-white/10 rounded-full lg:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center space-x-2">
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ type: "spring", repeat: Infinity, repeatDelay: 5, duration: 0.5 }}
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-0.5"
          >
            <div className="w-full h-full bg-black rounded-md grid grid-cols-2 gap-0.5 p-0.5">
               <div className="bg-yellow-400 rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
            </div>
          </motion.div>
          <span className="text-2xl font-bold tracking-tight">GoCab</span>
        </Link>
        <div className="hidden lg:flex items-center space-x-6 ml-8">
          <Link to="/" className="text-sm font-medium hover:text-gray-300">Ride</Link>
          {user?.role === 'driver' ? (
            <Link to="/driver" className="text-sm font-medium hover:text-yellow-400">
              Captain
            </Link>
          ) : (
            <Link to="/signup" className="text-sm font-medium hover:text-gray-300" title="Sign up as Captain">
              Drive
            </Link>
          )}
          <Link to="/" className="text-sm font-medium hover:text-gray-300">Business</Link>
          <Link to="/" className="text-sm font-medium hover:text-gray-300">About</Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        {user ? (
          <>
            <span className="hidden lg:block text-sm font-medium text-yellow-400 mr-4">Hi, {user.name}</span>
            <button onClick={handleLogout} className="hidden lg:flex bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-500 hover:text-white transition-colors items-center space-x-2">
              <LogOut size={16} />
              <span>Log out</span>
            </button>
            <Link to="/profile" className="p-2 hover:bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </Link>
          </>
        ) : (
          <>
            <Link to="/signin" className="hidden lg:block text-sm font-medium hover:text-yellow-400 transition-colors">Log in</Link>
            <Link to="/signup" className="hidden lg:block bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
