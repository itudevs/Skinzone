import { Stack, useRouter } from "expo-router";
import { StatusBar, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import {
  allocateBirthdayPointsIfEligible,
  registerPushTokenForCurrentUser,
  requestNotificationPermissions,
} from "@/lib/notifications";
import { UserSession } from "@/components/utils/GetUsersession";

const decodeParam = (value?: string | null) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseAllUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};

  const { queryParams } = Linking.parse(url);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params[key] = decodeParam(value);
      }
    });
  }

  const hash = url.split("#")[1];
  if (hash) {
    hash.split("&").forEach((pair) => {
      const [rawKey, ...rawValueParts] = pair.split("=");
      if (!rawKey) return;
      const rawValue = rawValueParts.join("=");
      params[decodeParam(rawKey)] = decodeParam(rawValue);
    });
  }

  return params;
};

const BIRTHDAY_BONUS_STORAGE_KEY = "birthday_bonus_awarded";

// Keep native splash visible until we hide it manually
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let lastHandledUserId: string | null = null;

    // Run startup work in parallel
    requestNotificationPermissions().catch(() => {});

    // Handle deep links
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      console.log("Incoming Deep Link:", url);

      const params = parseAllUrlParams(url);
      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      const code = params.code;
      const tokenHash = params.token_hash;
      const type = params.type;

      let recoveryEstablished = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Error exchanging code for session:", error);
        } else {
          recoveryEstablished = true;
          console.log("Session established from code successfully");
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error("Error setting session from deep link:", error);
        } else {
          recoveryEstablished = true;
          console.log("Session set from deep link successfully");
        }
      } else if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (error) {
          console.error("Error verifying recovery token:", error);
        } else {
          recoveryEstablished = true;
          console.log("Recovery token verified successfully");
        }
      }

      if (recoveryEstablished || type === "recovery") {
        const resetPasswordRoute: any = "/ResetPassword";
        router.replace(resetPasswordRoute);
      }
    };

    // Listen for initial URL
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for incoming URLs
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    const unsubscribeUserSession = UserSession.onSessionChange((session) => {
      const currentUserId = session?.user?.id ?? null;

      if (!currentUserId) {
        lastHandledUserId = null;
        return;
      }

      if (lastHandledUserId === currentUserId) {
        return;
      }

      lastHandledUserId = currentUserId;

      registerPushTokenForCurrentUser()
        .then(() => allocateBirthdayPointsIfEligible())
        .then(async (result) => {
          if (!result?.awarded) {
            return;
          }

          await AsyncStorage.setItem(
            BIRTHDAY_BONUS_STORAGE_KEY,
            JSON.stringify({
              awardedAt: new Date().toISOString(),
              pointsAwarded: result.pointsAwarded ?? 100,
            }),
          );
        })
        .catch(() => {});
    });

    // Listen for auth state changes (diagnostics only).
    // In-app token reset flow controls navigation in the screen itself.
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth Event:", event);
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
        <Stack.Screen name="Login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ForgotPassword" />
        <Stack.Screen name="ResetPassword" />
        <Stack.Screen
          name="CustomerProfile"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ChangePassword" />
        <Stack.Screen name="(Admintab)" options={{ gestureEnabled: false }} />
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
