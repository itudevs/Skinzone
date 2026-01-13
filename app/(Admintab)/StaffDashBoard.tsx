import Colors from "@/components/utils/Colours";
import { View, Text, StyleSheet } from "react-native";
import SearchBar from "../../components/SearchBar";
import PrimaryText from "@/components/PrimaryText";

const StaffDashBoard = () => {
  return (
    <View style={{ backgroundColor: Colors.PrimaryBackground, flex: 1 }}>
      <View style={styles.Main}>
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
      <View style={styles.CustomerSearchCard}>
        <Text
          style={{
            color: Colors.TextColour,
            paddingTop: "10%",
            paddingLeft: "10%",
          }}
        >
          SEARCH BY PHONE/NAME
        </Text>
        <View style={{}}>
          <SearchBar Placeholder="Type Customer info..." />

          <Text
            style={{
              fontWeight: "bold",
              color: Colors.TextColour,
              marginLeft: "10%",
            }}
          >
            RECENT RESULTS
          </Text>
        </View>
      </View>
    </View>
  );
};

export default StaffDashBoard;

const styles = StyleSheet.create({
  Main: {
    alignItems: "flex-start",
    paddingHorizontal: 50,
    paddingTop: 70,
  },
  CustomerSearchCard: {
    backgroundColor: Colors.background100,
    flex: 1,
    borderRadius: 30,
  },
});
