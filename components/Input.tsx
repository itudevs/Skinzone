import { View, TextInput, StyleSheet } from "react-native";
import { User } from "lucide-react-native";
import { Theme, useTheme } from "./utils/Colours";

interface Inputprops {
  text: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  showUserIcon?: boolean;
}
const Input = ({
  text,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  showUserIcon = false,
}: Inputprops) => {
  const theme = useTheme();
  return (
    <View style={styles(theme).container}>
      {showUserIcon && (
        <View style={styles(theme).iconContainer}>
          <User color={theme.icon} size={18} />
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles(theme).input}
        placeholder={text}
        placeholderTextColor={theme.placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

export default Input;

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.PrimaryBackground,
    borderColor: theme.bordercolor,
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: theme.TextColour,
  },
});
