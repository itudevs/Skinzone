import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { CheckCircle2, Search } from "lucide-react-native";
import { Theme, useTheme } from "@/components/utils/Colours";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingStatus } from "@/components/utils/utilinterfaces";
import type { Database } from "@/database.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cacheManager } from "@/lib/cache";
import BookingCalendar from "@/components/BookingCalendar";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

interface AdminBookingLine {
  id: number;
  treatmentName: string;
  time: string;
}

interface AdminBookingItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  status: string;
  bookingDate: Date;
  lines: AdminBookingLine[];
  notes?: string;
  bookingState: "pending" | "booked" | "completed" | "cancelled" | "past";
}

const ADMIN_BOOKINGS_CACHE_KEY = "admin_bookings_v2";
const BOOKING_SLOT_OPTIONS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

const getSlotOptionsForDate = (date: Date) =>
  date.getDay() === 6
    ? BOOKING_SLOT_OPTIONS.filter((slot) => slot <= "13:00")
    : BOOKING_SLOT_OPTIONS;

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getContiguousSlots = (
  startSlot: string,
  count: number,
  availableSlots: string[],
  slotOptions = BOOKING_SLOT_OPTIONS,
) => {
  const startIndex = slotOptions.indexOf(startSlot);
  const slots = slotOptions.slice(startIndex, startIndex + count);
  return startIndex >= 0 &&
    slots.length === count &&
    slots.every((slot) => availableSlots.includes(slot))
    ? slots
    : [];
};

