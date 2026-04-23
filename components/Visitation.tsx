import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Image,
  Button,
  Alert,
} from "react-native";
import Colors from "./utils/Colours";
import { useEffect, useState, useMemo } from "react";
import PrimaryButton from "./PrimaryButton";
import PrimaryText from "./PrimaryText";
import { Star, Notebook, PartyPopper } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { CustomerDetails } from "./utils/CustomerInterface";
import { Getvisitations } from "./utils/GetUserData";
import { cacheManager } from "@/lib/cache";

interface VisitationProps extends CustomerDetails {
  limit?: number;
  visitsData?: any[];
  allowDelete?: boolean;
  onVisitDeleted?: (csid: number) => void;
}

const Visitation = ({
  id,
  limit = 5,
  visitsData,
  allowDelete = false,
  onVisitDeleted,
}: VisitationProps) => {
  const [isModalActive, setisModalActive] = useState(false);
  const [selectedvisit, setselectedvisit] = useState<any | null>(null);
  const [visitations, setvisitations] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteVisit = (visitToDelete?: any) => {
    const targetVisit = visitToDelete || selectedvisit;
    if (!targetVisit?.csid || isDeleting) return;

    Alert.alert(
      "Delete Record",
      "Delete this recorded treatment/product for the selected client?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              const visitId = targetVisit.csid;

              const { error: lineDeleteError } = await supabase
                .from("customervisitlines")
                .delete()
                .eq("csid", visitId);

              if (lineDeleteError) {
                Alert.alert("Error 2", lineDeleteError.message);
                setIsDeleting(false);
                return;
              }

              let { data: deletedVisitRows, error: visitDeleteError } =
                await supabase
                  .from("customervisits")
                  .delete()
                  .eq("csid", visitId)
                  .select("csid");

              if (visitDeleteError) {
                Alert.alert("Error", visitDeleteError.message);
                setIsDeleting(false);
                return;
              }

              if (!deletedVisitRows || deletedVisitRows.length === 0) {
                // Delete may return no error but still affect 0 rows (e.g. RLS policy).
                const { data: existingVisit } = await supabase
                  .from("customervisits")
                  .select("csid")
                  .eq("csid", visitId)
                  .maybeSingle();

                if (existingVisit) {
                  Alert.alert(
                    "Delete Failed",
                    "Record is still in database. Check delete permissions/policies for customervisits.",
                  );
                  setIsDeleting(false);
                  return;
                }
              }

              const customerIdForInvalidation =
                targetVisit.customerid || id || "";

              // Free-treatment claims increase User.pointsused when claimed.
              // Reverse that usage when such a visit is deleted.
              const deletedVisitPoints =
                targetVisit.customervisitlines?.reduce(
                  (acc: number, line: any) =>
                    acc +
                    Number(line?.treatments?.Services?.servicepoints || 0),
                  0,
                ) || 0;

              if (
                targetVisit.Freetreatment &&
                customerIdForInvalidation &&
                deletedVisitPoints > 0
              ) {
                const { data: userData, error: userFetchError } = await supabase
                  .from("User")
                  .select("pointsused")
                  .eq("id", customerIdForInvalidation)
                  .single();

                if (!userFetchError) {
                  const currentPointsUsed = Number(userData?.pointsused || 0);
                  const newPointsUsed = Math.max(
                    0,
                    currentPointsUsed - deletedVisitPoints,
                  );

                  const { error: updatePointsUsedError } = await supabase
                    .from("User")
                    .update({ pointsused: newPointsUsed })
                    .eq("id", customerIdForInvalidation);

                  if (updatePointsUsedError) {
                    Alert.alert(
                      "Warning",
                      "Visit deleted, but points balance could not be fully updated.",
                    );
                  }
                }
              }

              if (customerIdForInvalidation) {
                await cacheManager.invalidatePattern(
                  `visitations_${customerIdForInvalidation}`,
                );
                await cacheManager.invalidatePattern(
                  `points_${customerIdForInvalidation}`,
                );
                await cacheManager.invalidatePattern(
                  `lastvisit_${customerIdForInvalidation}`,
                );
              }

              setvisitations((prev) =>
                prev.filter((visit) => visit.csid !== visitId),
              );
              if (selectedvisit?.csid === visitId) {
                setselectedvisit(null);
                setisModalActive(false);
              }
              onVisitDeleted?.(visitId);
              Alert.alert("Success", "Recorded treatment/product removed.");
            } catch {
              Alert.alert(
                "Error",
                "Failed to delete record. Please try again.",
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (visitsData) {
      setvisitations(visitsData);
      return;
    }

    if (!id) {
      setvisitations([]);
      return;
    }

    const fetchvisitation = async () => {
      const data = await Getvisitations(id, limit);
      setvisitations(data);
    };

    fetchvisitation();
  }, [id, limit, visitsData]);

  const groupedVisits = useMemo(() => {
    const groups: {
      [key: string]: { date: string; points: number; visits: any[] };
    } = {};

    visitations.forEach((visit) => {
      // Use date string as key to group by day
      const dateKey = new Date(visit.visit_date).toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: visit.visit_date,
          points: 0,
          visits: [],
        };
      }

      groups[dateKey].visits.push(visit);

      // Accumulate points for the day
      // Assuming structure as per existing code: visit.customervisitlines?.[0]...
      // Note: A single visit might have multiple lines, so we should sum up all lines if applicable.
      // But based on existing code, it seems to only look at the first line [0].
      // I'll stick to summing up what's available, iterating if there are multiple lines would be better but
      // sticking to existing pattern for now, assuming 1 main service per visit entry or just taking from the lines.
      // Actually, let's look at all lines if possible, but the existing rendering creates one card per visit.
      // If a visit has multiple lines, they are part of the same visit.
      // The current code only displays the first line's service name.
      // I will sum points from all lines if possible, or just the first one to match existing logic.
      // Let's iterate lines to be safe for points.
      const visitPoints =
        visit.customervisitlines?.reduce(
          (acc: number, line: any) =>
            acc + (line.treatments?.Services?.servicepoints || 0),
          0,
        ) || 0;

      groups[dateKey].points += visitPoints;
    });

    // Sort by date descending
    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [visitations]);

  return (
    <View>
      {groupedVisits.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.groupContainer}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupDateText}>
              {new Date(group.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <View style={styles.groupPointsBadge}>
              <Text style={styles.groupPointsText}>+{group.points} PTS</Text>
            </View>
          </View>

          {group.visits.map((visit, index) => (
            <View key={index}>
              <Pressable
                style={({ pressed }) => pressed && styles.presseditem}
                onPress={() => {
                  setisModalActive(true);
                  setselectedvisit(visit);
                }}
              >
                <View style={styles.visitCard}>
                  {/* 
                  Removed the date box from here as it's now in the group header.
                  Replaced with icon or just removed. 
                  The image shows an icon on the left (green icon).
                */}
                  <View style={styles.serviceIconContainer}>
                    {visit.customervisitlines?.[0]?.treatments?.Services
                      ?.servicecategory === "product" ? (
                      <PartyPopper color={Colors.Primary900} size={24} />
                    ) : (
                      <Star color={Colors.Primary900} size={24} />
                    )}
                  </View>

                  <View style={styles.visitInfo}>
                    <Text style={styles.visitService}>
                      {visit.customervisitlines?.[0]?.treatments?.Services
                        ?.servicename || "Unknown Service"}
                    </Text>
                    <Text style={styles.visitStylist}>
                      {visit.customervisitlines?.[0]?.treatments?.Services
                        ?.servicecategory || "Service"}
                    </Text>
                  </View>
                  <View style={styles.pointsColumn}>
                    <Text style={styles.pointsValueText}>
                      +
                      {visit.customervisitlines?.reduce(
                        (acc: number, line: any) =>
                          acc + (line.treatments?.Services?.servicepoints || 0),
                        0,
                      ) || 0}
                    </Text>
                    <Text style={styles.pointsLabelText}>POINTS</Text>
                  </View>
                </View>
              </Pressable>
              {allowDelete && (
                <Pressable
                  style={styles.inlineDeleteButton}
                  onPress={() => handleDeleteVisit(visit)}
                >
                  <Text style={styles.inlineDeleteButtonText}>
                    {isDeleting ? "Deleting..." : "Delete Treatment/Product"}
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      ))}

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
                    source={require("../assets/images/AltSkinzoneLogo.png")}
                  />
                  <View style={styles.treatmentTitleWrapper}>
                    <Text style={styles.treatmentTitle}>
                      {selectedvisit.customervisitlines?.[0]?.treatments
                        ?.Services?.servicename || "Unknown"}
                    </Text>
                    <Text style={{ color: Colors.Primary900, fontSize: 12 }}>
                      {selectedvisit.customervisitlines?.[0]?.treatments
                        ?.Services?.servicecategory === "treatment"
                        ? "Treatment"
                        : "Product"}
                    </Text>
                  </View>
                </View>
                <View style={styles.TreatmentRow2}>
                  <View style={styles.halfinput}>
                    <PrimaryText>DATE</PrimaryText>
                    <Text style={{ color: "white" }}>
                      {" "}
                      {new Date(selectedvisit.visit_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.halfinput}>
                    <PrimaryText>COST</PrimaryText>
                    <Text style={{ color: "white" }}>
                      R
                      {selectedvisit.customervisitlines?.[0]?.treatments
                        ?.Services?.servicecost || 0}
                    </Text>
                  </View>
                </View>
                {selectedvisit.customervisitlines?.[0]?.treatments?.Services
                  ?.servicecategory === "treatment" &&
                  selectedvisit.customervisitlines?.[0]?.treatments
                    ?.duration_minutes && (
                    <View style={styles.fullinput}>
                      <PrimaryText>DURATION</PrimaryText>
                      <Text style={{ color: "white" }}>
                        {
                          selectedvisit.customervisitlines?.[0]?.treatments
                            ?.duration_minutes
                        }{" "}
                        Minutes
                      </Text>
                    </View>
                  )}
              </View>
            </View>
            <View style={styles.pointsCard}>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsIcon}>
                  <Star color={"white"} />
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.pointsValue}>
                    +
                    {selectedvisit.customervisitlines?.[0]?.treatments?.Services
                      ?.servicepoints || 0}{" "}
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
              <Text
                style={styles.notesCopy}
              >{`"${selectedvisit.notes || "No notes available"}"`}</Text>
            </View>
            <View style={styles.therapistcontainer}>
              <Image
                style={styles.therapistLogo}
                source={require("../assets/images/AltSkinzoneLogo.png")}
              />
              <View style={styles.DetailsContainer}>
                <PrimaryText>THERAPIST</PrimaryText>
                <Text
                  style={{
                    color: "white",
                    padding: 5,
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >
                  {selectedvisit.staff?.name}{" "}
                  {selectedvisit.staff?.surname?.[0] || ""}
                </Text>
              </View>
            </View>
            {allowDelete && (
              <PrimaryButton
                text={isDeleting ? "Deleting..." : "Delete Record"}
                onPressHandler={() => handleDeleteVisit()}
              />
            )}
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
export default Visitation;

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  groupDateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  groupPointsBadge: {
    backgroundColor: Colors.SecondaryColour100, // Dark green background for badge
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Primary900,
  },
  groupPointsText: {
    color: Colors.Primary900,
    fontSize: 12,
    fontWeight: "bold",
  },
  visitCard: {
    flexDirection: "row",
    backgroundColor: Colors.background100, // Dark card background
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.SecondaryColour100,
    borderRadius: 12,
    marginRight: 16,
  },
  visitInfo: {
    flex: 1,
  },
  visitService: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  visitStylist: {
    fontSize: 13,
    color: Colors.TextColour,
  },
  pointsColumn: {
    alignItems: "flex-end",
  },
  pointsValueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  pointsLabelText: {
    color: Colors.TextColour,
    fontSize: 10,
    textTransform: "uppercase",
  },
  presseditem: {
    opacity: 0.7,
  },
  inlineDeleteButton: {
    alignSelf: "flex-end",
    backgroundColor: "#2A1111",
    borderColor: "#B83232",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  inlineDeleteButtonText: {
    color: "#FF8A8A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
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
