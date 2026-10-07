import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Theme, useTheme } from "./utils/Colours";
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
import { DropDownItems } from "./utils/utilinterfaces";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import FreeVisit from "./FreeVisit";
import Visitation from "./Visitation";
import DatePicker from "./DatePicker";
import SearchBar from "./SearchBar";
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
  const theme = useTheme();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedTreatments, setSelectedTreatments] = useState<DropDownItems[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<DropDownItems[]>([]);
  const [clicked, setclicked] = useState(false);
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
  const [products, setProducts] = useState<DropDownItems[]>([]);
  const [notes, setnotes] = useState("");
  const [historyLimit, setHistoryLimit] = useState(5);
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [point, setpoint] = useState(0);
  const [visits, setvisits] = useState<any[]>([]);
  const [lastvisit, setlastvisit] = useState<number>(0);
  const [idfetched, setidfetched] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [visitDate, setVisitDate] = useState(new Date());

  const filteredTreatments = useMemo(() => {
    const query = treatmentSearch.trim().toLowerCase();
    if (!query) return treatment;
    return treatment.filter((item) => item.value.toLowerCase().includes(query));
  }, [treatment, treatmentSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) => item.value.toLowerCase().includes(query));
  }, [products, productSearch]);

  const totalAmount = useMemo(
    () =>
      [...selectedTreatments, ...selectedProducts].reduce(
        (total, item) => total + (Number(item.cost) || 0),
        0,
      ),
    [selectedProducts, selectedTreatments],
  );

  const filteredVisits = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return visits;

    return visits.filter((visit) => {
      const service = visit.customervisitlines?.[0]?.treatments?.Services || {};
      return [service.servicename, service.servicecategory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [historySearch, visits]);

  const handleTreatmentSelect = (id: string, value: string) => {
    const selected = treatment.find((item) => item.id === id);
    if (!selected || selectedTreatments.some((item) => item.id === id)) return;
    setSelectedTreatments((current) => [...current, selected]);
  };

  const handleProductSelect = (id: string, value: string) => {
    const selected = products.find((item) => item.id === id);
    if (!selected || selectedProducts.some((item) => item.id === id)) return;
    setSelectedProducts((current) => [...current, selected]);
  };

  const removeTreatment = (id: string) =>
    setSelectedTreatments((current) => current.filter((item) => item.id !== id));

  const removeProduct = (id: string) =>
    setSelectedProducts((current) => current.filter((item) => item.id !== id));

  const AddVisitHandler = async () => {
    if (clicked) return; // Prevent multiple submissions

    // Validate selections
    if (!selectedStaffId) {
      Alert.alert("Error", "Please select a staff member");
      return;
    }

    if (selectedTreatments.length === 0 && selectedProducts.length === 0) {
      Alert.alert("Error", "Please select a treatment or product");
      return;
    }

    setclicked(true);

    let visitData: CustomerVisitInsert;
    let idString: string = id || "";
    const selectedItems = [
      ...selectedTreatments.map((item) => ({ item, isProduct: false })),
      ...selectedProducts.map((item) => ({ item, isProduct: true })),
    ];

    visitData = {
      customerid: idString,
      staffid: selectedStaffId,
      totalamountpaid: totalAmount,
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

    for (const selectedItem of selectedItems.filter((entry) => entry.isProduct)) {
      const serviceId = selectedItem.item.id;
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

    const visitLines: CustomerVisitLineInsert[] = selectedItems.map(({ item }) => ({
      quantity: 1,
      treatmentid: +item.id,
      csid: data.csid,
    }));
    const { error: lineError } = await supabase
      .from("customervisitlines")
      .insert(visitLines);

    if (lineError) {
      // Rollback: delete the customer visit
      await supabase.from("customervisits").delete().eq("csid", data.csid);
      Alert.alert("Error", lineError.message);
      setclicked(false);
      return;
    }

    // Send notification to customer
    try {
      const serviceName = selectedItems.map(({ item }) => item.value).join(", ");
      await sendVisitNotification(serviceName, selectedStaffName, idString);
    } catch (error) {
      // Notification failed, but visit was added successfully
    }
    // Invalidate cache for this user
    await cacheManager.invalidatePattern(`visitations_${idString}`);
    await cacheManager.invalidatePattern(`points_${idString}`);
    await cacheManager.invalidatePattern(`lastvisit_${idString}`);

    Alert.alert("Success", "Visit added successfully!");
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
      setSelectedStaffName("");
      setVisitDate(new Date());
      setnotes("");
      setTreatmentSearch("");
      setProductSearch("");
      setHistorySearch("");
      setSelectedTreatments([]);
      setSelectedProducts([]);
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
        <View style={styles(theme).Main}>
          <View style={styles(theme).ModalHeader}>
            <TouchableOpacity onPress={Onclose} style={styles(theme).CloseButton}>
              <X color={theme.treatmentModalText} size={24} />
            </TouchableOpacity>
            <Text style={styles(theme).HeaderTitle}>ADD NEW VISIT FOR USERS</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles(theme).ScrollContent}
          >
            {/* Customer Profile Card */}
            <View style={styles(theme).Card}>
              <View style={styles(theme).RowBetween}>
                <View>
                  <Text style={styles(theme).Label}>CUSTOMER</Text>
                  <Text style={styles(theme).CustomerName}>
                    {Name} {Surname}
                  </Text>

                  <Text style={[styles(theme).Label, { marginTop: 12 }]}>CONTACT</Text>
                  <View style={styles(theme).IconRow}>
                    <PhoneIcon size={14} color="#00ff44" />
                    <Text style={styles(theme).ContactText}>{Phone}</Text>
                  </View>
                </View>
                <View style={styles(theme).Avatar}>
                  <User size={24} color={theme.treatmentModalText} />
                </View>
              </View>
            </View>

            {/* Points & Status Card */}
            <View style={[styles(theme).Card, styles(theme).RowBetween]}>
              <View style={styles(theme).PointsContainer}>
                <View style={styles(theme).GreenBar} />
                <View>
                  <Text style={styles(theme).Label}>CURRENT POINTS</Text>
                  <Text style={styles(theme).PointsValue}>{point}</Text>
                </View>
              </View>

              <View
                style={{ alignItems: "flex-end", flex: 1, paddingLeft: 10 }}
              >
                <Text
                  style={[
                    styles(theme).Label,
                    { textAlign: "right", marginBottom: 5 },
                  ]}
                >
                  STATUS
                </Text>
                <View style={styles(theme).StatusPill}>
                  <Text style={styles(theme).StatusText}>
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
            <View style={styles(theme).Card}>
              <View style={styles(theme).SectionHeader}>
                <PlusCircle size={24} color="#00ff44" />
                <Text style={styles(theme).SectionTitle}>Add New Visit</Text>
              </View>

              {/* Treatment Picker */}
              <Text style={styles(theme).InputLabel}>TREATMENT</Text>
              <TextInput
                value={treatmentSearch}
                onChangeText={setTreatmentSearch}
                placeholder="Search treatments"
                placeholderTextColor={theme.placeholder}
                style={styles(theme).pickerSearchInput}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles(theme).pickerOptions}
              >
                {filteredTreatments.map((item) => {
                  const isSelected = selectedTreatments.some(
                    (selected) => selected.id === item.id,
                  );
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleTreatmentSelect(item.id, item.value)}
                      style={[
                        styles(theme).pickerOption,
                        isSelected && styles(theme).pickerOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles(theme).pickerOptionText,
                          isSelected && styles(theme).pickerOptionTextSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {item.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles(theme).selectionList}>
                {selectedTreatments.map((item) => (
                  <View key={item.id} style={styles(theme).selectionChip}>
                    <Text style={styles(theme).selectionChipText}>{item.value}</Text>
                    <TouchableOpacity onPress={() => removeTreatment(item.id)}>
                      <X color={theme.treatmentModalText} size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Product Picker */}
              <Text style={styles(theme).InputLabel}>PRODUCTS</Text>
              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search products"
                placeholderTextColor={theme.placeholder}
                style={styles(theme).pickerSearchInput}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles(theme).pickerOptions}
              >
                {filteredProducts.map((item) => {
                  const isSelected = selectedProducts.some(
                    (selected) => selected.id === item.id,
                  );
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleProductSelect(item.id, item.value)}
                      style={[
                        styles(theme).pickerOption,
                        isSelected && styles(theme).pickerOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles(theme).pickerOptionText,
                          isSelected && styles(theme).pickerOptionTextSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {item.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles(theme).selectionList}>
                {selectedProducts.map((item) => (
                  <View key={item.id} style={styles(theme).selectionChip}>
                    <Text style={styles(theme).selectionChipText}>{item.value}</Text>
                    <TouchableOpacity onPress={() => removeProduct(item.id)}>
                      <X color={theme.treatmentModalText} size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Staff Member Dropdown */}
              <Text style={styles(theme).InputLabel}>STAFF MEMBER</Text>
              <View style={styles(theme).InputContainer}>
                <TextInput
                  style={styles(theme).TextInput}
                  value={selectedStaffName || "Current Staff"}
                  editable={false}
                  placeholder="Current Staff"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* Amount Paid */}
              <Text style={styles(theme).InputLabel}>AMOUNT PAID</Text>
              <View style={styles(theme).InputContainer}>
                <Text style={styles(theme).CurrencySymbol}>R</Text>
                <TextInput
                  style={styles(theme).TextInput}
                  value={totalAmount.toFixed(2)}
                  editable={false} // Assuming amount is auto-calculated based on selection
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* Visit Date */}
              <Text style={styles(theme).InputLabel}>VISIT DATE</Text>
              <DatePicker
                placeholder="Select visit date"
                value={visitDate}
                onDateChange={setVisitDate}
              />

              {/* Notes */}
              <Text style={styles(theme).InputLabel}>NOTES</Text>
              <View style={[styles(theme).InputContainer, styles(theme).TextAreaContainer]}>
                <TextInput
                  style={[styles(theme).TextInput, styles(theme).TextArea]}
                  value={notes}
                  onChangeText={HandleNotes}
                  placeholder="Add Treatment Notes"
                  placeholderTextColor={theme.placeholder}
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
            <View style={styles(theme).HistoryHeader}>
              <Text style={styles(theme).HistoryTitle}>HISTORY</Text>
              <View style={styles(theme).Badge}>
                <Text style={styles(theme).BadgeText}>
                  Showing last {historyLimit} visits
                </Text>
              </View>
            </View>

            <SearchBar
              Placeholder="Search old treatments or products"
              size="compact"
              value={historySearch}
              onChangeText={setHistorySearch}
            />

            {/* History List */}
            <View style={styles(theme).HistoryList}>
              <Visitation
                id={id}
                Name={Name}
                Surname={Surname}
                Phone={Phone}
                limit={historyLimit}
                visitsData={filteredVisits}
                allowDelete={true}
                onVisitDeleted={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </View>

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

const styles = (theme: Theme) => StyleSheet.create({
  Main: {
    flex: 1,
    backgroundColor: theme.PrimaryBackground,
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
  pickerSearchInput: {
    backgroundColor: theme.treatmentModalBackground,
    borderColor: theme.bordercolor,
    borderRadius: 8,
    borderWidth: 1,
    color: theme.treatmentModalText,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  pickerOptions: {
    gap: 8,
    paddingVertical: 4,
  },
  pickerOption: {
    alignItems: "center",
    backgroundColor: theme.treatmentModalBackground,
    borderColor: theme.bordercolor,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 12,
    width: 150,
  },
  pickerOptionSelected: {
    backgroundColor: theme.Primary900,
    borderColor: theme.Primary900,
  },
  pickerOptionText: {
    color: theme.treatmentModalText,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  pickerOptionTextSelected: {
    color: "#000000",
    fontWeight: "800",
  },
  selectionList: {
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  selectionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.SecondaryColour100,
    borderColor: theme.Primary900,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectionChipText: {
    color: theme.treatmentModalText,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },
  InputContainer: {
    backgroundColor: theme.treatmentModalBackground,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: theme.bordercolor,
    marginTop: 8,
  },
  CurrencySymbol: {
    color: theme.treatmentModalText,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  TextInput: {
    flex: 1,
    color: theme.treatmentModalText,
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
  HistoryList: {
    width: "100%",
    alignSelf: "stretch",
  },
});
