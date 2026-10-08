import { View, TextInput, StyleSheet, Text, Pressable } from "react-native";

import { Search } from "lucide-react-native";
import { Theme, useTheme } from "./utils/Colours";
interface SearchProps {
  Placeholder: string;
  size?: "default" | "compact" | "fullWidthCompact";
  value?: string;
  onChangeText?: (text: string) => void;
  suggestions?: {
    id: string;
    name: string;
    surname: string;
    phone: string;
  }[];
  onSelectSuggestion?: (item: any) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}
const SearchBar = ({
  Placeholder,
  size = "default",
  value,
  onChangeText,
  suggestions = [],
  keyboardType,
  onSelectSuggestion,
}: SearchProps) => {
  const theme = useTheme();
  return (
    <View>
      <View
        style={[
          styles(theme).Main,
          size === "compact" && styles(theme).compactMain,
          size === "fullWidthCompact" && styles(theme).fullWidthCompactMain,
        ]}
      >
        <Search color={theme.TextColour} />
        <TextInput
          style={{ paddingHorizontal: 10, flex: 1, color: theme.TextColour }}
          placeholder={Placeholder}
          placeholderTextColor={theme.TextColour}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        ></TextInput>
      </View>
      {suggestions.length > 0 && (
        <View style={styles(theme).suggestionContainer}>
          {suggestions.slice(0, 5).map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles(theme).suggestionItem,
                pressed && styles(theme).suggestionItemPressed,
              ]}
              onPress={() => onSelectSuggestion && onSelectSuggestion(item)}
            >
              <Text style={styles(theme).suggestionPhone}>{item.phone}</Text>
              <Text style={styles(theme).suggestionName}>
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

const styles = (theme: Theme) => StyleSheet.create({
  Main: {
    flexDirection: "row",
    backgroundColor: theme.PrimaryBackground,
    padding: 20,
    margin: 30,
    marginBottom: 10,
    borderRadius: 20,
    borderColor: theme.TextColour,
    borderWidth: 0.3,
    alignItems: "center",
  },
  compactMain: {
    padding: 10,
    margin: 8,
    marginBottom: 8,
    borderRadius: 10,
  },
  fullWidthCompactMain: {
    padding: 10,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 12,
  },
  suggestionContainer: {
    backgroundColor: theme.PrimaryBackground,
    marginHorizontal: 30,
    borderRadius: 10,
    borderColor: theme.TextColour,
    borderWidth: 0.3,
    marginBottom: 20,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 0.3,
    borderBottomColor: theme.TextColour,
  },
  suggestionItemPressed: {
    backgroundColor: theme.Primary900,
  },
  suggestionPhone: {
    color: theme.TextColour,
    fontSize: 16,
    fontWeight: "bold",
  },
  suggestionName: {
    color: theme.TextColour,
    fontSize: 14,
    marginTop: 2,
  },
});
