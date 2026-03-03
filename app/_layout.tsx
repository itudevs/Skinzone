import { Stack } from "expo-router";
import { StatusBar, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import { requestNotificationPermissions } from "@/lib/notifications";

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions().catch((error) => {
      console.log("Failed to setup notifications:", error);
    });
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
