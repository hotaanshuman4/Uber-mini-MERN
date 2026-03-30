import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Activity, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Services', path: '/services', icon: Compass },
    { name: 'Activity', path: '/history', icon: Activity },
    { name: 'Account', path: '/profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 z-50 flex items-center justify-around px-2 pb-safe">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-black" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
