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
  TouchableOpacity,
} from "react-native";
import Colors from "./utils/Colours";
import { CustomerModalprops } from "./utils/CustomerInterface";
import {
  PlusCircle,
  PhoneIcon,
  User,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react-native";
import PrimaryText from "./PrimaryText";
import PrimaryButton from "./PrimaryButton";
import DropDownInput from "./DropDownInput";
import { DropDownItems } from "./utils/utilinterfaces";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import FreeVisit from "./FreeVisit";
import Visitation from "./Visitation";
import DatePicker from "./DatePicker";
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
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
  const [products, setProducts] = useState<DropDownItems[]>([]);
  const [amountpaid, setamountpaid] = useState("0.00");
  const [notes, setnotes] = useState("");
  const [historyLimit, setHistoryLimit] = useState(5);
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
  const [visitDate, setVisitDate] = useState(new Date());

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
      visit_date: visitDate.toISOString(),
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

  useEffect(() => {
    if (!Visible) return;
    let mounted = true;

    const setCurrentStaffMember = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        return;
      }

      if (!mounted) return;
      setSelectedStaffId(currentUserId);

      const { data: userData } = await supabase
        .from("User")
        .select("name,surname")
        .eq("id", currentUserId)
        .maybeSingle();

      if (!mounted) return;
      const fullName = [userData?.name, userData?.surname]
        .filter(Boolean)
        .join(" ")
        .trim();
      setSelectedStaffName(fullName || "Current Staff");
    };

    setCurrentStaffMember();

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
      setVisitDate(new Date());
      setnotes("");
      setselectedTreatment(undefined);
      setSelectedProduct(undefined);
      setHistoryLimit(5);
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
          <View style={styles.ModalHeader}>
            <TouchableOpacity onPress={Onclose} style={styles.CloseButton}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.HeaderTitle}>ADD NEW VISIT FOR USERS</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.ScrollContent}
          >
            {/* Customer Profile Card */}
            <View style={styles.Card}>
              <View style={styles.RowBetween}>
                <View>
                  <Text style={styles.Label}>CUSTOMER</Text>
                  <Text style={styles.CustomerName}>
                    {Name} {Surname}
                  </Text>

                  <Text style={[styles.Label, { marginTop: 12 }]}>CONTACT</Text>
                  <View style={styles.IconRow}>
                    <PhoneIcon size={14} color="#00ff44" />
                    <Text style={styles.ContactText}>{Phone}</Text>
                  </View>
                </View>
                <View style={styles.Avatar}>
                  <User size={24} color="#fff" />
                </View>
              </View>
            </View>

            {/* Points & Status Card */}
            <View style={[styles.Card, styles.RowBetween]}>
              <View style={styles.PointsContainer}>
                <View style={styles.GreenBar} />
                <View>
                  <Text style={styles.Label}>CURRENT POINTS</Text>
                  <Text style={styles.PointsValue}>{point}</Text>
                </View>
              </View>

              <View
                style={{ alignItems: "flex-end", flex: 1, paddingLeft: 10 }}
              >
                <Text
                  style={[
                    styles.Label,
                    { textAlign: "right", marginBottom: 5 },
                  ]}
                >
                  STATUS
                </Text>
                <View style={styles.StatusPill}>
                  <Text style={styles.StatusText}>
                    {!idfetched ? (
                      "Loading..."
                    ) : point >= 500 ? (
                      <>
                        Qualifies for:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          Free Scalp Treatment
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontWeight: "bold" }}>
                        Does Not Qualify for Treatment
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Add New Visit Form */}
            <View style={styles.Card}>
              <View style={styles.SectionHeader}>
                <PlusCircle size={24} color="#00ff44" />
                <Text style={styles.SectionTitle}>Add New Visit</Text>
              </View>

              {/* Treatment Dropdown */}
              <Text style={styles.InputLabel}>TREATMENT</Text>
              <DropDownInput
                value={selectedTreatmentName || "Select Treatment"}
                id="treatment-select"
                DropDownItem={treatment}
                onSelect={handleTreatmentSelect}
              />

              {/* Products Dropdown */}
              <Text style={styles.InputLabel}>PRODUCTS</Text>
              <DropDownInput
                value={selectedProductName || "Select Product"}
                id="product-select"
                DropDownItem={products}
                onSelect={handleProductSelect}
              />

              {/* Staff Member Dropdown */}
              <Text style={styles.InputLabel}>STAFF MEMBER</Text>
              <View style={styles.InputContainer}>
                <TextInput
                  style={styles.TextInput}
                  value={selectedStaffName || "Current Staff"}
                  editable={false}
                  placeholder="Current Staff"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Amount Paid */}
              <Text style={styles.InputLabel}>AMOUNT PAID</Text>
              <View style={styles.InputContainer}>
                <Text style={styles.CurrencySymbol}>R</Text>
                <TextInput
                  style={styles.TextInput}
                  value={amountpaid}
                  editable={false} // Assuming amount is auto-calculated based on selection
                  placeholder="0.00"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Visit Date */}
              <Text style={styles.InputLabel}>VISIT DATE</Text>
              <DatePicker
                placeholder="Select visit date"
                value={visitDate}
                onDateChange={setVisitDate}
              />

              {/* Notes */}
              <Text style={styles.InputLabel}>NOTES</Text>
              <View style={[styles.InputContainer, styles.TextAreaContainer]}>
                <TextInput
                  style={[styles.TextInput, styles.TextArea]}
                  value={notes}
                  onChangeText={HandleNotes}
                  placeholder="Add Treatment Notes"
                  placeholderTextColor="#666"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Add Visit Button */}
              <View style={{ marginTop: 24 }}>
                <PrimaryButton
                  text={!clicked ? "ADD VISIT" : "ADDING..."}
                  onPressHandler={AddVisitHandler}
                />
              </View>
            </View>

            {/* History Section */}
            <View style={styles.HistoryHeader}>
              <Text style={styles.HistoryTitle}>HISTORY</Text>
              <View style={styles.Badge}>
                <Text style={styles.BadgeText}>
                  Showing last {historyLimit} visits
                </Text>
              </View>
            </View>

            {/* History List */}
            <Visitation
              id={id}
              Name={Name}
              Surname={Surname}
              Phone={Phone}
              limit={historyLimit}
              allowDelete={true}
              onVisitDeleted={() => setRefreshTrigger((prev) => prev + 1)}
            />

            <TouchableOpacity
              onPress={() => setHistoryLimit((prev) => prev + 5)}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text
                style={{ color: "#00ff44", fontSize: 14, fontWeight: "600" }}
              >
                See More
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CustomerModal;

const styles = StyleSheet.create({
  Main: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground || "#121212",
  },
  ModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
  },
  HeaderTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  CloseButton: {
    padding: 4,
  },
  ScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  Card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  RowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  Label: {
    color: "#666",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  CustomerName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  IconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  ContactText: {
    color: "#00ff44",
    fontSize: 14,
    fontWeight: "500",
  },
  Avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  PointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  GreenBar: {
    width: 4,
    height: 36,
    backgroundColor: "#00ff44",
    borderRadius: 2,
  },
  PointsValue: {
    color: "#00ff44",
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 32,
  },
  StatusPill: {
    backgroundColor: "rgba(0, 255, 68, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 68, 0.2)",
  },
  StatusText: {
    color: "#00ff44",
    fontSize: 10,
  },
  SectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  SectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  InputLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  InputContainer: {
    backgroundColor: Colors.PrimaryBackground || "#121212",
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#8b8b8bff",
    marginTop: 8,
  },
  CurrencySymbol: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  TextInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 14,
    fontSize: 14,
  },
  TextAreaContainer: {
    alignItems: "flex-start",
  },
  TextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  HistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  HistoryTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  Badge: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  BadgeText: {
    color: "#666",
    fontSize: 10,
  },
});
