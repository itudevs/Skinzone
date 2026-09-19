import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TextInput,
} from "react-native";
import { CheckCircle2, Search } from "lucide-react-native";
import Colors from "@/components/utils/Colours";
import { supabase } from "@/lib/supabase";
import { GetTreatments } from "@/components/utils/GetServices";
import type { DropDownItems } from "@/components/utils/utilinterfaces";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingStatus } from "@/components/utils/utilinterfaces";
interface AdminBookingItem {
  id: number;
  customerName: string;
  treatmentName: string;
  status: string;
  bookingDate: Date;
  time: string;
  notes?: string;
  room?: string;
  specialist?: string;
  bookingState: "active" | "completed";
}

const parseBookingDate = (value: unknown): Date => {
  if (!value) return new Date();

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const AdminBooking = () => {
  const [searchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [treatments, setTreatments] = useState<DropDownItems[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(
    null,
  );
  const [, setSelectedTreatmentName] = useState("");
  const [treatmentSearch, setTreatmentSearch] = useState("");

  const normalizeBookingState = (status: string): "active" | "completed" => {
    const normalized = status.trim().toLowerCase();
    return normalized.includes("complete") ? "completed" : "active";
  };

  const filteredTreatments = useMemo(() => {
    const query = treatmentSearch.trim().toLowerCase();
    if (!query) return treatments;

    return treatments.filter((treatment) =>
      treatment.value.toLowerCase().includes(query),
    );
  }, [treatments, treatmentSearch]);

  useEffect(() => {
    let mounted = true;

    GetTreatments().then((items) => {
      if (mounted) {
        setTreatments(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("bookingid,bookingdate,status,notes,time,customerid")
          .order("bookingdate", { ascending: true });

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        if (!data) {
          setBookings([]);
          return;
        }

        const mappedBookings: AdminBookingItem[] = await Promise.all(
          data.map(async (booking: any) => {
            const customerId = booking.customerid;
            let customerName = "Customer";

            if (customerId) {
              const { data: customerData } = await supabase
                .from("User")
                .select("name,surname")
                .eq("id", customerId)
                .maybeSingle();

              customerName =
                [customerData?.name, customerData?.surname]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Customer";
            }

            const status = String(booking.status ?? "Pending").trim();
            const treatmentName =
              String(booking.notes ?? "Treatment Booking").trim() ||
              "Treatment Booking";

            return {
              id: booking.bookingid,
              customerName,
              treatmentName,
              status,
              bookingDate: parseBookingDate(booking.bookingdate),
              time: booking.time,
              notes: booking.notes ?? "",
              room: "Room 01",
              specialist: "Admin S",
              bookingState: normalizeBookingState(status),
            };
          }),
        );

        setBookings(mappedBookings);
      } catch (bookingError) {
        console.log("fetchBookings error", bookingError);
      }
    };

    fetchBookings();
  }, []);
  const getBookingStatus = (status: string | number): BookingStatus => {
    const normalizedStatus = String(status).trim().toLowerCase();

    if (normalizedStatus === "0" || normalizedStatus.includes("complete")) {
      return BookingStatus.Completed;
    }

    if (normalizedStatus === "1" || normalizedStatus.includes("pending")) {
      return BookingStatus.Pending;
    }

    return BookingStatus.Booked;
  };
  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesState =
        activeFilter === "all" || booking.bookingState === activeFilter;

      const haystack = [
        booking.customerName,
        booking.treatmentName,
        booking.status,
        booking.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      return matchesState && matchesSearch;
    });
  }, [activeFilter, bookings, searchQuery]);

  const activeCount = bookings.filter(
    (b) => b.bookingState === "active",
  ).length;
  const completedCount = bookings.filter(
    (b) => b.bookingState === "completed",
  ).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statHint}>Visits logged</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.greenText]}>
              {activeCount}
            </Text>
            <Text style={styles.statHint}>Needs action</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>
              {bookings.filter((b) => b.bookingState === "active").length}
            </Text>
            <Text style={styles.statHint}>Scheduled</Text>
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.searchWrap}>
        <Search color={Colors.TextColour} size={18} />
        <Text style={styles.searchInput}>
          Search by client, treatment, phone...
        </Text>
      </View>

      <View style={styles.filterBar}>
        <Pressable
          onPress={() => setActiveFilter("all")}
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "all" && styles.filterTextActive,
            ]}
          >
            All {bookings.length}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter("active")}
          style={[
            styles.filterButton,
            activeFilter === "active" && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "active" && styles.filterTextActive,
            ]}
          >
            Pending {activeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter("completed")}
          style={[
            styles.filterButton,
            activeFilter === "completed" && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "completed" && styles.filterTextActive,
            ]}
          >
            Confirmed {completedCount}
          </Text>
        </Pressable>
      </View>

      <View style={styles.treatmentSection}>
        <Text style={styles.sectionLabel}>Select treatment</Text>
        <TextInput
          value={treatmentSearch}
          onChangeText={setTreatmentSearch}
          placeholder="Search treatments"
          placeholderTextColor={Colors.TextColour}
          style={styles.searchInputField}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.treatmentScroller}
        >
          {filteredTreatments.map((treatment) => {
            const isSelected = selectedTreatmentId === treatment.id;
            return (
              <Pressable
                key={treatment.id}
                onPress={() => {
                  setSelectedTreatmentId(treatment.id);
                  setSelectedTreatmentName(treatment.value);
                }}
                style={[
                  styles.treatmentCard,
                  isSelected && styles.treatmentCardSelected,
                ]}
              >
                <Text style={styles.treatmentName}>{treatment.value}</Text>
                <Text style={styles.treatmentMeta}>
                  {treatment.cost
                    ? `R${Number(treatment.cost).toFixed(2)}`
                    : "Price on request"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {filteredBookings.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>No matching bookings.</Text>
        </View>
      ) : (
        filteredBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.dateBox}>
                <Text style={styles.monthText}>
                  {new Intl.DateTimeFormat("en-ZA", {
                    month: "short",
                  }).format(booking.bookingDate)}
                </Text>
                <Text style={styles.dayText}>
                  {new Intl.DateTimeFormat("en-US", {
                    day: "2-digit",
                  }).format(booking.bookingDate)}
                </Text>
              </View>

              <View style={styles.customerBlock}>
                <Text style={styles.customerName}>{booking.customerName}</Text>
                <Text style={styles.bookingMeta}> {booking.time}</Text>
              </View>

              <View style={styles.statusTagWrap}>
                <View
                  style={[
                    styles.statusDot,
                    booking.status.toLowerCase().includes("pending")
                      ? styles.statusDotWarning
                      : styles.statusDotSuccess,
                  ]}
                />
                <Text style={styles.statusText}>
                  {getBookingStatus(booking.status)}
                </Text>
              </View>
            </View>

            <View style={styles.treatmentRow}>
              <Text style={styles.labelText}>Treatment requested</Text>
            </View>

            <Text style={styles.bookingTitle}>{booking.treatmentName}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{booking.time}</Text>
              <Text style={styles.metaText}>
                Specialist: {booking.specialist}
              </Text>
            </View>

            {booking.notes ? (
              <View style={styles.noteRow}>
                <Text style={styles.noteText}>{booking.notes}</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable style={styles.primaryAction}>
                <CheckCircle2 size={16} color="#07130d" />
                <Text style={styles.primaryActionText}>
                  {booking.status.toLowerCase().includes("pending")
                    ? "Confirm Booking"
                    : "View Record"}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Reschedule</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default AdminBooking;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.Primary900,
    fontSize: 26,
    fontWeight: "800",
  },
  headerPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerPillText: {
    color: Colors.TextColour,
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statLabel: {
    color: Colors.TextColour,
    fontSize: 12,
    opacity: 0.8,
  },
  statValue: {
    color: "#f4f4f4",
    fontWeight: "800",
    fontSize: 30,
    marginTop: 10,
  },
  statHint: {
    color: Colors.TextColour,
    fontSize: 11,
    opacity: 0.8,
  },
  greenText: {
    color: Colors.Primary900,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 18,
  },
  searchInput: {
    color: Colors.TextColour,
    fontSize: 14,
  },
  filterBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "rgba(0,255,95,0.16)",
    borderWidth: 1,
    borderColor: Colors.Primary900,
  },
  filterText: {
    color: Colors.TextColour,
    fontWeight: "700",
    fontSize: 12,
  },
  filterTextActive: {
    color: Colors.Primary900,
  },
  treatmentSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: Colors.TextColour,
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  searchInputField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#f1f1f1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  treatmentScroller: {
    paddingRight: 8,
    gap: 12,
  },
  treatmentCard: {
    width: 170,
    minHeight: 96,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 10,
    justifyContent: "center",
  },
  treatmentCardSelected: {
    backgroundColor: "rgba(0,255,95,0.12)",
    borderColor: Colors.Primary900,
  },
  treatmentName: {
    color: "#f2f2f2",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  treatmentMeta: {
    color: Colors.TextColour,
    fontSize: 11,
  },
  bookingCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dateBox: {
    width: 62,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  monthText: {
    color: Colors.TextColour,
    fontSize: 10,
    textTransform: "uppercase",
  },
  dayText: {
    color: "#f4f4f4",
    fontSize: 22,
    fontWeight: "800",
  },
  customerBlock: {
    flex: 1,
  },
  customerName: {
    color: "#f4f4f4",
    fontSize: 18,
    fontWeight: "700",
  },
  bookingMeta: {
    color: Colors.TextColour,
    fontSize: 12,
    marginTop: 4,
  },
  statusTagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSuccess: {
    backgroundColor: Colors.Primary900,
  },
  statusDotWarning: {
    backgroundColor: "#F1C75B",
  },
  statusText: {
    color: "#f4f4f4",
    fontSize: 10,
    fontWeight: "700",
  },
  treatmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    color: Colors.TextColour,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pointsBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: Colors.Primary900,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  bookingTitle: {
    color: "#f7f7f7",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  metaText: {
    color: Colors.TextColour,
    fontSize: 12,
  },
  noteRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  noteText: {
    color: Colors.TextColour,
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.Primary900,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryActionText: {
    color: "#08130d",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: Colors.TextColour,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyStateCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 18,
  },
  emptyStateText: {
    color: Colors.TextColour,
    fontSize: 14,
  },
});
