import { useCallback } from "react";
import { Text, Linking, Alert, Pressable, StyleSheet } from "react-native";
import { Href, useRouter } from "expo-router";

interface PrimaryLinkProps {
  url: Href;
  children: string;
  colour: string;
}
const PrimaryLink = ({ url, children, colour }: PrimaryLinkProps) => {
  const router = useRouter();
  const handlePress = () => {
    router.navigate(url);
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => pressed && styles.presseditem}
    >
      <Text style={{ color: colour, paddingTop: 5, paddingLeft: 2 }}>
        {children}
      </Text>
    </Pressable>
  );
};

export default PrimaryLink;

const styles = StyleSheet.create({
  presseditem: {
    opacity: 0.5,
  },
});
