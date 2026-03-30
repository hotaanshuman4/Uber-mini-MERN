/**
 * Fetch road geometry from OSRM public demo (lat/lng in [lat, lng] order).
 * Returns array of [lat, lng] for Leaflet Polyline, or null on failure.
 */
export async function fetchOsrmRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}
