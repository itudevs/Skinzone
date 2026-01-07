import { Stack } from "expo-router";
import { StatusBar, StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.main}>
      <StatusBar barStyle={"dark-content"} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" options={{ headerShown: false }} />
        <Stack.Screen
          name="Login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="ResetPassword" options={{ headerShown: false }} />
        <Stack.Screen
          name="CustomerProfile"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="ChangePassword" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { color: "#000000ff", flex: 1 },
});
