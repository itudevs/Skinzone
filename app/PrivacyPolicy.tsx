import { View, Text, StyleSheet, ScrollView , Pressable } from "react-native";
import { Theme, useTheme } from "@/components/utils/Colours";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";


const PrivacyPolicy = () => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>Privacy Policy</Text>
        <Pressable onPress={() => router.back()}>
          <X color={theme.TextColour} size={28} />
        </Pressable>
      </View>

      <ScrollView
        style={styles(theme).scrollView}
        contentContainerStyle={styles(theme).content}
      >
        <Text style={styles(theme).lastUpdated}>Last Updated: March 19, 2026</Text>

        <Text style={styles(theme).sectionTitle}>1. Introduction</Text>
        <Text style={styles(theme).text}>
          Skinzone Naturel , respects your privacy and is committed to
          protecting your personal data. This privacy policy explains how we
          collect, use, disclose, and safeguard your information when you use
          our mobile application and services.
        </Text>

        <Text style={styles(theme).sectionTitle}>2. Information We Collect</Text>
        <Text style={styles(theme).text}>
          We collect the following personal information to provide our aesthetic
          services:
        </Text>
        <Text style={styles(theme).bulletPoint}>• Name and Surname</Text>
        <Text style={styles(theme).bulletPoint}>• Email address</Text>
        <Text style={styles(theme).bulletPoint}>• Phone number</Text>
        <Text style={styles(theme).bulletPoint}>• Date of birth</Text>
        <Text style={styles(theme).bulletPoint}>
          • Skin concerns and relevant medical history (allergies, previous
          treatments)
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Visit history and treatment records
        </Text>
        <Text style={styles(theme).bulletPoint}>• Loyalty points balance</Text>
        <Text style={styles(theme).bulletPoint}>
          • Device information and push notification tokens
        </Text>

        <Text style={styles(theme).sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles(theme).text}>We use your personal information to:</Text>
        <Text style={styles(theme).bulletPoint}>
          • Provide effective treatments (Chemical Peels, Microneedling, Laser,
          IV Infusions)
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Process appointments and send reminders
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Customize your Get The Glow experience
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Communicate with you regarding updates, offers, and new services
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Maintain your loyalty points and visit history
        </Text>

        <Text style={styles(theme).sectionTitle}>4. Data Protection</Text>
        <Text style={styles(theme).text}>
          We implement appropriate technical and organizational security
          measures to protect your personal information. However, no method of
          transmission over the internet or electronic storage is 100% secure.
        </Text>

        <Text style={styles(theme).sectionTitle}>5. Data Sharing</Text>
        <Text style={styles(theme).text}>
          We do not sell personal information. We only share data with service
          providers that are required to operate the app, such as Supabase
          (secure backend hosting/authentication/storage) and Expo Notifications
          (push delivery), and only for app functionality.
        </Text>

        <Text style={styles(theme).sectionTitle}>6. Tracking</Text>
        <Text style={styles(theme).text}>
          Skinzone does not track you across other companies apps or websites
          for advertising purposes. We do not use third-party advertising SDKs,
          data brokers, or cross-app profiling.
        </Text>

        <Text style={styles(theme).sectionTitle}>7. Contact Us</Text>
        <Text style={styles(theme).text}>
          If you have questions about this policy, please contact us at:
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Email: skinzonenaturel@gmail.com
        </Text>
        <Text style={styles(theme).bulletPoint}>• Phone: +27 61 587 7918</Text>
        <Text style={styles(theme).bulletPoint}>
          • Address: Owner Vukosi J Chabangu
        </Text>
        <View style={styles(theme).footer} />
      </ScrollView>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.PrimaryBackground,
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
    color: theme.TextColour,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: theme.SecondaryColour100,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.TextColour,
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: theme.TextColour,
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    color: theme.TextColour,
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 5,
  },
  footer: {
    height: 50,
  },
});

export default PrivacyPolicy;
