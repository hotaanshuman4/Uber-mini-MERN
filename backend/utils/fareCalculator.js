// utils/fareCalculator.js

/** Straight-line distance in km (for driver radius checks). */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Haversine formula to calculate straight-line distance, multiplied by a routing factor (e.g. 1.3) to estimate road distance.
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  
  // Multiply by 1.3 to roughly simulate actual driving roads instead of as the crow flies
  return straightDistance * 1.3;
};

const calculateFare = (distance, vehicleType) => {
  let baseRate = 0;
  // Based on user constraints: bike 25, mini 50, premium 65, XL 75
  switch (vehicleType.toLowerCase()) {
    case 'bike':
    case 'moto':
      baseRate = 25;
      break;
    case 'mini':
    case 'micro':
    case 'uberx':
      baseRate = 50;
      break;
    case 'premium':
    case 'sedan':
    case 'black':
      baseRate = 65;
      break;
    case 'xl':
    case 'suv':
    case 'uberxl':
      baseRate = 75;
      break;
    default:
      baseRate = 50;
  }

  // Calculate Surge: If between 9 PM (21:00) and 8 AM (08:00)
  const currentHour = new Date().getHours();
  let surgeAddition = 0;
  if (currentHour >= 21 || currentHour < 8) {
    surgeAddition = 10;
  }

  const finalRatePerKm = baseRate + surgeAddition;
  const totalPrice = distance * finalRatePerKm;

  return Math.round(totalPrice); // Return rounded rupees
};

export { calculateDistance, calculateFare, haversineKm };
