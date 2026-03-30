import React, { useState } from 'react';
import { ArrowRight, Apple, Facebook } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16 lg:pt-24 items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium mb-8">What's your phone number or email?</h1>
        
        <input 
          type="text" 
          placeholder="Enter phone number or email" 
          className="w-full bg-gray-100 p-4 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <button className="w-full bg-black text-white p-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors flex justify-between items-center mb-6">
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4 mb-6">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-gray-500 font-medium text-sm">or</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-black p-4 rounded-lg text-lg font-medium transition-colors flex justify-center items-center space-x-3">
            <svg viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-black p-4 rounded-lg text-lg font-medium transition-colors flex justify-center items-center space-x-3">
            <Apple className="w-5 h-5 fill-current" />
            <span>Continue with Apple</span>
          </button>
          
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-black p-4 rounded-lg text-lg font-medium transition-colors flex justify-center items-center space-x-3">
            <Facebook className="w-5 h-5 fill-current" />
            <span>Continue with Facebook</span>
          </button>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-500">
          By proceeding, you consent to get calls, WhatsApp or SMS messages, including by automated means, from Uber and its affiliates to the number provided.
        </p>

        <p className="mt-6 text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"} className="underline font-medium">{isLogin ? "Sign up" : "Log in"}</Link>
        </p>
      </div>
    </div>
  );
}
