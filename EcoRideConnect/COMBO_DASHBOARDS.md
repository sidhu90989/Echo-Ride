# Combo Dashboards

We unified the duplicate "Dashboard" and "Dashboard OLA" variants into role-specific Combo dashboards that pick the best available implementation and preserve backward links.

- Rider: `client/src/pages/rider/ComboDashboard.tsx`
- Driver: `client/src/pages/driver/ComboDashboard.tsx`
- Admin: `client/src/pages/admin/ComboDashboard.tsx`

Current behavior:
- Both legacy files (e.g., `RiderDashboard.tsx` and `RiderDashboardOLA.tsx`) are feature-equivalent.
- The Combo dashboard renders the primary Dashboard by default.
- You can force the OLA variant by appending `?style=ola` to the URL or by setting `localStorage.setItem('ecoRide.uiStyle', 'ola')`.
- App routes for both `/role` and `/role/dashboard-ola` now point to the Combo dashboards, so existing links keep working.

Cleanup plan:
- Once verified in staging/preview, we can remove `*DashboardOLA.tsx` and keep the Combo files routing to the primary dashboard.
- Update any docs/screenshots accordingly.

Testing tips:
- Rider: visit `/rider` and `/rider/dashboard-ola` (both should work).
- Driver: visit `/driver` and `/driver/dashboard-ola`.
- Admin: visit `/admin` and `/admin/dashboard-ola`.
- Try `?style=ola` to confirm the toggling mechanism.
