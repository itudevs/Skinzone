import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/components/utils/Colours";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable } from "react-native";

const PrivacyPolicy = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Pressable onPress={() => router.back()}>
          <X color={Colors.TextColour} size={28} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 19, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.text}>
          Skinzone Naturel ("we," "our," or "us"), owned by Vukosi J Chabangu,
          respects your privacy and is committed to protecting your personal
          data. This privacy policy explains how we collect, use, disclose, and
          safeguard your information when you use our mobile application and
          services.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.text}>
          We collect the following personal information to provide our aesthetic
          services:
        </Text>
        <Text style={styles.bulletPoint}>• Name and Surname</Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Phone number</Text>
        <Text style={styles.bulletPoint}>• Date of birth</Text>
        <Text style={styles.bulletPoint}>
          • Skin concerns and relevant medical history (allergies, previous
          treatments)
        </Text>
        <Text style={styles.bulletPoint}>
          • Visit history and treatment records
        </Text>
        <Text style={styles.bulletPoint}>• Loyalty points balance</Text>
        <Text style={styles.bulletPoint}>
          • Device information and push notification tokens
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.text}>We use your personal information to:</Text>
        <Text style={styles.bulletPoint}>
          • Provide effective treatments (Chemical Peels, Microneedling, Laser,
          IV Infusions)
        </Text>
        <Text style={styles.bulletPoint}>
          • Process appointments and send reminders
        </Text>
        <Text style={styles.bulletPoint}>
          • Customize your "Get The Glow" experience
        </Text>
        <Text style={styles.bulletPoint}>
          • Communicate with you regarding updates, offers, and new services
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain your loyalty points and visit history
        </Text>

        <Text style={styles.sectionTitle}>4. Data Protection</Text>
        <Text style={styles.text}>
          We implement appropriate technical and organizational security
          measures to protect your personal information. However, no method of
          transmission over the internet or electronic storage is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact Us</Text>
        <Text style={styles.text}>
          If you have questions about this policy, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>
          • Email: skinzonenaturel@gmail.com
        </Text>
        <Text style={styles.bulletPoint}>• Phone: +27 61 587 7918</Text>
        <Text style={styles.bulletPoint}>
          • Address: Owner Vukosi J Chabangu
        </Text>
        <Text style={styles.bulletPoint}>• Create and manage your account</Text>
        <Text style={styles.bulletPoint}>
          • Track your visit history and loyalty points
        </Text>
        <Text style={styles.bulletPoint}>
          • Send you notifications about your visits
        </Text>
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Primary900,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.TextColour,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.SecondaryColour100,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.TextColour,
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: Colors.TextColour,
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    color: Colors.TextColour,
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 5,
  },
  footer: {
    height: 50,
  },
});

export default PrivacyPolicy;
