export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.5.1';

export const APP_BUILD_DATE: string =
  typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

export type UpdateCheckResult =
  | 'updated'
  | 'up-to-date'
  | 'offline'
  | 'no-sw'
  | 'error';

/**
 * Checks for a newer PWA service worker version and activates it if found.
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline';
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'no-sw';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return 'no-sw';
    }

    let controllerChanged = false;
    const onControllerChange = () => {
      controllerChanged = true;
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, {
      once: true,
    });

    try {
      await registration.update();

      // If a new worker is currently installing, wait briefly for it to finish installing/activating
      const installing = registration.installing;
      if (installing) {
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 4500);
          const onStateChange = () => {
            if (
              installing.state === 'installed' ||
              installing.state === 'activated' ||
              installing.state === 'redundant'
            ) {
              window.clearTimeout(timer);
              installing.removeEventListener('statechange', onStateChange);
              resolve();
            }
          };
          installing.addEventListener('statechange', onStateChange);
        });
      }

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        return 'updated';
      }

      if (controllerChanged) {
        return 'updated';
      }

      return 'up-to-date';
    } finally {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    }
  } catch {
    return 'error';
  }
}
