import React from 'react';

export type RideStatusUi =
  | 'searching'
  | 'assigned'
  | 'enroute_pickup'
  | 'enroute_drop'
  | 'complete'
  | 'error_no_drivers'
  | 'error_payment';

export interface RideFeedbackProps {
  status: RideStatusUi;
  progress?: number; // 0-100 for searching progress
  etaMin?: number; // estimated minutes
  driverName?: string;
  vehicleLabel?: string;
  onRetry?: () => void;
  onRebook?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * RideFeedback: generic ride-hailing feedback UI. Not wired by default.
 */
export default function RideFeedback({
  status,
  progress,
  etaMin,
  driverName,
  vehicleLabel,
  onRetry,
  onRebook,
  className,
  style,
}: RideFeedbackProps) {
  if (status === 'searching') {
    return (
      <div className={className} style={style}>
        <div className="animate-pulse font-medium">Finding your driver…</div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }} />
        </div>
      </div>
    );
  }
  if (status === 'assigned') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">Driver assigned{driverName ? `: ${driverName}` : ''}</div>
        <div className="text-sm text-muted-foreground">ETA {etaMin ?? '-'} min • {vehicleLabel || ''}</div>
      </div>
    );
  }
  if (status === 'enroute_pickup') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">On the way to pickup</div>
        <div className="text-sm text-muted-foreground">ETA {etaMin ?? '-'} min</div>
      </div>
    );
  }
  if (status === 'enroute_drop') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">On the way</div>
        <div className="text-sm text-muted-foreground">ETA {etaMin ?? '-'} min</div>
      </div>
    );
  }
  if (status === 'complete') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">Ride complete 🎉</div>
        <button className="mt-2 px-3 py-2 rounded border" onClick={onRebook}>Rebook</button>
      </div>
    );
  }
  if (status === 'error_no_drivers') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">No drivers available</div>
        <button className="mt-2 px-3 py-2 rounded border" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (status === 'error_payment') {
    return (
      <div className={className} style={style}>
        <div className="font-medium">Payment failed</div>
        <button className="mt-2 px-3 py-2 rounded border" onClick={onRetry}>Try another method</button>
      </div>
    );
  }
  return null;
}
