import React, { useCallback, useState, memo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "./utils/Colours";
interface EditModalprops {
  Signout: () => void;
  userId?: string;
}
const EditModal = ({ Signout, userId }: EditModalprops) => {
  interface ProfileData {
    name: string;
    surname: string;
    email: string;
    phone: string;
    dob: Date;
  }
  const defaultDob = new Date("1900-01-01");
  const parseDob = (value: string | Date | null | undefined) => {
    if (value instanceof Date) return value;
    if (!value) return defaultDob;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? defaultDob : parsed;
  };
  // Your user data
  const [profile, setProfile] = useState<ProfileData>({
    name: "-",
    surname: "-",
    email: "-",
    phone: "- ",
    dob: new Date("-"),
  });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(
    async (isActive: () => boolean) => {
      if (!userId) return;
      try {
        const { data: userData, error: dbError } = await supabase
          .from("User")
          .select("*")
          .eq("id", userId)
          .single();

        if (dbError || !userData) {
          console.error("Database error:", dbError);
          return;
        }

        if (isActive()) {
          setProfile({
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            phone: userData.phone,
            dob: parseDob(userData.dob),
          });
        }
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred.");
        router.navigate("/Login");
      }
    },
    [router, userId],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProfile(() => active);
      return () => {
        active = false;
      };
    }, [loadProfile]),
  );
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };
  const updateField = async (FieldtoUpdate: string, newField: string) => {
    if (FieldtoUpdate === "email") {
      if (!validateEmail(newField)) {
        Alert.alert("Error", "Enter a valid email address");
        return;
      }
    }
    if (FieldtoUpdate === "phone") {
      if (!validatePhone(newField)) {
        Alert.alert(
          "Error",
          "Please enter a valid phone number (at least 10 digits)",
        );
        return;
      }
    }
    const { data, error } = await supabase
      .from("User")
      .update({ [FieldtoUpdate]: newField }) // Only include the field you want to change
      .eq("id", userId)
      .select(); // Returns the updated row so you can verify the change

    if (error) {
      console.error("Update failed:", error.message);
    } else {
      console.log("Updated successfully:", data);
    }
  };

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<keyof ProfileData | "">(""); // 'name' or 'bio'
  const [tempValue, setTempValue] = useState(""); // Holds text while typing
  const [tempDate, setTempDate] = useState<Date>(new Date()); // Holds date while picking
  const [showDatePicker, setShowDatePicker] = useState(false);

  const openEditModal = (field: keyof ProfileData) => {
    setActiveField(field);
    const currentValue = profile[field];

    if (field === "dob" && currentValue instanceof Date) {
      setTempDate(currentValue);
      setShowDatePicker(true);
    } else {
      const valueAsString = String(currentValue ?? "");
      setTempValue(valueAsString);
    }

    setModalVisible(true);
  };

  const validateDOB = (date: Date): boolean => {
    const today = new Date();
    const minDate = new Date(1900, 0, 1);
    const maxAge = 120;
    const minAge = 13; // Minimum age requirement

    // Check if date is in the future
    if (date > today) {
      Alert.alert("Invalid Date", "Date of birth cannot be in the future.");
      return false;
    }

    // Check if date is too old
    if (date < minDate) {
      Alert.alert("Invalid Date", "Please enter a valid date of birth.");
      return false;
    }

    // Calculate age
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    // Check minimum age
    if (actualAge < minAge) {
      Alert.alert("Invalid Age", `You must be at least ${minAge} years old.`);
      return false;
    }

    // Check maximum age
    if (actualAge > maxAge) {
      Alert.alert("Invalid Date", "Please enter a valid date of birth.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!activeField) {
      setModalVisible(false);
      return;
    }

    const previousValue = profile[activeField];

    // Validate email before saving
    if (activeField === "email" && !validateEmail(tempValue)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      setTempValue(String(previousValue ?? ""));
      setModalVisible(false);
      return;
    }

    // Validate phone before saving
    if (activeField === "phone" && !validatePhone(tempValue)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid phone number (at least 10 digits).",
      );
      setTempValue(String(previousValue ?? ""));
      setModalVisible(false);
      return;
    }

    if (activeField === "dob") {
      // Validate DOB
      if (!validateDOB(tempDate)) {
        return; // Don't close modal if invalid
      }

      const dobString = tempDate.toISOString().slice(0, 10);
      setProfile({ ...profile, dob: tempDate });
      await updateField("dob", dobString);
    } else {
      setProfile({ ...profile, [activeField]: tempValue });
      await updateField(activeField, tempValue);
    }
    setModalVisible(false);
    setShowDatePicker(false);
  };

  const formatDate = (dateValue: Date | string): string => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return "Invalid date";

    return new Intl.DateTimeFormat("en-US", {
      month: "short", // "Jan"
      day: "numeric", // "14"
      year: "numeric", // "1992"
    }).format(date);
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    try {
      // Delete user data from User table
      const { error: deleteError } = await supabase
        .from("User")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        Alert.alert(
          "Error",
          "Failed to delete account. Please contact support.",
        );
        return;
      }

      // Sign out the user
      await supabase.auth.signOut();

      Alert.alert(
        "Account Deleted",
        "Your account and all associated data have been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => router.navigate("/Login"),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Delete account error:", error);
    } finally {
      setDeleteConfirmVisible(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "⚠️ Delete Account",
      "Are you sure you want to delete your account?\n\nThis will:\n• Permanently delete all your personal information\n• Remove your visit history\n• Forfeit all loyalty points\n• Cannot be undone\n\nDo you want to continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => setDeleteConfirmVisible(true),
        },
      ],
    );
  };

  type PropertyItem = { key: keyof ProfileData; label: string; value: string };

  // Define properties data for FlatList
  const properties: PropertyItem[] = [
    { key: "name", label: "NAME", value: profile.name },
    { key: "surname", label: "SURNAME", value: profile.surname },
    { key: "email", label: "EMAIL", value: profile.email },
    { key: "phone", label: "PHONE", value: profile.phone },
    {
      key: "dob",
      label: "DATE OF BIRTH",
      value: formatDate(profile.dob),
    },
  ];

  const renderProperty = ({ item }: { item: PropertyItem }) => (
    <View style={styles.row}>
      <Text style={{ color: Colors.TextColour }}>{item.label}</Text>
      <Pressable onPress={() => openEditModal(item.key)}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 15,
          }}
        >
          <Text style={styles.TextColor}>{item.value}</Text>
          <Text style={styles.editBtn}>Edit</Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Properties - Using FlatList for scrollability */}
      <View style={styles.flatListWrapper}>
        <FlatList<PropertyItem>
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.key as string}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.flatListContent}
        />
        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <Pressable
            onPress={() => router.navigate("/ChangePassword")}
            style={({ pressed }) => pressed && styles.presseditem}
          >
            <Text style={styles.buttonPassword}>Change Password</Text>
          </Pressable>

          <Pressable
            onPress={Signout}
            style={({ pressed }) => pressed && styles.presseditem}
          >
            <Text style={styles.editBtn}>Sign Out</Text>
          </Pressable>

          {/* Legal Links */}
          <View style={styles.legalSection}>
            <Pressable
              onPress={() => router.navigate("/PrivacyPolicy")}
              style={({ pressed }) => pressed && styles.presseditem}
            >
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.legalDivider}>•</Text>
            <Pressable
              onPress={() => router.navigate("/TermsOfService")}
              style={({ pressed }) => pressed && styles.presseditem}
            >
              <Text style={styles.legalLink}>Terms of Service</Text>
            </Pressable>
          </View>

          {/* Delete Account */}
          <Pressable
            onPress={confirmDeleteAccount}
            style={({ pressed }) => [
              styles.deleteAccountBtn,
              pressed && styles.presseditem,
            ]}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </Pressable>
        </View>
        {/* Buttons */}
        <View style={styles.buttonsSection}></View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>⚠️ Final Confirmation</Text>
            <Text style={styles.deleteModalText}>
              This action is irreversible. Type DELETE to confirm:
            </Text>
            <TextInput
              style={styles.deleteInput}
              placeholder="Type DELETE"
              placeholderTextColor={Colors.TextColour}
              onChangeText={(text) => {
                if (text === "DELETE") {
                  handleDeleteAccount();
                }
              }}
            />
            <View style={styles.buttonGroup}>
              <Pressable onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REUSABLE MODAL */}
      <Modal
        style={{ flex: 1 }}
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {activeField}</Text>

            {activeField === "dob" && showDatePicker ? (
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateDisplayText}>
                  Selected: {formatDate(tempDate)}
                </Text>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor="#ffffff"
                  themeVariant="dark"
                  style={styles.datePicker}
                />
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={tempValue}
                onChangeText={setTempValue}
                autoFocus={true}
              />
            )}

            <View style={styles.buttonGroup}>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.cancelBtn}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave}>
                <Text style={styles.saveBtn}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditModal;
