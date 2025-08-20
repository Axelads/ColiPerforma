// --- Patch Android: éviter le crash "null cannot be cast to kotlin.Double" ---
// Certains modules (ou versions d'auto-complete) peuvent passer `timeout = null` au module natif.
import { NativeModules } from 'react-native';
try {
  const { Networking } = NativeModules;
  if (Networking && typeof Networking.sendRequest === 'function') {
    const origSend = Networking.sendRequest;
    NativeModules.Networking.sendRequest = function (
      method, url, headers, data, responseType,
      useIncrementalUpdates, timeout, withCredentials, ...rest
    ) {
      const safeTimeout = typeof timeout === 'number' ? timeout : 0; // jamais null
      return origSend.call(
        this,
        method, url, headers, data, responseType,
        useIncrementalUpdates, safeTimeout, withCredentials, ...rest
      );
    };
  }
} catch { /* no-op */ }
// ---------------------------------------------------------------------------

import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import App from './App';

// Enregistre l'app (Expo Go ou build natif)
registerRootComponent(App);
