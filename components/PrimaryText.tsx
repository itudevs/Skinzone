import { Text, StyleSheet } from "react-native";
import Colors from "./utils/Colours";

interface PrimaryTextprops {
  children: string;
  
}
const PrimaryText = ({ children }: PrimaryTextprops) => {
  return <Text style={styles.main}>{children}</Text>;
};

export default PrimaryText;

const styles = StyleSheet.create({
  main: {
    paddingTop: 5,
    color: Colors.TextColour,
  },
});
