import PrimaryText from "@/components/PrimaryText";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import {
  ProductsInsert,
  SerivceInsert,
  TrearmentInsert,
} from "@/components/utils/DatabaseTypes";
import Colors from "@/components/utils/Colours";
import { ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import { GetTreatments, GetProducts } from "@/components/utils/GetServices";
import { DropDownItems } from "@/components/utils/utilinterfaces";
import { TrashIcon } from "lucide-react-native";
import { cacheManager } from "@/lib/cache";
const AddTreatment = () => {
  const [treatmentname, settreatmentname] = useState("");
  const [price, setprice] = useState("");
  const [treatmenttype, settreatmenttype] = useState("");
  const [duration, setduration] = useState("");
  const [points, setpoints] = useState("");
  const [clicked, setclicked] = useState(false);
  const [treatments, settreatments] = useState<DropDownItems[]>([]);
  const [products, setproducts] = useState<DropDownItems[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selecteditem, setselecteditem] = useState("treatment");
  const [productname, setproductname] = useState("");
  const [productprice, setproductprice] = useState("");
  const [producttype, setproducttype] = useState("");
  const [productdescription, setproductdescription] = useState("");

  const HandleproductName = (text: string) => {
    setproductname(text);
  };
  const Handleproductprice = (text: string) => {
    setproductprice(text);
  };
  const Handleproducttype = (text: string) => {
    setproducttype(text);
  };
  const Handleproductdescription = (text: string) => {
    setproductdescription(text);
  };
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
    setproductname("");
    setproductprice("");
    setproducttype("");
    setproductdescription("");
  };
  const ValidateInput = (): boolean => {
    let passed = true;
    if (selecteditem == "treatment") {
      if (treatmentname.length < 3 || treatmenttype.length < 3) {
        Alert.alert("Error", "field must contain 3 or more letters");
        passed = false;
      } else if (!parseFloat(price)) {
        Alert.alert("Error", "price must not be characters");
        passed = false;
      }
      if (typeof +duration != "number" || typeof +points != "number") {
        Alert.alert("Error", "field must be a number");
        passed = false;
      }
    } else {
      if (productname.length < 3 || producttype.length < 3) {
        Alert.alert("Error", "field must contain 3 or more letters");
        passed = false;
      } else if (!parseFloat(productprice)) {
        Alert.alert("Error", "price must not be characters");
        passed = false;
      }
      if (productdescription.length < 3) {
        Alert.alert(
          "Error",
          "product description must contain at least 3 characters",
        );
        passed = false;
      }
    }
    return passed;
  };
  const HandleDeleteTreatment = async (id: string, name: string) => {
    Alert.alert("Delete", "Are you sure you want to Delete " + name, [
      {
        text: "Yes",
        onPress: async () => {
          try {
            const numericId = parseInt(id);

            // Check if treatment is used in any customer visit lines
            const { data: visitLines } = await supabase
              .from("customervisitlines")
              .select("id")
              .eq("treatmentid", numericId);

            if (visitLines && visitLines.length > 0) {
              Alert.alert(
                "Cannot Delete",
                "This treatment cannot be deleted because it has been used in customer visits.",
              );
              return;
            }

            // Check if treatment exists
            const { data: treatmentExists } = await supabase
              .from("treatments")
              .select("treatmentid")
              .eq("treatmentid", numericId)
              .maybeSingle();

            if (treatmentExists) {
              // Delete from treatments table (child record)
              const { error: treatmentError } = await supabase
                .from("treatments")
                .delete()
                .eq("treatmentid", numericId);

              if (treatmentError) {
                Alert.alert(
                  "Error",
                  "Treatment could not be removed: " + treatmentError.message,
                );
                return;
              }
            }

            // Delete from Services table (parent record)
            const { error: serviceError } = await supabase
              .from("Services")
              .delete()
              .eq("ServiceId", numericId);

            if (serviceError) {
              Alert.alert(
                "Error",
                "Service could not be removed: " + serviceError.message,
              );
              return;
            }

            // Invalidate services cache
            await cacheManager.invalidatePattern("services");
            await cacheManager.invalidatePattern("treatments");

            // Update state directly by filtering out deleted item
            settreatments((prevTreatments) =>
              prevTreatments.filter((t) => t.id !== id),
            );
            setRefreshTrigger((prev) => prev + 1);

            Alert.alert("Success", "Treatment removed");
          } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
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
  const HandleDeleteProduct = async (id: string, name: string) => {
    Alert.alert("Delete", "Are you sure you want to Delete " + name, [
      {
        text: "Yes",
        onPress: async () => {
          try {
            const numericId = parseInt(id);

            // Check if product is used in any customer visit lines
            const { data: visitLines } = await supabase
              .from("customervisitlines")
              .select("id")
              .eq("treatmentid", numericId);

            if (visitLines && visitLines.length > 0) {
              Alert.alert(
                "Cannot Delete",
                "This product cannot be deleted because it has been used in customer visits.",
              );
              return;
            }

            // Check if product exists
            const { data: productExists } = await supabase
              .from("Product")
              .select("productid")
              .eq("productid", numericId)
              .maybeSingle();

            if (productExists) {
              // Delete from Product table (child record)
              const { error: productError } = await supabase
                .from("Product")
                .delete()
                .eq("productid", numericId);

              if (productError) {
                Alert.alert(
                  "Error",
                  "Product could not be removed: " + productError.message,
                );
                return;
              }
            }

            // Delete from Services table (parent record)
            const { error: serviceError } = await supabase
              .from("Services")
              .delete()
              .eq("ServiceId", numericId);

            if (serviceError) {
              Alert.alert(
                "Error",
                "Service could not be removed: " + serviceError.message,
              );
              return;
            }

            // Invalidate services cache
            await cacheManager.invalidatePattern("services");
            await cacheManager.invalidatePattern("products");

            // Update state directly by filtering out deleted item
            setproducts((prevProducts) =>
              prevProducts.filter((p) => p.id !== id),
            );
            setRefreshTrigger((prev) => prev + 1);

            Alert.alert("Success", "Product removed");
          } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
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
    if (!ValidateInput()) {
      setclicked(false);
      return;
    }

    setclicked(true);

    if (selecteditem == "treatment") {
      // Step 1: Insert service FIRST to get ServiceId
      const service: SerivceInsert = {
        servicecategory: "treatment",
        servicepoints: (10 / 100) * +price,
        servicecost: +price,
        servicename: treatmentname,
      };

      const { data: serviceData, error: serviceError } = await supabase
        .from("Services")
        .insert(service)
        .select("ServiceId")
        .single();

      if (serviceError) {
        Alert.alert("Error", serviceError.message);
        setclicked(false);
        return;
      }

      // Step 2: Insert treatment with ServiceId as treatmentid
      const treatment: TrearmentInsert = {
        treatmentid: serviceData.ServiceId,
        duration_minutes: +duration,
      };

      const { error: treatmentError } = await supabase
        .from("treatments")
        .insert(treatment)
        .select()
        .single();

      if (treatmentError) {
        // Rollback: Delete the service if treatment insert fails
        await supabase
          .from("Services")
          .delete()
          .eq("ServiceId", serviceData.ServiceId);
        Alert.alert("Error", treatmentError.message);
        setclicked(false);
        return;
      }

      clearInputs();

      // Invalidate services cache
      await cacheManager.invalidatePattern("services");
      await cacheManager.invalidatePattern("treatments");

      Alert.alert("Success", "New Treatment has been added");
      const updatedTreatments = await GetTreatments();
      settreatments(updatedTreatments);
      setRefreshTrigger((prev) => prev + 1);
    } else {
      // Step 1: Insert service FIRST to get ServiceId
      const service: SerivceInsert = {
        servicecategory: "product",
        servicepoints: Math.round((2.5 / 100) * +productprice),
        servicecost: +productprice,
        servicename: productname,
      };

      const { data: serviceData, error: serviceError } = await supabase
        .from("Services")
        .insert(service)
        .select("ServiceId")
        .single();

      if (serviceError) {
        Alert.alert("Error", serviceError.message);
        setclicked(false);
        return;
      }

      // Step 2: Insert product with ServiceId as productid
      const product: ProductsInsert = {
        productid: serviceData.ServiceId,
        productdescription: productdescription,
      };

      const { error: productError } = await supabase
        .from("Product")
        .insert(product)
        .select()
        .single();

      if (productError) {
        // Rollback: Delete the service if product insert fails
        await supabase
          .from("Services")
          .delete()
          .eq("ServiceId", serviceData.ServiceId);
        Alert.alert("Error1", productError.message);
        setclicked(false);
        return;
      }

      clearInputs();

      // Invalidate services cache
      await cacheManager.invalidatePattern("services");
      await cacheManager.invalidatePattern("products");

      Alert.alert("Success", "New Product has been added");
      const updatedProducts = await GetProducts();
      setproducts(updatedProducts);
      setRefreshTrigger((prev) => prev + 1);
    }

    setclicked(false);
  };
  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  });
  useEffect(() => {
    const fetchData = async () => {
      if (selecteditem === "treatment") {
        const data = await GetTreatments();
        settreatments(data);
      } else {
        const data = await GetProducts();
        setproducts(data);
      }
    };
    fetchData();
  }, [refreshTrigger, selecteditem]);
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
        {Platform.OS === "ios" ? (
          <Picker
            selectedValue={selecteditem}
            onValueChange={(itemValue) => {
              setselecteditem(itemValue);
            }}
          >
            <Picker.Item value={"treatment"} label="Treatment" />
            <Picker.Item value={"product"} label="Product" />
          </Picker>
        ) : (
          <View style={styles.androidPickerContainer}>
            <Picker
              selectedValue={selecteditem}
              onValueChange={(itemValue) => {
                setselecteditem(itemValue);
              }}
              mode="dropdown"
              style={styles.androidPicker}
              dropdownIconColor="#ffffff"
            >
              <Picker.Item value={"treatment"} label="Treatment" />
              <Picker.Item value={"product"} label="Product" />
            </Picker>
          </View>
        )}
        {selecteditem == "treatment" && (
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
            <View>
              {treatments.map((item) => (
                <View key={item.id} style={styles.TreatMain}>
                  <View style={styles.Treatment}>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 20,
                        paddingVertical: 5,
                        flexShrink: 1,
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
              ))}
            </View>
          </View>
        )}
        {selecteditem == "product" && (
          <View style={styles.main}>
            <Text style={styles.maintexts}>Add New Product</Text>
            <View style={styles.maininputs}>
              <PrimaryText children="Product Name" />
              <Input
                text="e.g ,Facial Product"
                value={productname}
                onChangeText={HandleproductName}
              />
            </View>
            <View style={styles.maininputs}>
              <PrimaryText children="Price (R)" />
              <Input
                keyboardType="numeric"
                text="e.g, 450"
                value={productprice}
                onChangeText={Handleproductprice}
              />
            </View>
            <View style={styles.maininputs}>
              <PrimaryText children="Product Type" />
              <Input
                keyboardType="default"
                text="e.g, facial"
                value={producttype}
                onChangeText={Handleproducttype}
              />
            </View>
            <View style={styles.maininputs}>
              <PrimaryText children="Product Description" />
              <TextInput
                multiline={true}
                placeholder="Product Description"
                style={{
                  color: Colors.TextColour,
                  paddingVertical: 10,
                  paddingLeft: 10,
                  paddingBottom: 50,
                  marginVertical: 10,
                  marginRight: 0,
                  backgroundColor: Colors.PrimaryBackground,
                  borderRadius: 10,
                  borderWidth: 0.5,

                  borderColor: "#8b8b8bff",
                }}
                blurOnSubmit={true}
                value={productdescription}
                onChangeText={Handleproductdescription}
              ></TextInput>
            </View>
            <View style={{ paddingHorizontal: 15 }}>
              <PrimaryButton
                text={!clicked ? "ADD TO SYSTEM" : "ADDING..."}
                onPressHandler={HandleAdd}
              />
            </View>
            <Text style={styles.maintexts}>Current Products</Text>
            <View>
              {products.map((item) => (
                <View key={item.id} style={styles.TreatMain}>
                  <View style={styles.Treatment}>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 20,
                        paddingVertical: 5,
                        flexShrink: 1,
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
                    onPress={HandleDeleteProduct.bind(
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
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddTreatment;

const styles = StyleSheet.create({
  main: {
    paddingTop: 60,
  },
  maininputs: { paddingHorizontal: 25, padding: 5, borderColor: "#8b8b8bff" },
  maintexts: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    paddingLeft: 20,
  },
  Treatment: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    flexShrink: 1,
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
    alignItems: "center",
  },
  presseditem: {
    opacity: 0.5,
  },
  androidPickerContainer: {
    marginHorizontal: 25,
    marginVertical: 15,
    marginTop: 40,
    borderRadius: 8,
    backgroundColor: Colors.background100,
    borderWidth: 1,
    borderColor: "#8b8b8bff",
    overflow: "hidden",
  },
  androidPicker: {
    color: "white",
    height: 50,
    backgroundColor: Colors.background100,
  },
});
