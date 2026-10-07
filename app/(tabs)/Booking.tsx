import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Modal,
  type ViewStyle,
} from "react-native";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
} from "lucide-react-native";
import BookingCalendar from "@/components/BookingCalendar";
import SearchBar from "@/components/SearchBar";
import Colors from "@/components/utils/Colours";
import { UserSession } from "@/components/utils/GetUsersession";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import type {
  BookingInsert,
  BookingLineInsert,
} from "@/components/utils/DatabaseTypes";
import { GetTreatments } from "@/components/utils/GetServices";
import type { DropDownItems } from "@/components/utils/utilinterfaces";
import { BookingStatus } from "@/components/utils/utilinterfaces";
type ClientType = "first" | "returning";

const defaultSlotOptions = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

const isSunday = (date: Date) => date.getDay() === 0;

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const isSlotElapsed = (date: Date, slot: string, now = new Date()) => {
  if (!isToday(date)) return false;

  const [hours, minutes] = slot.split(":").map(Number);
  const slotStart = new Date(now);
  slotStart.setHours(hours, minutes, 0, 0);
  return new Date() >= slotStart;
};

const getInitialBookingDate = () => {
  const date = new Date();
  if (isSunday(date)) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const getContiguousSlots = (
  startSlot: string,
  count: number,
  availableSlots: string[],
) => {
  const startIndex = defaultSlotOptions.indexOf(startSlot);
  if (startIndex < 0) return [];

  const slots = defaultSlotOptions.slice(startIndex, startIndex + count);
  return slots.length === count &&
    slots.every((slot) => availableSlots.includes(slot))
    ? slots
    : [];
};

interface userBooking {
  id: number;
  bookingDate: Date;
  status: string;
  notes: string;
  time: string;
  treatmentName: string;
  bookingState: "active" | "completed" | "past";
}

const isDateBeforeToday = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
};

const formatBookingDate = (date: Date) =>
  new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

