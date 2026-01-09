import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Image,
  Button,
} from "react-native";
import Colors from "./Colours";
import { useState } from "react";
import PrimaryButton from "../PrimaryButton";
import PrimaryText from "../PrimaryText";
import DatePicker from "../DatePicker";

const Visitation = () => {
  const [isModalActive, setisModalActive] = useState(false);
  // Mock data - replace with real data from Supabase
  const visitations = [
    {
      date: "OCT-24",
      service: "Haircut & Style",
      stylist: "Sarah M.",
      Duration: "60 Mins",
      points: 100,
    },
    {
      date: "SEP-12",
      service: "Beard Trim",
      stylist: "Mike R.",
      Duration: "10 Mins",
      points: 50,
    },
    {
      date: "AUG-30",
      service: "Color Treatment",
      stylist: "Sarah M.",
      Duration: "25 Mins",
      points: 200,
    },
    {
      date: "AUG-05",
      service: "Consultation",
      stylist: "Alex T.",
      Duration: "30 Mins",
      points: 10,
    },
  ];

  return visitations.map((visit, index) => (
    <Pressable
      key={index}
      style={({ pressed }) => pressed && styles.presseditem}
      onPress={() => setisModalActive(true)}
    >
      <View style={styles.visitCard}>
        <View style={styles.visitDate}>
          <Text style={styles.visitDateText}>{visit.date}</Text>
        </View>
        <View style={styles.visitInfo}>
          <Text style={styles.visitService}>{visit.service}</Text>
          <Text style={styles.visitStylist}>Stylist: {visit.stylist}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>+{visit.points} pts</Text>
        </View>
      </View>
      <Modal
        visible={isModalActive}
        onRequestClose={() => setisModalActive(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.ModalContainer}>
          <View></View>
          <View style={styles.TreatmentCard}>
            <View
              style={{
                padding: 1,
                height: 5,
                paddingHorizontal: 20,
                backgroundColor: Colors.TextColour,
                borderRadius: 20,
                marginTop: 3,
                marginBottom: 8,
              }}
            >
              <Button title="" />
            </View>
            <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
              Visit Details
            </Text>
            <PrimaryText children="Reciept ID:" />
            <View style={styles.IconCard}>
              <View style={styles.TreatmentRow1}>
                <Image
                  style={styles.logo}
                  source={require("../../assets/images/AltSkinzoneLogo.png")}
                />
                <View style={styles.treatmentTitleWrapper}>
                  <Text style={styles.treatmentTitle}>{visit.service}</Text>
                </View>
              </View>
              <View style={styles.TreatmentRow2}>
                <View style={styles.halfinput}>
                  <PrimaryText children="DATE" />
                  <Text style={{ color: "white" }}>{visit.date}</Text>
                </View>
                <View style={styles.halfinput}>
                  <PrimaryText children="TIME" />
                  <Text style={{ color: "white" }}>----</Text>
                </View>
              </View>
              <View style={styles.fullinput}>
                <PrimaryText children="DURATION" />
                <Text style={{ color: "white" }}>{visit.Duration}</Text>
              </View>
            </View>
          </View>
          <View style={styles.therapistcontainer}>
            <Image
              style={styles.therapistLogo}
              source={require("../../assets/images/AltSkinzoneLogo.png")}
            />
            <View style={styles.DetailsContainer}>
              <PrimaryText children="THERAPIST" />
              <Text
                style={{
                  color: "white",
                  padding: 5,
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >
                {visit.stylist}
              </Text>
            </View>
          </View>
          <PrimaryButton
            text="Close Details"
            onPressHandler={() => setisModalActive(false)}
          />
        </View>
      </Modal>
    </Pressable>
  ));
};
export default Visitation;

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
  ModalContainer: {
    backgroundColor: "#0E1C14",
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  TreatmentCard: { alignItems: "center" },
  IconCard: {
    marginVertical: 15,
    marginHorizontal: 12,
    backgroundColor: "#222c26ff",
    borderRadius: 15,
    padding: 10,
    paddingHorizontal: 30,
  },
  TreatmentRow1: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 60,
    height: 60,
    margin: 10,
    borderColor: Colors.Primary900,
    borderWidth: 1,
    borderRadius: 15,
  },
  TreatmentRow2: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  halfinput: {
    flex: 1,
    backgroundColor: Colors.background100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fullinput: {
    marginVertical: 10,
    backgroundColor: Colors.background100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  treatmentTitleWrapper: {
    flex: 1,
  },
  treatmentTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    paddingVertical: 15,
    width: "100%",
  },
  therapistLogo: {
    width: 40,
    height: 40,
    borderRadius: 40,
  },
  therapistcontainer: {
    marginVertical: 5,
    marginHorizontal: 12,
    backgroundColor: "#222c26ff",
    borderRadius: 15,
    padding: 10,
    paddingHorizontal: 30,
    flexDirection: "row",
  },
  DetailsContainer: {},
});
