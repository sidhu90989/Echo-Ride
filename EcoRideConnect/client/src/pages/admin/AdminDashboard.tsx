/**
 * OLA-Style Admin Dashboard with Real-Time Monitoring
 * Monitor all active drivers, rides, and platform metrics
 */

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  MapPin, 
  Menu, 
  Users,
  Car,
  TrendingUp,
  Activity,
  IndianRupee,
  Clock,
  CheckCircle,
  Navigation,
  Phone,
  User,
  X,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { 
  initializeMap,
  createDriverMarker,
  animateMarker,
  renderRoute,
  calculateRoute,
  loadMapsAPI,
  isMapsLoaded,
  type LatLng
} from '@/services/mapService';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
  initSocket,
  requestAllDrivers,
  onAllDriversLocations,
  onAllActiveRides,
  onPlatformMetrics,
  removeAdminListeners,
  type DriverLocation,
  type RideDetails
} from '@/services/socketService';

interface PlatformMetrics {
  totalDrivers: number;
  activeDrivers: number;
  activeRides: number;
  todayRevenue: number;
  todayRides: number;
  avgResponseTime: number;
}

interface DriverWithMarker extends DriverLocation {
  marker?: google.maps.Marker;
  infoWindow?: google.maps.InfoWindow;
  status: 'online' | 'offline' | 'on_ride';
  lastUpdate: number;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { canInstall, installed, isIOS, isStandalone, promptInstall } = usePWAInstall();
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkersRef = useRef<Map<string, DriverWithMarker>>(new Map());
  const rideRoutesRef = useRef<Map<string, google.maps.DirectionsRenderer>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  
  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithMarker | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideDetails | null>(null);
  const [drivers, setDrivers] = useState<DriverWithMarker[]>([]);
  const [activeRides, setActiveRides] = useState<RideDetails[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalDrivers: 0,
    activeDrivers: 0,
    activeRides: 0,
    todayRevenue: 0,
    todayRides: 0,
    avgResponseTime: 0
  });
  const [activeTab, setActiveTab] = useState<'map' | 'drivers' | 'rides'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'on_ride'>('all');
  
  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          toast({
            title: 'Configuration Error',
            description: 'Google Maps API key not found',
            variant: 'destructive'
          });
          return;
        }
        
        if (!isMapsLoaded()) {
          await loadMapsAPI(apiKey);
        }
        
        // Initialize map centered on default location (can be city center)
        const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi
        
        if (mapRef.current && !mapInstanceRef.current) {
          const map = initializeMap(mapRef.current, {
            center: defaultCenter,
            zoom: 12
          });
          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
        
        setIsLoadingData(false);
      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: 'Map Error',
          description: 'Unable to load map',
          variant: 'destructive'
        });
        setIsLoadingData(false);
      }
    };
    
    initMap();
  }, []);
  
  // Initialize Socket.IO and request real-time data
  useEffect(() => {
    if (!user?.id || !mapLoaded) return;
    
    const socket = initSocket(user.id, 'admin');
    
    // Request all drivers data
    requestAllDrivers();
    
    // Listen for driver location updates
    onAllDriversLocations((driversData) => {
      // Convert DriverLocation to DriverWithMarker by adding status and lastUpdate
      const driversWithStatus = driversData.map(d => ({
        ...d,
        status: (d.isAvailable ? 'online' : 'offline') as 'online' | 'offline' | 'on_ride',
        lastUpdate: d.timestamp
      }));
      setDrivers(driversWithStatus);
      updateDriverMarkers(driversData);
    });
    
    // Listen for active rides updates
    onAllActiveRides((ridesData) => {
      setActiveRides(ridesData);
      updateRideRoutes(ridesData);
    });
    
    // Listen for platform metrics
    onPlatformMetrics((metricsData) => {
      // Map incoming metrics to our PlatformMetrics interface
      setMetrics({
        totalDrivers: metricsData.activeDrivers, // TODO: backend should send total
        activeDrivers: metricsData.activeDrivers,
        activeRides: metricsData.ongoingRides,
        todayRevenue: metricsData.todayRevenue,
        todayRides: 0, // TODO: backend should send this
        avgResponseTime: 0 // TODO: backend should send this
      });
    });
    
    // Poll for updates every 5 seconds
    const pollInterval = setInterval(() => {
      requestAllDrivers();
    }, 5000);
    
    return () => {
      clearInterval(pollInterval);
      removeAdminListeners();
    };
  }, [user?.id, mapLoaded]);
  
  // Update driver markers on map
  const updateDriverMarkers = (driversData: DriverLocation[]) => {
    if (!mapInstanceRef.current) return;
    
    const currentDriverIds = new Set(driversData.map(d => d.driverId));
    
    // Remove markers for drivers no longer in the list
    driverMarkersRef.current.forEach((driverWithMarker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        if (driverWithMarker.marker) {
          driverWithMarker.marker.setMap(null);
        }
        if (driverWithMarker.infoWindow) {
          driverWithMarker.infoWindow.close();
        }
        driverMarkersRef.current.delete(driverId);
      }
    });
    
  // Add or update markers
    driversData.forEach(driver => {
      const existingDriver = driverMarkersRef.current.get(driver.driverId);
      const driverStatus = driver.isAvailable ? 'online' : 'offline';
      
      if (existingDriver?.marker) {
        // Update existing marker position
        animateMarker(existingDriver.marker, driver.location);
        
        // Update marker icon based on status
        const icon = getDriverIcon(driverStatus, driver.vehicleType);
        existingDriver.marker.setIcon(icon);
      } else {
        // Create new marker
        if (!mapInstanceRef.current) return;
        const marker = createDriverMarker(
          mapInstanceRef.current,
          driver.location,
          getDriverIcon(driverStatus, driver.vehicleType)
        );
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createDriverInfoContent(driver)
        });
        
        // Add click listener
        marker.addListener('click', () => {
          setSelectedDriver({ 
            ...driver, 
            marker, 
            infoWindow,
            status: driverStatus as 'online' | 'offline' | 'on_ride',
            lastUpdate: driver.timestamp
          });
          infoWindow.open(mapInstanceRef.current!, marker);
        });
        
        driverMarkersRef.current.set(driver.driverId, {
          ...driver,
          marker,
          infoWindow,
          status: driverStatus as 'online' | 'offline' | 'on_ride',
          lastUpdate: driver.timestamp
        });
      }
    });

    // Update clustering
    const markers = Array.from(driverMarkersRef.current.values())
      .map(d => d.marker)
      .filter((m): m is google.maps.Marker => !!m);
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapInstanceRef.current,
        markers,
      });
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markers);
    }
  };
  
  // Update ride routes on map
  const updateRideRoutes = (ridesData: RideDetails[]) => {
    if (!mapInstanceRef.current) return;
    
    const currentRideIds = new Set(ridesData.map(r => r.id));
    
    // Remove routes for completed rides
    rideRoutesRef.current.forEach((renderer, rideId) => {
      if (!currentRideIds.has(rideId)) {
        renderer.setMap(null);
        rideRoutesRef.current.delete(rideId);
      }
    });
    
    // Add routes for new rides
    ridesData.forEach(async (ride) => {
      if (!rideRoutesRef.current.has(ride.id)) {
        try {
          const route = await calculateRoute(ride.pickup, ride.drop);
          const renderer = renderRoute(mapInstanceRef.current!, route, {
            strokeColor: '#22c55e',
            strokeWeight: 4
          });
          rideRoutesRef.current.set(ride.id, renderer);
        } catch (error) {
          console.error('Failed to render ride route:', error);
        }
      }
    });
  };
  
  // Get driver icon based on status and vehicle type
  const getDriverIcon = (status: string, vehicleType?: string): any => {
    let color = '#9ca3af'; // gray for offline
    if (status === 'online') color = '#22c55e'; // green
    if (status === 'on_ride') color = '#3b82f6'; // blue
    
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 0.5,
      anchor: new google.maps.Point(0, 0)
    };
  };
  
  // Create info window content for driver
  const createDriverInfoContent = (driver: DriverLocation): string => {
    const driverStatus = driver.isAvailable ? 'online' : 'offline';
    const statusColor = driverStatus === 'online' ? '#22c55e' : '#9ca3af';
    const statusText = driverStatus === 'online' ? 'Online' : 'Offline';
    
    return `
      <div style="padding: 8px; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 4px;">Driver ${driver.driverId.substring(0, 8)}</div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></div>
          <span style="font-size: 12px;">${statusText}</span>
        </div>
        ${driver.vehicleType ? `<div style="font-size: 12px; color: #6b7280;">Vehicle: ${driver.vehicleType.toUpperCase()}</div>` : ''}
        <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
          Updated: ${new Date(driver.timestamp).toLocaleTimeString()}
        </div>
      </div>
    `;
  };
  
  // Filter drivers based on search and status
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.driverId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || driver.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  
  // Filter rides based on search
  const filteredRides = activeRides.filter(ride => {
    return ride.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ride.riderId.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Focus on driver on map
  const focusOnDriver = (driver: DriverWithMarker) => {
    if (mapInstanceRef.current && driver.location) {
      mapInstanceRef.current.panTo(driver.location);
      mapInstanceRef.current.setZoom(16);
      
      if (driver.marker && driver.infoWindow) {
        driver.infoWindow.open(mapInstanceRef.current, driver.marker);
      }
      
      setSelectedDriver(driver);
    }
  };
  
  // Focus on ride on map
  const focusOnRide = (ride: RideDetails) => {
    if (mapInstanceRef.current) {
      // Fit map to show both pickup and drop
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(ride.pickup);
      bounds.extend(ride.drop);
      mapInstanceRef.current.fitBounds(bounds);
      
      setSelectedRide(ride);
    }
  };
  
  if (!user) {
    setLocation('/login');
    return null;
  }
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => setLocation('/')}>Go Back</Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {(canInstall || isIOS) && !installed && !isStandalone && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isIOS) {
                  toast({
                    title: 'Add to Home Screen',
                    description: 'Use the Share button → Add to Home Screen',
                  });
                } else {
                  await promptInstall();
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestAllDrivers()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Metrics Bar */}
      <div className="p-4 bg-background border-b overflow-x-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 min-w-max">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Total Drivers</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalDrivers}</div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-600">Active Drivers</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.activeDrivers}</div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-600">Active Rides</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeRides}</div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-600">Today Revenue</span>
            </div>
            <div className="text-2xl font-bold">₹{metrics.todayRevenue.toLocaleString()}</div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-600">Today Rides</span>
            </div>
            <div className="text-2xl font-bold">{metrics.todayRides}</div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-600">Avg Response</span>
            </div>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}s</div>
          </Card>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4 w-auto">
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 mr-2" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="drivers">
              <Users className="h-4 w-4 mr-2" />
              Drivers ({drivers.length})
            </TabsTrigger>
            <TabsTrigger value="rides">
              <Car className="h-4 w-4 mr-2" />
              Active Rides ({activeRides.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Map View */}
          <TabsContent value="map" className="flex-1 m-0 p-4">
            <div className="relative h-full rounded-lg overflow-hidden border">
              <div ref={mapRef} className="absolute inset-0 h-full w-full" />
              
              {isLoadingData && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <LoadingSpinner />
                  <p className="ml-3 text-lg">Loading map data...</p>
                </div>
              )}
              
              {/* Map Legend */}
              <Card className="absolute top-4 right-4 p-3 space-y-2 text-xs z-10">
                <div className="font-semibold mb-2">Legend</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Online Drivers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>On Ride</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span>Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-green-500" />
                  <span>Active Routes</span>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          {/* Drivers List */}
          <TabsContent value="drivers" className="flex-1 m-0 p-4 overflow-auto">
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2 border rounded-lg"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="on_ride">On Ride</option>
              </select>
            </div>
            
            <div className="space-y-2">
              {filteredDrivers.map(driver => (
                <Card
                  key={driver.driverId}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setActiveTab('map');
                    focusOnDriver(driver);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      
                      <div>
                        <div className="font-semibold">Driver {driver.driverId.substring(0, 8)}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant={driver.status === 'online' ? 'default' : driver.status === 'on_ride' ? 'secondary' : 'outline'}>
                            {driver.status === 'online' ? 'Online' : driver.status === 'on_ride' ? 'On Ride' : 'Offline'}
                          </Badge>
                          {driver.vehicleType && (
                            <span className="text-xs">{driver.vehicleType.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Last updated</div>
                      <div className="text-sm font-medium">
                        {new Date(driver.lastUpdate).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredDrivers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No drivers found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Active Rides List */}
          <TabsContent value="rides" className="flex-1 m-0 p-4 overflow-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rides..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              {filteredRides.map(ride => (
                <Card
                  key={ride.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setActiveTab('map');
                    focusOnRide(ride);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">Ride #{ride.id.substring(0, 8)}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">{ride.vehicleType.toUpperCase()}</Badge>
                        <Badge variant="outline">{ride.status}</Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">₹{ride.fare}</div>
                      <div className="text-xs text-gray-500">{(ride.distance / 1000).toFixed(1)} km</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="font-medium text-xs text-gray-500">Pickup</div>
                        <div className="text-gray-700">{ride.pickup.address}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                      <div className="flex-1">
                        <div className="font-medium text-xs text-gray-500">Drop</div>
                        <div className="text-gray-700">{ride.drop.address}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>Driver: {ride.driverId ? ride.driverId.substring(0, 8) : 'Not assigned'}</span>
                    <span>Rider: {ride.riderId.substring(0, 8)}</span>
                  </div>
                </Card>
              ))}
              
              {filteredRides.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active rides</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Menu Drawer */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Menu</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/admin/analytics');
            }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/admin/payments');
            }}>
              <IndianRupee className="mr-2 h-4 w-4" />
              Payments & Commission
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/admin/offers');
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Offers & Notifications
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/admin/users');
            }}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users & Drivers
            </Button>
            
            <hr className="my-2" />
            
            <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => {
              signOut();
              setLocation('/login');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
