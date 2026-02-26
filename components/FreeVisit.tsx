import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { PlusCircle, X } from "lucide-react-native";
import { useState, useEffect } from "react";
import PrimaryButton from "./PrimaryButton";
import PrimaryText from "./PrimaryText";
import Colors from "./utils/Colours";
import DropDownInput from "./DropDownInput";
import { GetTreatments } from "./utils/Gettreatment";
import { DropDownItems } from "./utils/utilinterfaces";
import { supabase } from "@/lib/supabase";
import {
  CustomerVisitInsert,
  CustomerVisitLineInsert,
} from "./utils/DatabaseTypes";
interface FreeVisit {
  points: number;
  customerid: string;
  onClaimSuccess?: () => void;
}
const FreeVisit = ({ points, customerid, onClaimSuccess }: FreeVisit) => {
  const [isModalActive, setisModalActive] = useState(false);
  const [selectedvisit, setselectedvisit] = useState<any | null>(null);
  const [clicked, setclicked] = useState(false);
  const [selectedtreatmentid, setselectedtreatmentid] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
  const [staff, setstaff] = useState<DropDownItems[]>([]);
  const [amountpaid, setamountpaid] = useState("0.00");
  const [notes, setnotes] = useState("");
  const [selectedTreatmentName, setSelectedTreatmentName] = useState(
    "Select Free Treatment",
  );

  const handleStaffSelect = (id: string, value: string) => {
    setSelectedStaffId(id);
  };

  const handletreatment = (id: string, value: string) => {
    setselectedtreatmentid(id);
    setSelectedTreatmentName(value);
    // Find the treatment and set the amount
    const selectedTreatment = treatment.find((t) => t.id === id);
    if (selectedTreatment && selectedTreatment.cost) {
      setamountpaid(selectedTreatment.cost);
    } else {
      setamountpaid("0.00");
    }
  };
  useEffect(() => {
    if (!isModalActive) return;
    let mounted = true;

    // Fetch treatments
    GetTreatments().then((y) => {
      if (mounted) {
        settreatment(y);
      }
    });

    // Fetch staff
    const GetStaff = async () => {
      const { data, error } = await supabase
        .from("User")
        .select("id,name")
        .eq("role", "staff");

      if (error) {
        Alert.alert("Error", "error occured while fetching staff");
        return [];
      }

      if (data && data.length > 0) {
        return data.map((staff) => ({
          id: staff.id,
          value: staff.name,
        }));
      }
      return [];
    };

    GetStaff().then((s) => {
      if (mounted) {
        setstaff(s);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isModalActive]);

  const AddCLAIMHandler = async () => {
    if (clicked) return;

    // Validate treatment selection
    if (!selectedtreatmentid) {
      Alert.alert("Error", "Please select a treatment");
      return;
    }

    // Validate staff selection
    if (!selectedStaffId) {
      Alert.alert("Error", "Please select a staff member");
      return;
    }

    // Find the selected treatment
    const selectedTreatment = treatment.find(
      (t) => t.id === selectedtreatmentid,
    );

    if (!selectedTreatment) {
      Alert.alert("Error", "Invalid treatment selection");
      return;
    }

    // Check if user has enough points
    const requiredPoints = selectedTreatment.points
      ? parseInt(selectedTreatment.points)
      : 0;
    const availablePoints = points; // points is already 10% of total balance
    const totalBalance = points * 10; // Calculate total balance for display

    if (availablePoints < requiredPoints) {
      Alert.alert(
        "Not Enough Points",
        `You need ${requiredPoints} points to claim this treatment. Your total balance is ${totalBalance.toFixed(0)} points (${availablePoints.toFixed(2)} points available for claims).`,
      );
      return;
    }

    // Proceed with claim
    setclicked(true);

    try {
      // Insert free visit with actual amount paid
      const visitData: CustomerVisitInsert = {
        customerid: customerid,
        staffid: selectedStaffId,
        totalamountpaid: parseFloat(amountpaid),
        notes: notes
          ? `Free treatment claim - ${notes}`
          : "Free treatment claim",
      };

      const { data, error } = await supabase
        .from("customervisits")
        .insert(visitData)
        .select("csid")
        .single();

      if (error) {
        Alert.alert("Error", "Error while claiming free treatment");
        setclicked(false);
        return;
      }

      // Insert visitline for the claimed treatment
      const visitLine: CustomerVisitLineInsert = {
        quantity: 1,
        treatmentid: +selectedtreatmentid,
        csid: data.csid,
      };

      const { error: lineError } = await supabase
        .from("customervisitlines")
        .insert(visitLine)
        .select()
        .single();

      if (lineError) {
        await supabase.from("customervisits").delete().eq("csid", data.csid);
        Alert.alert("Error", lineError.message);
        setclicked(false);
        return;
      }

      // Deduct only the claimed treatment's points (not the full balance)
      // Find a treatment with negative points (for points deduction)
      const resetTreatment = treatment.find(
        (t) => t.points && parseInt(t.points) < 0,
      );

      if (resetTreatment) {
        // Create a points deduction visit
        const pointsToDeduct = requiredPoints * 10;
        const resetVisitData: CustomerVisitInsert = {
          customerid: customerid,
          staffid: selectedStaffId,
          totalamountpaid: 0,
          notes: `Points deducted for free treatment claim: ${selectedTreatmentName} (${pointsToDeduct} points deducted from total balance)`,
        };

        const { data: resetData, error: resetError } = await supabase
          .from("customervisits")
          .insert(resetVisitData)
          .select("csid")
          .single();

        if (!resetError && resetData) {
          // Deduct 10x the claimed points from total balance
          // (e.g., claiming 50 points = deducting 500 from total balance)
          const pointsToDeduct = requiredPoints * 10;
          const resetPointsValue = Math.abs(
            parseInt(resetTreatment.points || "1"),
          );
          const quantityNeeded = Math.ceil(pointsToDeduct / resetPointsValue);

          const resetLine: CustomerVisitLineInsert = {
            quantity: quantityNeeded,
            treatmentid: +resetTreatment.id,
            csid: resetData.csid,
          };
          await supabase.from("customervisitlines").insert(resetLine);
        }
      }

      Alert.alert("Success", "Free treatment claimed successfully!");
      setclicked(false);
      setisModalActive(false);

      // Call the success callback to refresh points in Home
      if (onClaimSuccess) {
        onClaimSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      setclicked(false);
    }
  };

  useEffect(() => {
    if (!isModalActive) {
      // Reset form when modal is closed
      setselectedtreatmentid("");
      setSelectedStaffId("");
      setamountpaid("0.00");
      setnotes("");
      setclicked(false);
      setSelectedTreatmentName("Select Free Treatment");
    }
  }, [isModalActive]);

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
            <Text style={styles.visitService}>{selectedTreatmentName}</Text>
            <Text style={styles.visitStylist}>Stylist: {""}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>{points} pts</Text>
          </View>
        </View>
      </Pressable>

      <Modal visible={isModalActive} animationType="fade" transparent={true}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.Main}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setisModalActive(false)}
            >
              <X color={Colors.TextColour} size={24} />
            </Pressable>
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.modalHeading}>Claim Free Treatment</Text>
              </View>

              <View style={styles.TreatmentContainer}>
                <View style={styles.VisitHeader}>
                  <PlusCircle color={Colors.Primary900} size={24} />
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 20,
                      paddingLeft: 10,
                      color: "white",
                    }}
                  ></Text>
                </View>
                <View style={styles.VisitHolder}>
                  <PrimaryText children="TREATMENT" />
                  <DropDownInput
                    id="freetreatment"
                    value={"Select Free Treatment"}
                    DropDownItem={treatment}
                    onSelect={handletreatment}
                  />
                </View>
                <View style={styles.VisitHolder}>
                  <PrimaryText children="STAFF MEMBER" />
                  <DropDownInput
                    id="freevisit-staff"
                    value={"Select Staff Member"}
                    DropDownItem={staff}
                    onSelect={handleStaffSelect}
                  />
                </View>
                <View style={styles.VisitHolder}>
                  <PrimaryText children="AMOUNT PAID" />
                  <View
                    style={{
                      flexDirection: "row",

                      paddingVertical: 10,
                      marginVertical: 10,

                      marginRight: 20,
                      backgroundColor: Colors.PrimaryBackground,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        paddingHorizontal: 10,
                        color: Colors.TextColour,
                        fontWeight: "bold",
                      }}
                    >
                      R
                    </Text>
                    <TextInput
                      placeholder="  0.00"
                      style={{ color: Colors.TextColour, paddingLeft: 10 }}
                      blurOnSubmit={true}
                      value={amountpaid}
                      editable={false}
                      keyboardType="number-pad"
                    ></TextInput>
                  </View>
                </View>

                <View style={styles.VisitHolder}>
                  <PrimaryText children="NOTES" />

                  <TextInput
                    multiline={true}
                    placeholder="   Additional Comments Before You claim"
                    style={{
                      color: Colors.TextColour,
                      paddingVertical: 10,
                      paddingLeft: 10,
                      paddingBottom: 50,
                      marginVertical: 10,
                      marginRight: 20,
                      backgroundColor: Colors.PrimaryBackground,
                      borderRadius: 10,
                    }}
                    blurOnSubmit={true}
                    value={notes}
                    onChangeText={setnotes}
                  ></TextInput>
                </View>

                <PrimaryButton
                  text={!clicked ? "CLAIM" : "CLAIMING..."}
                  onPressHandler={AddCLAIMHandler}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  Main: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  modalHeading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    letterSpacing: 1,
  },
  CustomerDetails: {
    padding: "2%",
    margin: "5%",
    backgroundColor: Colors.background100,
    borderRadius: 20,
  },
  CustomerCard: {
    backgroundColor: Colors.PrimaryBackground,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  CustomerInfo: {
    flex: 1,
  },
  Label: {
    fontSize: 10,
    color: "#888888",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  CustomerName: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 12,
  },
  ContactNumber: {
    fontSize: 14,
    color: Colors.Primary900,
    fontWeight: "600",
    letterSpacing: 1,
    paddingLeft: 10,
  },
  IconContainer: {
    backgroundColor: "#414141",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  Verticalline: {
    backgroundColor: Colors.Primary900,
    paddingHorizontal: 100,
    paddingVertical: 1,
    borderRadius: 30,
  },
  TreatmentContainer: {
    backgroundColor: Colors.background100,
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
    width: "90%",
    maxWidth: 400,
  },
  VisitHeader: {
    flexDirection: "row",
    padding: 15,
  },
  VisitHolder: {
    paddingLeft: 20,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: Colors.PrimaryBackground,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
