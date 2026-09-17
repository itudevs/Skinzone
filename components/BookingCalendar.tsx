import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Colors from "./utils/Colours";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface BookingCalendarProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const BookingCalendar = ({
  selectedDate = new Date(2026, 2, 19),
  onDateChange,
}: BookingCalendarProps) => {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const [activeDate, setActiveDate] = useState<Date>(selectedDate);

  useEffect(() => {
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
    setActiveDate(selectedDate);
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const items: {
      date: Date;
      isCurrentMonth: boolean;
      isMuted: boolean;
    }[] = [];

    for (let i = 0; i < startDayIndex; i += 1) {
      const day = prevMonthLastDate - startDayIndex + i + 1;
      items.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        isMuted: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        isMuted: false,
      });
    }

    while (items.length % 7 !== 0) {
      const nextDay = items.length - (daysInMonth + startDayIndex) + 1;
      items.push({
        date: new Date(year, month + 1, nextDay),
        isCurrentMonth: false,
        isMuted: true,
      });
    }

    return items;
  }, [visibleMonth]);

  const handlePress = (date: Date) => {
    setActiveDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onDateChange?.(date);
  };

  const changeMonth = (direction: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + direction,
      1,
    );
    setVisibleMonth(nextMonth);
  };

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeaderRow}>
        <Text style={styles.monthTitle}>
          {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </Text>
        <View style={styles.navArrows}>
          <Pressable
            style={styles.arrowButton}
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
          >
            <ArrowLeft color={Colors.TextColour} size={18} />
          </Pressable>
          <Pressable
            style={styles.arrowButton}
            onPress={() => changeMonth(1)}
            accessibilityRole="button"
          >
            <ArrowRight color={Colors.TextColour} size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.gridHeader}>
        {weekDays.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.gridWeekday}>
            {day}
          </Text>
        ))}
      </View>

      {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map(
        (_, weekIndex) => {
          const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);

          return (
            <View key={`week-${weekIndex}`} style={styles.gridRow}>
              {week.map((cell, dayIndex) => {
                const isSelected =
                  cell.date.toDateString() === activeDate.toDateString();

                return (
                  <Pressable
                    key={`${weekIndex}-${dayIndex}-${cell.date.toISOString()}`}
                    onPress={() => handlePress(cell.date)}
                    style={[
                      styles.dateCell,
                      isSelected && styles.dateCellSelected,
                      cell.isMuted && styles.dateCellMuted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isSelected && styles.dateTextSelected,
                        cell.isMuted && styles.dateTextMuted,
                      ]}
                    >
                      {cell.date.getDate()}
                    </Text>
                    {cell.date.getDate() === 16 ||
                    cell.date.getDate() === 18 ? (
                      <View style={styles.dateDot} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          );
        },
      )}
    </View>
  );
};

export default BookingCalendar;

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthTitle: {
    color: Colors.Primary900,
    fontSize: 24,
    fontWeight: "700",
  },
  navArrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  gridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  gridWeekday: {
    flex: 1,
    color: Colors.TextColour,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateCell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dateCellSelected: {
    backgroundColor: Colors.Primary900,
  },
  dateCellMuted: {
    opacity: 0.4,
  },
  dateText: {
    color: Colors.TextColour,
    fontSize: 13,
    fontWeight: "600",
  },
  dateTextSelected: {
    color: "#111315",
    fontWeight: "800",
  },
  dateTextMuted: {
    color: "#a4a4a4",
  },
  dateDot: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.Primary900,
  },
});
