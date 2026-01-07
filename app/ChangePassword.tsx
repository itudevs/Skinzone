import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import { router } from "expo-router";

const ChangePassword = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const UpdateHandler = async () => {
    try {
      // Validation
      if (password.length < 13) {
        Alert.alert("Error", "Password must be at least 13 characters");
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });
      if (data) {
        setLoading(true);

        Alert.alert("Success", "Password Changed", [
          {
            text: "OK",
            onPress: () => {
              router.navigate("/CustomerProfile");
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
        <View style={styles.backContainer}>
          <PrimaryText children="Remember your password?" />
          <PrimaryLink
            colour="#00FF5F"
            url="/CustomerProfile"
            children="Back to Profile"
          />
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
