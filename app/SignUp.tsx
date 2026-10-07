import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Theme, useTheme } from "@/components/utils/Colours";
import PrimaryText from "@/components/PrimaryText";
import Input from "../components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryLink from "@/components/PrimaryLink";
import DatePicker from "@/components/DatePicker";
import PasswordInput from "@/components/PasswordInput";
import { Href, useRouter } from "expo-router";
import {
  handleSupabaseAuthError,
  handleUnexpectedError,
} from "../lib/error-handler";

const SignUp = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [nameError, setNameError] = useState("");
  const [surnameError, setSurnameError] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmpassword, setconfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
  const hasOnlyValidNameChars = (value: string): boolean => {
    return /^[\p{L}\s'-]+$/u.test(value);
  };
  const validateNameValue = (value: string): string => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "This field is required";
    }

    if (trimmed.length < 2) {
      return "Must be at least 2 characters";
    }

    if (trimmed.length > 50) {
      return "Must be 50 characters or fewer";
    }

    if (!hasOnlyValidNameChars(trimmed)) {
      return "Only letters, spaces, apostrophes, and hyphens are allowed";
    }

    if (!/^[\p{L}]/u.test(trimmed)) {
      return "Must start with a letter";
    }

    return "";
  };
  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(validateNameValue(value));
  };
  const handleSurnameChange = (value: string) => {
    setSurname(value);
    setSurnameError(validateNameValue(value));
  };
  const validatePassword = (value: string): boolean => {
    const hasMinLength = value.length >= 8;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasMinLength && hasLetter && hasNumber;
  };
  const getPasswordStrength = (value: string) => {
    if (!value) {
      return { label: "", color: theme.TextColour };
    }

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Za-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;

    if (score <= 1) {
      return { label: "Weak", color: "#FF6B6B" };
    }

    if (score === 2) {
      return { label: "Medium", color: "#FFC857" };
    }

    return { label: "Strong", color: "#00FF5F" };
  };

  const passwordChecks = {
    hasMinLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
  const passwordStrength = getPasswordStrength(password);

  const SignUpHandler = async () => {
    try {
      // Validation
      if (!name || !surname || !email || !phone || !dob || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (!agreedToTerms) {
        Alert.alert(
          "Terms Required",
          "Please read and agree to the Privacy Policy and Terms of Service to continue.",
        );
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

      const validatedNameError = validateNameValue(name);
      const validatedSurnameError = validateNameValue(surname);
      setNameError(validatedNameError);
      setSurnameError(validatedSurnameError);

      if (validatedNameError || validatedSurnameError) {
        Alert.alert(
          "Error",
          "Please correct name and surname. Only letters, spaces, apostrophes, and hyphens are allowed.",
        );
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

      if (!validatePassword(password)) {
        Alert.alert(
          "Error",
          "Password must be at least 8 characters and include at least one letter and one number",
        );
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
        const sanitizedError = handleSupabaseAuthError(error);
        Alert.alert(sanitizedError.title, sanitizedError.message);
        console.error("Sign up error:", error);
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
      const sanitizedError = handleUnexpectedError(error);
      Alert.alert(sanitizedError.title, sanitizedError.message);
      console.error("SignUp error:", error);
    } finally {
      setLoading(false);
    }
  };

  //end magic link handling function
  const renderContent = () => (
    <View style={styles(theme).content}>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 32,
            color: theme.TextColour,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Sign-Up{" "}
        </Text>
        <PrimaryText>Welcome to your Skin journey</PrimaryText>
      </View>
      {/*Sign Up Card*/}
      <View style={styles(theme).CardContainer}>
        {/*Required Field Legend */}
        <Text style={styles(theme).legendText}>
          <Text style={styles(theme).asterisk}>*</Text>
          <Text> = Required field</Text>
        </Text>

        {/*Name and Surname Row */}
        <View style={styles(theme).rowContainer}>
          <View style={styles(theme).halfInput}>
            <PrimaryText required={true}>NAME</PrimaryText>
            <TextInput
              style={styles(theme).textinputheader}
              placeholder="John"
              placeholderTextColor={theme.placeholder}
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
            />
            {!!nameError && (
              <Text style={styles(theme).inlineErrorText}>{nameError}</Text>
            )}
          </View>
          <View style={styles(theme).halfInput}>
            <PrimaryText required={true}>SURNAME</PrimaryText>
            <TextInput
              style={styles(theme).textinputheader}
              placeholder="Doe"
              placeholderTextColor={theme.placeholder}
              value={surname}
              onChangeText={handleSurnameChange}
              autoCapitalize="words"
            />
            {!!surnameError && (
              <Text style={styles(theme).inlineErrorText}>{surnameError}</Text>
            )}
          </View>
        </View>

        {/*Email Field */}
        <View style={styles(theme).inputcontainer}>
          <PrimaryText required={true}>EMAIL</PrimaryText>
          <Input
            text="john.doe@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/*Phone Field */}
        <View style={styles(theme).inputcontainer}>
          <PrimaryText required={true}>PHONE</PrimaryText>
          <Input
            text="+27 (81) 555-4444"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/*Date of Birth Field */}
        <View style={styles(theme).inputcontainer}>
          <PrimaryText required={true}>DATE OF BIRTH</PrimaryText>
          <DatePicker
            placeholder="mm/dd/yyyy"
            value={dob}
            onDateChange={setDob}
          />
        </View>

        {/*Password Field */}
        <View style={styles(theme).inputcontainer}>
          <PrimaryText required={true}>PASSWORD</PrimaryText>
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles(theme).passwordHelperText}>
            Use at least 8 characters with at least one letter and one number.
          </Text>
          {!!password && (
            <View style={styles(theme).passwordFeedbackContainer}>
              <Text
                style={[
                  styles(theme).passwordStrengthText,
                  { color: passwordStrength.color },
                ]}
              >
                Strength: {passwordStrength.label}
              </Text>
              <Text
                style={[
                  styles(theme).passwordRuleText,
                  passwordChecks.hasMinLength
                    ? styles(theme).passwordRuleMet
                    : styles(theme).passwordRuleUnmet,
                ]}
              >
                • At least 8 characters
              </Text>
              <Text
                style={[
                  styles(theme).passwordRuleText,
                  passwordChecks.hasLetter
                    ? styles(theme).passwordRuleMet
                    : styles(theme).passwordRuleUnmet,
                ]}
              >
                • Contains a letter
              </Text>
              <Text
                style={[
                  styles(theme).passwordRuleText,
                  passwordChecks.hasNumber
                    ? styles(theme).passwordRuleMet
                    : styles(theme).passwordRuleUnmet,
                ]}
              >
                • Contains a number
              </Text>
            </View>
          )}
        </View>

        {/*Confirm Password Field */}
        <View style={styles(theme).inputcontainer}>
          <PrimaryText required={true}>CONFIRM PASSWORD</PrimaryText>
          <PasswordInput
            placeholder="••••••••"
            value={confirmpassword}
            onChangeText={setconfirmPassword}
          />
        </View>

        {/*Terms and Privacy Consent */}
        <View style={styles(theme).consentContainer}>
          <Pressable
            style={styles(theme).checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[styles(theme).checkbox, agreedToTerms && styles(theme).checkboxChecked]}
            >
              {agreedToTerms && <Text style={styles(theme).checkmark}>✓</Text>}
            </View>
            <View style={styles(theme).consentTextContainer}>
              <Text style={styles(theme).consentText}>
                I agree to the collection and processing of my personal data as
                described in the{" "}
                <Text
                  style={styles(theme).consentLink}
                  onPress={() => router.navigate("/PrivacyPolicy")}
                >
                  Privacy Policy
                </Text>{" "}
                and{" "}
                <Text
                  style={styles(theme).consentLink}
                  onPress={() => router.navigate("/TermsOfService")}
                >
                  Terms of Service
                </Text>
                .
              </Text>
            </View>
          </Pressable>
          <Text style={styles(theme).dataCollectionNotice}>
            We collect: Name, Email, Phone, DOB, Visit History, and Loyalty
            Points to provide our services.
          </Text>
        </View>

        {/*Create Account Button */}
        <View style={styles(theme).buttonContainer}>
          <PrimaryButton
            text={loading ? "Creating Account..." : "CREATE ACCOUNT →"}
            onPressHandler={SignUpHandler}
          />
        </View>

        {/*Login Link */}
        <View style={styles(theme).signupcontainer}>
          <PrimaryText>Already a Member?</PrimaryText>
          <PrimaryLink colour="#00FF5F" url="/Login">
            Login
          </PrimaryLink>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles(theme).Container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles(theme).keyboardView}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={[{ key: "form" }]}
          renderItem={renderContent}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[
            styles(theme).scrollContent,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUp;

const styles = (theme: Theme) => StyleSheet.create({
  Container: {
    backgroundColor: theme.PrimaryBackground,
    flex: 1,
  },
  keyboardView: {
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
    color: theme.TextColour,
    backgroundColor: theme.PrimaryBackground,
    borderColor: theme.bordercolor,
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
    backgroundColor: theme.PrimaryBackground,
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
  consentContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.TextColour,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.Primary900,
    borderColor: theme.Primary900,
  },
  checkmark: {
    color: theme.TextColour,
    fontSize: 18,
    fontWeight: "bold",
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    color: theme.TextColour,
    fontSize: 13,
    lineHeight: 20,
  },
  consentLink: {
    color: theme.Primary900,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  dataCollectionNotice: {
    color: theme.TextColour,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
    marginTop: 8,
    paddingLeft: 36,
  },
  legendText: {
    color: theme.TextColour,
    fontSize: 12,
    marginBottom: 15,
    marginTop: 5,
  },
  asterisk: {
    color: "#FF4444",
    fontWeight: "bold",
    fontSize: 14,
  },
  passwordHelperText: {
    color: theme.TextColour,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    opacity: 0.85,
  },
  passwordFeedbackContainer: {
    marginTop: 8,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  passwordRuleText: {
    fontSize: 11,
    lineHeight: 16,
  },
  passwordRuleMet: {
    color: "#00FF5F",
  },
  passwordRuleUnmet: {
    color: "#FF8A8A",
  },
  inlineErrorText: {
    color: "#FF8A8A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
