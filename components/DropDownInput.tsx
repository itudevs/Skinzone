import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "./utils/Colours";
import { DropDownItems } from "./utils/utilinterfaces";
interface DropDownValues {
  value: string;
  id: string;
  DropDownItem: DropDownItems[];
  onSelect: (id: string, value: string) => void;
}
const DropDownInput = ({ onSelect, value, DropDownItem }: DropDownValues) => {
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
        style={({ pressed }) => pressed && styles.presseditem}
      >
        <View style={styles.dropdown}>
          <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
            {selectedValue}
          </Text>
          <View style={styles.careticon}>
            <Caret size={15} color={Colors.TextColour} />
          </View>
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.listitems}>
          {DropDownItem.map((item, index) => (
            <View key={item.value}>
              <Pressable
                onPress={() => handlepressitem(item)}
                style={({ pressed }) => pressed && styles.presseditem}
              >
                <Text style={{ color: "white", padding: 10 }}>
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

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: Colors.PrimaryBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    marginRight: 20,
    paddingRight: 10,
  },
  listitems: {
    marginVertical: 5,
    backgroundColor: Colors.PrimaryBackground,
    marginHorizontal: 20,
    marginRight: 30,
  },
  text: {
    padding: 10,
    color: "white",
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
