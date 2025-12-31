import { View, Text, Image, StyleSheet, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import Input from "../components/Input";
import Link from "@/components/Link";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import PasswordInput from "@/components/PasswordInput";

const Login = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const LoginHandler = async () => {
    try {
      // Validation
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      if (data?.user) {
        Alert.alert("Success", "Logged in successfully!");
        // Navigate to home screen here
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      <View style={{ alignItems: "center" }}>
        <Image
          style={styles.imgContainer}
          source={require("../assets/images/SkinzoneLogo.jpeg")}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: "bold",
            padding: 10,
          }}
        >
          SKINZONE
        </Text>
        <PrimaryText children="Welcome back to your skin journey" />
      </View>

      <View style={styles.inputcontainer}>
        <PrimaryText children="Email" />
        <Input
          text="user@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PrimaryText children="Password" />
        <PasswordInput
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
        />
        <PrimaryLink
          colour={Colors.TextColour}
          url="/ResetPassword"
          children="Forgot Password"
        />
      </View>

      <View>
        <PrimaryButton
          text={loading ? "Loading..." : "Login"}
          onPressHandler={LoginHandler}
        />
      </View>
      <View style={styles.signupcontainer}>
        <PrimaryText children="New to SkinZone?"></PrimaryText>
        <PrimaryLink colour="#00FF5F" url="./SignUp" children="Sign Up" />
      </View>

      <View style={styles.signupcontainer}>
        <Text style={{ color: "#97999B", paddingTop: 4 }}>
          Are you a staff member?
        </Text>
        <Link
          colour={Colors.TextColour}
          url="mailto:itumelengmorena20@gmail.com"
          children="Contact Admin"
        />
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

export default Login;

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
    padding: 10,
    alignContent: "flex-start",
  },
  imgContainer: {
    width: 150,
    height: 150,
    borderRadius: 35,
    borderColor: Colors.SecondaryColour100,
    borderWidth: 3,
    alignItems: "center",
  },
  textContainer: {
    padding: 10,
    alignItems: "center",
  },
  signupcontainer: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
});
