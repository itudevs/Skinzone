import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";

const ChangePassword = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(false);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);
  const params = useLocalSearchParams<{
    type?: string;
    access_token?: string;
    refresh_token?: string;
  }>();
  const deepLinkUrl = Linking.useURL();

  const extractTokenFromUrl = (url: string | null, key: string) => {
    if (!url) return undefined;

    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = url.match(new RegExp(`[?#&]${escapedKey}=([^&#]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  };

  const openedFromRecoveryLink = useMemo(() => {
    return (
      params.type === "recovery" ||
      !!params.access_token ||
      !!params.refresh_token
    );
  }, [params.type, params.access_token, params.refresh_token]);

  const canGoBackToProfile = hasAuthenticatedSession && !openedFromRecoveryLink;

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setHasAuthenticatedSession(!!session?.user);
      setRecoverySessionReady(!openedFromRecoveryLink || !!session?.user);
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [openedFromRecoveryLink]);

  useEffect(() => {
    let active = true;

    const ensureRecoverySession = async () => {
      if (!openedFromRecoveryLink) return;

      const accessToken =
        (params.access_token as string | undefined) ||
        extractTokenFromUrl(deepLinkUrl, "access_token");
      const refreshToken =
        (params.refresh_token as string | undefined) ||
        extractTokenFromUrl(deepLinkUrl, "refresh_token");

      if (!accessToken || !refreshToken) {
        if (active) setRecoverySessionReady(false);
        return;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!active) return;

      if (error || !data.session?.user) {
        setRecoverySessionReady(false);
        return;
      }

      setHasAuthenticatedSession(true);
      setRecoverySessionReady(true);
    };

    ensureRecoverySession();

    return () => {
      active = false;
    };
  }, [
    openedFromRecoveryLink,
    params.access_token,
    params.refresh_token,
    deepLinkUrl,
  ]);

  const UpdateHandler = async () => {
    try {
      // Validation
      if (password.length < 13) {
        Alert.alert("Error", "Password must be at least 13 characters");
        return;
      }

      if (openedFromRecoveryLink && !recoverySessionReady) {
        Alert.alert(
          "Invalid or Expired Link",
          "Your reset link is invalid or expired. Please request a new password reset link.",
        );
        return;
      }

      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert(
          "Auth Session Missing",
          "No active reset session was found. Please open the latest reset email link and try again.",
        );
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });
      if (data) {
        Alert.alert("Success", "Password Changed", [
          {
            text: "OK",
            onPress: () => {
              if (canGoBackToProfile) {
                router.replace("/CustomerProfile");
              } else {
                router.replace("/Login");
              }
            },
          },
        ]);
        setPassword(""); // Clear the email field
      }
      if (error) {
        Alert.alert("Error", error.message);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Update password error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Text
          style={{
            fontSize: 32,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Change Password
        </Text>
        <PrimaryText children="Enter New Password" />
      </View>

      {/*Reset Card*/}
      <View style={styles.CardContainer}>
        {/*Email Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="Password" />
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/*Send Reset Link Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            text={loading ? "Changing..." : "UPDATE"}
            onPressHandler={UpdateHandler}
          />
        </View>

        {/*Back to Login Link */}
        {canGoBackToProfile && (
          <View style={styles.backContainer}>
            <PrimaryText children="Remember your password?" />
            <PrimaryLink
              colour="#00FF5F"
              url="/CustomerProfile"
              children="Back to Profile"
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.Container}>
      <FlatList
        data={[{ key: "form" }]}
        renderItem={renderContent}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: "#000000ff",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputcontainer: {
    marginTop: 15,
  },
  CardContainer: {
    marginTop: 20,
    backgroundColor: "#000000ff",
    padding: 30,
    borderColor: "#5f5e5eff",
    borderWidth: 2,
    borderRadius: 20,
  },
  infoContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    color: Colors.TextColour,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 20,
  },
  backContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    alignItems: "center",
  },
});
