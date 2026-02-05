import { View, StyleSheet, Text, Pressable } from "react-native";
import Colors from "./utils/Colours";
import CustomerModal from "./CustomerModal";
import { useState } from "react";
import { CustomerDetails } from "./utils/CustomerInterface";
const Customer = ({ Name, Surname, Phone }: CustomerDetails) => {
  const [visible, setVisible] = useState(false);
  const togglemodal = () => {
    if (visible === true) {
      setVisible(false);
    }
  };
  return (
    <Pressable
      onPress={() => setVisible(true)}
      style={({ pressed }) => pressed && styles.presseditem}
    >
      <View style={styles.Main}>
        <Text style={styles.TextUserContainer}>
          {Name[0]}
          {Surname[0]}
        </Text>
        <View style={styles.TextNameContainer}>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {Name} {Surname}
          </Text>
        </View>
        <View style={styles.TextNumberContainer}>
          <Text style={{ color: Colors.Primary900, fontWeight: "bold" }}>
            {Phone}
          </Text>
        </View>
      </View>
      <CustomerModal
        Visible={visible}
        Onclose={togglemodal}
        Name={Name}
        Phone={Phone}
        Surname={Surname}
      />
    </Pressable>
  );
};

export default Customer;

const styles = StyleSheet.create({
  Main: {
    flexDirection: "row",
    gap: 1,
    backgroundColor: Colors.PrimaryBackground,
    overflow: "hidden",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 0.3,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  TextUserContainer: {
    color: "white",
    fontWeight: "bold",
    borderRadius: 25,
    padding: 10,
    backgroundColor: "#9595955c",
    borderColor: "white",
    borderWidth: 1,
    width: 40,
    height: 40,
    textAlign: "center",
    lineHeight: 20,
  },
  TextNameContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  TextNumberContainer: {
    paddingHorizontal: 10,
  },
  presseditem: {
    opacity: 0.5,
  },
});
