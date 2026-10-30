import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Theme, useTheme } from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";

const ResetPassword = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters and include a letter and a number.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert("Update Failed", error.message);
        return;
      }

      Alert.alert("Success", "Your password has been changed successfully.", [
        { text: "Login", onPress: () => router.replace("/Login") },
      ]);
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Unable to update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles(theme).container}>
      <FlatList
        data={[{ key: "form" }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles(theme).content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        renderItem={() => (
          <View>
            <Text style={styles(theme).title}>Reset Password</Text>
            <PrimaryText>Choose a new password for your account.</PrimaryText>
            <View style={styles(theme).field}>
              <PrimaryText>NEW PASSWORD</PrimaryText>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles(theme).field}>
              <PrimaryText>CONFIRM PASSWORD</PrimaryText>
              <PasswordInput
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            <PrimaryButton
              text={loading ? "Updating..." : "UPDATE PASSWORD"}
              onPressHandler={updatePassword}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.PrimaryBackground },
    content: { paddingHorizontal: 20 },
    title: {
      color: theme.TextColour,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
    },
    field: { marginTop: 24 },
  });

export default ResetPassword;
