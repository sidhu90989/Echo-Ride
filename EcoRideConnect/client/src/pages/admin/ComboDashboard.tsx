/**
 * Combo Admin Dashboard
 * Unified dashboard that can toggle between AdminDashboard and AdminDashboardOLA.
 * Defaults to AdminDashboard. Pass ?style=ola to force the OLA variant.
 */
import React from 'react';
import AdminDashboard from './AdminDashboard';
import AdminDashboardOLA from './AdminDashboardOLA';

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

export default function AdminComboDashboard() {
  const variant = getStyleVariant();
  if (variant === 'ola') {
    return <AdminDashboardOLA />;
  }
  return <AdminDashboard />;
}