const Booking = () => {
  const loggedInUser = UserSession.getSession();
  const [bookedSlotTimes, setBookedSlotTimes] = useState<string[]>([]);
  const [clientType, setClientType] = useState<ClientType>("returning");
  const [selectedSlot, setSelectedSlot] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(getInitialBookingDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [bookings, setBookings] = useState<userBooking[]>([]);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<userBooking | null>(
    null,
  );
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showFeeExplanation, setShowFeeExplanation] = useState(false);
  const [treatments, setTreatments] = useState<DropDownItems[]>([]);
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string[]>([]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedTreatmentNames = useMemo(
    () =>
      selectedTreatmentId
        .map((id: string) =>
          treatments.find((treatment: DropDownItems) => treatment.id === id)
            ?.value,
        )
        .filter((name): name is string => Boolean(name)),
    [selectedTreatmentId, treatments],
  );
  const slotOptions = useMemo(() => {
    const availableSlots = defaultSlotOptions.filter(
      (slot) =>
        !bookedSlotTimes.includes(slot) &&
        !isSlotElapsed(selectedDate, slot, currentTime),
    );
    const requiredSlots = Math.max(selectedTreatmentId.length, 1);

    return defaultSlotOptions.filter(
      (slot) =>
        getContiguousSlots(slot, requiredSlots, availableSlots).length > 0,
    );
  }, [bookedSlotTimes, currentTime, selectedDate, selectedTreatmentId.length]);

  const filteredTreatments = useMemo<DropDownItems[]>(() => {
    const query = treatmentSearch.trim().toLowerCase();
    if (!query) return treatments;

    return treatments.filter((treatment: DropDownItems) =>
      treatment.value.toLowerCase().includes(query),
    );
  }, [treatments, treatmentSearch]);

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

  const normalizeBookingState = (
    status: string,
    bookingDate: Date,
  ): "active" | "completed" | "past" => {
    const normalizedStatus = status.trim().toLowerCase();

    if (
      !normalizedStatus.includes("cancel") &&
      normalizedStatus !== "3" &&
      bookingDate.setHours(0, 0, 0, 0) <
        new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    ) {
      return "past";
    }
    if (normalizedStatus.includes("complete")) {
      return "completed";
    }

    return "active";
  };

  const matchesSearch = (value: string) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return value.toLowerCase().includes(query);
  };

  const filteredCurrentBookings = bookings.filter((booking) => {
    const isActiveBooking = booking.bookingState === "active";

    return (
      (activeFilter === "all" || activeFilter === "active") &&
      isActiveBooking &&
      [
        booking.id.toString(),
        booking.bookingDate.toString(),
        booking.status,
        booking.treatmentName,
        booking.notes,
      ].some((value) => matchesSearch(value))
    );
  });

  const filteredPastBookings = bookings.filter((booking) => {
    const isCompletedBooking =
      booking.bookingState === "completed" || booking.bookingState === "past";

    return (
      (activeFilter === "all" || activeFilter === "completed") &&
      isCompletedBooking &&
      [
        booking.id.toString(),
        booking.bookingDate.toString(),
        booking.status,
        booking.treatmentName,
        booking.notes,
      ].some((value) => matchesSearch(value))
    );
  });
  const validateBooking = () => {
    if (!loggedInUser?.user.id) {
      Alert.alert("Error", "Please sign in before booking");
      return false;
    }
    if (selectedTreatmentId.length === 0) {
      Alert.alert("Error", "Please select a treatment");
      return false;
    }
    if (selectedSlot.length !== selectedTreatmentId.length) {
      Alert.alert("Error", "Please select an available slot");
      return false;
    }
    if (selectedSlot.some((slot) => isSlotElapsed(selectedDate, slot))) {
      Alert.alert("Error", "One or more selected time slots has already passed.");
      setSelectedSlot([]);
      return false;
    }
    if (isSunday(selectedDate)) {
      Alert.alert("Error", "Bookings are not available on Sundays");
      return false;
    }
    return true;
  };

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
  const userId = loggedInUser?.user.id;

  useEffect(() => {
    const getUserBookings = async () => {
      if (!userId) {
        setBookings([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("bookingid,bookingdate,status,notes")
          .eq("customerid", userId);

        if (error) {
          console.log("Error", error);
          return;
        }
        if (data) {
          const bookingIds = data.map((booking) => booking.bookingid);
          const { data: lineData, error: lineError } =
            bookingIds.length > 0
              ? await supabase
                  .from("booking_line")
                  .select("booking_id,time")
                  .in("booking_id", bookingIds)
              : { data: [], error: null };

          if (lineError) {
            console.log("Could not load booking times:", lineError);
            return;
          }

          const timesByBooking = new Map<number, string[]>();
          (lineData ?? []).forEach((line) => {
            const times = timesByBooking.get(line.booking_id) ?? [];
            times.push(line.time.slice(0, 5));
            timesByBooking.set(line.booking_id, times);
          });

          const formattedBooking: userBooking[] = data.map((booking) => {
            const rawStatus = String(booking.status ?? "").trim();

            const notes = String(booking.notes ?? "").trim();
            const bookingTimes = (timesByBooking.get(booking.bookingid) ?? [])
              .sort();
            const startTime = bookingTimes[0] ?? "";
            const endTime = bookingTimes[bookingTimes.length - 1] ?? startTime;
            const bookingDate = new Date(booking.bookingdate);
            const bookingState = normalizeBookingState(rawStatus, bookingDate);

            return {
              bookingDate,
              id: booking.bookingid,
              status: rawStatus || "Pending",
              time:
                startTime && endTime && startTime !== endTime
                  ? `${startTime} - ${endTime}`
                  : startTime || "Time not assigned",
              notes,
              treatmentName: notes || "Treatment Booking",
              bookingState,
            };
          });
          setBookings(formattedBooking);
        }
      } catch (bookingError) {
        console.log(bookingError);
      }
    };
    getUserBookings();
  }, [userId, clientType]);
  useEffect(() => {
    const getAvailableSlots = async () => {
      try {
        if (isSunday(selectedDate)) {
          setBookedSlotTimes(defaultSlotOptions);
          setSelectedSlot([]);
          return;
        }

        const startOfDay = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        const { data, error } = await supabase
          .from("bookings")
          .select("bookingid,status")
          .gte("bookingdate", startOfDay.toISOString())
          .lt("bookingdate", endOfDay.toISOString());
        if (error) {
          throw error;
        }

        const activeBookingIds = (data ?? [])
          .filter((booking) => booking.status !== BookingStatus.Cancelled)
          .map((booking) => booking.bookingid);
        if (activeBookingIds.length === 0) {
          setBookedSlotTimes([]);
          return;
        }

        const { data: lineData, error: lineError } = await supabase
          .from("booking_line")
          .select("time")
          .in("booking_id", activeBookingIds);
        if (lineError) {
          throw lineError;
        }
        setBookedSlotTimes(
          (lineData ?? []).map((line) => line.time.slice(0, 5)),
        );
      } catch (availableSlotsError) {
        console.log("Could not load available slots:", availableSlotsError);
        Alert.alert(
          "Error",
          "Could not load available slots. Please try again.",
        );
      }
    };
    getAvailableSlots();
  }, [showBookingConfirmation, selectedDate]);

  const BookedUser = async (
    userid: string,
    date: string,
  ): Promise<boolean | null> => {
    try {
      const bookingDate = new Date(date);
      const endDate = new Date(bookingDate);
      endDate.setDate(endDate.getDate() + 1);
      const { data, error } = await supabase
        .from("bookings")
        .select("bookingid")
        .eq("customerid", userid)
        .gte("bookingdate", bookingDate.toISOString())
        .lt("bookingdate", endDate.toISOString())
        .neq("status", BookingStatus.Cancelled)
        .limit(1);

      if (error) {
        console.log("Could not check existing booking:", error);
        Alert.alert("Error", "Could not verify your existing bookings.");
        return null;
      }
      return (data?.length ?? 0) > 0;
    } catch (error) {
      console.log("Error", error);
      return null;
    }
  };
  const areSlotsAvailable = async (
    date: Date,
    requestedSlots: string[],
  ): Promise<boolean> => {
    try {
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("bookingid,status")
        .gte("bookingdate", startOfDay.toISOString())
        .lt("bookingdate", endOfDay.toISOString());

      if (bookingError) throw bookingError;

      const activeBookingIds = (bookingData ?? [])
        .filter((booking) => booking.status !== BookingStatus.Cancelled)
        .map((booking) => booking.bookingid);
      if (activeBookingIds.length === 0) return true;

      const { data: lineData, error: lineError } = await supabase
        .from("booking_line")
        .select("time")
        .in("booking_id", activeBookingIds);

      if (lineError) throw lineError;

      const bookedTimes = new Set(
        (lineData ?? []).map((line) => line.time.slice(0, 5)),
      );
      return requestedSlots.every((slot) => !bookedTimes.has(slot));
    } catch (error) {
      console.log("Could not verify slot availability:", error);
      Alert.alert(
        "Error",
        "Could not verify slot availability. Please try again.",
      );
      return false;
    }
  };
  const CancelBooking = async (id: number) => {
    const foundBooking = bookings.find((booking) => booking.id === id);
    if (!foundBooking) {
      Alert.alert("Cancel Error", "Booking details could not be found.");
      return;
    }
    if (isDateBeforeToday(foundBooking.bookingDate)) {
      Alert.alert("Cancel Error", "Past bookings cannot be cancelled.");
      return;
    }
    if (getBookingStatus(foundBooking.status) === BookingStatus.Cancelled) {
      return;
    }

    setIsCancelling(true);
    try {
      if (
        foundBooking.bookingDate.toDateString() === new Date().toDateString()
      ) {
        Alert.alert(
          "Cancel Error",
          "Cannot cancel booking on the day of booking. Please call Skinzone Naturel to cancel or reschedule.",
        );
        return;
      }
      const { error } = await supabase
        .from("bookings")
        .update({ status: BookingStatus.Cancelled })
        .eq("bookingid", id);
      if (error) {
        Alert.alert("Error", error.message);
        console.log("booked user error", error);
        return;
      }
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, status: BookingStatus.Cancelled } : booking,
        ),
      );
      setSelectedBooking((current) =>
        current?.id === id
          ? { ...current, status: BookingStatus.Cancelled }
          : current,
      );
      Alert.alert("Booking cancelled", "Your booking has been cancelled.");
    } catch (error) {
      Alert.alert("Failed to cancel booking", "Please try again.");
      console.log(error);
    } finally {
      setIsCancelling(false);
    }
  };
  const bookClient = async () => {
    setClientType("first");
    if (!validateBooking()) {
      return;
    }
    try {
      Alert.alert(
        "Confirm",
        `Are you sure you want to confirm your booking for ${selectedDayLabel}? at ${selectedSlot[0]} to ${selectedSlot[selectedSlot.length - 1]}`,
        [
          {
            text: "Confirm",
            onPress: async () => {
              if (selectedSlot.some((slot) => isSlotElapsed(selectedDate, slot))) {
                Alert.alert(
                  "Cannot Book",
                  "One or more selected time slots has already passed.",
                );
                setSelectedSlot([]);
                return;
              }
              const alreadyBooked = await BookedUser(
                loggedInUser!.user.id,
                selectedDate.toISOString(),
              );
              if (alreadyBooked === null) {
                return;
              }
              if (alreadyBooked) {
                Alert.alert(
                  "Cannot Book",
                  "Please reschedule or cancel booking ",
                );
                return;
              }
              if (!(await areSlotsAvailable(selectedDate, selectedSlot))) {
                Alert.alert(
                  "Cannot Book",
                  "One or more selected slots are no longer available.",
                );
                setSelectedSlot([]);
                return;
              }
              const Booking: BookingInsert = {
                customerid: loggedInUser!.user.id,
                bookingdate: selectedDate.toISOString(),
                status: BookingStatus.Pending,
                notes: selectedTreatmentNames.join(", ") || "Treatment Booking",
              };
              const { data, error } = await supabase
                .from("bookings")
                .insert(Booking)
                .select()
                .single();

              if (error || !data) {
                Alert.alert(
                  "Error",
                  error?.message ?? "Could not create booking",
                );
                return;
              }

              const bookingLines: BookingLineInsert[] = selectedTreatmentId.map(
                (treatmentId, index) => ({
                  booking_id: data.bookingid,
                  treatment_id: Number(treatmentId),
                  time: selectedSlot[index],
                }),
              );
              const { error: lineError } = await supabase
                .from("booking_line")
                .insert(bookingLines);
              if (lineError) {
                await supabase
                  .from("bookings")
                  .delete()
                  .eq("bookingid", data.bookingid);
                Alert.alert("Booking Error", "Could not book all treatments");
                console.log("booking line insert error", lineError);
                return;
              }
              setShowBookingConfirmation(true);
            },
            style: "default",
          },
          {
            text: "Cancel",
            onPress: () => {},
            style: "cancel",
          },
        ],
      );
    } catch (bookingError) {
      console.log(bookingError);
    }
  };
  const getBookingStatus = (status: string | number): BookingStatus => {
    const normalizedStatus = String(status).trim().toLowerCase();

    if (normalizedStatus === "0" || normalizedStatus.includes("complete")) {
      return BookingStatus.Completed;
    }

    if (normalizedStatus === "1" || normalizedStatus.includes("pending")) {
      return BookingStatus.Pending;
    }
    if (normalizedStatus === "2" || normalizedStatus.includes("booked")) {
      return BookingStatus.Booked;
    }
    return BookingStatus.Cancelled;
  };
  const renderReturningClientScreen = () => (
    <>
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
            All ({bookings.length})
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
            Active ({filteredCurrentBookings.length})
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
            Completed ({filteredPastBookings.length})
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
        filteredCurrentBookings.map((booking) => {
          const isPendingBooking =
            getBookingStatus(booking.status) === BookingStatus.Pending;

          return (
            <Pressable
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => {
                setSelectedBooking(booking);
                setShowBookingDetails(true);
              }}
            >
              <View style={styles.bookingHeaderRow}>
                <View style={styles.bookingStatusWrap}>
                  <View
                    style={[
                      styles.statusDot,
                      isPendingBooking
                        ? styles.statusDotWarning
                        : styles.statusDotSuccess,
                    ]}
                  />
                  <Text
                    style={[
                      styles.bookingStatusText,
                      isPendingBooking && styles.bookingStatusTextWarning,
                    ]}
                  >
                    {getBookingStatus(booking.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.bookingTitle}>{booking.treatmentName}</Text>

              <View style={styles.bookingMetaRow}>
                <Text style={styles.metaText}>
                  {formatBookingDate(booking.bookingDate)}
                </Text>
                <Text style={styles.metaText}>{booking.time}</Text>
              </View>

              {isPendingBooking ? (
                <View style={styles.pendingFooter}>
                  <Pressable style={styles.primaryActionWide}>
                    <Text style={styles.primaryActionWideText}>
                      Pay Booking Fee R300
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Cancel Booking",
                        `Are you sure you wish to cancel the booking on ${formatBookingDate(
                          booking.bookingDate,
                        )}?`,
                        [
                          {
                            text: "Confirm",
                            onPress: () => {
                              CancelBooking(booking.id);
                            },
                            style: "destructive",
                          },
                          {
                            text: "Cancel",
                            onPress: () => {},
                            style: "cancel",
                          },
                        ],
                      );
                    }}
                    style={styles.secondaryAction}
                  >
                    <Text style={styles.secondaryActionText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedBooking(booking);
                      setShowBookingDetails(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>
                      Manage / Reschedule
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => {
                      setSelectedBooking(booking);
                      setShowBookingDetails(true);
                    }}
                  >
                    <Calendar color={Colors.TextColour} size={18} />
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })
      )}

      <Text style={styles.sectionHeading}>
        Past Bookings{" "}
        <Text style={styles.countBadge}>{filteredPastBookings.length}</Text>
      </Text>

      {filteredPastBookings.length === 0 ? (
        <Text style={styles.emptyStateText}>No matching past bookings.</Text>
      ) : (
        filteredPastBookings.map((booking) => (
          <Pressable
            key={booking.id}
            style={[
              styles.bookingCardPast,
              booking.bookingState === "past" && styles.bookingCardPastDay,
            ]}
            onPress={() => {
              setSelectedBooking(booking);
              setShowBookingDetails(true);
            }}
          >
            <View style={styles.bookingHeaderRow}>
              <Text
                style={[
                  styles.bookingStatusTextPast,
                  booking.bookingState === "past" && styles.bookingStatusTextPastDay,
                ]}
              >
                {booking.bookingState === "past" ? "Past" : booking.status}
              </Text>
            </View>

            <View style={styles.rewardRow}>
              <Text style={styles.bookingTitle}>{booking.treatmentName}</Text>
            </View>

            <View style={styles.bookingMetaRow}>
              <Text style={styles.metaText}>
                {formatBookingDate(booking.bookingDate)}
              </Text>
              <Text style={styles.metaText}>{booking.time}</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setSelectedBooking(booking);
                  setShowBookingDetails(true);
                }}
              >
                <Text style={styles.actionButtonText}>Book Again</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setSelectedBooking(booking);
                  setShowBookingDetails(true);
                }}
              >
                <Text style={styles.actionButtonText}>Summary</Text>
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      <Pressable
        onPress={() => setClientType("first")}
        style={styles.newBookingButton}
      >
        <Text style={styles.newBookingText}>+ Book New Appointment</Text>
      </Pressable>
      </ScrollView>
      <Modal
        visible={showBookingDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBookingDetails(false)}
      >
        <View style={styles.bookingDetailsOverlay}>
          <View style={styles.bookingDetailsModal}>
            <Text style={styles.bookingDetailsTitle}>Booking Details</Text>
            {selectedBooking ? (
              <>
                <Text style={styles.bookingDetailsTreatment}>
                  {selectedBooking.treatmentName}
                </Text>
                <Text style={styles.bookingDetailsLabel}>Status</Text>
                <Text style={styles.bookingDetailsValue}>
                  {selectedBooking.bookingState === "past"
                    ? "Past"
                    : getBookingStatus(selectedBooking.status)}
                </Text>
                <Text style={styles.bookingDetailsLabel}>Date</Text>
                <Text style={styles.bookingDetailsValue}>
                  {formatBookingDate(selectedBooking.bookingDate)}
                </Text>
                <Text style={styles.bookingDetailsLabel}>Time</Text>
                <Text style={styles.bookingDetailsValue}>
                  {selectedBooking.time || "Not assigned"}
                </Text>
                {selectedBooking.notes ? (
                  <>
                    <Text style={styles.bookingDetailsLabel}>Notes</Text>
                    <Text style={styles.bookingDetailsValue}>
                      {selectedBooking.notes}
                    </Text>
                  </>
                ) : null}
                {getBookingStatus(selectedBooking.status) !==
                  BookingStatus.Cancelled &&
                selectedBooking.bookingState !== "past" ? (
                  <Pressable
                    style={styles.cancelBookingButton}
                    disabled={isCancelling}
                    onPress={() =>
                      Alert.alert(
                        "Cancel Booking",
                        "Are you sure you want to cancel this booking?",
                        [
                          { text: "Keep Booking", style: "cancel" },
                          {
                            text: "Cancel Booking",
                            style: "destructive",
                            onPress: () => void CancelBooking(selectedBooking.id),
                          },
                        ],
                      )
                    }
                  >
                    <Text style={styles.cancelBookingButtonText}>
                      {isCancelling ? "Cancelling..." : "Cancel Booking"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            <Pressable
              style={styles.bookingDetailsClose}
              onPress={() => setShowBookingDetails(false)}
            >
              <Text style={styles.bookingDetailsCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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

        <View>
          <View style={styles.infoRow}>
            <Pressable
              style={styles.infoIconWrap}
              onPress={() => setShowFeeExplanation((isOpen) => !isOpen)}
              accessibilityRole="button"
              accessibilityLabel="Explain consultation and booking fees"
            >
              <Text style={styles.infoIcon}>i</Text>
            </Pressable>
            <Text style={styles.infoText}>
              Why different fees? Consultation vs. Booking Fee
            </Text>
            <Pressable
              onPress={() => setShowFeeExplanation((isOpen) => !isOpen)}
              accessibilityRole="button"
              accessibilityLabel={
                showFeeExplanation
                  ? "Hide fee explanation"
                  : "Show fee explanation"
              }
            >
              <ChevronDown
                color={Colors.TextColour}
                size={20}
                style={showFeeExplanation ? styles.chevronOpen : undefined}
              />
            </Pressable>
          </View>
          {showFeeExplanation ? (
            <View style={styles.feeExplanation}>
              <Text style={styles.feeExplanationText}>
                Consultation is part of the treatment process for returning
                clients. The booking fee applies to first-time clients who have
                never booked before.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.sectionTitle}>Select Treatment</Text>
      <SearchBar
        Placeholder="Search treatments"
        size="fullWidthCompact"
        value={treatmentSearch}
        onChangeText={setTreatmentSearch}
      />

      {treatments.length === 0 ? (
        <Text style={styles.emptyStateText}>Loading treatments...</Text>
      ) : filteredTreatments.length === 0 ? (
        <Text style={styles.emptyStateText}>
          No treatments match your search.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.treatmentScroller}
        >
          {filteredTreatments.map((treatment) => {
            const isSelected =
              selectedTreatmentId.find(
                (givenTreatment) => givenTreatment === treatment.id,
              ) === treatment.id;
            const priceLabel = treatment.cost
              ? `From R${Number(treatment.cost).toFixed(2)}`
              : "Price on request";

            return (
              <Pressable
                key={treatment.id}
                onPress={() => {
                  setSelectedTreatmentId((prevIds) =>
                    isSelected
                      ? prevIds.filter((id) => id !== treatment.id)
                      : [...prevIds, treatment.id],
                  );
                  setSelectedSlot([]);
                }}
                style={[
                  styles.treatmentCard,
                  isSelected && styles.treatmentCardSelected,
                ]}
              >
                <Text style={styles.treatmentName}>{treatment.value}</Text>
                <Text style={styles.treatmentMeta}>{priceLabel}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>Select Booking Date</Text>
      <BookingCalendar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <View style={styles.slotHeaderRow}>
        <Text style={styles.sectionTitle}>Available Slots</Text>
        <Text style={styles.dateLabel}>{selectedDayLabel}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotRow}
      >
        {defaultSlotOptions.map((slot) => {
          const hasTreatments = selectedTreatmentId.length > 0;
          const isAvailableStart = slotOptions.includes(slot);
          const active = selectedSlot.includes(slot);
          return (
            <Pressable
              key={slot}
              disabled={!hasTreatments || !isAvailableStart}
              onPress={() => {
                const availableSlots = defaultSlotOptions.filter(
                  (availableSlot) =>
                    !bookedSlotTimes.includes(availableSlot) &&
                    !isSlotElapsed(selectedDate, availableSlot),
                );
                setSelectedSlot(
                  getContiguousSlots(
                    slot,
                    Math.max(selectedTreatmentId.length, 1),
                    availableSlots,
                  ),
                );
              }}
              style={[
                styles.slotCard,
                active && styles.slotCardSelected,
                (!hasTreatments || !isAvailableStart) && styles.slotCardDisabled,
              ]}
            >
              <Text
                style={[
                  styles.slotText,
                  active && styles.slotTextSelected,
                  (!hasTreatments || !isAvailableStart) &&
                    styles.slotTextDisabled,
                ]}
              >
                {slot}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}></View>

        <View style={styles.summaryRowSecondary}>
          <Text style={styles.summaryLabelMuted}>Treatment</Text>
          <Text style={styles.summaryValueStrong}>
            {selectedTreatmentNames.join(", ") || "Not selected"}
          </Text>
        </View>

        <View style={styles.summaryRowSecondary}>
          <Text style={styles.summaryLabelMuted}>Slot</Text>
          <Text style={styles.summaryValueStrong}>
            {selectedDayLabel} •{" "}
            {selectedSlot.length > 0
              ? `${selectedSlot[0]} - ${selectedSlot[selectedSlot.length - 1]}`
              : "Not selected"}
          </Text>
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

  return clientType === "returning" ? (
    renderReturningClientScreen()
  ) : (
    <>
      {renderFirstTimeClientScreen()}
      <Modal
        visible={showBookingConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBookingConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <CheckCircle2
              color={Colors.Primary900}
              size={58}
              strokeWidth={2.5}
            />
            <Text style={styles.confirmationTitle}>Booking Confirmed</Text>
            <Text style={styles.confirmationMessage}>
              Your appointment has been successfully confirmed.
            </Text>
            <View style={styles.confirmationDetails}>
              <Text style={styles.confirmationDetailLabel}>Date</Text>
              <Text style={styles.confirmationDetailValue}>
                {selectedDayLabel}
              </Text>
              <Text style={styles.confirmationDetailLabel}>Time</Text>
              <Text style={styles.confirmationDetailValue}>
                {selectedSlot.join(", ")}
              </Text>
            </View>
            <Pressable
              style={styles.confirmationButton}
              onPress={() => {
                setShowBookingConfirmation(false);
              }}
            >
              <Text style={styles.confirmationButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
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
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  feeExplanation: {
    backgroundColor: "rgba(0,255,95,0.08)",
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  feeExplanationText: {
    color: Colors.TextColour,
    fontSize: 13,
    lineHeight: 19,
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
  treatmentScroller: {
    paddingRight: 6,
    paddingBottom: 4,
    gap: 12,
  },
  treatmentCard: {
    width: 180,
    minHeight: 108,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 12,
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
    marginBottom: 22,
    gap: 8,
  },
  slotCard: {
    width: 104,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  slotCardSelected: {
    backgroundColor: "rgba(0,255,95,0.22)",
  },
  slotCardDisabled: {
    opacity: 0.35,
  },
  slotText: {
    color: Colors.TextColour,
    fontSize: 14,
    fontWeight: "700",
  },
  slotTextSelected: {
    color: "#1b1b1b",
  },
  slotTextDisabled: {
    color: Colors.TextColour,
  },
  confirmationOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  confirmationModal: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    backgroundColor: "#10261A",
    borderColor: "rgba(0,255,95,0.55)",
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
  },
  confirmationTitle: {
    color: Colors.Primary900,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 14,
  },
  confirmationMessage: {
    color: Colors.TextColour,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  confirmationDetails: {
    alignSelf: "stretch",
    backgroundColor: "rgba(0,255,95,0.1)",
    borderRadius: 12,
    marginTop: 20,
    padding: 14,
  },
  confirmationDetailLabel: {
    color: Colors.TextColour,
    fontSize: 12,
    marginBottom: 2,
    opacity: 0.75,
  },
  confirmationDetailValue: {
    color: "#F5FFF7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  confirmationButton: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: Colors.Primary900,
    borderRadius: 12,
    marginTop: 6,
    paddingVertical: 14,
  },
  confirmationButtonText: {
    color: "#0B0F0D",
    fontSize: 16,
    fontWeight: "800",
  },
  bookingDetailsOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  bookingDetailsModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#10261A",
    borderColor: "rgba(0,255,95,0.55)",
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
  },
  bookingDetailsTitle: {
    color: Colors.Primary900,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 18,
  },
  bookingDetailsTreatment: {
    color: "#F5FFF7",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 14,
  },
  bookingDetailsLabel: {
    color: Colors.TextColour,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.75,
  },
  bookingDetailsValue: {
    color: "#F5FFF7",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  cancelBookingButton: {
    alignItems: "center",
    backgroundColor: "#B94A48",
    borderRadius: 12,
    marginTop: 22,
    paddingVertical: 14,
  },
  cancelBookingButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  bookingDetailsClose: {
    alignItems: "center",
    paddingVertical: 14,
  },
  bookingDetailsCloseText: {
    color: Colors.TextColour,
    fontSize: 15,
    fontWeight: "700",
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
  bookingCardPastDay: {
    borderColor: "rgba(196,154,90,0.75)",
    borderWidth: 1,
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
  bookingStatusTextPastDay: {
    color: "#C49A5A",
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
