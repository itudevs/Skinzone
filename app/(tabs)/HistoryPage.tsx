import PrimaryText from "@/components/PrimaryText";
import Colors from "@/components/utils/Colours";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Button,
  Image,
  ScrollView,
} from "react-native";
import {
  History,
  ChevronRight,
  Star,
  PartyPopper,
  Notebook,
} from "lucide-react-native";
import { Getvisitations } from "@/components/utils/GetUserData";
import Visitation from "@/components/Visitation";
import PrimaryButton from "@/components/PrimaryButton";
import { useState, useEffect } from "react";
import { UserSession } from "@/components/utils/GetUsersession";
import { Session } from "@supabase/supabase-js";
const HistoryPage = () => {
  const [isModalActive, setisModalActive] = useState(false);
  const [selectedvisit, setselectedvisit] = useState<any>(null);
  const [visitations, setvisitations] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(
    UserSession.getSession(),
  );
  useEffect(() => {
    setSession(UserSession.getSession());
  }, []);
  useEffect(() => {
    const fetchvisitation = async () => {
      const data = await Getvisitations(session?.user.id);
      setvisitations(data);
    };

    fetchvisitation();
  }, []);
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
          <ScrollView style={{ padding: 20 }}>
            {visitations.map((visit, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => pressed && styles.presseditem}
                onPress={() => {
                  setisModalActive(true);
                  setselectedvisit(visit);
                }}
              >
                <View style={styles.Visit}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: Colors.Primary900,
                        fontWeight: "medium",
                        paddingLeft: 10,
                      }}
                    >
                      Date:{" "}
                      {new Date(visit.visit_date)
                        .toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "bold",
                        padding: 10,
                      }}
                    >
                      {visit.customervisitlines?.[0]?.treatments
                        ?.treatmentname || "Unknown Service"}
                    </Text>
                  </View>
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      paddingRight: 15,
                    }}
                  >
                    <Pressable
                      style={({ pressed }) => pressed && styles.presseditem}
                      key={index}
                      onPress={() => {
                        setisModalActive(true);
                        setselectedvisit(visit);
                      }}
                    >
                      <ChevronRight size={40} color={Colors.TextColour} />
                    </Pressable>
                  </View>
                </View>
                <Text
                  style={{
                    color: Colors.TextColour,
                    paddingHorizontal: 15,
                    paddingBottom: 10,
                  }}
                >
                  -------------------------------------
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ alignItems: "center", padding: 20 }}>
            <PrimaryText children="Tap on row to view details" />
          </View>
        </View>
      </View>

      {selectedvisit && (
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
              <Text
                style={{ color: "white", fontSize: 32, fontWeight: "bold" }}
              >
                Visit Details
              </Text>

              <View style={styles.IconCard}>
                <View style={styles.TreatmentRow1}>
                  <Image
                    style={styles.logo}
                    source={require("../../assets/images/AltSkinzoneLogo.png")}
                  />
                  <View style={styles.treatmentTitleWrapper}>
                    <Text style={styles.treatmentTitle}>
                      {selectedvisit.customervisitlines?.[0]?.treatments
                        ?.treatmentname || "Unknown"}
                    </Text>
                  </View>
                </View>
                <View style={styles.TreatmentRow2}>
                  <View style={styles.halfinput}>
                    <PrimaryText children="DATE" />
                    <Text style={{ color: "white" }}>
                      {new Date(selectedvisit.visit_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.halfinput}>
                    <PrimaryText children="TIME" />
                    <Text style={{ color: "white" }}>----</Text>
                  </View>
                </View>
                <View style={styles.fullinput}>
                  <PrimaryText children="DURATION" />
                  <Text style={{ color: "white" }}>
                    {selectedvisit.customervisitlines?.[0]?.treatments
                      ?.duration_minutes || 0}{" "}
                    Minutes
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.pointsCard}>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsIcon}>
                  <Star color={"white"} />
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.pointsValue}>
                    +{selectedvisit.customervisitlines?.[0]?.treatments.points}
                    Points
                  </Text>
                  <Text style={styles.pointsSubtitle}>Earned this visit</Text>
                </View>
                <Text style={styles.pointsEmoji}>
                  <PartyPopper color={"white"} />
                </Text>
              </View>
            </View>
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Text style={styles.notesIcon}>
                  <Notebook color={"white"} />
                </Text>
                <Text style={styles.notesHeaderText}>COMMENTS / NOTES</Text>
              </View>
              <Text style={styles.notesCopy}>
                "{selectedvisit.notes || "No notes available"}"
              </Text>
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
                  {selectedvisit.staff?.name} {selectedvisit.staff?.surname[0]}
                </Text>
              </View>
            </View>
            <PrimaryButton
              text="Close Details"
              onPressHandler={() => setisModalActive(false)}
            />
          </View>
        </Modal>
      )}
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
  Visit: {
    flexDirection: "row",
  },
  presseditem: {
    opacity: 0.5,
  },
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
  pointsCard: {
    marginVertical: 8,
    marginHorizontal: 12,
    backgroundColor: "#0F6B38",
    borderRadius: 18,
    padding: 18,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsIcon: {
    fontSize: 28,
  },
  pointsValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  pointsSubtitle: {
    color: "#B8F0CD",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pointsEmoji: {
    fontSize: 24,
  },
  notesCard: {
    marginVertical: 8,
    marginHorizontal: 12,
    backgroundColor: "#111A16",
    borderRadius: 18,
    padding: 18,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  notesIcon: {
    fontSize: 18,
  },
  notesHeaderText: {
    color: "#8FA399",
    fontSize: 12,
    letterSpacing: 1,
    marginLeft: 8,
  },
  notesCopy: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
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
