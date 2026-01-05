import "react-native-url-polyfill/auto";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { View, Text, StyleSheet } from "react-native";
import { Session } from "@supabase/supabase-js";
import Colors from "@/components/utils/Colours";
import ProfileImage from "../components/ProfileImage";
import EditModal from "@/components/EditModal";
const CustomerProfile = () => {
  //session logic
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, [session]);
  //end of session logic
  const addimage = () => {
    console.log("image added");
  };
  return (
    <View style={styles.Container}>
      <View style={styles.CardContainer}>
        <ProfileImage imagehandler={addimage} />
        <Text
          style={{
            color: Colors.TextColour,
            textAlign: "center",
            paddingTop: 1,
          }}
        >
          Tap to change photo
        </Text>
        <View>
          <EditModal />
        </View>
      </View>
    </View>
  );
};

export default CustomerProfile;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: "#000000ff",
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 7,
    paddingRight: 7,
    flex: 1,
  },
  CardContainer: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
    alignItems: "center",
    borderColor: Colors.bordercolor,
    borderWidth: 1,
    borderRadius: 50,
  },
});
