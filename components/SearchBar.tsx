import { View, TextInput, StyleSheet } from "react-native";
interface SearchProps {
  Placeholder: string;
}
import { Search } from "lucide-react-native";
import Colors from "./utils/Colours";
const SearchBar = ({ Placeholder }: SearchProps) => {
  return (
    <View style={styles.Main}>
      <Search color={Colors.TextColour} />
      <TextInput
        style={{ paddingHorizontal: 10 }}
        placeholder={Placeholder}
      ></TextInput>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  Main: {
    flexDirection: "row",
    backgroundColor: Colors.PrimaryBackground,
    padding: 20,
    margin: 30,
    borderRadius: 20,
    borderColor: Colors.TextColour,
    borderWidth: 0.3,
  },
});
