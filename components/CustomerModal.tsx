import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
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

const CustomerModal = ({
  Visible,
  Onclose,
  Name,
  Surname,
  Phone,
}: CustomerModalprops) => {
  const AddVisitHandler = () => {};
  const [staff, setstaff] = useState<DropDownItems[]>([]);
  const [treatment, settreatment] = useState<DropDownItems[]>([]);
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
      console.log(data);
      // Map data to match DropDownItems interface
      return data.map((staff) => ({
        id: staff.id,
        value: staff.name,
      }));
    }

    return [];
  };
  useEffect(() => {
    let mounted = true;
    GetStaff().then((u) => {
      if (mounted) {
        setstaff(u);
      }
    });
    GetTreatments().then((y) => {
      if (mounted) {
        console.log("eish");
        settreatment(y);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
  const GetTreatments = async () => {
    const { data, error } = await supabase
      .from("treatments")
      .select("treatmentid,treatmentname");

    if (error) {
      Alert.alert("Error", "error occured while fetching Users");
      return [];
    }

    if (data && data.length > 0) {
      // Map data to match DropDownItems interface
      return data.map((treatment) => ({
        id: treatment.treatmentid,
        value: treatment.treatmentname,
      }));
    }

    return [];
  };
  return (
    <Modal
      visible={Visible}
      onRequestClose={Onclose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.Main}>
        <ScrollView style={{ flex: 1 }}>
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
              />
            </View>
            <View style={styles.VisitHolder}>
              <PrimaryText children="STAFF MEMBER" />
              <DropDownInput
                value="Select User"
                id="staff-select"
                DropDownItem={staff}
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
              ></TextInput>
            </View>

            <PrimaryButton text="ADD VISIT" onPressHandler={AddVisitHandler} />
          </View>
        </ScrollView>
      </View>
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
