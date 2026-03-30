import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 bg-background text-foreground">
      <Navbar />
      <main className="flex-1 w-full pt-16 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
