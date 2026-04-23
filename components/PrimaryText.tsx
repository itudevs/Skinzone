import { Text, StyleSheet, View } from "react-native";
import { ReactNode } from "react";
import Colors from "./utils/Colours";

interface PrimaryTextprops {
  children?: ReactNode;
  required?: boolean;
}
const PrimaryText = ({ children, required = false }: PrimaryTextprops) => {
  return (
    <View style={styles.container}>
      <Text style={styles.main}>{children}</Text>
      {required && <Text style={styles.asterisk}>*</Text>}
    </View>
  );
};

export default PrimaryText;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  main: {
    paddingTop: 5,
    color: Colors.TextColour,
  },
  asterisk: {
    paddingTop: 5,
    color: "#FF4444",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 4,
  },
});
