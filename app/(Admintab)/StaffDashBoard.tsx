import Colors from "@/components/utils/Colours";
import { View, Text, StyleSheet } from "react-native";

const StaffDashBoard = () => {
  return (
    <View style={styles.Main}>
      <View>
        <Text style={{ color: Colors.Primary900, fontWeight: "bold" }}>
          STAFF PORTAL
        </Text>
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            paddingVertical: 30,
            fontSize: 25,
          }}
        >
          Customer List
          <Text style={{ color: Colors.TextColour }}> / Lookup</Text>
        </Text>
      </View>
      <View style={styles.CustomerSearchCard}></View>
    </View>
  );
};

export default StaffDashBoard;

const styles = StyleSheet.create({
  Main: {
    alignItems: "flex-start",
    paddingHorizontal: 50,
    paddingTop: 70,
    backgroundColor: Colors.PrimaryBackground,
    flex: 1,
  },
  CustomerSearchCard: {},
});
