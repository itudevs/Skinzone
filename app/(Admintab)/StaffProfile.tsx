import "react-native-url-polyfill/auto";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Session } from "@supabase/supabase-js";
import Colors from "@/components/utils/Colours";
import ProfileImage from "../../components/ProfileImage";
import EditModal from "@/components/EditModal";
import { useRouter, useFocusEffect } from "expo-router";
import { UserSession } from "@/components/utils/GetUsersession";
import { pickImage, uploadProfileImage } from "@/lib/imageUpload";

const StaffProfile = () => {
  const router = useRouter();
  const session = UserSession;
  const userId = session?.getSession()?.user.id;
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load profile picture from database
  const loadProfilePicture = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("User")
        .select("profile_picture")
        .eq("id", userId)
        .single();

      if (error) {
        return;
      }

      if (data?.profile_picture) {
        setProfilePicture(data.profile_picture);
      }
    } catch (error) {
      // Error loading profile picture
    }
  }, [userId]);

  // Load profile picture on screen focus
  useFocusEffect(
    useCallback(() => {
      loadProfilePicture();
    }, [loadProfilePicture]),
  );

  const handleImageUpload = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    try {
      setUploading(true);

      // Pick image (will show permissions dialog as required by Apple guidelines)
      const image = await pickImage();
      if (!image) {
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const imageUrl = await uploadProfileImage(userId, image.uri);

      if (imageUrl) {
        // Reload from database to get the fresh URL
        await loadProfilePicture();
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update profile picture. Please try again.",
      );
    } finally {
      setUploading(false);
    }
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
          <ProfileImage
            imagehandler={handleImageUpload}
            imageUrl={profilePicture}
            uploading={uploading}
          />
          <Text
            style={{
              color: Colors.TextColour,
              textAlign: "center",
              paddingTop: 1,
            }}
          >
            {uploading ? "Uploading..." : "Tap to change photo"}
          </Text>
          <View>
            <EditModal Signout={SignOutHandler} userId={userId} />
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
