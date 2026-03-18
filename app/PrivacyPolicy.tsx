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
        <Text style={styles.lastUpdated}>Last Updated: February 21, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.text}>
          Skinzone ("we," "our," or "us") respects your privacy and is committed
          to protecting your personal data. This privacy policy explains how we
          collect, use, disclose, and safeguard your information when you use
          our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.text}>
          We collect the following personal information:
        </Text>
        <Text style={styles.bulletPoint}>• Name and Surname</Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Phone number</Text>
        <Text style={styles.bulletPoint}>• Date of birth</Text>
        <Text style={styles.bulletPoint}>
          • Visit history and treatment records
        </Text>
        <Text style={styles.bulletPoint}>• Loyalty points balance</Text>
        <Text style={styles.bulletPoint}>
          • Device information and push notification tokens
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.text}>We use your personal information to:</Text>
        <Text style={styles.bulletPoint}>• Create and manage your account</Text>
        <Text style={styles.bulletPoint}>
          • Track your visit history and loyalty points
        </Text>
        <Text style={styles.bulletPoint}>
          • Send you notifications about your visits
        </Text>
        <Text style={styles.bulletPoint}>• Provide customer support</Text>
        <Text style={styles.bulletPoint}>• Improve our services</Text>
        <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>

        <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
        <Text style={styles.text}>
          Your data is securely stored using Supabase (PostgreSQL database) with
          industry-standard encryption. We use HTTPS for all data transmission
          and implement strict access controls to protect your information.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.text}>
          We do not sell your personal information. We only share your data
          with:
        </Text>
        <Text style={styles.bulletPoint}>
          • Staff members (limited to information necessary for providing
          services)
        </Text>
        <Text style={styles.bulletPoint}>
          • Service providers (Supabase for data hosting)
        </Text>
        <Text style={styles.bulletPoint}>
          • Legal authorities when required by law
        </Text>

        <Text style={styles.sectionTitle}>
          6. Your Rights (POPIA Compliance)
        </Text>
        <Text style={styles.text}>
          Under South Africa's POPIA law, you have the right to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Access your personal information
        </Text>
        <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
        <Text style={styles.bulletPoint}>
          • Request deletion of your account and data
        </Text>
        <Text style={styles.bulletPoint}>
          • Object to processing of your data
        </Text>
        <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.text}>
          We retain your personal information for as long as your account is
          active or as needed to provide services. After account deletion, we
          may retain certain information for legal compliance purposes for up to
          7 years.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.text}>
          Our service is not intended for users under 13 years of age. Users
          under 18 require parental consent.
        </Text>

        <Text style={styles.sectionTitle}>9. Data Breach Notification</Text>
        <Text style={styles.text}>
          In the event of a data breach affecting your personal information, we
          will notify you within 72 hours as required by POPIA.
        </Text>

        <Text style={styles.sectionTitle}>
          10. International Data Transfers
        </Text>
        <Text style={styles.text}>
          Your data may be processed outside South Africa. We ensure adequate
          protection through appropriate safeguards.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this privacy policy from time to time. We will notify
          you of any changes by updating the "Last Updated" date and posting the
          new policy in the app.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.text}>
          If you have questions about this privacy policy or wish to exercise
          your rights:
        </Text>
        <Text style={styles.bulletPoint}>
          • Email: skinzonenaturel@gmail.com
        </Text>
        <Text style={styles.bulletPoint}>• Company: Skinzone</Text>
        <Text style={styles.bulletPoint}>• Location: South Africa</Text>

        <Text style={styles.sectionTitle}>13. Consent</Text>
        <Text style={styles.text}>
          By using our app, you consent to the collection and use of your
          information as described in this privacy policy.
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.TextColour,
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.Primary900,
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: Colors.TextColour,
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 5,
  },
  footer: {
    height: 50,
  },
});
