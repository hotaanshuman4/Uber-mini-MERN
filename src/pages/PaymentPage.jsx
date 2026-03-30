import React from 'react';
import { CreditCard, Plus, ChevronRight } from 'lucide-react';

export default function PaymentPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 pt-6 lg:pt-12 min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold mb-8">Wallet</h1>

      <div className="bg-black text-white rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute right-10 -bottom-10 w-24 h-24 bg-white opacity-10 rounded-full"></div>
        <p className="text-gray-400 font-medium mb-1">Uber Cash</p>
        <h2 className="text-4xl font-bold mb-6">$0.00</h2>
        <div className="flex items-center space-x-2 bg-white/10 w-max px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors backdrop-blur-sm">
          <Plus size={18} />
          <span className="font-medium">Add funds</span>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-4 text-gray-600 uppercase tracking-wide">Payment Methods</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center space-x-4">
            <div className="bg-[#1A1F71] text-white p-2 rounded w-12 h-8 flex items-center justify-center text-xs font-bold italic border border-gray-200">
               VISA
            </div>
            <div>
              <p className="font-bold">•••• 1234</p>
              <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded inline-block mt-1">Default</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>

        <div className="flex items-center justify-between p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center space-x-4">
            <div className="bg-white text-blue-800 p-2 text-center rounded w-12 h-8 flex items-center justify-center text-[10px] font-bold border border-gray-200">
               PayPal
            </div>
            <p className="font-bold">user@email.com</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>

        <div className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors text-blue-600 font-medium">
          <div className="flex items-center space-x-4">
            <div className="w-12 flex justify-center"><Plus size={24} /></div>
            <span>Add Payment Method</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-lg mb-4 text-gray-600 uppercase tracking-wide">Promotions</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors text-blue-600 font-medium">
          <Plus size={24} className="mr-4" />
          <span>Add promo code</span>
        </div>
      </div>

    </div>
  );
}
