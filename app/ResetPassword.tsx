import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import Input from "../components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";

const ResetPassword = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const ResetHandler = async () => {
    try {
      // Validation
      if (!email) {
        Alert.alert("Error", "Please enter your email address");
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: "yourapp://reset-password",
        }
      );

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Password reset link has been sent to your email. Please check your inbox.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to login
            },
          },
        ]
      );
      setEmail(""); // Clear the email field
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Reset password error:", error);
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
          Reset Password
        </Text>
        <PrimaryText children="Enter your email to reset your password" />
      </View>

      {/*Reset Card*/}
      <View style={styles.CardContainer}>
        {/*Email Field */}
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

        {/*Info Text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            We'll send you a link to reset your password via email.
          </Text>
        </View>

        {/*Send Reset Link Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            text={loading ? "Sending..." : "SEND RESET LINK"}
            onPressHandler={ResetHandler}
          />
        </View>

        {/*Back to Login Link */}
        <View style={styles.backContainer}>
          <PrimaryText children="Remember your password?" />
          <PrimaryLink colour="#00FF5F" url="/Login" children="Back to Login" />
        </View>
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

export default ResetPassword;

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
