import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import Input from "../components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import { useRouter } from "expo-router";
import {
  sendPasswordResetOTP,
  verifyResetTokenAndUpdatePassword,
  validateEmail,
  validatePasswordReset,
} from "@/lib/forgot-password";

const ForgotPassword = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "update">("request");

  const sendVerificationCode = async () => {
    try {
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        Alert.alert("Error", emailValidation.error!);
        return;
      }

      setLoading(true);

      const result = await sendPasswordResetOTP(email);

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to send code");
        return;
      }

      Alert.alert(
        "Email Sent",
        "Check your email for the reset token, then enter it below.",
      );
      setStep("update");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    const validation = validatePasswordReset(
      verificationToken,
      newPassword,
      confirmPassword,
      6,
    );

    if (!validation.valid) {
      Alert.alert("Error", validation.error || "Invalid input");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyResetTokenAndUpdatePassword(
        email,
        verificationToken,
        newPassword,
      );

      if (!result.success) {
        Alert.alert(
          "Update Failed",
          result.error || "Failed to reset password",
        );
        return;
      }

      Alert.alert("Success", "Your password has been changed successfully.", [
        {
          text: "Login",
          onPress: () => {
            router.replace("/Login");
          },
        },
      ]);
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
          Forgot Password
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
                Enter your email and we will send you a reset token to verify
                your account.
              </Text>
            </View>

            <View style={styles.inputcontainer}>
              <PrimaryText children="EMAIL" />
              <Input
                text="user@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                text={loading ? "Sending..." : "SEND RESET TOKEN"}
                onPressHandler={sendVerificationCode}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.inputcontainer}>
              <PrimaryText children="EMAIL" />
              <Input
                text="user@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputcontainer}>
              <PrimaryText children="VERIFICATION TOKEN" />
              <Input
                text="12345678"
                value={verificationToken}
                onChangeText={setVerificationToken}
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
                  onPressHandler={() => {
                    setStep("request");
                    setVerificationToken("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.backContainer}>
          <PrimaryText children="Remember your password?" />
          <PrimaryLink colour="#00FF5F" url="/Login" children="Back to Login" />
        </View>
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

export default ForgotPassword;

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
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 30,
    gap: 10,
  },
  backContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    alignItems: "center",
  },
});
