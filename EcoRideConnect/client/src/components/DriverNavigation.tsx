import React from 'react';

export type DriverNavState = 'offline' | 'online_waiting' | 'request' | 'active';

export interface RideRequestInfo {
  riderName?: string;
  pickup?: string;
  dropoff?: string;
  distanceKm?: number;
  etaMin?: number;
  countdownSec?: number; // for request accept window
}

export interface ActiveRideInfo {
  riderName?: string;
  phone?: string;
  pickup?: string;
  dropoff?: string;
  etaToPickupMin?: number;
  etaToDropMin?: number;
}

export interface DriverNavigationProps {
  state: DriverNavState;
  request?: RideRequestInfo;
  active?: ActiveRideInfo;
  onGoOnline?: () => void;
  onGoOffline?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onNavigate?: () => void;
  onCallRider?: () => void;
  onCompleteRide?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DriverNavigation: Additive driver UI states scaffold.
 * Not wired anywhere yet—safe to include.
 */
export default function DriverNavigation({
  state,
  request,
  active,
  onGoOnline,
  onGoOffline,
  onAccept,
  onReject,
  onNavigate,
  onCallRider,
  onCompleteRide,
  className,
  style,
}: DriverNavigationProps) {
  return (
    <div className={className} style={style}>
      {state === 'offline' && (
        <div className="p-4 text-center space-y-3">
          <div className="text-sm text-muted-foreground">You are offline</div>
          <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={onGoOnline}>Go Online</button>
        </div>
      )}
      {state === 'online_waiting' && (
        <div className="p-4 text-center space-y-3">
          <div className="animate-pulse">Waiting for rides…</div>
          <button className="px-3 py-2 rounded border" onClick={onGoOffline}>Go Offline</button>
        </div>
      )}
      {state === 'request' && (
        <div className="p-4 space-y-3">
          <div className="font-semibold">New ride request</div>
          <div className="text-sm text-muted-foreground">
            {request?.pickup} → {request?.dropoff} • {request?.distanceKm ?? '-'} km • ETA {request?.etaMin ?? '-'} min
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 rounded bg-emerald-600 text-white" onClick={onAccept}>Accept</button>
            <button className="flex-1 px-4 py-2 rounded border" onClick={onReject}>Reject</button>
          </div>
          {!!request?.countdownSec && (
            <div className="text-xs text-muted-foreground">Auto-expiring in {request.countdownSec}s</div>
          )}
        </div>
      )}
      {state === 'active' && (
        <div className="p-4 space-y-3">
          <div className="font-semibold">On trip</div>
          <div className="text-sm text-muted-foreground">{active?.pickup} → {active?.dropoff}</div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 rounded bg-blue-600 text-white" onClick={onNavigate}>Navigate</button>
            <button className="flex-1 px-4 py-2 rounded border" onClick={onCallRider}>Call Rider</button>
          </div>
          <button className="w-full px-4 py-2 rounded bg-emerald-600 text-white" onClick={onCompleteRide}>Complete Ride</button>
        </div>
      )}
    </div>
  );
}
