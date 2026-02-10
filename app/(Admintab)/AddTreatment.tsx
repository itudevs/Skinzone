import PrimaryText from "@/components/PrimaryText";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import { TrearmentInsert } from "@/components/utils/DatabaseTypes";
import Colors from "@/components/utils/Colours";
import { ScrollView } from "react-native";

const AddTreatment = () => {
  const [treatmentname, settreatmentname] = useState("");
  const [price, setprice] = useState("");
  const [treatmenttype, settreatmenttype] = useState("");
  const [duration, setduration] = useState("");
  const [points, setpoints] = useState("");
  const [clicked, setclicked] = useState(false);
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
  const HandleAdd = async () => {
    let treatment: TrearmentInsert;
    treatment: {
      cost: +price;
      treatmentname: treatmentname;
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.PrimaryBackground }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
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
              value={price}
              onChangeText={Handlepoints}
            />
          </View>
          <View style={styles.maininputs}>
            <PrimaryText children="Duration(mins)" />
            <Input
              keyboardType="numeric"
              text="e.g, 60"
              value={price}
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
});
