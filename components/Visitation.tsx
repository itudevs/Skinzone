import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Image,
  Button,
  Alert,
  ScrollView,
} from "react-native";
import { Theme, useTheme } from "./utils/Colours";
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
  const theme = useTheme();
  const getVisitServices = (visit: any) =>
    (visit?.customervisitlines || [])
      .map((line: any) => line?.treatments?.Services)
      .filter(Boolean);
  const getVisitServiceNames = (visit: any) =>
    getVisitServices(visit)
      .map((service: any) => service.servicename)
      .filter(Boolean);
  const getVisitTotalCost = (visit: any) =>
    getVisitServices(visit).reduce(
      (total: number, service: any) => total + (Number(service.servicecost) || 0),
      0,
    );
  const getVisitDuration = (visit: any) =>
    getVisitServices(visit).filter(
      (service: any) => service.servicecategory === "treatment",
    ).length * 60;
  const [isModalActive, setisModalActive] = useState(false);
  const [selectedvisit, setselectedvisit] = useState<any | null>(null);
  const [visitations, setvisitations] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const getRawVisitPoints = useMemo(
    () => (visit: any) =>
      visit?.customervisitlines?.reduce(
        (acc: number, line: any) =>
          acc + Number(line?.treatments?.Services?.servicepoints || 0),
        0,
      ) || 0,
    [],
  );

  const getSignedVisitPoints = useMemo(
    () => (visit: any) => {
      const rawPoints = getRawVisitPoints(visit);
      const scaled = visit?.Freetreatment ? rawPoints * 10 : rawPoints;
      return visit?.Freetreatment ? -scaled : scaled;
    },
    [getRawVisitPoints],
  );

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
              const deletedVisitPointsRaw =
                targetVisit.customervisitlines?.reduce(
                  (acc: number, line: any) =>
                    acc +
                    Number(line?.treatments?.Services?.servicepoints || 0),
                  0,
                ) || 0;

              const deletedVisitPoints = targetVisit.Freetreatment
                ? deletedVisitPointsRaw * 10
                : deletedVisitPointsRaw;

              if (customerIdForInvalidation && deletedVisitPoints > 0) {
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
      const visitPoints = getSignedVisitPoints(visit);

      groups[dateKey].points += visitPoints;
    });

    // Sort by date descending
    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [visitations, getSignedVisitPoints]);

  return (
    <View>
      {groupedVisits.map((group, groupIndex) => (
        <View key={groupIndex} style={styles(theme).groupContainer}>
          <View style={styles(theme).groupHeader}>
            <Text style={styles(theme).groupDateText}>
              {new Date(group.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <View style={styles(theme).groupPointsBadge}>
              <Text style={styles(theme).groupPointsText}>
                {group.points > 0 ? `+${group.points}` : group.points} PTS
              </Text>
            </View>
          </View>

          {group.visits.map((visit, index) => (
            <View key={index}>
              <Pressable
                style={({ pressed }) => pressed && styles(theme).presseditem}
                onPress={() => {
                  setisModalActive(true);
                  setselectedvisit(visit);
                }}
              >
                <View style={styles(theme).visitCard}>
                  {/* 
                  Removed the date box from here as it's now in the group header.
                  Replaced with icon or just removed. 
                  The image shows an icon on the left (green icon).
                */}
                  <View style={styles(theme).serviceIconContainer}>
                    {getVisitServices(visit)[0]?.servicecategory === "product" ? (
                      <PartyPopper color={theme.Primary900} size={24} />
                    ) : (
                      <Star color={theme.Primary900} size={24} />
                    )}
                  </View>

                  <View style={styles(theme).visitInfo}>
                    <Text
                      style={styles(theme).visitService}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {getVisitServiceNames(visit).join(", ") || "Unknown Service"}
                    </Text>
                    <Text style={styles(theme).visitStylist}>
                      {getVisitServices(visit)
                        .map((service: any) => service.servicecategory)
                        .filter(Boolean)
                        .join(", ") || "Service"}
                    </Text>
                  </View>
                  <View style={styles(theme).pointsColumn}>
                    <Text style={styles(theme).pointsValueText}>
                      {getSignedVisitPoints(visit) > 0
                        ? `+${getSignedVisitPoints(visit)}`
                        : getSignedVisitPoints(visit)}
                    </Text>
                    <Text style={styles(theme).pointsLabelText}>POINTS</Text>
                  </View>
                </View>
              </Pressable>
              {allowDelete && (
                <Pressable
                  style={styles(theme).inlineDeleteButton}
                  onPress={() => handleDeleteVisit(visit)}
                >
                  <Text style={styles(theme).inlineDeleteButtonText}>
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
          <View style={styles(theme).ModalContainer}>
            <View></View>
            <ScrollView
              style={styles(theme).modalScroll}
              contentContainerStyle={styles(theme).modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles(theme).TreatmentCard}>
              <View
                style={{
                  padding: 1,
                  height: 5,
                  paddingHorizontal: 20,
                  backgroundColor: theme.TextColour,
                  borderRadius: 20,
                  marginTop: 3,
                  marginBottom: 8,
                }}
              >
                <Button title="" />
              </View>
              <Text
                style={{ color: theme.visitationItemText, fontSize: 32, fontWeight: "bold" }}
              >
                Visit Details
              </Text>

              <View style={styles(theme).IconCard}>
                {getVisitServices(selectedvisit).map((service: any, index: number) => {
                  const isProduct = service.servicecategory === "product";
                  const servicePoints = Number(service.servicepoints) || 0;
                  return (
                    <View key={`${service.servicename}-${index}`} style={styles(theme).serviceDetailRow}>
                      <View style={styles(theme).serviceDetailIcon}>
                        {isProduct ? (
                          <PartyPopper color={theme.Primary900} size={20} />
                        ) : (
                          <Star color={theme.Primary900} size={20} />
                        )}
                      </View>
                      <View style={styles(theme).serviceDetailInfo}>
                        <Text style={styles(theme).serviceDetailName}>
                          {service.servicename || "Unknown service"}
                        </Text>
                        <Text style={styles(theme).serviceDetailType}>
                          {isProduct ? "Product" : "Treatment"}
                        </Text>
                      </View>
                      <Text style={styles(theme).serviceDetailPoints}>
                        +{servicePoints} pts
                      </Text>
                    </View>
                  );
                })}
                <View style={styles(theme).TreatmentRow2}>
                  <View style={styles(theme).halfinput}>
                    <PrimaryText>DATE</PrimaryText>
                    <Text style={{ color: theme.TextColour }}>
                      {" "}
                      {new Date(selectedvisit.visit_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles(theme).halfinput}>
                    <PrimaryText>COST</PrimaryText>
                    <Text style={{ color: theme.TextColour }}>
                      R
                      {getVisitTotalCost(selectedvisit).toFixed(2)}
                    </Text>
                  </View>
                </View>
                {getVisitDuration(selectedvisit) > 0 && (
                    <View style={styles(theme).fullinput}>
                      <PrimaryText>DURATION</PrimaryText>
                      <Text style={{ color: theme.TextColour }}>
                        {getVisitDuration(selectedvisit)} Minutes
                      </Text>
                    </View>
                  )}
              </View>
            </View>
            <View style={styles(theme).pointsCard}>
              <View style={styles(theme).pointsRow}>
                <Text style={styles(theme).pointsIcon}>
                  <Star color={theme.visitationItemText} />
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles(theme).pointsValue}>
                    {getSignedVisitPoints(selectedvisit) > 0
                      ? `+${getSignedVisitPoints(selectedvisit)}`
                      : getSignedVisitPoints(selectedvisit)}{" "}
                    Points
                  </Text>
                  <Text style={styles(theme).pointsSubtitle}>
                    {selectedvisit?.Freetreatment
                      ? "Used on free claim"
                      : "Earned this visit"}
                  </Text>
                </View>
                <Text style={styles(theme).pointsEmoji}>
                  <PartyPopper color={theme.visitationItemText} />
                </Text>
              </View>
            </View>
            <View style={styles(theme).notesCard}>
              <View style={styles(theme).notesHeader}>
                <Text style={styles(theme).notesIcon}>
                  <Notebook color={theme.visitationItemText} />
                </Text>
                <Text style={styles(theme).notesHeaderText}>COMMENTS / NOTES</Text>
              </View>
              <Text
                style={styles(theme).notesCopy}
              >{`"${selectedvisit.notes || "No notes available"}"`}</Text>
            </View>
            <View style={styles(theme).therapistcontainer}>
              <Image
                style={styles(theme).therapistLogo}
                source={require("../assets/images/AltSkinzoneLogo.png")}
              />
              <View style={styles(theme).DetailsContainer}>
                <PrimaryText>THERAPIST</PrimaryText>
                <Text
                  style={{
                    color: theme.visitationItemText,
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
            </ScrollView>
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

const styles = (theme: Theme) => StyleSheet.create({
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
    color: theme.TextColour,
    fontSize: 16,
    fontWeight: "bold",
  },
  groupPointsBadge: {
    backgroundColor: theme.SecondaryColour100, // Dark green background for badge
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Primary900,
  },
  groupPointsText: {
    color: theme.Primary900,
    fontSize: 12,
    fontWeight: "bold",
  },
  visitCard: {
    flexDirection: "row",
    backgroundColor: theme.background100, // Dark card background
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.SecondaryColour100,
    borderRadius: 12,
    marginRight: 16,
  },
  visitInfo: {
    flex: 1,
  },
  visitService: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.TextColour,
    marginBottom: 4,
    flexShrink: 1,
  },
  visitStylist: {
    fontSize: 13,
    color: theme.TextColour,
  },
  pointsColumn: {
    alignItems: "flex-end",
  },
  pointsValueText: {
    color: theme.TextColour,
    fontSize: 16,
    fontWeight: "bold",
  },
  pointsLabelText: {
    color: theme.TextColour,
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
    backgroundColor: theme.visitationModalBackground,
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 12,
    width: "100%",
  },
  TreatmentCard: { alignItems: "center" },
  IconCard: {
    marginVertical: 15,
    width: "100%",
    backgroundColor: "#222c26ff",
    borderRadius: 15,
    padding: 14,
  },
  TreatmentRow1: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },
  serviceDetailRow: {
    alignItems: "center",
    backgroundColor: theme.background100,
    borderColor: theme.adminBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  serviceDetailIcon: {
    alignItems: "center",
    backgroundColor: theme.SecondaryColour100,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  serviceDetailInfo: {
    flex: 1,
  },
  serviceDetailName: {
    color: theme.TextColour,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  serviceDetailType: {
    color: theme.TextColour,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  serviceDetailPoints: {
    color: theme.Primary900,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },
  logo: {
    width: 60,
    height: 60,
    margin: 10,
    borderColor: theme.Primary900,
    borderWidth: 1,
    borderRadius: 15,
  },
  TreatmentRow2: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    width: "100%",
  },
  halfinput: {
    flex: 1,
    backgroundColor: theme.background100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fullinput: {
    marginVertical: 10,
    backgroundColor: theme.background100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  treatmentTitleWrapper: {
    flex: 1,
  },
  treatmentTitle: {
    color: theme.visitationItemText,
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
    color: theme.visitationItemText,
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
    color: theme.visitationItemText,
    fontSize: 12,
    letterSpacing: 1,
    marginLeft: 8,
  },
  notesCopy: {
    color: theme.visitationItemText,
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
