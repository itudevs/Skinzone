import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import { useRouter } from "expo-router";

const ResetPassword = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid session (recovery session)
    // Subscribe to auth state changes to catch session updates from deep link
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "ResetPassword - Auth Change:",
        event,
        session ? "Valid Session" : "No Session",
      );
      if (session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
        setCheckingSession(false);
      } else {
        // If no session immediately, give it a moment for the deep link listener in _layout to process
        // But don't wait forever
        setTimeout(() => {
          if (!hasSession) {
            // Only set checking to false if we still don't have a session
            // Let the UI decided whether to show error or just stay loading
            // In this case, if we still have no session after 3s, show error
            setCheckingSession(false);
          }
        }, 3000);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const UpdatePasswordHandler = async () => {
    try {
      if (!password || !confirmPassword) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success", "Your password has been updated successfully.", [
        {
          text: "Login",
          onPress: () => router.replace("/Login"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
      console.error("Update password error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={[styles.Container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00FF5F" />
        <Text style={{ color: "white", marginTop: 20 }}>Verifying link...</Text>
      </View>
    );
  }

  if (!hasSession) {
    return (
      <View style={[styles.Container, styles.centerContent]}>
        <Text style={{ color: "white" }}>Invalid Session</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.Container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <View style={{ alignItems: "center", marginBottom: 30, marginTop: 40 }}>
          <Text
            style={{
              fontSize: 32,
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            New Password
          </Text>
          <PrimaryText children="Create a new secure password" />
        </View>

        <View style={styles.CardContainer}>
          <View style={styles.inputcontainer}>
            <PrimaryText children="NEW PASSWORD" />
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputcontainer}>
            <PrimaryText children="CONFIRM PASSWORD" />
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton
              text={loading ? "Updating..." : "UPDATE PASSWORD"}
              onPressHandler={UpdatePasswordHandler}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: "#000000ff",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  CardContainer: {
    marginTop: 20,
    backgroundColor: "#000000ff",
    padding: 30,
    borderColor: "#5f5e5eff",
    borderWidth: 2,
    borderRadius: 20,
  },
  inputcontainer: {
    marginTop: 15,
  },
  buttonContainer: {
    marginTop: 30,
  },
});
