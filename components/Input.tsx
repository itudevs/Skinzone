import { View, TextInput, StyleSheet } from "react-native";
import { User } from "lucide-react-native";
import Colors from "./utils/Colours";

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
  return (
    <View style={styles.container}>
      {showUserIcon && (
        <View style={styles.iconContainer}>
          <User color={"#999999"} size={18} />
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={text}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PrimaryBackground,
    borderColor: "#8b8b8bff",
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
    color: Colors.TextColour,
  },
});
