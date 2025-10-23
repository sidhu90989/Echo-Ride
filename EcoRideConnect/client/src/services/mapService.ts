/**
 * Google Maps Service for OLA-Style Ride Hailing
 * Comprehensive utilities for maps, routing, and location tracking
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapOptions {
  center: LatLng;
  zoom?: number;
  styles?: google.maps.MapTypeStyle[];
}

export interface MarkerOptions {
  icon?: string | google.maps.Icon | google.maps.Symbol;
  title?: string;
  animation?: google.maps.Animation;
}

// OLA-style dark map theme
export const OLA_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// Custom marker icons for different vehicle types (SVG)
export const VEHICLE_ICONS = {
  auto: '/markers/auto.svg',
  bike: '/markers/bike.svg',
  car: '/markers/car.svg',
  user: '/markers/user-location.svg',
  pickup: '/markers/pickup.svg',
  drop: '/markers/drop.svg',
};

/**
 * Initialize Google Map with OLA-style configuration
 */
export const initializeMap = (
  element: HTMLElement,
  options: MapOptions
): google.maps.Map => {
  return new google.maps.Map(element, {
    center: options.center,
    zoom: options.zoom || 15,
    styles: options.styles || OLA_MAP_STYLES,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    gestureHandling: 'greedy',
  });
};

/**
 * Get current user location using browser geolocation
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
};

/**
 * Watch user location for continuous tracking
 */
export const watchLocation = (
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }
  
  return navigator.geolocation.watchPosition(
    callback,
    errorCallback || console.error,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
};

/**
 * Clear location watch
 */
export const clearLocationWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Calculate route between origin and destination
 */
export const calculateRoute = async (
  origin: LatLng,
  destination: LatLng
): Promise<google.maps.DirectionsResult> => {
  const directionsService = new google.maps.DirectionsService();
  
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
};

/**
 * Get estimated time of arrival (in seconds)
 */
export const getETA = async (
  origin: LatLng,
  destination: LatLng
): Promise<number> => {
  try {
    const route = await calculateRoute(origin, destination);
    return route.routes[0].legs[0].duration?.value || 0;
  } catch (error) {
    console.error('Failed to get ETA:', error);
    return 0;
  }
};

/**
 * Get distance between two points (in meters)
 */
export const getDistance = async (
  origin: LatLng,
  destination: LatLng
): Promise<number> => {
  try {
    const route = await calculateRoute(origin, destination);
    return route.routes[0].legs[0].distance?.value || 0;
  } catch (error) {
    console.error('Failed to get distance:', error);
    return 0;
  }
};

/**
 * Calculate fare based on distance and vehicle type
 */
export const calculateFare = (
  distanceInMeters: number,
  vehicleType: 'auto' | 'bike' | 'car'
): number => {
  const distanceInKm = distanceInMeters / 1000;
  
  // Base fare + per km rate
  const rates = {
    auto: { base: 30, perKm: 12 },
    bike: { base: 20, perKm: 8 },
    car: { base: 50, perKm: 15 },
  };
  
  const rate = rates[vehicleType];
  return Math.round(rate.base + (distanceInKm * rate.perKm));
};

/**
 * Initialize Places Autocomplete on input element
 */
export const initAutocomplete = (
  inputElement: HTMLInputElement,
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void
): google.maps.places.Autocomplete => {
  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    types: ['geocode', 'establishment'],
    componentRestrictions: { country: 'in' },
    fields: ['geometry', 'formatted_address', 'name'],
  });
  
  if (onPlaceSelected) {
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    });
  }
  
  return autocomplete;
};

/**
 * Create marker on map
 */
export const createMarker = (
  map: google.maps.Map,
  position: LatLng,
  options?: MarkerOptions
): google.maps.Marker => {
  return new google.maps.Marker({
    map,
    position,
    icon: options?.icon,
    title: options?.title,
    animation: options?.animation,
  });
};

/**
 * Render route on map
 */
