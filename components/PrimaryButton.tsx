import { Pressable, View, Text, StyleSheet } from "react-native";
import Colors from "./utils/Colours";
interface PrimaryButtonprops {
  text: string;
  onPressHandler: () => void;
}
const PrimaryButton = ({ text, onPressHandler }: PrimaryButtonprops) => {
  return (
    <Pressable
      onPress={onPressHandler}
      style={({ pressed }) => pressed && styles.presseditem}
    >
      {/*Button Container*/}
      <View style={styles.main}>
        <Text style={{ color: "black", fontWeight: "bold", fontSize: 15 }}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  main: {
    margin: 10,
    padding: 10,
    alignItems: "center",
    borderColor: "#00FF5F",
    borderWidth: 10,
    borderRadius: 10,
    backgroundColor: "#00FF5F",
    shadowColor: "#3fff85ff",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
  presseditem: {
    opacity: 0.5,
  },
});
