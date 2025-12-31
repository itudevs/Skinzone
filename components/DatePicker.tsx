import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Colors from "./utils/Colours";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DatePickerProps {
  placeholder: string;
  value?: Date;
  onDateChange?: (date: Date) => void;
}

const DatePicker = ({ placeholder, value, onDateChange }: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(value);
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setTimeout(() => {
      setShow(false);
    }, 5000);
    if (selectedDate) {
      setDate(selectedDate);
      onDateChange?.(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShow(true)}>
        <TextInput
          style={styles.main}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={date ? formatDate(date) : ""}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChange}
          maximumDate={new Date()}
          textColor="#ffffff"
        />
      )}
    </View>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  main: {
    marginTop: 8,
    padding: 15,
    color: Colors.TextColour,
    backgroundColor: Colors.PrimaryBackground,
    borderColor: "#8b8b8bff",
    borderWidth: 0.5,
    borderRadius: 10,
  },
});
