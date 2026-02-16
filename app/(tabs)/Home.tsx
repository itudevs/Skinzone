import {
  Text,
  View,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import ProfileImage from "@/components/ProfileImage";
import { useCallback, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import Colors from "@/components/utils/Colours";
import { Bell, TrendingUp } from "lucide-react-native";
import Visitation from "@/components/Visitation";
import { UserSession } from "@/components/utils/GetUsersession";

const Home = () => {
  const [session, setSession] = useState<Session | null>(
    UserSession.getSession(),
  );
  const [username, setUsername] = useState("-");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(UserSession.getSession());
  }, []);

  const getUserData = useCallback(
    async (isActive: () => boolean) => {
      if (!session?.user.id) return;

      setLoading(true);
      try {
        const { data: userData, error: dbError } = await supabase
          .from("User")
          .select("name")
          .eq("id", session.user.id)
          .single();

        if (dbError || !userData) {
          console.error("Database error:", dbError);
          return;
        }

        if (isActive()) {
          setUsername(userData.name);
        }
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [session?.user.id],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserData(() => active);
      return () => {
        active = false;
      };
    }, [getUserData]),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ProfileImage
            imagehandler={() => console.log("Image Cannot Be Changed")}
          />
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <Text style={styles.usernameText}>
              {loading ? "Loading..." : username}
            </Text>
          </View>
        </View>
        <Pressable style={styles.notificationBtn}>
          <Text style={styles.notificationIcon}>
            <Bell color={"white"} />
          </Text>
        </Pressable>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceAmount}>2,450</Text>
        <Text style={styles.balanceLabel}>OVERALL BALANCE</Text>

        <View style={styles.balanceFooter}>
          <View>
            <Text style={styles.pointsAmount}>
              100 <Text style={styles.pointsUnit}>pts</Text>
            </Text>
            <Text style={styles.visitationLabel}>VISITATION</Text>
          </View>
          <Text style={styles.trendIcon}>
            <TrendingUp />
          </Text>
        </View>
      </View>

      {/* Visitations Section */}
      <View style={styles.visitationsHeader}>
        <Text style={styles.visitationsTitle}>Visitations</Text>
        <Pressable style={styles.recentBtn}>
          <Text style={styles.recentBtnText}>Recent</Text>
        </Pressable>
      </View>

      <Visitation id={session?.user.id} />
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 120,
    flex: 1,
  },
  welcomeContainer: {
    marginLeft: 5,
  },
  welcomeText: {
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
  },
  usernameText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationIcon: {
    fontSize: 20,
  },
  balanceCard: {
    backgroundColor: "#D4F5E9",
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 25,
  },
  balanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
  },
  pointsUnit: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#666666",
  },
  visitationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00CC88",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  trendIcon: {
    fontSize: 24,
  },
  visitationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  visitationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  recentBtn: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
