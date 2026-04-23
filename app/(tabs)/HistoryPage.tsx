import PrimaryText from "@/components/PrimaryText";
import Colors from "@/components/utils/Colours";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { History } from "lucide-react-native";
import { Getvisitations } from "@/components/utils/GetUserData";
import { useState, useEffect, useCallback } from "react";
import { UserSession } from "@/components/utils/GetUsersession";
import { Session } from "@supabase/supabase-js";
import Visitation from "@/components/Visitation";

const HistoryPage = () => {
  const [visitations, setvisitations] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(
    UserSession.getSession(),
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = UserSession.onSessionChange((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchvisitation = useCallback(async () => {
    if (!session?.user.id) {
      setvisitations([]);
      return;
    }
    const data = await Getvisitations(session.user.id, 100);
    setvisitations(data);
  }, [session?.user.id]);

  useEffect(() => {
    fetchvisitation();
  }, [fetchvisitation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchvisitation();
    setRefreshing(false);
  };

  return (
    <View style={styles.Container}>
      <View style={styles.header}>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 40 }}>
          History
        </Text>
        <PrimaryText>Track your loyalty visitations</PrimaryText>
      </View>
      <ScrollView
        style={styles.CardContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 15,
          }}
        >
          <Text style={{ color: Colors.Primary900, padding: 15 }}>Logs</Text>
          <History color={Colors.TextColour} size={20} />
        </View>
        <View style={styles.InnerCard}>
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 20,
              paddingHorizontal: 15,
              paddingTop: 20,
              paddingBottom: 10,
            }}
          >
            VISITS
          </Text>
          <Text
            style={{
              color: Colors.TextColour,
              paddingHorizontal: 20,
              paddingBottom: 10,
            }}
          >
            ---------------------------------------
          </Text>
          <View style={{ paddingHorizontal: 15 }}>
            <Visitation
              id={session?.user.id || ""}
              limit={100}
              visitsData={visitations}
            />
          </View>
          {visitations.length === 0 && (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text style={{ color: Colors.TextColour }}>No visits found</Text>
            </View>
          )}
          <View style={{ alignItems: "center", padding: 20 }}>
            <PrimaryText>Tap on row to view details</PrimaryText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HistoryPage;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  CardContainer: {
    flex: 1,
    backgroundColor: Colors.background100,
    borderColor: Colors.bordercolor,
    borderWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  InnerCard: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
    borderColor: Colors.bordercolor,
    borderWidth: 0.5,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    paddingBottom: 20,
  },
});
