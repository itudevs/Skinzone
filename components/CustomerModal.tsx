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
import { PlusCircle, PhoneIcon, User } from "lucide-react-native";
import PrimaryText from "./PrimaryText";
import PrimaryButton from "./PrimaryButton";
import DropDownInput from "./DropDownInput";
import { DropDownItems } from "./utils/utilinterfaces";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import FreeVisit from "./FreeVisit";
import {
  CustomerVisitLineInsert,
  CustomerVisitInsert,
} from "./utils/DatabaseTypes";
import { GetTreatments, GetProducts } from "@/components/utils/GetServices";
import { sendVisitNotification } from "@/lib/notifications";
import {
  GetTotalFinalPoints,
  Getvisitations,
  GetLastPointvisit,
} from "./utils/GetUserData";
import { cacheManager } from "@/lib/cache";

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
  const [selectedProductId, setSelectedProductId] = useState("");
  const [clicked, setclicked] = useState(false);
  const [staff, setstaff] = useState<DropDownItems[]>([]);
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
  const [products, setProducts] = useState<DropDownItems[]>([]);
  const [amountpaid, setamountpaid] = useState("0.00");
  const [notes, setnotes] = useState("");
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [selectedTreatmentName, setSelectedTreatmentName] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedTreatment, setselectedTreatment] = useState<DropDownItems>();
  const [selectedProduct, setSelectedProduct] = useState<DropDownItems>();
  const [point, setpoint] = useState(0);
  const [visits, setvisits] = useState<any[]>([]);
  const [lastvisit, setlastvisit] = useState<number>(0);
  const [idfetched, setidfetched] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStaffSelect = (id: string, value: string) => {
    setSelectedStaffId(id);
    setSelectedStaffName(value);
  };

  const handleTreatmentSelect = (id: string, value: string) => {
    setSelectedTreatmentId(id);
    setSelectedTreatmentName(value);
    // Clear product selection (mutual exclusivity)
    setSelectedProductId("");
    setSelectedProductName("");
    setSelectedProduct(undefined);
    // Find the treatment and set the amount
    const selected = treatment.find((t) => t.id === id);
    setselectedTreatment(selected);
    if (selected && selected.cost) {
      setamountpaid(selected.cost);
    } else {
      setamountpaid("0.00");
    }
  };

  const handleProductSelect = (id: string, value: string) => {
    setSelectedProductId(id);
    setSelectedProductName(value);
    // Clear treatment selection (mutual exclusivity)
    setSelectedTreatmentId("");
    setSelectedTreatmentName("");
    setselectedTreatment(undefined);
    // Find the product and set the amount
    const selected = products.find((p) => p.id === id);
    setSelectedProduct(selected);
    if (selected && selected.cost) {
      setamountpaid(selected.cost);
    } else {
      setamountpaid("0.00");
    }
  };

  const AddVisitHandler = async () => {
    if (clicked) return; // Prevent multiple submissions

    // Validate selections
    if (!selectedStaffId) {
      Alert.alert("Error", "Please select a staff member");
      return;
    }

    if (!selectedTreatmentId && !selectedProductId) {
      Alert.alert("Error", "Please select a treatment or product");
      return;
    }

    setclicked(true);

    let visitData: CustomerVisitInsert;
    let visitLine: CustomerVisitLineInsert;
    let idString: string = id || "";
    const isProduct = !!selectedProductId;

    visitData = {
      customerid: idString,
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
      Alert.alert("Error", "Error while adding customer visit");
      setclicked(false);
      return;
    }

    // Insert visitline - need to handle treatments vs products differently
    const serviceId = selectedTreatmentId || selectedProductId;

    // For products, we need to check if a treatment record exists with this ServiceId
    // since customervisitlines.treatmentid references treatments.treatmentid
    if (isProduct) {
      // Check if this product has a corresponding treatment entry
      const { data: treatmentCheck, error: treatmentCheckError } =
        await supabase
          .from("treatments")
          .select("treatmentid")
          .eq("treatmentid", +serviceId)
          .maybeSingle();

      if (treatmentCheckError) {
        console.error("Error checking treatment:", treatmentCheckError);
        await supabase.from("customervisits").delete().eq("csid", data.csid);
        Alert.alert(
          "Error",
          "Unable to verify product. Please contact support.",
        );
        setclicked(false);
        return;
      }

      // If no treatment record exists for this product's ServiceId, create one
      if (!treatmentCheck) {
        const { error: treatmentInsertError } = await supabase
          .from("treatments")
          .insert({
            treatmentid: +serviceId,
            duration_minutes: null,
          })
          .single();

        if (treatmentInsertError) {
          console.error(
            "Error creating treatment record:",
            treatmentInsertError,
          );
          await supabase.from("customervisits").delete().eq("csid", data.csid);
          Alert.alert(
            "Error",
            "Unable to process product purchase. Please contact support.",
          );
          setclicked(false);
          return;
        }
      }
    }

    visitLine = {
      quantity: 1,
      treatmentid: +serviceId,
      csid: data.csid,
    };

    const { error: lineError } = await supabase
      .from("customervisitlines")
      .insert(visitLine)
      .select()
      .single();

    if (lineError) {
      // Rollback: delete the customer visit
      await supabase.from("customervisits").delete().eq("csid", data.csid);
      Alert.alert("Error", lineError.message);
      setclicked(false);
      return;
    }

    // Send notification to customer
    try {
      const serviceName = selectedTreatmentName || selectedProductName;
      await sendVisitNotification(serviceName, selectedStaffName, idString);
    } catch (error) {
      // Notification failed, but visit was added successfully
    }
    // Invalidate cache for this user
    await cacheManager.invalidatePattern(`visitations_${idString}`);
    await cacheManager.invalidatePattern(`points_${idString}`);
    await cacheManager.invalidatePattern(`lastvisit_${idString}`);

    const itemType = isProduct ? "Product purchase" : "Visit";
    Alert.alert("Success", `${itemType} added successfully!`);
    setclicked(false);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh
    Onclose();
  };

  const GetStaff = async () => {
    const { data, error } = await supabase
      .from("User")
      .select("id,name")
      .eq("role", "staff");

    if (error) {
      Alert.alert("Error", "Error occurred while fetching staff");
      return [];
    }

    if (data && data.length > 0) {
      return data.map((staff) => ({
        id: staff.id,
        value: staff.name,
        cost: null,
        points: null,
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

    GetProducts().then((p) => {
      if (mounted) {
        setProducts(p);
      }
    });

    return () => {
      mounted = false;
    };
  }, [Visible]);

  const HandleNotes = (text: string) => {
    setnotes(text);
  };

  useEffect(() => {
    if (!Visible) {
      // Reset form when modal is closed
      setSelectedStaffId("");
      setSelectedTreatmentId("");
      setSelectedProductId("");
      setSelectedStaffName("");
      setSelectedTreatmentName("");
      setSelectedProductName("");
      setamountpaid("0.00");
      setnotes("");
      setselectedTreatment(undefined);
      setSelectedProduct(undefined);
    }
  }, [Visible]);

  const handleClaimSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchdata = async () => {
      let customerid = id || "0";
      const Userpoint = await GetTotalFinalPoints(customerid);
      setpoint(Userpoint);
      const date = await Getvisitations(customerid, 5);
      setvisits(date);
      const lastVisit = await GetLastPointvisit(customerid);
      setlastvisit(lastVisit);
      setidfetched(true);
    };

    if (Visible) {
      fetchdata();
    }
  }, [Visible, id, refreshTrigger]);

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
                  value={selectedTreatmentName || "Select Treatment"}
                  id="Treatment select"
                  DropDownItem={treatment}
                  onSelect={handleTreatmentSelect}
                />
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="PRODUCTS" />
                <DropDownInput
                  value={selectedProductName || "Select Product"}
                  id="Product select"
                  DropDownItem={products}
                  onSelect={handleProductSelect}
                />
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="STAFF MEMBER" />
                <DropDownInput
                  value={selectedStaffName || "Select User"}
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
                    placeholderTextColor="#888"
                    style={{ color: Colors.TextColour, paddingLeft: 10 }}
                    blurOnSubmit={true}
                    value={amountpaid}
                    editable={false}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.VisitHolder}>
                <PrimaryText children="NOTES" />
                <TextInput
                  multiline={true}
                  placeholder="    Add Treatment Notes"
                  placeholderTextColor="#888"
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
                />
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
