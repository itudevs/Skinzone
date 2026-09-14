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
import { useState, useEffect, useCallback, useMemo } from "react";
import { UserSession } from "@/components/utils/GetUsersession";
import { Session } from "@supabase/supabase-js";
import Visitation from "@/components/Visitation";
import SearchBar from "@/components/SearchBar";

type DateFilter = "all" | "30days" | "90days" | "year";

const HistoryPage = () => {
  const [visitations, setvisitations] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(
    UserSession.getSession(),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const filteredVisitations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const today = new Date();
    const startDate = new Date(today);

    if (dateFilter === "30days") {
      startDate.setDate(today.getDate() - 30);
    } else if (dateFilter === "90days") {
      startDate.setDate(today.getDate() - 90);
    } else if (dateFilter === "year") {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return visitations.filter((visit) => {
      const visitDate = new Date(visit.visit_date);
      const matchesDate =
        dateFilter === "all" || (visitDate >= startDate && visitDate <= today);
      const service = visit.customervisitlines?.[0]?.treatments?.Services || {};
      const matchesSearch = [
        service.servicename,
        service.servicecategory,
        visit.notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      return matchesDate && (!query || matchesSearch);
    });
  }, [dateFilter, searchQuery, visitations]);

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
          <SearchBar
            Placeholder="Search treatments or products"
            size="compact"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterRow}>
            {(
              [
                ["all", "All"],
                ["30days", "30 days"],
                ["90days", "90 days"],
                ["year", "This year"],
              ] as [DateFilter, string][]
            ).map(([value, label]) => (
              <Text
                key={value}
                onPress={() => setDateFilter(value)}
                style={[
                  styles.filterChip,
                  dateFilter === value && styles.filterChipActive,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
          <View style={{ paddingHorizontal: 15 }}>
            <Visitation
              id={session?.user.id || ""}
              limit={100}
              visitsData={filteredVisitations}
            />
          </View>
          {filteredVisitations.length === 0 && (
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
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    color: Colors.TextColour,
    backgroundColor: Colors.background100,
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  filterChipActive: {
    color: Colors.PrimaryBackground,
    backgroundColor: Colors.Primary900,
  },
});
