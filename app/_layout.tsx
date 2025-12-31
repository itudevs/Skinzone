import { Stack } from "expo-router";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <View style={styles.main}>
      <Stack>
        <StatusBar barStyle={"dark-content"} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { color: "#000000ff", flex: 1 },
});
