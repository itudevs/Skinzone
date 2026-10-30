import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Theme, useTheme } from "./utils/Colours";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DatePickerProps {
  placeholder: string;
  value?: Date;
  onDateChange?: (date: Date) => void;
}

const DatePicker = ({ placeholder, value, onDateChange }: DatePickerProps) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  const onChange = (_event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
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
          style={styles(theme).main}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={value ? formatDate(value) : ""}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChange}
          maximumDate={new Date()}
          textColor={theme.TextColour}
        />
      )}
    </View>
  );
};

export default DatePicker;

const styles = (theme: Theme) => StyleSheet.create({
  main: {
    marginTop: 8,
    padding: 15,
    color: theme.TextColour,
    backgroundColor: theme.PrimaryBackground,
    borderColor: theme.bordercolor,
    borderWidth: 0.5,
    borderRadius: 10,
  },
});
