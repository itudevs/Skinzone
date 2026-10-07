import { Text, StyleSheet, View } from "react-native";
import { ReactNode } from "react";
import { Theme, useTheme } from "./utils/Colours";

interface PrimaryTextprops {
  children?: ReactNode;
  required?: boolean;
}
const PrimaryText = ({ children, required = false }: PrimaryTextprops) => {
  const theme = useTheme();
  return (
    <View style={styles(theme).container}>
      <Text style={styles(theme).main}>{children}</Text>
      {required && <Text style={styles(theme).asterisk}>*</Text>}
    </View>
  );
};

export default PrimaryText;

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  main: {
    paddingTop: 5,
    color: theme.TextColour,
  },
  asterisk: {
    paddingTop: 5,
    color: "#FF4444",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 4,
  },
});