const styles = StyleSheet.create({
  container: { padding: 5 },
  flatListWrapper: {
    marginBottom: 10,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "column",
    justifyContent: "space-between",
    borderColor: Colors.bordercolor,
    borderWidth: 1,
    margin: 10,
    padding: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 10,
    backgroundColor: Colors.background100,
    width: 275,
  },
  TextColor: {
    color: "white",
    fontWeight: "bold",
  },
  editBtn: {
    color: Colors.Primary900,
    fontWeight: "bold",
    alignItems: "center",
    paddingBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: Colors.background100,
    color: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    color: Colors.TextColour,
    fontSize: 16,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    padding: 8,
    color: Colors.TextColour,
    overflow: "hidden",
  },
  datePickerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  dateDisplayText: {
    color: Colors.Primary900,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  datePicker: {
    width: "100%",
    backgroundColor: Colors.PrimaryBackground,
  },
  buttonGroup: { flexDirection: "row", justifyContent: "flex-end" },
  cancelBtn: { marginRight: 20, color: "red" },
  saveBtn: { color: Colors.Primary900, fontWeight: "bold" },
  presseditem: {
    opacity: 0.5,
  },
  buttonsSection: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  buttonPassword: {
    color: Colors.Primary900,
    fontWeight: "bold",
    alignItems: "center",
    borderColor: Colors.Primary900,
    borderWidth: 1,
    padding: 12,
    marginBottom: 25,
    borderRadius: 15,
    margin: 5,
    width: 275,
    textAlign: "center",
  },
  legalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 20,
    gap: 10,
  },
  legalLink: {
    color: Colors.TextColour,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalDivider: {
    color: Colors.TextColour,
    fontSize: 12,
  },
  deleteAccountBtn: {
    backgroundColor: "transparent",
    borderColor: "#FF3B30",
    borderWidth: 1,
    padding: 12,
    borderRadius: 15,
    width: 275,
    marginTop: 10,
  },
  deleteAccountText: {
    color: "#FF3B30",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  deleteModalContent: {
    width: "80%",
    backgroundColor: Colors.background100,
    padding: 20,
    borderRadius: 10,
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  deleteModalTitle: {
    color: "#FF3B30",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  deleteModalText: {
    color: Colors.TextColour,
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  deleteInput: {
    borderWidth: 1,
    borderColor: Colors.TextColour,
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
});
