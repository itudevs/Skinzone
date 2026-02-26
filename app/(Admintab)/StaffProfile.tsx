import "react-native-url-polyfill/auto";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Session } from "@supabase/supabase-js";
import Colors from "@/components/utils/Colours";
import ProfileImage from "../../components/ProfileImage";
import EditModal from "@/components/EditModal";
import { useRouter } from "expo-router";
import { UserSession } from "@/components/utils/GetUsersession";
const StaffProfile = () => {
  const router = useRouter();
  const session = UserSession;
  //end of session logic
  const addimage = () => {
    console.log("image added");
  };
  const SignOutHandler = () => {
    supabase.auth.signOut();
    router.navigate("/Login");
  };
  return (
    <View style={styles.Container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <EditModal
              Signout={SignOutHandler}
              userId={session?.getSession()?.user.id}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StaffProfile;

const styles = StyleSheet.create({
  Container: {
    backgroundColor: "#000000ff",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 150,
    paddingLeft: 7,
    paddingRight: 7,
    flexGrow: 1,
  },
  CardContainer: {
    flex: 1,
    backgroundColor: "#000000ff",
    alignItems: "center",
    borderColor: Colors.bordercolor,
    borderWidth: 1,
    borderRadius: 50,
    paddingBottom: 30,
  },
});
