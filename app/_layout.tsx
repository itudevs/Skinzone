import { Stack, useRouter } from "expo-router";
import { StatusBar, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import {
  registerPushTokenForCurrentUser,
  requestNotificationPermissions,
} from "@/lib/notifications";
import { UserSession } from "@/components/utils/GetUsersession";

// Keep native splash visible until we hide it manually
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Run startup work in parallel
    requestNotificationPermissions().catch(() => {});

    // Handle deep links
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      console.log("Incoming Deep Link:", url);

      // Extract access_token and refresh_token from the URL fragment
      // The URL format is scheme://path#access_token=...&refresh_token=...&type=recovery
      
      // Handle standard query params too just in case
      const { queryParams } = Linking.parse(url);
      
      let accessToken = queryParams?.access_token as string;
      let refreshToken = queryParams?.refresh_token as string;

      // Check fragment if query params are missing (Supabase default)
      if (!accessToken || !refreshToken) {
         const fragment = url.split("#")[1];
         if (fragment) {
            // Manual parsing to avoid URLSearchParams issues if not polyfilled
            accessToken = fragment.match(/access_token=([^&]+)/)?.[1] || "";
            refreshToken = fragment.match(/refresh_token=([^&]+)/)?.[1] || "";
         }
      }

      if (accessToken && refreshToken) {
         const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
           console.error("Error setting session from deep link:", error);
        } else {
           console.log("Session set from deep link successfully");
        }
      }
    };

    // Listen for initial URL
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for incoming URLs
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    const unsubscribeUserSession = UserSession.onSessionChange((session) => {
      if (!session?.user?.id) {
        return;
      }

      registerPushTokenForCurrentUser().catch(() => {});
    });

    // Listen for Auth State Changes (PASSWORD_RECOVERY)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/ResetPassword");
      }
    });

    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000); // 3 seconds

    return () => {
      clearTimeout(timer);
      unsubscribeUserSession();
      subscription.remove();
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.main}>
      <StatusBar barStyle={"dark-content"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="SignUp" />
        <Stack.Screen
          name="Login"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="ForgotPassword" />
        <Stack.Screen name="ResetPassword" />
        <Stack.Screen
          name="CustomerProfile"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="ChangePassword" />
        <Stack.Screen
          name="(Admintab)"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          options={{ title: "PrivacyPolicy" }}
        />
        <Stack.Screen
          name="TermsOfService"
          options={{ title: "TermsOfService" }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { color: "#000000ff", flex: 1 },
});
