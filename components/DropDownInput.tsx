import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Theme, useTheme } from "./utils/Colours";
import { DropDownItems } from "./utils/utilinterfaces";
import SearchBar from "./SearchBar";
interface DropDownValues {
  value: string;
  id: string;
  DropDownItem: DropDownItems[];
  onSelect: (id: string, value: string) => void;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
}
const DropDownInput = ({
  onSelect,
  value,
  DropDownItem,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
}: DropDownValues) => {
  const theme = useTheme();
  const [expanded, setexpanded] = useState(false);
  const [selectedValue, setselectedValue] = useState(value);
  const Caret = expanded ? ChevronUp : ChevronDown;

  // Sync internal state with prop value when it changes
  useEffect(() => {
    setselectedValue(value);
  }, [value]);

  const handlepressitem = (item: DropDownItems) => {
    setselectedValue(item.value);
    onSelect(item.id, item.value);
    setexpanded(false);
  };
  const OpenCloseList = () => {
    if (expanded === false) {
      setexpanded(true);
    } else {
      setexpanded(false);
    }
  };

  return (
    <View style={{ marginVertical: 5 }}>
      <Pressable
        onPress={OpenCloseList}
        style={({ pressed }) => pressed && styles(theme).presseditem}
      >
        <View style={styles(theme).dropdown}>
          <Text style={styles(theme).text} numberOfLines={1} ellipsizeMode="tail">
            {selectedValue}
          </Text>
          <View style={styles(theme).careticon}>
            <Caret size={15} color={theme.TextColour} />
          </View>
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles(theme).listitems}>
          {onSearchChange && (
            <SearchBar
              Placeholder={searchPlaceholder}
              size="compact"
              value={searchValue}
              onChangeText={onSearchChange}
            />
          )}
          {DropDownItem.map((item, index) => (
            <View key={item.value}>
              <Pressable
                onPress={() => handlepressitem(item)}
                style={({ pressed }) => pressed && styles(theme).presseditem}
              >
                <Text style={{ color: theme.TextColour, padding: 10 }}>
                  {item.value}
                  {"("}
                  {item.points}
                  {"pts)"}
                </Text>
              </Pressable>
              {index < DropDownItem.length - 1 && (
                <View style={{ height: 4 }}></View>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};
export default DropDownInput;

const styles = (theme: Theme) => StyleSheet.create({
  dropdown: {
    backgroundColor: theme.PrimaryBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    marginRight: 20,
    paddingRight: 10,
  },
  listitems: {
    marginVertical: 5,
    backgroundColor: theme.PrimaryBackground,
    marginHorizontal: 20,
    marginRight: 30,
  },
  text: {
    padding: 10,
    color: theme.TextColour,
    flex: 1,
    marginRight: 10,
  },
  careticon: {
    paddingHorizontal: 5,
  },
  presseditem: {
    opacity: 0.5,
  },
});
