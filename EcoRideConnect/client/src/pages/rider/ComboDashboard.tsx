/**
 * Combo Rider Dashboard
 * Unified dashboard that intelligently chooses between the legacy
 * RiderDashboard and RiderDashboardOLA. With OLA files removed, this
 * component always renders the unified RiderDashboard.
 */
import React from 'react';
import RiderDashboard from './RiderDashboard';

export default function RiderComboDashboard() {
  return <RiderDashboard />;
}
