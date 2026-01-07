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
} from "react-native";
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
    [router, userId]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProfile(() => active);
      return () => {
        active = false;
      };
    }, [loadProfile])
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
          "Please enter a valid phone number (at least 10 digits)"
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

  const openEditModal = (field: keyof ProfileData) => {
    setActiveField(field);
    const currentValue = profile[field];
    const valueAsString =
      field === "dob" && currentValue instanceof Date
        ? currentValue.toISOString().slice(0, 10) // simple YYYY-MM-DD
        : String(currentValue ?? "");
    setTempValue(valueAsString);
    setModalVisible(true);
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
        "Please enter a valid phone number (at least 10 digits)."
      );
      setTempValue(String(previousValue ?? ""));
      setModalVisible(false);
      return;
    }

    if (activeField === "dob") {
      setProfile({ ...profile, dob: parseDob(tempValue) });
      await updateField("dob", tempValue);
    } else {
      setProfile({ ...profile, [activeField]: tempValue });
      await updateField(activeField, tempValue);
    }
    setModalVisible(false);
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
        />
        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <Pressable
            onPress={() => router.navigate("/ChangePassword")}
            style={({ pressed }) => pressed && styles.presseditem}
          >
            <Text style={styles.buttonPassword}>Change Password</Text>
          </Pressable>
          {/* Change Password Modal */}

          <Pressable
            onPress={Signout}
            style={({ pressed }) => pressed && styles.presseditem}
          >
            <Text style={styles.editBtn}>Sign Out</Text>
          </Pressable>
        </View>
        {/* Buttons */}
        <View style={styles.buttonsSection}></View>
      </View>

      {/* REUSABLE MODAL */}
      <Modal
        style={{ flex: 1 }}
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: Colors.TextColour }}>Edit {activeField}</Text>

            <TextInput
              style={styles.input}
              value={tempValue}
              onChangeText={setTempValue}
              autoFocus={true}
            />

            <View style={styles.buttonGroup}>
              <Pressable onPress={() => setModalVisible(false)}>
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
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    padding: 8,
    color: Colors.TextColour,
    overflow: "hidden",
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
});
