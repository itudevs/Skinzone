import { TextInput, StyleSheet } from "react-native";
import Colors from "./utils/Colours";

interface Inputprops {
  text: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}
const Input = ({
  text,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
}: Inputprops) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.main}
      placeholder={text}
      placeholderTextColor="#666"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  );
};

export default Input;

const styles = StyleSheet.create({
  main: {
    marginTop: 8,
    padding: 15,
    color: Colors.TextColour,
    backgroundColor: Colors.PrimaryBackground,
    borderColor: "#8b8b8bff",
    borderWidth: 0.5,
    borderRadius: 10,
  },
});