export const renderRoute = (
  map: google.maps.Map,
  directionsResult: google.maps.DirectionsResult,
  options?: { strokeColor?: string; strokeWeight?: number }
): google.maps.DirectionsRenderer => {
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: options?.strokeColor || '#22c55e',
      strokeWeight: options?.strokeWeight || 5,
    },
  });
  
  directionsRenderer.setDirections(directionsResult);
  return directionsRenderer;
};

/**
 * Fit map bounds to show all markers
 */
export const fitBounds = (
  map: google.maps.Map,
  locations: LatLng[]
): void => {
  const bounds = new google.maps.LatLngBounds();
  locations.forEach(location => bounds.extend(location));
  map.fitBounds(bounds);
};

/**
 * Geocode address to coordinates
 */
export const geocodeAddress = async (address: string): Promise<LatLng> => {
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (location: LatLng): Promise<string> => {
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
};

/**
 * Start real-time location tracking
 * Returns cleanup function to stop tracking
 */
export const startLocationTracking = (
  onLocationUpdate: (location: LatLng) => void,
  onError?: (error: GeolocationPositionError) => void
): (() => void) => {
  const watchId = watchLocation(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      onLocationUpdate(location);
    },
    onError
  );
  
  return () => clearLocationWatch(watchId);
};

/**
 * Create user location marker (blue dot with custom SVG)
 */
export const createUserMarker = (
  map: google.maps.Map,
  position: LatLng
): google.maps.Marker => {
  return createMarker(map, position, {
    icon: {
      url: VEHICLE_ICONS.user,
      scaledSize: new google.maps.Size(48, 48),
      anchor: new google.maps.Point(24, 24), // Center the icon
    },
    title: 'Your Location',
  });
};

/**
 * Create driver marker with custom icon
 */
export const createDriverMarker = (
  map: google.maps.Map,
  position: LatLng,
  vehicleType: 'auto' | 'bike' | 'car'
): google.maps.Marker => {
  return createMarker(map, position, {
    icon: {
      url: VEHICLE_ICONS[vehicleType],
      scaledSize: new google.maps.Size(48, 48),
      anchor: new google.maps.Point(24, 40), // Bottom center
    },
    title: `${vehicleType.toUpperCase()} Driver`,
  });
};

/**
 * Create pickup location marker
 */
export const createPickupMarker = (
  map: google.maps.Map,
  position: LatLng,
  title?: string
): google.maps.Marker => {
  return createMarker(map, position, {
    icon: {
      url: VEHICLE_ICONS.pickup,
      scaledSize: new google.maps.Size(48, 64),
      anchor: new google.maps.Point(24, 54), // Bottom center of pin
    },
    title: title || 'Pickup Location',
  });
};

/**
 * Create drop location marker
 */
export const createDropMarker = (
  map: google.maps.Map,
  position: LatLng,
  title?: string
): google.maps.Marker => {
  return createMarker(map, position, {
    icon: {
      url: VEHICLE_ICONS.drop,
      scaledSize: new google.maps.Size(48, 64),
      anchor: new google.maps.Point(24, 54), // Bottom center of pin
    },
    title: title || 'Drop Location',
  });
};

/**
 * Animate marker movement smoothly
 */
export const animateMarker = (
  marker: google.maps.Marker,
  newPosition: LatLng,
  duration: number = 1000
): void => {
  const startPosition = marker.getPosition();
  if (!startPosition) return;
  
  const startLat = startPosition.lat();
  const startLng = startPosition.lng();
  const deltaLat = newPosition.lat - startLat;
  const deltaLng = newPosition.lng - startLng;
  
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const currentLat = startLat + (deltaLat * progress);
    const currentLng = startLng + (deltaLng * progress);
    
    marker.setPosition({ lat: currentLat, lng: currentLng });
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Check if Maps API is loaded
 */
export const isMapsLoaded = (): boolean => {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
};

/**
 * Load Google Maps API dynamically
 */
export const loadMapsAPI = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isMapsLoaded()) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    
    document.head.appendChild(script);
  });
};
