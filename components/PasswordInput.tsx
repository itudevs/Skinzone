import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import Colors from "./utils/Colours";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock color={"#999999"} size={18} />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.eyeContainer}
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

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PrimaryBackground,
    borderColor: "#8b8b8bff",
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
    color: Colors.TextColour,
  },
  eyeContainer: {
    padding: 5,
    marginLeft: 10,
  },
  eyeIcon: {
    fontSize: 20,
  },
});
