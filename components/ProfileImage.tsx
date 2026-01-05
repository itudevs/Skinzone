import { useState } from "react";
import { Pressable, Image, StyleSheet, View } from "react-native";

interface Profileprops {
  imagehandler: () => void;
}
const ProfileImage = ({ imagehandler }: Profileprops) => {
  const [imgurl, setimgurl] = useState(
    "https://thumbs.dreamstime.com/b/profile-picture-placeholder-icon-design-white-bubble-chat-head-user-s-figure-avatar-vector-illustration-198816164.jpg"
  );

  return (
    <Pressable
      style={({ pressed }) => pressed && styles.presseditem}
      onPress={imagehandler}
    >
      <View>
        <Image style={styles.ImgContainer} source={{ uri: imgurl }} />
      </View>
    </Pressable>
  );
};

export default ProfileImage;

const styles = StyleSheet.create({
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
});
