import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user?.id) {
        router.replace("/Login");
        return;
      }

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
