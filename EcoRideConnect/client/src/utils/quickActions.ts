export type QuickAction = {
  id: string;
  label: string;
  payload?: Record<string, unknown>;
};

export function getRiderShortcuts(options?: {
  favorites?: Array<{ id: string; label: string; address: string }>;
  recent?: Array<{ id: string; label: string; address: string }>;
}): QuickAction[] {
  const items: QuickAction[] = [];
  items.push({ id: 'goto_home', label: 'Home' });
  items.push({ id: 'goto_work', label: 'Work' });
  items.push({ id: 'goto_airport', label: 'Airport' });
  (options?.favorites || []).slice(0, 3).forEach((f) => items.push({ id: `fav_${f.id}`, label: f.label }));
  (options?.recent || []).slice(0, 3).forEach((r) => items.push({ id: `recent_${r.id}`, label: r.label }));
  return items;
}

export function getDriverShortcuts(): QuickAction[] {
  return [
    { id: 'payout_request', label: 'Request Payout' },
    { id: 'today_earnings', label: "Today's Earnings" },
    { id: 'performance', label: 'Performance' },
  ];
}
