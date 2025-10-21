import { useCallback, useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
};

export function usePWAInstall() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const onInstalled = () => {
      deferredRef.current = null;
      setInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = deferredRef.current;
    if (!evt) return { outcome: 'dismissed' as const };
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredRef.current = null;
      setCanInstall(false);
    }
    return choice;
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('standalone' in navigator ? (navigator as any).standalone : false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

  return { canInstall, installed, promptInstall, isIOS, isStandalone };
}
