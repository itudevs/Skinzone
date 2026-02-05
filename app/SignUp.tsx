import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Colors from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import Input from "../components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import DatePicker from "@/components/DatePicker";
import PasswordInput from "@/components/PasswordInput";
import { Href, useRouter } from "expo-router";

const SignUp = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmpassword, setconfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const redirect = (url: Href) => {
    router.navigate(url);
  };
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const SignUpHandler = async () => {
    try {
      // Validation
      if (!name || !surname || !email || !phone || !dob || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (name.trim().length < 2) {
        Alert.alert("Error", "Name must be at least 2 characters");
        return;
      }

      if (surname.trim().length < 2) {
        Alert.alert("Error", "Surname must be at least 2 characters");
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      if (!validatePhone(phone)) {
        Alert.alert(
          "Error",
          "Please enter a valid phone number (at least 10 digits)",
        );
        return;
      }

      if (password.length < 13) {
        Alert.alert("Error", "Password must be at least 13 characters");
        return;
      }

      if (password !== confirmpassword) {
        Alert.alert("Error", "Passwords Do No Match");
        return;
      }

      // Check if user is at least 13 years old
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        Alert.alert("Error", "You must be at least 13 years old to sign up");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            surname: surname.trim(),
            phone: phone.trim(),
            date_of_birth: dob.toISOString(),
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      if (data?.user) {
        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to login or verification screen
              },
            },
          ],
        );
        redirect("/Login");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("SignUp error:", error);
    } finally {
      setLoading(false);
    }
  };

  //end magic link handling function
  const renderContent = () => (
    <View style={styles.content}>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 32,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Sign-Up{" "}
        </Text>
        <PrimaryText children="Welcome to your Skin journey"></PrimaryText>
      </View>
      {/*Sign Up Card*/}
      <View style={styles.CardContainer}>
        {/*Name and Surname Row */}
        <View style={styles.rowContainer}>
          <View style={styles.halfInput}>
            <PrimaryText children="NAME" />
            <TextInput
              style={styles.textinputheader}
              placeholder="John"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.halfInput}>
            <PrimaryText children="SURNAME" />
            <TextInput
              style={styles.textinputheader}
              placeholder="Doe"
              placeholderTextColor="#666"
              value={surname}
              onChangeText={setSurname}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/*Email Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="EMAIL" />
          <Input
            text="john.doe@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/*Phone Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="PHONE" />
          <Input
            text="+27 (81) 555-4444"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/*Date of Birth Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="DATE OF BIRTH" />
          <DatePicker
            placeholder="mm/dd/yyyy"
            value={dob}
            onDateChange={setDob}
          />
        </View>

        {/*Password Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="PASSWORD" />
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/*Confirm Password Field */}
        <View style={styles.inputcontainer}>
          <PrimaryText children="CONFIRM PASSWORD" />
          <PasswordInput
            placeholder="••••••••"
            value={confirmpassword}
            onChangeText={setconfirmPassword}
          />
        </View>

        {/*Create Account Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            text={loading ? "Creating Account..." : "CREATE ACCOUNT →"}
            onPressHandler={SignUpHandler}
          />
        </View>

        {/*Login Link */}
        <View style={styles.signupcontainer}>
          <PrimaryText children="Already a Member?" />
          <PrimaryLink colour="#00FF5F" url="/Login" children="Login" />
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

export default SignUp;

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
  textinputheader: {
    marginTop: 8,
    padding: 15,
    color: Colors.TextColour,
    backgroundColor: Colors.PrimaryBackground,
    borderColor: "#8b8b8bff",
    borderWidth: 0.5,
    borderRadius: 10,
  },
  inputcontainer: {
    marginTop: 15,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  halfInput: {
    flex: 1,
  },
  CardContainer: {
    marginTop: 20,
    backgroundColor: "#000000ff",
    padding: 30,
    borderColor: "#5f5e5eff",
    borderWidth: 2,
    borderRadius: 20,
  },
  buttonContainer: {
    marginTop: 25,
  },
  signupcontainer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
});
