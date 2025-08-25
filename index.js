// --- Patch Android: sécuriser le module natif Networking (timeout/booleans) ---
import { NativeModules, Platform } from 'react-native';

try {
  const { Networking } = NativeModules;
  if (Networking && typeof Networking.sendRequest === 'function' && Platform.OS === 'android') {
    const origSend = Networking.sendRequest;
    NativeModules.Networking.sendRequest = function (
      method,
      url,
      headers,
      data,
      responseType,
      useIncrementalUpdates,
      timeout,
      withCredentials,
      ...rest
    ) {
      const safeTimeout = typeof timeout === 'number' && isFinite(timeout) ? timeout : 0;
      const safeIncr  = !!useIncrementalUpdates;
      const safeCreds = !!withCredentials;

      return origSend.call(
        this,
        method,
        url,
        headers,
        data,
        responseType,
        safeIncr,
        safeTimeout,
        safeCreds,
        ...rest
      );
    };
  }
} catch { /* no-op */ }

// ---------------------------------------------------------------------------

import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
