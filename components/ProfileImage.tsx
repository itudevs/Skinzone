import { useState, useEffect } from "react";
import { Pressable, StyleSheet, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Theme, useTheme } from "./utils/Colours";

interface Profileprops {
  imagehandler: () => void;
  imageUrl?: string | null;
  uploading?: boolean;
}

const DEFAULT_IMAGE =
  "https://thumbs.dreamstime.com/b/profile-picture-placeholder-icon-design-white-bubble-chat-head-user-s-figure-avatar-vector-illustration-198816164.jpg";

const ProfileImage = ({
  imagehandler,
  imageUrl,
  uploading = false,
}: Profileprops) => {
  const theme = useTheme();
  const [imgurl, setimgurl] = useState(imageUrl || DEFAULT_IMAGE);

  useEffect(() => {
    if (imageUrl) {
      setimgurl(imageUrl);
    } else {
      setimgurl(DEFAULT_IMAGE);
    }
  }, [imageUrl]);

  const handleLoadError = () => {
    setimgurl(DEFAULT_IMAGE);
  };

  const handlePress = () => {
    if (!uploading) {
      imagehandler();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => pressed && styles(theme).presseditem}
      onPress={handlePress}
      disabled={uploading}
    >
      <View style={styles(theme).container}>
        {uploading ? (
          <View style={styles(theme).loadingContainer}>
            <ActivityIndicator size="large" color={theme.Primary900} />
          </View>
        ) : (
          <Image
            style={styles(theme).ImgContainer}
            source={{ uri: imgurl }}
            contentFit="cover"
            transition={200}
            placeholder={DEFAULT_IMAGE}
            onError={handleLoadError}
          />
        )}
      </View>
    </Pressable>
  );
};

export default ProfileImage;

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    position: "relative",
  },
  ImgContainer: {
    width: 90,
    borderWidth: 2,
    margin: 30,
    height: 90,
    borderColor: "#747474ff",
    borderRadius: 50,
  },
  presseditem: {
    opacity: 0.5,
  },
  loadingContainer: {
    width: 90,
    height: 90,
    margin: 30,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#747474ff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.PrimaryBackground,
  },
});
