import { useMemo, useState } from 'react';

export type LatLng = { lat: number; lng: number };
export type VehicleKind = 'e_rickshaw' | 'e_scooter' | 'cng_car';

export type RideStep =
  | 'home'            // landing, where-to pre-focus
  | 'pickup'          // adjust pickup
  | 'drop'            // choose drop
  | 'vehicle'         // pick vehicle
  | 'confirm'         // confirm booking
  | 'searching'       // driver matching
  | 'assigned'        // driver found
  | 'enroute_pickup'  // to pickup
  | 'enroute_drop'    // to drop
  | 'complete';

export interface RideFlowState {
  step: RideStep;
  pickup?: LatLng;
  drop?: LatLng;
  vehicle?: VehicleKind;
}

export interface UseRideFlowOptions {
  defaultVehicle?: VehicleKind;
}

export function useRideFlow(opts: UseRideFlowOptions = {}) {
  const [state, setState] = useState<RideFlowState>({ step: 'home', vehicle: opts.defaultVehicle });

  function setPickup(p: LatLng) {
    setState((s) => ({ ...s, pickup: p, step: s.step === 'home' ? 'drop' : s.step }));
  }

  function setDrop(d: LatLng) {
    setState((s) => ({ ...s, drop: d, step: 'vehicle' }));
  }

  function selectVehicle(v: VehicleKind) {
    setState((s) => ({ ...s, vehicle: v, step: 'confirm' }));
  }

  function back() {
    setState((s) => {
      switch (s.step) {
        case 'confirm': return { ...s, step: 'vehicle' };
        case 'vehicle': return { ...s, step: 'drop' };
        case 'drop': return { ...s, step: 'pickup' };
        case 'pickup': return { ...s, step: 'home' };
        default: return s;
      }
    });
  }

  function reset() {
    setState({ step: 'home', vehicle: opts.defaultVehicle });
  }

  // Transition helpers
  const canConfirm = !!(state.pickup && state.drop && state.vehicle && state.step === 'confirm');

  return useMemo(() => ({
    state,
    setPickup,
    setDrop,
    selectVehicle,
    back,
    reset,
    canConfirm,
  }), [state]);
}

export default useRideFlow;
