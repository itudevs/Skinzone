import { Stack } from "expo-router";
import { StatusBar, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { requestNotificationPermissions } from "@/lib/notifications";

// Keep native splash visible until we hide it manually
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Run startup work in parallel
    requestNotificationPermissions().catch(() => {});

    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.main}>
      <StatusBar barStyle={"dark-content"} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" options={{ headerShown: false }} />
        <Stack.Screen
          name="Login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="ResetPassword" options={{ headerShown: false }} />
        <Stack.Screen
          name="CustomerProfile"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="ChangePassword" options={{ headerShown: false }} />
        <Stack.Screen
          name="(Admintab)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          options={{ headerShown: false, title: "PrivacyPolicy" }}
        />
        <Stack.Screen
          name="TermsOfService"
          options={{ headerShown: false, title: "TermsOfService" }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { color: "#000000ff", flex: 1 },
});
