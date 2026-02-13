import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Colors from "./utils/Colours";
import { CustomerModalprops } from "./utils/CustomerInterface";
import { PlusCircle, PhoneIcon, User, TextInitial } from "lucide-react-native";
import PrimaryText from "./PrimaryText";
import PrimaryButton from "./PrimaryButton";
import DropDownInput from "./DropDownInput";
import { DropDownItems } from "./utils/utilinterfaces";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  CustomerVisitLineInsert,
  CustomerVisitInsert,
} from "./utils/DatabaseTypes";
import { GetTreatments } from "./utils/Gettreatment";

const CustomerModal = ({
  Visible,
  Onclose,
  id,
  Name,
  Surname,
  Phone,
}: CustomerModalprops) => {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [clicked, setclicked] = useState(false);
  const [staff, setstaff] = useState<DropDownItems[]>([]);
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
  const [amountpaid, setamountpaid] = useState("");
  const [notes, setnotes] = useState("");
  const handleStaffSelect = (id: string, value: string) => {
    setSelectedStaffId(id);
  };

  const handleTreatmentSelect = (id: string, value: string) => {
    setSelectedTreatmentId(id);
  };

  const AddVisitHandler = async () => {
    if (clicked) return; // Prevent multiple submissions
    setclicked(true);

    let visitData: CustomerVisitInsert;
    let visitLine: CustomerVisitLineInsert;

    visitData = {
      customerid: id,
      staffid: selectedStaffId,
      totalamountpaid: +amountpaid,
      notes: notes,
    };
    const { data, error } = await supabase
      .from("customervisits")
      .insert(visitData)
      .select("csid")
      .single();
    if (error) {
      Alert.alert("Error", "error while adding customer visit");
      setclicked(false); // Reset on error
      return;
    }
    console.log(data.csid);
    //insert visitline
    visitLine = {
      quantity: 1,
      treatmentid: +selectedTreatmentId,
      csid: data.csid,
    };
    console.log(visitLine.treatmentid);
    const { error: line } = await supabase
      .from("customervisitlines")
      .insert(visitLine)
      .select()
      .single();
    if (line) {
      await supabase.from("customervisits").delete().eq("id", visitLine.csid);
      Alert.alert("Error", line.message);
      setclicked(false); // Reset on error
      return;
    }

    Alert.alert("Success", "Visit added successfully!");
    setclicked(false); // Reset on success
    Onclose(); // Close the modal on success
  };

  const GetStaff = async () => {
    const { data, error } = await supabase
      .from("User")
      .select("id,name")
      .eq("role", "staff");

    if (error) {
      Alert.alert("Error", "error occured while fetching Users");
      return [];
    }

    if (data && data.length > 0) {
      // Map data to match DropDownItems interface
      return data.map((staff) => ({
        id: staff.id,
        value: staff.name,
      }));
    }

    return [];
  };
  useEffect(() => {
    if (!Visible) return;
    let mounted = true;
    GetStaff().then((u) => {
      if (mounted) {
        setstaff(u);
      }
    });
    GetTreatments().then((y) => {
      if (mounted) {
        settreatment(y);
      }
    });
    return () => {
      mounted = false;
    };
  }, [Visible]);
  GetTreatments();
  const HandleAmountpaid = (text: string) => {
    setamountpaid(text);
  };
  const HandleNotes = (text: string) => {
    setnotes(text);
  };
  useEffect(() => {
    if (!Visible) {
      // Reset form when modal is closed
      setSelectedStaffId("");
      setSelectedTreatmentId("");
      setamountpaid("");
      setnotes("");
    }
  }, [Visible]);
  return (
    <Modal
      visible={Visible}
      onRequestClose={Onclose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.Main}>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text
              style={{
                paddingHorizontal: "5%",
                paddingVertical: "3%",
                color: "#ffffff",
                borderRadius: 50,
              }}
            >
              Staff Access
            </Text>
            <Text
              style={{
                paddingHorizontal: "5%",
                paddingVertical: "2%",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: 22,
              }}
            >
              Loaded Customer Information
            </Text>
            <View style={{ paddingHorizontal: "5%", paddingVertical: "1%" }}>
              <PrimaryText children="Add New Visit For Users" />
            </View>
            <View style={styles.CustomerDetails}>
              <View style={styles.CustomerCard}>
                <View style={styles.CustomerInfo}>
                  <Text style={styles.Label}>CUSTOMER</Text>
                  <Text style={styles.CustomerName}>
                    {Name} {Surname}
                  </Text>
                  <Text style={styles.Label}>CONTACT</Text>
                  <View style={{ flexDirection: "row" }}>
                    <PhoneIcon size={14} color={Colors.Primary900} />
                    <Text style={styles.ContactNumber}>{Phone}</Text>
                  </View>
                </View>
                <View style={styles.IconContainer}>
                  <User size={24} color={"white"} />
                </View>
              </View>
              <View style={styles.Verticalline}></View>
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
                >
                  Add New Visit
                </Text>
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="TREATMENT" />

                <DropDownInput
                  value="Select Treatment"
                  id="Treatment select"
                  DropDownItem={treatment}
                  onSelect={handleTreatmentSelect}
                />
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="STAFF MEMBER" />
                <DropDownInput
                  value="Select User"
                  id="staff-select"
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
                    onChangeText={HandleAmountpaid}
                    keyboardType="number-pad"
                  ></TextInput>
                </View>
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="NOTES" />

                <TextInput
                  multiline={true}
                  placeholder="    Add Treatment Notes"
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
                  onChangeText={HandleNotes}
                ></TextInput>
              </View>

              <PrimaryButton
                text={!clicked ? "ADD VISIT" : "ADDING..."}
                onPressHandler={AddVisitHandler}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CustomerModal;

const styles = StyleSheet.create({
  Main: {
    backgroundColor: Colors.PrimaryBackground,
    flex: 1,
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
    padding: "2%",
    margin: "5%",
    borderRadius: 20,
    paddingLeft: 10,
  },
  VisitHeader: {
    flexDirection: "row",
    padding: 15,
  },
  VisitHolder: {
    paddingLeft: 20,
  },
});
