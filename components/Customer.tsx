import { View, StyleSheet, Text, Pressable } from "react-native";
import { Theme, useTheme } from "./utils/Colours";
import CustomerModal from "./CustomerModal";
import { useState } from "react";
import { CustomerDetails } from "./utils/CustomerInterface";
const Customer = ({ id, Name, Surname, Phone }: CustomerDetails) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const togglemodal = () => {
    if (visible === true) {
      setVisible(false);
    }
  };
  let InitialName;
  let InitialSurname;
  if (Name != undefined) {
    InitialName = Name[0];
  }
  if (Surname != undefined) {
    InitialSurname = Surname[0];
  }
  return (
    <Pressable
      onPress={() => setVisible(true)}
      style={({ pressed }) => pressed && styles(theme).presseditem}
    >
      <View style={styles(theme).Main}>
        <Text style={styles(theme).TextUserContainer}>
          {InitialName}
          {InitialSurname}
        </Text>
        <View style={styles(theme).TextNameContainer}>
          <Text style={{ color: theme.TextColour, fontWeight: "bold" }}>
            {Name} {Surname}
          </Text>
        </View>
        <View style={styles(theme).TextNumberContainer}>
          <Text style={{ color: theme.Primary900, fontWeight: "bold" }}>
            {Phone}
          </Text>
        </View>
      </View>
      <CustomerModal
        Visible={visible}
        Onclose={togglemodal}
        id={id}
        Name={Name}
        Phone={Phone}
        Surname={Surname}
      />
    </Pressable>
  );
};

export default Customer;

const styles = (theme: Theme) => StyleSheet.create({
  Main: {
    flexDirection: "row",
    gap: 1,
    backgroundColor: theme.PrimaryBackground,
    overflow: "hidden",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    borderColor: theme.bordercolor,
    borderWidth: 0.3,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  TextUserContainer: {
    color: theme.TextColour,
    fontWeight: "bold",
    borderRadius: 25,
    padding: 10,
    backgroundColor: "#9595955c",
    borderColor: theme.bordercolor,
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
