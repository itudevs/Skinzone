import PrimaryText from "@/components/PrimaryText";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  FlatList,
  Pressable,
} from "react-native";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import { TrearmentInsert } from "@/components/utils/DatabaseTypes";
import Colors from "@/components/utils/Colours";
import { ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import { GetTreatments } from "@/components/utils/Gettreatment";
import { DropDownItems } from "@/components/utils/utilinterfaces";
import { TrashIcon } from "lucide-react-native";
const AddTreatment = () => {
  const [treatmentname, settreatmentname] = useState("");
  const [price, setprice] = useState("");
  const [treatmenttype, settreatmenttype] = useState("");
  const [duration, setduration] = useState("");
  const [points, setpoints] = useState("");
  const [clicked, setclicked] = useState(false);
  const [treatments, settreatments] = useState<DropDownItems[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const HandleChangetreatment = (text: string) => {
    settreatmentname(text);
  };
  const Handletreatmenttype = (text: string) => {
    settreatmenttype(text);
  };
  const HandlePrice = (text: string) => {
    setprice(text);
  };
  const Handleduration = (text: string) => {
    setduration(text);
  };
  const Handlepoints = (text: string) => {
    setpoints(text);
  };
  const clearInputs = () => {
    settreatmentname("");
    settreatmenttype("");
    setprice("");
    setduration("");
    setpoints("");
  };
  const ValidateInput = () => {
    if (treatmentname.length < 3 || treatmenttype.length < 3) {
      Alert.alert("Error", "field must contain 3 or more letters");
      return;
    } else if (!parseFloat(price)) {
      Alert.alert("Error", "price must not be characters");
      return;
    }
    if (typeof +duration != "number" || typeof +points != "number") {
      Alert.alert("Error", "field must be a number");
      return;
    }
  };
  const HandleDeleteTreatment = async (id: string, name: string) => {
    Alert.alert("Delete", "Are you sure you want to Delete " + name, [
      {
        text: "Yes",
        onPress: async () => {
          try {
            const { data, error } = await supabase
              .from("treatments")
              .delete()
              .eq("treatmentid", id)
              .select()
              .single();
            if (data) {
              Alert.alert("Success", "Treatment removed");
              setRefreshTrigger((prev) => prev + 1);
            }
            if (error) {
              Alert.alert("Error", "Treatment could not be removed");
              console.log(error.message);
            }
          } catch (error) {
            console.log(error);
          }
        },
        style: "default",
      },
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
    ]);
  };
  const HandleAdd = async () => {
    ValidateInput();
    setclicked(true);
    let treatment: TrearmentInsert;
    treatment = {
      cost: +price,
      treatmentname: treatmentname,
      treatment_type: treatmenttype,
      duration_minutes: +duration,
      points: +points,
    };
    const { data, error } = await supabase
      .from("treatments")
      .insert(treatment)
      .select()
      .single();
    if (data) {
      //clear inputs
      clearInputs();
      // alert to say added
      Alert.alert("Success", "New Treatment has been added");
      console.log("Treatment added");
      // Refresh the treatments list
      const updatedTreatments = await GetTreatments();
      settreatments(updatedTreatments);
      setRefreshTrigger((prev) => prev + 1);
    }
    if (error) {
      //dont clear inputs

      //alert
      Alert.alert("Error", "error occurered treatment not added");
      console.log(error.message);
    }
    //reset clicked
    setclicked(false);
  };
  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  });
  useEffect(() => {
    const fetchTreatments = async () => {
      const data = await GetTreatments();
      settreatments(data);
    };
    fetchTreatments();
  }, [refreshTrigger]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.PrimaryBackground }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <View style={styles.main}>
          <Text style={styles.maintexts}>Add New Treatment</Text>
          <View style={styles.maininputs}>
            <PrimaryText children="Treatment Name" />
            <Input
              text="e.g ,Deep Tissue Massage"
              value={treatmentname}
              onChangeText={HandleChangetreatment}
            />
          </View>
          <View style={styles.maininputs}>
            <PrimaryText children="Price (R)" />
            <Input
              keyboardType="numeric"
              text="e.g, 450"
              value={price}
              onChangeText={HandlePrice}
            />
          </View>
          <View style={styles.maininputs}>
            <PrimaryText children="Treatment Type" />
            <Input
              keyboardType="default"
              text="e.g, facial"
              value={treatmenttype}
              onChangeText={Handletreatmenttype}
            />
          </View>
          <View style={styles.maininputs}>
            <PrimaryText children="Points" />
            <Input
              keyboardType="numeric"
              text="e.g, 100"
              value={points}
              onChangeText={Handlepoints}
            />
          </View>
          <View style={styles.maininputs}>
            <PrimaryText children="Duration(mins)" />
            <Input
              keyboardType="numeric"
              text="e.g, 60"
              value={duration}
              onChangeText={Handleduration}
            />
          </View>
          <View style={{ paddingHorizontal: 15 }}>
            <PrimaryButton
              text={!clicked ? "ADD TO SYSTEM" : "ADDING..."}
              onPressHandler={HandleAdd}
            />
          </View>
          <Text style={styles.maintexts}>Current Treatments</Text>
          <FlatList
            keyExtractor={(item) => item.id}
            data={treatments}
            renderItem={({ item }) => (
              <View style={styles.TreatMain}>
                <View style={styles.Treatment}>
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 20,
                      paddingVertical: 5,
                    }}
                  >
                    {item.value}
                  </Text>
                  <Text style={{ color: Colors.Primary900 }}>
                    {formatter.format(parseFloat(item.cost || "0"))}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "white",
                    paddingVertical: 20,
                  }}
                >
                  {item.points}pts
                </Text>
                <Pressable
                  style={({ pressed }) => pressed && styles.presseditem}
                  onPress={HandleDeleteTreatment.bind(
                    null,
                    item.id,
                    item.value,
                  )}
                >
                  <View style={styles.Trash}>
                    <TrashIcon color={"#ff0101e0"} />
                  </View>
                </Pressable>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddTreatment;

const styles = StyleSheet.create({
  main: {
    paddingTop: 60,
  },
  maininputs: { paddingHorizontal: 25, padding: 5 },
  maintexts: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    paddingLeft: 20,
  },
  Treatment: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  Trash: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 20,
    marginHorizontal: 15,
    backgroundColor: "#ff010159",
    borderRadius: 10,
    alignItems: "flex-end",
  },
  TreatMain: {
    flexDirection: "row",
    backgroundColor: Colors.background100,
    margin: 10,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  presseditem: {
    opacity: 0.5,
  },
});
