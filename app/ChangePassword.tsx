import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import Input from "@/components/Input";
import { useRouter } from "expo-router";

const ChangePassword = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "update">("request");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert(
          "Authentication Required",
          "Please log in to change your password.",
          [{ text: "Login", onPress: () => router.replace("/Login") }],
        );
      }
    };
    checkUser();
  }, []);

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.reauthenticate();

      if (error) {
        Alert.alert("Error Sending Code", error.message);
        return;
      }

      Alert.alert(
        "Code Sent",
        "Please check your email for the verification code.",
      );
      setStep("update");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!verificationCode) {
      Alert.alert(
        "Missing Code",
        "Please enter the verification code sent to your email.",
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Mismatch",
        "New password and Confirm password do not match.",
      );
      return;
    }

    try {
      setLoading(true);

      const updateParams: any = {
        password: newPassword,
        nonce: verificationCode,
      };

      const { data, error } = await supabase.auth.updateUser(updateParams);

      if (error) {
        Alert.alert("Update Failed", error.message);
        return;
      }

      if (data.user) {
        Alert.alert("Success", "Your password has been changed successfully.", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred.");
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
        <PrimaryText
          children={
            step === "request"
              ? "Secure Password Update"
              : "Verify & Set New Password"
          }
        />
      </View>

      <View style={styles.CardContainer}>
        {step === "request" ? (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                For your security, verify your identity first. Tap the button
                below to receive a verification code via email.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                text={loading ? "Sending Code..." : "SEND VERIFICATION CODE"}
                onPressHandler={sendVerificationCode}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.inputcontainer}>
              <PrimaryText children="VERIFICATION CODE" />
              <Input
                text="123456"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputcontainer}>
              <PrimaryText children="NEW PASSWORD" />
              <PasswordInput
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
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
                text={loading ? "Updating..." : "CHANGE PASSWORD"}
                onPressHandler={updatePassword}
              />

              <View style={{ marginTop: 15 }}>
                <PrimaryButton
                  text="Cancel"
                  onPressHandler={() => setStep("request")}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.Container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <FlatList
        data={[{ key: "form" }]}
        renderItem={renderContent}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
    marginBottom: 20,
    alignItems: "center",
  },
  infoText: {
    color: Colors.TextColour,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 10,
  },
});
