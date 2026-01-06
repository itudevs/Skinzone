import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";
import Colors from "./utils/Colours";
interface EditModalprops {
  Signout: () => void;
}
const EditModal = ({ Signout }: EditModalprops) => {
  interface ProfileData {
    name: string;
    surname: string;
    email: string;
    phone: string;
    dob: Date;
  }
  // Your user data
  const [profile, setProfile] = useState<ProfileData>({
    name: "John",
    surname: "Doe",
    email: "Johndoe@example.com",
    phone: "+27 82 555 444",
    dob: new Date("1995-12-17"),
  });

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeField, setActiveField] = useState(""); // 'name' or 'bio'
  const [tempValue, setTempValue] = useState(""); // Holds text while typing

  const openEditModal = (field: string) => {
    setActiveField(field);
    setTempValue(field); // Pre-fill with current value
    setModalVisible(true);
  };

  const handleSave = () => {
    setProfile({ ...profile, [activeField]: tempValue });
    setModalVisible(false);
  };

  const formatDate = (dateValue: Date | string): string => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;

    return new Intl.DateTimeFormat("en-US", {
      month: "short", // "Jan"
      day: "numeric", // "14"
      year: "numeric", // "1992"
    }).format(date);
  };
  // Define properties data for FlatList
  const properties = [
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

  const renderProperty = ({ item }: { item: (typeof properties)[0] }) => (
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
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.key}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <Pressable style={({ pressed }) => pressed && styles.presseditem}>
            <Text style={styles.buttonPassword}>Change Password</Text>
          </Pressable>

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
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
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
