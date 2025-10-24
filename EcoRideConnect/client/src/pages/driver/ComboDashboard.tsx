/**
 * Combo Driver Dashboard
 * Unified dashboard that can toggle between DriverDashboard and DriverDashboardOLA.
 * Defaults to DriverDashboard. Pass ?style=ola to force the OLA variant.
 */
import React from 'react';
import DriverDashboard from './DriverDashboard';
import DriverDashboardOLA from './DriverDashboardOLA';

function getStyleVariant(): 'default' | 'ola' {
  try {
    const params = new URLSearchParams(window.location.search);
    const style = params.get('style');
    if (style === 'ola') return 'ola';
    const saved = localStorage.getItem('ecoRide.uiStyle');
    if (saved === 'ola') return 'ola';
  } catch {}
  return 'default';
}

export default function DriverComboDashboard() {
  const variant = getStyleVariant();
  if (variant === 'ola') {
    return <DriverDashboardOLA />;
  }
  return <DriverDashboard />;
}
