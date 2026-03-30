import React from 'react';
import { motion } from 'framer-motion';
import { CarFront, Bike, Truck, Car } from 'lucide-react';

export default function AnimatedVehicle({ type, className = "w-16 h-16" }) {
  // Common animation variants
  const vehicleVariants = {
    initial: { x: -10, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    },
    hover: { 
      scale: 1.1,
      y: -5,
      transition: { yoyo: Infinity, duration: 0.3 }
    }
  };

  const getVehicleIcon = () => {
    switch (type) {
      case 'bike':
      case 'comfort':
        return (
          <motion.div 
            variants={vehicleVariants} 
            initial="initial" animate="animate" whileHover="hover"
            className={`bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-2 text-white shadow-lg flex items-center justify-center ${className}`}
          >
            <Bike className="w-full h-full" />
          </motion.div>
        );
      case 'uberxl':
      case 'package':
        return (
          <motion.div 
            variants={vehicleVariants} 
            initial="initial" animate="animate" whileHover="hover"
            className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2 text-white shadow-lg flex items-center justify-center ${className}`}
          >
            <Truck className="w-full h-full" />
          </motion.div>
        );
      case 'black':
        return (
          <motion.div 
            variants={vehicleVariants} 
            initial="initial" animate="animate" whileHover="hover"
            className={`bg-gradient-to-br from-gray-800 to-black border border-yellow-500/30 rounded-xl p-2 text-yellow-500 shadow-xl flex items-center justify-center ${className}`}
          >
            <Car className="w-full h-full" />
          </motion.div>
        );
      case 'uberx':
      case 'auto':
      default:
        return (
          <motion.div 
            variants={vehicleVariants} 
            initial="initial" animate="animate" whileHover="hover"
            className={`bg-gradient-to-br from-gray-100 to-white border border-gray-200 rounded-xl p-2 text-black shadow-md flex items-center justify-center ${className}`}
          >
            <CarFront className="w-full h-full" />
          </motion.div>
        );
    }
  };

  return getVehicleIcon();
}
