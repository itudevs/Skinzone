import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Calendar, Check, ChevronDown } from "lucide-react-native";
import BookingCalendar from "@/components/BookingCalendar";
import SearchBar from "@/components/SearchBar";
import Colors from "@/components/utils/Colours";
import { UserSession } from "@/components/utils/GetUsersession";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type ClientType = "first" | "returning";

type TreatmentOption = {
  name: string;
  duration: string;
  subtitle: string;
};

const treatmentOptions: TreatmentOption[] = [
  {
    name: "Modified Jessner",
    duration: "60 Mins",
    subtitle: "Intensive",
  },
  {
    name: "Microneedling & Peel",
    duration: "60 Mins",
    subtitle: "Intensive",
  },
  {
    name: "Facial Hydration",
    duration: "50 Mins",
    subtitle: "Radiance",
  },
  {
    name: "Back (Acne/Pimples)",
    duration: "55 Mins",
    subtitle: "Clarifying",
  },
];

const slotOptions = [
  "09:00 AM",
  "10:00 AM",
  "11:00 PM",
  "12:00 PM",
  "13:00 PM",
  "14:00 PM",
  "15:00 PM",
  "16:00 PM",
];
enum BookingStatus{Completed,Pending,Booked}


const loggedInUser=UserSession.getSession();
const Booking = () => {
  const [clientType, setClientType] = useState<ClientType>("returning");
  const [selectedTreatment, setSelectedTreatment] = useState(
    "Back (Acne/Pimples)",
  );
  const [selectedSlot, setSelectedSlot] = useState("11:00 AM");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "completed"
  >("all");

  const selectedDetail = useMemo(
    () =>
      treatmentOptions.find(
        (treatment) => treatment.name === selectedTreatment,
      ) ?? treatmentOptions[3],
    [selectedTreatment],
  );

  const selectedDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(selectedDate),
    [selectedDate],
  );

  const toggleButtonStyle = (type: ClientType): ViewStyle => ({
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      clientType === type ? "rgba(255,255,255,0.08)" : "transparent",
  });

  const currentBookings = [
    {
      status: "Confirmed",
      title: "Modified Jessner Clinical Peel",
      date: "Mar 26, 2026 • 10:30 AM",
      room: "Room 02",
      specialist: "Admin S",
      isPending: false,
    },
    {
      status: "Pending Payment",
      title: "Microneedling & Peel",
      date: "Apr 02, 2026 • 02:15 PM",
      room: "Room 01",
      specialist: "Admin S",
      fee: "R300.00",
      isPending: true,
    },
  ];

  const pastBookings = [
    {
      status: "Completed",
      title: "Back (Acne/Pimples)",
      date: "Mar 19, 2026 • 11:00 AM",
      specialist: "Admin S",
      reward: "+100 PTS",
      rewardLabel: "Earned",
    },
    {
      status: "Completed",
      title: "Facial Hydration & Glow",
      date: "Feb 28, 2026 • 01:30 PM",
      specialist: "Admin S",
      reward: "+70 PTS",
      rewardLabel: "Earned",
    },
  ];

  const matchesSearch = (value: string) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return value.toLowerCase().includes(query);
  };

  const filteredCurrentBookings = currentBookings.filter(
    (booking) =>
      (activeFilter === "all" || activeFilter === "active") &&
      [booking.title, booking.date, booking.specialist, booking.status].some(
        (value) => matchesSearch(value),
      ),
  );

  const filteredPastBookings = pastBookings.filter(
    (booking) =>
      (activeFilter === "all" || activeFilter === "completed") &&
      [booking.title, booking.date, booking.specialist, booking.status].some(
        (value) => matchesSearch(value),
      ),
  );
  const bookClient = async () => {
    setClientType("first");
    try{
    const {data,error}=await supabase.from('bookings').insert(
      customerid:loggedInUser?.user.id,
      bookingdate:selectedDate,
      status:BookingStatus.Pending.toString()
    )
    }catch(bookingError){
      console.log(bookingError)
    }
  };
  const renderReturningClientScreen = () => (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setClientType("first")}
            style={toggleButtonStyle("first")}
          >
            <Text
              style={[
                styles.toggleText,
                clientType === "first" && styles.toggleTextActive,
              ]}
            >
              Book Visit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setClientType("returning")}
            style={toggleButtonStyle("returning")}
          >
            <Text
              style={[
                styles.toggleText,
                clientType === "returning" && styles.toggleTextActive,
              ]}
            >
              Manage Bookings
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <SearchBar
        Placeholder="Search by treatment"
        size="fullWidthCompact"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter("all")}
          style={[
            styles.filterChip,
            activeFilter === "all" && styles.filterChipActive,
          ]}
        >
          <Text
            style={
              activeFilter === "all"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
          >
            All ({currentBookings.length + pastBookings.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter("active")}
          style={[
            styles.filterChip,
            activeFilter === "active" && styles.filterChipActive,
          ]}
        >
          <Text
            style={
              activeFilter === "active"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
          >
            Active ({currentBookings.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter("completed")}
          style={[
            styles.filterChip,
            activeFilter === "completed" && styles.filterChipActive,
          ]}
        >
          <Text
            style={
              activeFilter === "completed"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
          >
            Completed ({pastBookings.length})
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeading}>
        Current Bookings{" "}
        <Text style={styles.countBadge}>{filteredCurrentBookings.length}</Text>
      </Text>

      {filteredCurrentBookings.length === 0 ? (
        <Text style={styles.emptyStateText}>No matching current bookings.</Text>
      ) : (
        filteredCurrentBookings.map((booking) => (
          <View key={booking.title} style={styles.bookingCard}>
            <View style={styles.bookingHeaderRow}>
              <View style={styles.bookingStatusWrap}>
                <View
                  style={[
                    styles.statusDot,
                    booking.isPending
                      ? styles.statusDotWarning
                      : styles.statusDotSuccess,
                  ]}
                />
                <Text
                  style={[
                    styles.bookingStatusText,
                    booking.isPending && styles.bookingStatusTextWarning,
                  ]}
                >
                  {booking.status}
                </Text>
              </View>
              <Text style={styles.specialistText}>{booking.specialist}</Text>
            </View>

            <Text style={styles.bookingTitle}>{booking.title}</Text>

            <View style={styles.bookingMetaRow}>
              <Text style={styles.metaText}>{booking.date}</Text>
              <Text style={styles.metaText}>{booking.room}</Text>
            </View>

            {booking.isPending ? (
              <View style={styles.pendingFooter}>
                <Pressable style={styles.primaryActionWide}>
                  <Text style={styles.primaryActionWideText}>
                    Pay Booking Fee ({booking.fee})
                  </Text>
                </Pressable>
                <Pressable style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>
                    Manage / Reschedule
                  </Text>
                </Pressable>
                <Pressable style={styles.iconButton}>
                  <Calendar color={Colors.TextColour} size={18} />
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.sectionHeading}>
        Past Bookings{" "}
        <Text style={styles.countBadge}>{filteredPastBookings.length}</Text>
      </Text>

      {filteredPastBookings.length === 0 ? (
        <Text style={styles.emptyStateText}>No matching past bookings.</Text>
      ) : (
        filteredPastBookings.map((booking) => (
          <View key={booking.title} style={styles.bookingCardPast}>
            <View style={styles.bookingHeaderRow}>
              <Text style={styles.bookingStatusTextPast}>{booking.status}</Text>
              <Text style={styles.rewardText}>{booking.reward}</Text>
            </View>

            <View style={styles.rewardRow}>
              <Text style={styles.bookingTitle}>{booking.title}</Text>
              <Text style={styles.rewardLabel}>{booking.rewardLabel}</Text>
            </View>

            <View style={styles.bookingMetaRow}>
              <Text style={styles.metaText}>{booking.date}</Text>
              <Text style={styles.metaText}>{booking.specialist}</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Book Again</Text>
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Summary</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Pressable style={styles.newBookingButton}>
        <Text style={styles.newBookingText}>+ Book New Appointment</Text>
      </Pressable>
    </ScrollView>
  );

  const renderFirstTimeClientScreen = () => (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView>
        <View style={styles.toggleRow}>
          <Pressable onPress={bookClient} style={toggleButtonStyle("first")}>
            <Text
              style={[
                styles.toggleText,
                clientType === "first" && styles.toggleTextActive,
              ]}
            >
              Book Visit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setClientType("returning")}
            style={toggleButtonStyle("returning")}
          >
            <Text
              style={[
                styles.toggleText,
                clientType === "returning" && styles.toggleTextActive,
              ]}
            >
              Manage Bookings
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.consultationCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.checkCircle}>
            <Check color={Colors.Primary900} size={14} />
          </View>
          <Text style={styles.cardHeaderText}>CLINICAL DERMAL INTAKE</Text>
          <View style={styles.cardAction}>
            <Calendar color={Colors.Primary900} size={20} />
          </View>
        </View>

        <Text style={styles.feeTitle}>Mandatory Consultation Fee: R300</Text>
        <Text style={styles.feeDescription}>
          Includes full skin diagnostic scan, aesthetic regimen blueprint, and
          30-min clinical evaluation. Fully applied to treatments booked within
          14 days.
        </Text>

        <View style={styles.divider} />

        <Pressable style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Text style={styles.infoIcon}>i</Text>
          </View>
          <Text style={styles.infoText}>
            Why different fees? Consultation vs. Booking Fee
          </Text>
          <ChevronDown color={Colors.TextColour} size={20} />
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>Select Treatment</Text>
      <View style={styles.treatmentGrid}>
        {treatmentOptions.map((item) => {
          const isSelected = item.name === selectedTreatment;
          return (
            <Pressable
              key={item.name}
              onPress={() => setSelectedTreatment(item.name)}
              style={[
                styles.treatmentCard,
                isSelected && styles.treatmentCardSelected,
              ]}
            >
              <Text style={styles.treatmentName}>{item.name}</Text>
              <Text style={styles.treatmentMeta}>
                {item.duration} • {item.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <BookingCalendar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <View style={styles.slotHeaderRow}>
        <Text style={styles.sectionTitle}>Available Slots</Text>
        <Text style={styles.dateLabel}>{selectedDayLabel}</Text>
      </View>
      <View style={styles.slotRow}>
        {slotOptions.map((slot) => {
          const active = selectedSlot === slot;
          return (
            <Pressable
              key={slot}
              onPress={() => setSelectedSlot(slot)}
              style={[styles.slotCard, active && styles.slotCardSelected]}
            >
              <Text
                style={[styles.slotText, active && styles.slotTextSelected]}
              >
                {slot}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Selected Protocol</Text>
          <Text style={styles.summaryValue}>{selectedDetail.name}</Text>
        </View>

        <View style={styles.summaryRowSecondary}>
          <Text style={styles.summaryLabelMuted}>Slot & Specialist</Text>
          <Text style={styles.summaryValueStrong}>
            {selectedDayLabel} • {selectedSlot}
          </Text>
        </View>

        <View style={styles.summaryRowSecondary}>
          <Text style={styles.summaryLabelMuted}>Loyalty Earnings</Text>
          <Text style={styles.pointsEarned}>+80 PTS</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Due Today</Text>
          <Text style={styles.totalValue}>R300.00</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Consultation Deposit</Text>
          <Text style={styles.totalValue}>R300.00</Text>
        </View>
      </View>
      <Pressable onPress={bookClient} style={styles.ctaButton}>
        <Text style={styles.ctaText}>Continue to Confirmation</Text>
        <Text style={styles.ctaArrow}>→</Text>
      </Pressable>
    </ScrollView>
  );

  return clientType === "returning"
    ? renderReturningClientScreen()
    : renderFirstTimeClientScreen();
};

export default Booking;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111315",
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.TextColour,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  pointsText: {
    color: Colors.Primary900,
    fontSize: 16,
    fontWeight: "700",
  },
  pointsTextSmall: {
    color: Colors.Primary900,
    fontSize: 9,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  toggleText: {
    color: Colors.TextColour,
    fontWeight: "600",
    fontSize: 14,
  },
  toggleTextActive: {
    color: Colors.Primary900,
  },
  consultationCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,255,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardHeaderText: {
    flex: 1,
    color: Colors.TextColour,
    fontWeight: "700",
    letterSpacing: 0.6,
    fontSize: 14,
  },
  cardAction: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,95,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  feeTitle: {
    color: "#F2F2F2",
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  feeDescription: {
    color: Colors.TextColour,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.Primary900,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    color: Colors.Primary900,
    fontWeight: "700",
    fontSize: 14,
  },
  infoText: {
    flex: 1,
    color: Colors.TextColour,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#F3F3F3",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  treatmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  treatmentCard: {
    width: "48%",
    minHeight: 98,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  treatmentCardSelected: {
    backgroundColor: "rgba(0,255,95,0.14)",
    borderColor: "rgba(0,255,95,0.7)",
  },
  treatmentName: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  treatmentMeta: {
    color: Colors.TextColour,
    fontSize: 12,
  },
  slotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateLabel: {
    color: "#F2F2F2",
    fontSize: 13,
    fontWeight: "600",
  },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 8,
  },
  slotCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  slotCardSelected: {
    backgroundColor: "rgba(0,255,95,0.22)",
  },
  slotText: {
    color: Colors.TextColour,
    fontSize: 14,
    fontWeight: "700",
  },
  slotTextSelected: {
    color: "#1b1b1b",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryRowSecondary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    color: Colors.TextColour,
    fontSize: 14,
    fontWeight: "600",
  },
  summaryLabelMuted: {
    color: Colors.TextColour,
    fontSize: 12,
  },
  summaryValue: {
    color: "#F2F2F2",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryValueStrong: {
    color: "#F2F2F2",
    fontSize: 14,
    fontWeight: "700",
  },
  pointsEarned: {
    color: Colors.Primary900,
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    color: "#F2F2F2",
    fontSize: 24,
    fontWeight: "800",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.Primary900,
    borderRadius: 18,
    paddingVertical: 22,
    marginTop: 8,
  },
  ctaText: {
    color: "#0B0F0D",
    fontWeight: "800",
    fontSize: 18,
  },
  ctaArrow: {
    color: "#0B0F0D",
    fontSize: 24,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 18,
  },
  searchText: {
    flex: 1,
    color: Colors.TextColour,
    fontSize: 14,
    opacity: 0.8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  filterChipActive: {
    backgroundColor: Colors.Primary900,
  },
  filterChipText: {
    color: Colors.TextColour,
    fontWeight: "700",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#0B0F0D",
    fontWeight: "800",
    fontSize: 13,
  },
  emptyStateText: {
    color: Colors.TextColour,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 14,
    opacity: 0.8,
  },
  sectionHeading: {
    color: "#F3F3F3",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  countBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: Colors.Primary900,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "700",
  },
  bookingCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  bookingCardPast: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  bookingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bookingStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotSuccess: {
    backgroundColor: Colors.Primary900,
  },
  statusDotWarning: {
    backgroundColor: "#F1C75B",
  },
  bookingStatusText: {
    color: Colors.Primary900,
    fontWeight: "700",
    fontSize: 12,
  },
  bookingStatusTextPast: {
    color: Colors.TextColour,
    fontWeight: "700",
    fontSize: 12,
  },
  bookingStatusTextWarning: {
    color: "#F1C75B",
  },
  specialistText: {
    color: "#F4F4F4",
    fontWeight: "600",
    fontSize: 12,
  },
  bookingTitle: {
    color: "#F3F3F3",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  bookingMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metaText: {
    color: Colors.TextColour,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 52,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: Colors.TextColour,
    fontWeight: "700",
    fontSize: 13,
  },
  pendingFooter: {
    gap: 10,
  },
  primaryActionWide: {
    backgroundColor: Colors.Primary900,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionWideText: {
    color: "#0B0F0D",
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryAction: {
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
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rewardText: {
    color: Colors.Primary900,
    fontWeight: "700",
    fontSize: 12,
  },
  rewardLabel: {
    color: Colors.TextColour,
    fontSize: 11,
    fontWeight: "600",
  },
  newBookingButton: {
    backgroundColor: Colors.Primary900,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  newBookingText: {
    color: "#0B0F0D",
    fontWeight: "900",
    fontSize: 16,
  },
});
