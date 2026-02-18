import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import Colors from "./utils/Colours";
interface FreeVisit {
  points: number;
}
const FreeVisit = ({ points }: FreeVisit) => {
  const [isModalActive, setisModalActive] = useState(false);
  const [selectedvisit, setselectedvisit] = useState<any | null>(null);
  return (
    <View>
      <Pressable
        style={({ pressed }) => pressed && styles.presseditem}
        onPress={() => {
          setisModalActive(true);
        }}
      >
        <View style={styles.visitCard}>
          <View style={styles.visitDate}>
            <Text style={styles.visitDateText}>FREE</Text>
          </View>
          <View style={styles.visitInfo}>
            <Text style={styles.visitService}>Select Free Treatment</Text>
            <Text style={styles.visitStylist}>Stylist: {""}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>{points} pts</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default FreeVisit;

const styles = StyleSheet.create({
  visitCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    alignItems: "center",
  },
  visitDate: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  visitDateText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666666",
    textAlign: "center",
    lineHeight: 16,
  },
  visitInfo: {
    flex: 1,
  },
  visitService: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  visitStylist: {
    fontSize: 13,
    color: "#666666",
  },
  pointsBadge: {
    backgroundColor: Colors.Primary900,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  presseditem: {
    opacity: 0.5,
  },
});
