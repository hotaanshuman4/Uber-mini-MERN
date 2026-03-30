import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getApiErrorMessage } from '../lib/api';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rider');
  const [dlNumber, setDlNumber] = useState('');
  const [error, setError] = useState('');
  const { register, googleLoginAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');
    const hasAlphanumeric = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9\s]/.test(password);
    if (!hasAlphanumeric || !hasSpecialChar)
      return setError('Password must contain numbers, letters, and at least one special character.');
    if (role === 'driver' && !dlNumber)
      return setError('Driving License number is required for Captains.');
    try {
      await register(name, email, password, role, dlNumber);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      await googleLoginAuth(tokenResponse.access_token, role);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-In was cancelled or failed. Please try again.'),
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Animated Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[100px]" 
      />

      {/* Main Container */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 z-10"
      >
        
        {/* Animated Logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <div className="w-8 h-8 bg-black rounded-full grid grid-cols-2 gap-1 p-1">
               <div className="bg-yellow-400 rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
               <div className="bg-white rounded-sm"></div>
            </div>
          </motion.div>
        </div>

        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h2>
          <p className="text-gray-300 text-center mb-6">Join millions riding across India.</p>
        </motion.div>

        {/* Role Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
          <button 
            type="button" 
            onClick={() => setRole('rider')} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${role === 'rider' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Rider
          </button>
          <button 
            type="button" 
            onClick={() => setRole('driver')} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${role === 'driver' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Captain (Driver)
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-xl mb-6 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
             <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               required
               placeholder="Full Name (e.g., Rahul Sharma)" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder-gray-400"
             />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="email" 
               required
               placeholder="Email Address" 
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder-gray-400"
             />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative"
          >
             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="password" 
               required
               placeholder="Create Password" 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder-gray-400"
             />
          </motion.div>

          {role === 'driver' && (
            <motion.div 
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              transition={{ delay: 0.8 }}
              className="relative"
            >
               <input 
                 type="text" 
                 required
                 placeholder="Driving License Number" 
                 value={dlNumber}
                 onChange={(e) => setDlNumber(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 px-4 outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder-gray-400"
               />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            type="submit"
            className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 hover:bg-yellow-500 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.3)]"
          >
            <span>Sign Up</span>
            <ArrowRight size={20} />
          </motion.button>

          <div className="relative my-4 flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or connect with</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            type="button"
            onClick={() => handleGoogleLogin()}
            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-white hover:text-yellow-400 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
}
