import { View, TextInput, StyleSheet, Text, Pressable } from "react-native";
interface SearchProps {
  Placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  suggestions?: Array<{
    id: string;
    name: string;
    surname: string;
    phone: string;
  }>;
  onSelectSuggestion?: (item: any) => void;
}
import { Search } from "lucide-react-native";
import Colors from "./utils/Colours";
const SearchBar = ({
  Placeholder,
  value,
  onChangeText,
  suggestions = [],
  onSelectSuggestion,
}: SearchProps) => {
  return (
    <View>
      <View style={styles.Main}>
        <Search color={Colors.TextColour} />
        <TextInput
          style={{ paddingHorizontal: 10, flex: 1, color: Colors.TextColour }}
          placeholder={Placeholder}
          placeholderTextColor={Colors.TextColour}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
        ></TextInput>
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionContainer}>
          {suggestions.slice(0, 5).map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.suggestionItem,
                pressed && styles.suggestionItemPressed,
              ]}
              onPress={() => onSelectSuggestion && onSelectSuggestion(item)}
            >
              <Text style={styles.suggestionPhone}>{item.phone}</Text>
              <Text style={styles.suggestionName}>
                {item.name} {item.surname}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
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
    marginBottom: 10,
    borderRadius: 20,
    borderColor: Colors.TextColour,
    borderWidth: 0.3,
    alignItems: "center",
  },
  suggestionContainer: {
    backgroundColor: Colors.PrimaryBackground,
    marginHorizontal: 30,
    borderRadius: 10,
    borderColor: Colors.TextColour,
    borderWidth: 0.3,
    marginBottom: 20,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 0.3,
    borderBottomColor: Colors.TextColour,
  },
  suggestionItemPressed: {
    backgroundColor: Colors.Primary900,
  },
  suggestionPhone: {
    color: Colors.TextColour,
    fontSize: 16,
    fontWeight: "bold",
  },
  suggestionName: {
    color: Colors.TextColour,
    fontSize: 14,
    marginTop: 2,
  },
});
