import { useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList } from "react-native";
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
  var Caret = expanded ? ChevronUp : ChevronDown;
  let DATA = DropDownItem;
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
          <Text style={styles.text}>{selectedValue}</Text>
          <View style={styles.careticon}>
            <Caret size={15} color={Colors.TextColour} />
          </View>
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.listitems}>
          <FlatList
            keyExtractor={(item) => item.value}
            data={DATA}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlepressitem(item)}
                style={({ pressed }) => pressed && styles.presseditem}
              >
                <Text style={{ color: "white", padding: 10 }}>
                  {item.value}
                </Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 4 }}></View>}
          ></FlatList>
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
    borderRadius: 10,
    marginRight: 20,
  },
  listitems: {
    marginVertical: 5,
    backgroundColor: Colors.PrimaryBackground,
    marginHorizontal: 20,
    marginRight: 30,
  },
  text: { padding: 10, color: "white" },
  careticon: { paddingLeft: 140 },
  presseditem: {
    opacity: 0.5,
  },
});
