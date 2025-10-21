import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function PWAInstallPrompt() {
  const { canInstall, installed, promptInstall, isIOS, isStandalone } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Hide if already installed or in standalone
  const shouldShow = !dismissed && !installed && !isStandalone && (canInstall || isIOS);

  useEffect(() => {
    // auto-dismiss after some time if desired
  }, []);

  if (!shouldShow) return null;

  if (isIOS && !canInstall) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-neutral-900/90 border rounded-full shadow-lg px-4 py-2 text-sm flex items-center gap-2">
        <span>Install EcoRide: Share → Add to Home Screen</span>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-neutral-900/90 border rounded-full shadow-lg px-3 py-2 flex items-center gap-2">
      <Button size="sm" onClick={async () => {
        const res = await promptInstall();
        if (res.outcome === 'accepted') setDismissed(true);
      }}>
        Install App
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
        Not now
      </Button>
    </div>
  );
}
