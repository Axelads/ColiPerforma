// utils/AdBanner.js
import React from "react";
import { View, Platform } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

/**
 * ⚠️ IMPORTANT
 * - iOS: tu m'as donné un **App ID** (avec ~). Il faut un **Ad Unit ID** (avec /).
 *   En attendant d'avoir l'Ad Unit iOS, on met un fallback sur l'ID de test en dev.
 * - Android: l'ID que tu as donné (…/6110708582) est un **Ad Unit ID** valide pour une bannière.
 */
const ANDROID_AD_UNIT_ID = "ca-app-pub-8479512225202408/6110708582";
const IOS_AD_UNIT_ID = ""; // ← Remplace par ton vrai ad unit iOS, ex: "ca-app-pub-8479512225202408/XXXXXXXXXX"

const BANNER_ID = Platform.select({
  ios: IOS_AD_UNIT_ID || (__DEV__ ? TestIds.BANNER : ""), // fallback test en dev
  android: ANDROID_AD_UNIT_ID || (__DEV__ ? TestIds.BANNER : ""),
});

export default function AdBanner() {
  // Si on est en prod iOS sans ad unit → on ne rend rien (évite un crash)
  if (!BANNER_ID) return null;

  return (
    <View style={{ width: "100%", alignItems: "center", marginVertical: 10 }}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
