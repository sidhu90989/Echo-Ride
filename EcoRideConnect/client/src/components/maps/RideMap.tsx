import { useMemo } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

export type LatLng = { lat: number; lng: number };

export function RideMap({
  apiKey,
  pickup,
  dropoff,
  rider,
  driver,
  height = 320,
}: {
  apiKey: string;
  pickup?: LatLng;
  dropoff?: LatLng;
  rider?: LatLng | null;
  driver?: LatLng | null;
  height?: number;
}) {
  const center = useMemo<LatLng>(() => {
    if (rider) return rider;
    if (driver) return driver;
    if (pickup) return pickup;
    return { lat: 28.6139, lng: 77.209 };
  }, [rider, driver, pickup]);

  return (
    <APIProvider apiKey={apiKey} onLoad={() => {}}>
      <div style={{ height }}>
        <Map defaultZoom={13} defaultCenter={center} gestureHandling="greedy" disableDefaultUI>
          {pickup && <Marker position={pickup} label="P" />}
          {dropoff && <Marker position={dropoff} label="D" />}
          {rider && <Marker position={rider} label="R" />}
          {driver && <Marker position={driver} label="DRV" />}
        </Map>
      </div>
    </APIProvider>
  );
}
