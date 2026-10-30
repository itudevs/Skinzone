import { useCallback } from "react";
import { Text, Linking, Alert, Pressable, StyleSheet } from "react-native";
import { Theme, useTheme } from "./utils/Colours";
interface LinkProps {
  url: string;
  children: string;
  colour: string;
}
const Link = ({ url, children, colour }: LinkProps) => {
  const theme = useTheme();
  const handlePress = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(`Failed to open: ${url}`);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open link:", error);
      Alert.alert(`Failed to open: ${url}`);
    }
  }, [url]);
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => pressed && styles(theme).presseditem}
    >
      <Text style={{ color: colour, textAlign: "right", padding: 5 }}>
        {children}
      </Text>
    </Pressable>
  );
};

export default Link;

const styles = (theme: Theme) => StyleSheet.create({
  presseditem: {
    opacity: 0.5,
  },
});
