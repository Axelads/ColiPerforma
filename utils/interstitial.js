// utils/interstitial.js
import { Platform } from "react-native";
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";

// IDs de TEST (remplace par tes IDs prod plus tard)
const AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
});

let loaded = false;
const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

interstitial.addAdEventListener(AdEventType.LOADED, () => { loaded = true; });
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  loaded = false;
  try { interstitial.load(); } catch {}
});
interstitial.addAdEventListener(AdEventType.ERROR, () => {
  loaded = false;
  try { interstitial.load(); } catch {}
});

// Appelle ceci une fois au démarrage (ex: dans App.js)
export function initInterstitial() {
  try { interstitial.load(); } catch {}
}

export function showInterstitialIfReady() {
  if (!loaded) return false;
  try {
    interstitial.show();
    return true;
  } catch {
    return false;
  }
}
