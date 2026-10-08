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
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.openURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
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
