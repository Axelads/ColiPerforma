// App.js
import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import PalettesFFLScreen from "./screens/PalettesFFLScreen";
import CitySearchScreen from "./screens/CitySearchScreen";
import ParametresScreen from "./screens/ParametresScreen";
import ProfileEditScreen from "./screens/ProfileEditScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";

// ❌ On désactive temporairement tout ce qui touche aux pubs
// import { initInterstitial } from "./utils/interstitial";
// import mobileAds from "react-native-google-mobile-ads";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem("pb_token");
        setInitialRoute(token ? "Home" : "Login");
      } catch {
        setInitialRoute("Login");
      }
    };
    bootstrap();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f1115", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PalettesFFL" component={PalettesFFLScreen} />
        <Stack.Screen name="CitySearch" component={CitySearchScreen} />
        <Stack.Screen name="Parametres" component={ParametresScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
