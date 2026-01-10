import PrimaryText from "@/components/PrimaryText";
import Colors from "@/components/utils/Colours";
import { View, Text, StyleSheet, Platform } from "react-native";
import { History } from "lucide-react-native";
const HistoryPage = () => {
  return (
    <View style={styles.Container}>
      <View style={styles.header}>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 40 }}>
          History
        </Text>
        <PrimaryText children="Track your loyalty visitations" />
      </View>
      <View style={styles.CardContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 15,
          }}
        >
          <Text style={{ color: Colors.Primary900, padding: 15 }}>Logs</Text>
          <History color={Colors.TextColour} size={20} />
        </View>
        <View style={styles.InnerCard}>
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 20,
              paddingHorizontal: 15,
              paddingTop: 20,
              paddingBottom: 10,
            }}
          >
            VISITS
          </Text>
          <Text
            style={{
              color: Colors.TextColour,
              paddingHorizontal: 15,
              paddingBottom: 10,
            }}
          >
            ---------------------------------------------
          </Text>
          <View></View>
          <Text
            style={{
              color: Colors.TextColour,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
              textAlign: "center",
              paddingVertical: 25,
            }}
          >
            Tap on row to view details
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HistoryPage;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: "#000000ff",
    flex: 1,
    paddingTop: 90,
    paddingLeft: 35,
    paddingHorizontal: 20,
  },
  header: {},
  CardContainer: {
    marginVertical: 40,
    backgroundColor: Colors.background100,
    borderColor: Colors.bordercolor,
    borderWidth: 1,
    borderRadius: 20,
    paddingBottom: 0,
  },
  InnerCard: {
    backgroundColor: Colors.PrimaryBackground,
    borderColor: Colors.bordercolor,
    borderWidth: 0.5,
    borderRadius: 20,
  },
});
