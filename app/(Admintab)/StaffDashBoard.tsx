import Colors from "@/components/utils/Colours";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import SearchBar from "../../components/SearchBar";
import PrimaryText from "@/components/PrimaryText";
import Customer from "@/components/Customer";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
interface Customer {
  id: string;
  Name: string;
  Surname: string;
  Phone: string;
}
const StaffDashBoard = () => {
  const [users, setusers] = useState<any>();
  const GetUserDetails = async () => {
    const { data, error } = await supabase
      .from("User")
      .select("id,name,surname,phone")
      .eq("role", "user");

    if (data?.length != 0) {
      console.log(data);
      return data;
    }
    if (error) {
      Alert.alert("Error", "error occured while fetching Users");
    } else {
      return null;
    }
  };
  useEffect(() => {
    let mounted = true;
    GetUserDetails().then((u) => {
      if (mounted) {
        setusers(u);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <View style={{ backgroundColor: Colors.PrimaryBackground, flex: 1 }}>
      <View style={styles.Main}>
        <Text style={{ color: Colors.Primary900, fontWeight: "bold" }}>
          STAFF PORTAL
        </Text>
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            paddingVertical: 30,
            fontSize: 25,
          }}
        >
          Customer List
          <Text style={{ color: Colors.TextColour }}> / Lookup</Text>
        </Text>
      </View>
      <View style={styles.CustomerSearchCard}>
        <Text
          style={{
            color: Colors.TextColour,
            paddingTop: "10%",
            paddingLeft: "10%",
          }}
        >
          SEARCH BY PHONE/NAME
        </Text>
        <View style={{}}>
          <SearchBar Placeholder="Type Customer info..." />

          <Text
            style={{
              fontWeight: "bold",
              color: Colors.TextColour,
              marginLeft: "10%",
            }}
          >
            CUSTOMERS
          </Text>
        </View>
        <View>
          <FlatList
            data={users}
            renderItem={(itemData) => {
              return (
                <Customer
                  Name={itemData.item.name}
                  Surname={itemData.item.surname}
                  Phone={itemData.item.phone}
                />
              );
            }}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 300 }}
          />
        </View>
      </View>
    </View>
  );
};

export default StaffDashBoard;

const styles = StyleSheet.create({
  Main: {
    alignItems: "flex-start",
    paddingHorizontal: 50,
    paddingTop: 70,
  },
  CustomerSearchCard: {
    backgroundColor: Colors.background100,
    flex: 1,
    borderRadius: 30,
  },
});
