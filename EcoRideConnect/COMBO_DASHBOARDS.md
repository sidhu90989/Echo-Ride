# Combo Dashboards (Unified)

We consolidated duplicate “Dashboard” and “Dashboard OLA” implementations into Combo dashboards per role. The OLA variants have been removed; Combo dashboards always render the unified primary dashboards.

- Rider: `client/src/pages/rider/ComboDashboard.tsx`
- Driver: `client/src/pages/driver/ComboDashboard.tsx`
- Admin: `client/src/pages/admin/ComboDashboard.tsx`

Behavior:
- OLA files have been deleted: `*DashboardOLA.tsx` no longer exist.
- Combo dashboards no longer support `?style=ola` overrides; they always render the unified implementation.
- Legacy routes `/rider|driver|admin/dashboard-ola` were removed.

Testing tips:
- Rider: visit `/rider`
- Driver: visit `/driver`
- Admin: visit `/admin`

Notes:
- The unified dashboards already contain the feature set that used to be split across the OLA/non-OLA variants.
- If you need A/B styling in the future, add a theming flag or feature toggle inside the primary dashboards instead of separate files.