const parseBookingDate = (value: unknown): Date => {
  if (!value) return new Date();

  const date = new Date(value instanceof Date ? value : String(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const isDateBeforeToday = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
};

const isSlotElapsed = (date: Date, slot: string) => {
  const today = new Date();
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (!isSameDay) return false;

  const [hours, minutes] = slot.split(":").map(Number);
  const slotStart = new Date();
  slotStart.setHours(hours, minutes, 0, 0);
  return new Date() >= slotStart;
};

const AdminBooking = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "booked" | "completed" | "cancelled" | "past"
  >("all");
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [selectedBooking, setSelectedBooking] =
    useState<AdminBookingItem | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const normalizeBookingState = (
    status: string,
    bookingDate: Date,
  ): "pending" | "booked" | "completed" | "cancelled" | "past" => {
    const normalized = status.trim().toLowerCase();
    if (normalized === "3" || normalized.includes("cancel")) return "cancelled";
    if (isDateBeforeToday(bookingDate)) return "past";
    if (normalized === "0" || normalized.includes("complete")) return "completed";
    if (normalized === "1" || normalized.includes("pending")) return "pending";
    return "booked";
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data: bookingData, error } = await supabase
          .from("bookings")
          .select("bookingid,bookingdate,status,notes,customerid")
          .order("bookingdate", { ascending: true });

        if (error) {
          throw error;
        }

        if (!bookingData) {
          setBookings([]);
          return;
        }

        const bookingIds = bookingData.map((booking) => booking.bookingid);
        const customerIds = bookingData.map((booking) => booking.customerid);

        const [{ data: lineData, error: lineError }, { data: userData, error: userError }] =
          await Promise.all([
            supabase
              .from("booking_line")
              .select("booking_id,id,time,treatment_id")
              .in("booking_id", bookingIds),
            supabase
              .from("User")
              .select("id,name,surname,phone")
              .in("id", customerIds),
          ]);

        if (lineError) throw lineError;
        if (userError) throw userError;

        const treatmentIds = (lineData ?? [])
          .map((line) => line.treatment_id)
          .filter((id): id is number => id !== null);
        const { data: serviceData, error: serviceError } =
          treatmentIds.length > 0
            ? await supabase
                .from("Services")
                .select("ServiceId,servicename")
                .in("ServiceId", treatmentIds)
            : { data: [], error: null };

        if (serviceError) throw serviceError;

        const usersById = new Map(
          (userData ?? []).map((user) => [
            user.id,
            {
              name:
                [user.name, user.surname].filter(Boolean).join(" ").trim() ||
                "Customer",
              phone: user.phone,
            },
          ]),
        );
        const servicesById = new Map(
          (serviceData ?? []).map((service) => [
            service.ServiceId,
            service.servicename,
          ]),
        );
        const linesByBooking = new Map<number, AdminBookingLine[]>();

        (lineData ?? []).forEach((line) => {
          const lines = linesByBooking.get(line.booking_id) ?? [];
          lines.push({
            id: line.id,
            treatmentName:
              (line.treatment_id !== null
                ? servicesById.get(line.treatment_id)
                : undefined) ?? "Treatment",
            time: line.time.slice(0, 5),
          });
          linesByBooking.set(line.booking_id, lines);
        });

        const mappedBookings: AdminBookingItem[] = bookingData.map(
          (booking: BookingRow) => {
            const status = String(booking.status ?? "Pending").trim();
            const bookingDate = parseBookingDate(booking.bookingdate);
            return {
              id: booking.bookingid,
              customerId: booking.customerid,
              customerName:
                usersById.get(booking.customerid)?.name ?? "Customer",
              customerPhone: usersById.get(booking.customerid)?.phone,
              status,
              bookingDate,
              lines: linesByBooking.get(booking.bookingid) ?? [],
              notes: booking.notes ?? "",
              bookingState: normalizeBookingState(status, bookingDate),
            };
          },
        );

        setBookings(mappedBookings);
        await cacheManager.set(ADMIN_BOOKINGS_CACHE_KEY, mappedBookings);
      } catch (bookingError) {
        console.log("fetchBookings error", bookingError);
        const cached = await AsyncStorage.getItem(`cache_${ADMIN_BOOKINGS_CACHE_KEY}`);
        if (cached) {
          try {
            const cachedBookings = JSON.parse(cached) as (
              Omit<AdminBookingItem, "bookingDate"> & { bookingDate: string }
            )[];
            setBookings(
              cachedBookings.map((booking) => ({
                ...booking,
                bookingDate: parseBookingDate(booking.bookingDate),
                bookingState: normalizeBookingState(
                  booking.status,
                  parseBookingDate(booking.bookingDate),
                ),
              })),
            );
          } catch (cacheError) {
            console.log("Could not read cached admin bookings:", cacheError);
            Alert.alert("Error", "Could not load bookings.");
          }
        } else {
          Alert.alert("Error", "Could not load bookings. Check your connection.");
        }
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

    if (normalizedStatus === "3" || normalizedStatus.includes("cancel")) {
      return BookingStatus.Cancelled;
    }

    return BookingStatus.Booked;
  };
  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesState =
        activeFilter === "all"
          ? booking.bookingState !== "past"
          : booking.bookingState === activeFilter;

      const haystack = [
        booking.customerName,
        ...booking.lines.flatMap((line) => [line.treatmentName, line.time]),
        booking.status,
        booking.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      return matchesState && matchesSearch;
    });
  }, [activeFilter, bookings, searchQuery]);

  const pendingCount = bookings.filter(
    (b) => b.bookingState === "pending",
  ).length;
  const bookedCount = bookings.filter(
    (b) => b.bookingState === "booked",
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.bookingState === "cancelled",
  ).length;
  const pastCount = bookings.filter((b) => b.bookingState === "past").length;
  const today = new Date();
  const todayCount = bookings.filter((booking) => {
    const date = booking.bookingDate;
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate() &&
      (booking.bookingState === "pending" ||
        booking.bookingState === "booked")
    );
  }).length;

  const openBooking = (booking: AdminBookingItem) => {
    setSelectedBooking(booking);
    setRescheduleDate(booking.bookingDate);
    setRescheduleTime(booking.lines[0]?.time ?? "");
    setShowBookingModal(true);
  };

  const availableRescheduleSlots = useMemo(() => {
    if (!selectedBooking) return [];

    const bookedTimes = new Set(
      bookings
        .filter(
          (booking) =>
            booking.id !== selectedBooking.id &&
            (booking.bookingState === "pending" ||
              booking.bookingState === "booked") &&
            formatDateKey(booking.bookingDate) === formatDateKey(rescheduleDate),
        )
        .flatMap((booking) => booking.lines.map((line) => line.time)),
    );
    const dateSlotOptions = getSlotOptionsForDate(rescheduleDate);
    const availableSlots = dateSlotOptions.filter(
      (slot) => !bookedTimes.has(slot) && !isSlotElapsed(rescheduleDate, slot),
    );
    const requiredSlots = Math.max(selectedBooking.lines.length, 1);

    return dateSlotOptions.filter(
      (slot) =>
        getContiguousSlots(slot, requiredSlots, availableSlots, dateSlotOptions).length > 0,
    );
  }, [bookings, rescheduleDate, selectedBooking]);

  const selectedRescheduleSlots = useMemo(
    () =>
      selectedBooking && rescheduleTime
        ? getContiguousSlots(
            rescheduleTime,
            selectedBooking.lines.length,
            BOOKING_SLOT_OPTIONS,
            getSlotOptionsForDate(rescheduleDate),
          )
        : [],
    [rescheduleTime, rescheduleDate, selectedBooking],
  );

  const closeBooking = () => {
    if (!isSaving) {
      setShowBookingModal(false);
      setSelectedBooking(null);
    }
  };

  const updateLocalBooking = (updated: AdminBookingItem) => {
    setBookings((current) => {
      const next = current.map((booking) =>
        booking.id === updated.id ? updated : booking,
      );
      void cacheManager.set(ADMIN_BOOKINGS_CACHE_KEY, next);
      return next;
    });
    setSelectedBooking(updated);
  };

  const confirmBooking = async () => {
    if (!selectedBooking || getBookingStatus(selectedBooking.status) !== BookingStatus.Pending) {
      Alert.alert("Cannot confirm", "Only pending bookings can be confirmed.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: BookingStatus.Booked })
        .eq("bookingid", selectedBooking.id);
      if (error) throw error;
      updateLocalBooking({
        ...selectedBooking,
        status: BookingStatus.Booked,
        bookingState: normalizeBookingState(
          BookingStatus.Booked,
          selectedBooking.bookingDate,
        ),
      });
      Alert.alert("Booking confirmed", "The booking is now confirmed.");
    } catch (error) {
      console.log("confirmBooking error", error);
      Alert.alert("Could not confirm", "The booking could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const rescheduleBooking = async () => {
    if (!selectedBooking || getBookingStatus(selectedBooking.status) !== BookingStatus.Booked) {
      Alert.alert("Cannot reschedule", "Only confirmed bookings can be rescheduled.");
      return;
    }
    if (isDateBeforeToday(selectedBooking.bookingDate)) {
      Alert.alert(
        "Cannot reschedule",
        "Bookings cannot be rescheduled after their scheduled day has passed.",
      );
      return;
    }
    const nextDate = new Date(rescheduleDate);
    const [hours, minutes] = rescheduleTime.split(":").map(Number);
    const now = new Date();
    if (
      Number.isNaN(nextDate.getTime()) ||
      nextDate.getDay() === 0 ||
      nextDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ||
      hours > 23 ||
      minutes > 59 ||
      !availableRescheduleSlots.includes(rescheduleTime)
    ) {
      Alert.alert(
        "Invalid booking details",
        "Choose an available date and start slot.",
      );
      return;
    }

    const requestedTimes = getContiguousSlots(
      rescheduleTime,
      selectedBooking.lines.length,
      BOOKING_SLOT_OPTIONS,
      getSlotOptionsForDate(nextDate),
    ).map((slot) => `${slot}:00`);
    if (requestedTimes.length !== selectedBooking.lines.length) {
      Alert.alert("Invalid time", "There are not enough consecutive time slots.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: activeBookings, error: bookingError } = await supabase
        .from("bookings")
        .select("bookingid")
        .neq("status", BookingStatus.Cancelled)
        .neq("bookingid", selectedBooking.id)
        .eq("bookingdate", formatDateKey(nextDate));
      if (bookingError) throw bookingError;
      const activeIds = (activeBookings ?? []).map((booking) => booking.bookingid);
      if (activeIds.length > 0) {
        const { data: conflicts, error: conflictError } = await supabase
          .from("booking_line")
          .select("time")
          .in("booking_id", activeIds)
          .in("time", requestedTimes);
        if (conflictError) throw conflictError;
        if ((conflicts ?? []).length > 0) {
          Alert.alert("Time unavailable", "One or more selected slots are already booked.");
          return;
        }
      }

      const { error: dateError } = await supabase
        .from("bookings")
        .update({ bookingdate: formatDateKey(nextDate) })
        .eq("bookingid", selectedBooking.id);
      if (dateError) throw dateError;

      const lineUpdates = await Promise.all(
        selectedBooking.lines.map((line, index) =>
          supabase
            .from("booking_line")
            .update({ time: requestedTimes[index] })
            .eq("id", line.id),
        ),
      );
      const lineUpdateError = lineUpdates.find((result) => result.error)?.error;
      if (lineUpdateError) throw lineUpdateError;
      const updatedLines = selectedBooking.lines.map((line, index) => ({
        ...line,
        time: requestedTimes[index].slice(0, 5),
      }));
      updateLocalBooking({
        ...selectedBooking,
        bookingDate: nextDate,
        lines: updatedLines,
      });
      Alert.alert("Booking rescheduled", "The booking time was updated.");
    } catch (error) {
      console.log("rescheduleBooking error", error);
      Alert.alert("Could not reschedule", "The booking could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles(theme).screen}
        contentContainerStyle={styles(theme).contentContainer}
        showsVerticalScrollIndicator={false}
      >
      <SafeAreaView>
        <View style={styles(theme).statsRow}>
          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Total</Text>
            <Text style={styles(theme).statValue}>{bookings.length}</Text>
            <Text style={styles(theme).statHint}>Visits logged</Text>
          </View>

          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Pending</Text>
            <Text style={[styles(theme).statValue, styles(theme).greenText]}>
              {pendingCount}
            </Text>
            <Text style={styles(theme).statHint}>Needs action</Text>
          </View>

          <View style={styles(theme).statCard}>
            <Text style={styles(theme).statLabel}>Today</Text>
            <Text style={styles(theme).statValue}>
              {todayCount}
            </Text>
            <Text style={styles(theme).statHint}>Scheduled</Text>
          </View>
        </View>
      </SafeAreaView>
      <View style={styles(theme).searchWrap}>
        <Search color={theme.TextColour} size={18} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by client, treatment, status..."
          placeholderTextColor={theme.TextColour}
          style={styles(theme).searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles(theme).filterBar}
      >
        <Pressable
          onPress={() => setActiveFilter("all")}
          style={[
            styles(theme).filterButton,
            activeFilter === "all" && styles(theme).filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles(theme).filterText,
              activeFilter === "all" && styles(theme).filterTextActive,
            ]}
          >
            All {bookings.filter((booking) => booking.bookingState !== "past").length}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter("pending")}
          style={[
            styles(theme).filterButton,
            activeFilter === "pending" && styles(theme).filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles(theme).filterText,
              activeFilter === "pending" && styles(theme).filterTextActive,
            ]}
          >
            Pending {pendingCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter("booked")}
          style={[
            styles(theme).filterButton,
            activeFilter === "booked" && styles(theme).filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles(theme).filterText,
              activeFilter === "booked" && styles(theme).filterTextActive,
            ]}
          >
            Confirmed {bookedCount}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter("cancelled")}
          style={[
            styles(theme).filterButton,
            activeFilter === "cancelled" && styles(theme).filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles(theme).filterText,
              activeFilter === "cancelled" && styles(theme).filterTextActive,
            ]}
          >
            Cancelled {cancelledCount}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter("past")}
          style={[
            styles(theme).filterButton,
            activeFilter === "past" && styles(theme).filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles(theme).filterText,
              activeFilter === "past" && styles(theme).filterTextActive,
            ]}
          >
            Past {pastCount}
          </Text>
        </Pressable>
      </ScrollView>

      {filteredBookings.length === 0 ? (
        <View style={styles(theme).emptyStateCard}>
          <Text style={styles(theme).emptyStateText}>No matching bookings.</Text>
        </View>
      ) : (
        filteredBookings.map((booking) => (
          <Pressable
            key={booking.id}
            style={[
              styles(theme).bookingCard,
              booking.bookingState === "past" && styles(theme).bookingCardPast,
            ]}
            onPress={() => openBooking(booking)}
          >
            <View style={styles(theme).bookingHeader}>
              <View style={styles(theme).dateBox}>
                <Text style={styles(theme).monthText}>
                  {new Intl.DateTimeFormat("en-ZA", {
                    month: "short",
                  }).format(booking.bookingDate)}
                </Text>
                <Text style={styles(theme).dayText}>
                  {new Intl.DateTimeFormat("en-US", {
                    day: "2-digit",
                  }).format(booking.bookingDate)}
                </Text>
              </View>

              <View style={styles(theme).customerBlock}>
                <Text style={styles(theme).customerName}>{booking.customerName}</Text>
                <Text style={styles(theme).bookingMeta}>
                  {booking.lines.length} treatment
                  {booking.lines.length === 1 ? "" : "s"}
                </Text>
              </View>

              <View style={styles(theme).statusTagWrap}>
                <View
                  style={[
                    styles(theme).statusDot,
                    getBookingStatus(booking.status) === BookingStatus.Pending
                      ? styles(theme).statusDotWarning
                      : booking.bookingState === "past"
                        ? styles(theme).statusDotPast
                      : styles(theme).statusDotSuccess,
                  ]}
                />
                <Text style={styles(theme).statusText}>
                  {booking.bookingState === "past"
                    ? "Past"
                    : getBookingStatus(booking.status)}
                </Text>
              </View>
            </View>

            <View style={styles(theme).treatmentRow}>
              <Text style={styles(theme).labelText}>Treatment requested</Text>
            </View>

            <View style={styles(theme).lineList}>
              {booking.lines.length > 0 ? (
                booking.lines.map((line, index) => (
                  <Text key={`${booking.id}-${line.time}-${index}`} style={styles(theme).bookingTitle}>
                    {line.treatmentName} • {line.time}
                  </Text>
                ))
              ) : (
                <Text style={styles(theme).bookingTitle}>No treatment lines</Text>
              )}
            </View>

            <View style={styles(theme).metaRow}>
              <Text style={styles(theme).metaText}>
                {booking.lines.map((line) => line.time).join(", ") ||
                  "No time assigned"}
              </Text>
            </View>

            {booking.notes ? (
              <View style={styles(theme).noteRow}>
                <Text style={styles(theme).noteText}>{booking.notes}</Text>
              </View>
            ) : null}

            <View style={styles(theme).actionRow}>
              <Pressable style={styles(theme).primaryAction} onPress={() => openBooking(booking)}>
                <CheckCircle2 size={16} color="#07130d" />
                <Text style={styles(theme).primaryActionText}>
                  {getBookingStatus(booking.status) === BookingStatus.Pending &&
                  booking.bookingState !== "past"
                    ? "Confirm Booking"
                    : "View Record"}
                </Text>
              </Pressable>

              <Pressable style={styles(theme).secondaryAction} onPress={() => openBooking(booking)}>
                <Text style={styles(theme).secondaryActionText}>
                  {booking.bookingState === "past" ? "View Details" : "Reschedule"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        ))
      )}
      </ScrollView>
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={closeBooking}
      >
        <View style={styles(theme).modalBackdrop}>
          <View style={styles(theme).modalCard}>
            <Text style={styles(theme).modalTitle}>Booking details</Text>
            <ScrollView
              style={styles(theme).modalScroll}
              contentContainerStyle={styles(theme).modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedBooking ? (
                <>
                <Text style={styles(theme).modalValue}>{selectedBooking.customerName}</Text>
                {selectedBooking.customerPhone ? (
                  <Pressable
                    onPress={() =>
                      void Linking.openURL(`tel:${selectedBooking.customerPhone}`)
                    }
                  >
                    <Text style={styles(theme).modalContact}>
                      Contact: {selectedBooking.customerPhone}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles(theme).modalContact}>
                    Contact: Not available
                  </Text>
                )}
                <Text style={styles(theme).modalLabel}>
                  {selectedBooking.bookingDate.toISOString().slice(0, 10)} •{" "}
                  {selectedBooking.status}
                </Text>
                {selectedBooking.lines.map((line) => (
                  <Text key={line.id} style={styles(theme).modalLine}>
                    {line.treatmentName} • {line.time}
                  </Text>
                ))}
                {selectedBooking.notes ? (
                  <Text style={styles(theme).modalNotes}>{selectedBooking.notes}</Text>
                ) : null}

                {getBookingStatus(selectedBooking.status) === BookingStatus.Booked &&
                !isDateBeforeToday(selectedBooking.bookingDate) ? (
                  <>
                    <TextInput
                      value={formatDateKey(rescheduleDate)}
                      editable={false}
                      style={styles(theme).modalInput}
                    />
                    <BookingCalendar
                      selectedDate={rescheduleDate}
                      onDateChange={(date) => {
                        setRescheduleDate(date);
                        setRescheduleTime("");
                      }}
                      textColor={theme.modalText}
                    />
                    <Text style={styles(theme).modalLabel}>Available start slots</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles(theme).modalSlotRow}
                    >
                      {getSlotOptionsForDate(rescheduleDate).map((slot) => {
                        const isStartSlot = availableRescheduleSlots.includes(slot);
                        const isSelectedSlot = selectedRescheduleSlots.includes(slot);
                        return (
                        <Pressable
                          key={slot}
                          disabled={!isStartSlot}
                          onPress={() => setRescheduleTime(slot)}
                          style={[
                            styles(theme).modalSlot,
                            isSelectedSlot && styles(theme).modalSlotSelected,
                            !isStartSlot && styles(theme).modalSlotDisabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles(theme).modalSlotText,
                              isSelectedSlot && styles(theme).modalSlotTextSelected,
                            ]}
                          >
                            {slot}
                          </Text>
                        </Pressable>
                        );
                      })}
                    </ScrollView>
                    <TextInput
                      value={
                        rescheduleTime
                          ? `${rescheduleTime} - ${
                              getContiguousSlots(
                                rescheduleTime,
                                selectedBooking.lines.length,
                                BOOKING_SLOT_OPTIONS,
                              )[selectedBooking.lines.length - 1] ??
                              rescheduleTime
                            }`
                          : "Select a start slot"
                      }
                      editable={false}
                      style={styles(theme).modalInput}
                    />
                    <Pressable
                      style={styles(theme).modalPrimaryAction}
                      onPress={() => void rescheduleBooking()}
                      disabled={isSaving}
                    >
                      <Text style={styles(theme).modalPrimaryText}>
                        {isSaving ? "Saving..." : "Reschedule booking"}
                      </Text>
                    </Pressable>
                  </>
                ) : selectedBooking.bookingState === "past" ? (
                  <Text style={styles(theme).modalReadOnly}>
                    This booking is view-only because its scheduled day has passed.
                  </Text>
                ) : getBookingStatus(selectedBooking.status) === BookingStatus.Booked ? (
                  <Text style={styles(theme).modalReadOnly}>
                    This booking can no longer be rescheduled because its scheduled day has passed.
                  </Text>
                ) : getBookingStatus(selectedBooking.status) === BookingStatus.Pending ? (
                  <Pressable
                    style={styles(theme).modalPrimaryAction}
                    onPress={() => void confirmBooking()}
                    disabled={isSaving}
                  >
                    <Text style={styles(theme).modalPrimaryText}>
                      {isSaving ? "Saving..." : "Confirm booking"}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles(theme).modalReadOnly}>This booking is view-only.</Text>
                )}
                </>
              ) : null}
            </ScrollView>
            <Pressable style={styles(theme).modalCloseAction} onPress={closeBooking}>
              <Text style={styles(theme).modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default AdminBooking;

const styles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.PrimaryBackground,
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
    color: theme.Primary900,
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
    color: theme.TextColour,
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
    borderWidth: 1.5,
    borderColor: theme.adminBorder,
  },
  statLabel: {
    color: theme.TextColour,
    fontSize: 12,
    opacity: 0.8,
  },
  statValue: {
    color: theme.TextColour,
    fontWeight: "800",
    fontSize: 30,
    marginTop: 10,
  },
  statHint: {
    color: theme.TextColour,
    fontSize: 11,
    opacity: 0.8,
  },
  greenText: {
    color: theme.Primary900,
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
    borderWidth: 1.5,
    borderColor: theme.adminBorder,
  },
  searchInput: {
    color: theme.TextColour,
    fontSize: 14,
  },
  filterBar: {
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingRight: 4,
  },
  filterButton: {
    minWidth: 92,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.adminBorder,
  },
  filterButtonActive: {
    backgroundColor: "rgba(0,255,95,0.16)",
    borderWidth: 1,
    borderColor: theme.Primary900,
  },
  filterText: {
    color: theme.TextColour,
    fontWeight: "700",
    fontSize: 12,
  },
  filterTextActive: {
    color: theme.Primary900,
  },
  treatmentSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: theme.TextColour,
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  searchInputField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.adminBorder,
    color: theme.TextColour,
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
    borderWidth: 1.5,
    borderColor: theme.adminBorder,
    marginRight: 10,
    justifyContent: "center",
  },
  treatmentCardSelected: {
    backgroundColor: "rgba(0,255,95,0.12)",
    borderColor: theme.Primary900,
  },
  treatmentName: {
    color: theme.TextColour,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  treatmentMeta: {
    color: theme.TextColour,
    fontSize: 11,
  },
  bookingCard: {
    backgroundColor: theme.bookingCardBackground,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: theme.adminBorder,
  },
  bookingCardPast: {
    backgroundColor: theme.bookingCardBackground,
    borderColor: "rgba(196,154,90,0.75)",
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
    borderWidth: 1,
    borderColor: theme.adminBorder,
  },
  monthText: {
    color: theme.TextColour,
    fontSize: 10,
    textTransform: "uppercase",
  },
  dayText: {
    color: theme.bookingCardText,
    fontSize: 22,
    fontWeight: "800",
  },
  customerBlock: {
    flex: 1,
  },
  customerName: {
    color: theme.bookingCardText,
    fontSize: 18,
    fontWeight: "700",
  },
  bookingMeta: {
    color: theme.TextColour,
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
    backgroundColor: theme.Primary900,
  },
  statusDotWarning: {
    backgroundColor: "#F1C75B",
  },
  statusDotPast: {
    backgroundColor: "#C49A5A",
  },
  statusText: {
    color: theme.bookingCardText,
    fontSize: 10,
    fontWeight: "700",
  },
  treatmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  lineList: {
    gap: 4,
    marginBottom: 10,
  },
  labelText: {
    color: theme.TextColour,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pointsBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: theme.Primary900,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  bookingTitle: {
    color: theme.bookingCardText,
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
    color: theme.TextColour,
    fontSize: 12,
  },
  noteRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.adminBorder,
  },
  noteText: {
    color: theme.TextColour,
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
    backgroundColor: theme.Primary900,
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
    borderWidth: 1,
    borderColor: theme.adminBorder,
  },
  secondaryActionText: {
    color: theme.TextColour,
    fontWeight: "700",
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "92%",
    backgroundColor: theme.visitDetailsModalBackground,
    borderColor: "rgba(0,255,95,0.55)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    gap: 12,
  },
  modalTitle: {
    color: theme.modalText,
    fontSize: 20,
    fontWeight: "800",
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    gap: 12,
  },
  modalValue: {
    color: theme.modalText,
    fontSize: 17,
    fontWeight: "700",
  },
  modalContact: {
    color: theme.Primary900,
    fontSize: 14,
    marginTop: -6,
    opacity: 0.9,
    textDecorationLine: "underline",
  },
  modalLabel: {
    color: theme.modalText,
  },
  modalLine: {
    color: theme.modalText,
    paddingVertical: 3,
  },
  modalNotes: {
    color: theme.modalText,
    fontStyle: "italic",
  },
  modalInput: {
    color: theme.modalText,
    borderWidth: 1,
    borderColor: theme.TextColour,
    borderRadius: 8,
    padding: 10,
  },
  modalSlotRow: {
    gap: 8,
    paddingVertical: 4,
  },
  modalSlot: {
    minWidth: 64,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalSlotSelected: {
    backgroundColor: theme.Primary900,
  },
  modalSlotText: {
    color: theme.modalText,
    fontWeight: "700",
  },
  modalSlotTextSelected: {
    color: theme.modalText,
  },
  modalSlotDisabled: {
    opacity: 0.35,
  },
  modalPrimaryAction: {
    backgroundColor: theme.Primary900,
    padding: 13,
    borderRadius: 9,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: theme.modalText,
    fontWeight: "800",
  },
  modalReadOnly: {
    color: theme.modalText,
  },
  modalCloseAction: {
    padding: 12,
    alignItems: "center",
  },
  modalCloseText: {
    color: theme.modalText,
    fontWeight: "700",
  },
  emptyStateCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 18,
  },
  emptyStateText: {
    color: theme.TextColour,
    fontSize: 14,
  },
});
