/**
 * Combo Rider Dashboard
 * Unified dashboard that intelligently chooses between the legacy
 * RiderDashboard and RiderDashboardOLA. Today both are feature-equivalent,
 * so we render the modern RiderDashboard by default. If a future delta
 * appears, setting ?style=ola will render the OLA variant for quick A/B.
 */
import React from 'react';
import RiderDashboard from './RiderDashboard';
import RiderDashboardOLA from './RiderDashboardOLA';

function getStyleVariant(): 'default' | 'ola' {
  try {
    const params = new URLSearchParams(window.location.search);
    const style = params.get('style');
    if (style === 'ola') return 'ola';
    // allow a local opt-in override via localStorage if ever needed
    const saved = localStorage.getItem('ecoRide.uiStyle');
    if (saved === 'ola') return 'ola';
  } catch {}
  return 'default';
}

export default function RiderComboDashboard() {
  const variant = getStyleVariant();
  if (variant === 'ola') {
    return <RiderDashboardOLA />;
  }
  return <RiderDashboard />;
}
