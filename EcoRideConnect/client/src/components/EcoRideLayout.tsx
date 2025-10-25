import React from 'react';
// Local responsive helpers for EcoRide layout
import '@/styles/ecoride-responsive.css';

export type Role = 'rider' | 'driver' | 'admin';

export interface EcoRideLayoutProps {
  role: Role;
  header?: React.ReactNode;
  mapArea?: React.ReactNode; // primary map workspace
  bottomPanel?: React.ReactNode; // rider bottom sheet / driver control panel
  bottomNav?: React.ReactNode; // mobile bottom navigation bar
  sidebar?: React.ReactNode; // admin-only sidebar
  children?: React.ReactNode; // admin main content
  className?: string;
  style?: React.CSSProperties;
}

/**
 * EcoRideLayout
 *
 * Non-invasive, role-aware layout scaffold for EcoRide.
 * This component does NOT wire itself into any page yet. Safe to ship.
 *
 * Usage idea (not wired):
 * <EcoRideLayout role="rider" header={<Header/>} mapArea={<Map/>} bottomPanel={<Sheet/>} bottomNav={<Nav/>} />
 */
export default function EcoRideLayout({
  role,
  header,
  mapArea,
  bottomPanel,
  bottomNav,
  sidebar,
  children,
  className,
  style,
}: EcoRideLayoutProps) {
  if (role === 'admin') {
    return (
      <div className={['admin-layout', className].filter(Boolean).join(' ')} style={style}>
        {/* Sidebar */}
        <aside style={{ borderRight: '1px solid var(--border)', minWidth: 280 }}>
          {sidebar}
        </aside>
        {/* Main */}
        <main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <header style={{ borderBottom: '1px solid var(--border)' }}>{header}</header>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
        </main>
      </div>
    );
  }

  if (role === 'driver') {
    return (
      <div className={['ecoride-container', className].filter(Boolean).join(' ')} style={style}>
        <header style={{ borderBottom: '1px solid var(--border)' }}>{header}</header>
        <div className="map-container" style={{ position: 'relative' }}>
          {mapArea}
        </div>
        <div className="bottom-sheet" style={{ borderTop: '1px solid var(--border)' }}>
          {bottomPanel}
        </div>
        <nav style={{ position: 'sticky', bottom: 0, borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
          {bottomNav}
        </nav>
      </div>
    );
  }

  // rider
  return (
    <div className={['ecoride-container', className].filter(Boolean).join(' ')} style={style}>
      <header style={{ borderBottom: '1px solid var(--border)' }}>{header}</header>
      <div className="map-container" style={{ position: 'relative' }}>
        {mapArea}
      </div>
      <div className="bottom-sheet" style={{ borderTop: '1px solid var(--border)' }}>
        {bottomPanel}
      </div>
      <nav style={{ position: 'sticky', bottom: 0, borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
        {bottomNav}
      </nav>
    </div>
  );
}
