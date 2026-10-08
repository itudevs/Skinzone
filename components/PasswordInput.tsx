import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { Theme, useTheme } from "./utils/Colours";

interface PasswordInputProps {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

const PasswordInput = ({
  placeholder,
  value,
  onChangeText,
}: PasswordInputProps) => {
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).iconContainer}>
        <Lock color={theme.icon} size={18} />
      </View>
      <TextInput
        style={styles(theme).input}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoComplete="off"
      />
      <TouchableOpacity
        style={styles(theme).eyeContainer}
        onPress={togglePasswordVisibility}
      >
        {isPasswordVisible ? (
          <Eye color={"#cccccc"} size={20} />
        ) : (
          <EyeOff color={"#cccccc"} size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PasswordInput;

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.PrimaryBackground,
    borderColor: theme.bordercolor,
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: "center",
  },
  lockIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    padding: 15,
    color: theme.TextColour,
  },
  eyeContainer: {
    padding: 5,
    marginLeft: 10,
  },
  eyeIcon: {
    fontSize: 20,
  },
});
