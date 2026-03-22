import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      // Check persistence preference first
      let keepSignedIn;
      try {
        keepSignedIn = await AsyncStorage.getItem("keep_signed_in");
        console.log("Index - Keep signed in preference:", keepSignedIn);

        if (keepSignedIn !== "true") {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Error checking Keep Signed In pref:", e);
      }

      // Re-read session to ensure we have the correct state after potential signOut
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      console.log("Index - Session found:", !!session?.user?.id);

      if (!session?.user?.id) {
        router.replace("/Login");
        return;
      }

      // NOTE: We already read session above, no need to read again unless asynchronous changes
      // happened, but since signOut is awaited, we are good.
      // However, we need to check the variable `session` we just got.

      const { data: userData } = await supabase
        .from("User")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!active) return;

      if (userData?.role === "staff") {
        router.replace("/(Admintab)/StaffDashBoard");
      } else {
        router.replace("/(tabs)/Home");
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [router]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
