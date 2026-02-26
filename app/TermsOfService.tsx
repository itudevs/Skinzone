import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/components/utils/Colours";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable } from "react-native";

const TermsOfService = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Terms of Service</Text>
        <Pressable onPress={() => router.back()}>
          <X color={Colors.TextColour} size={28} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 21, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using the Skinzone mobile application, you agree to be
          bound by these Terms of Service and all applicable laws and
          regulations. If you do not agree with any of these terms, you are
          prohibited from using this application.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.text}>
          Skinzone provides a loyalty and visit tracking system for beauty salon
          customers. The service allows users to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Track visit history and treatment records
        </Text>
        <Text style={styles.bulletPoint}>• Accumulate loyalty points</Text>
        <Text style={styles.bulletPoint}>
          • Receive notifications about visits
        </Text>
        <Text style={styles.bulletPoint}>
          • View and manage personal profile information
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.text}>To use our service, you must:</Text>
        <Text style={styles.bulletPoint}>
          • Be at least 13 years old (users under 18 require parental consent)
        </Text>
        <Text style={styles.bulletPoint}>
          • Provide accurate and complete information
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain the confidentiality of your password
        </Text>
        <Text style={styles.bulletPoint}>
          • Notify us immediately of any unauthorized access
        </Text>
        <Text style={styles.bulletPoint}>
          • Accept responsibility for all activities under your account
        </Text>

        <Text style={styles.sectionTitle}>4. Loyalty Points Program</Text>
        <Text style={styles.text}>
          Loyalty points are earned through visits and treatments:
        </Text>
        <Text style={styles.bulletPoint}>
          • Points are awarded based on treatments received
        </Text>
        <Text style={styles.bulletPoint}>
          • Points may be redeemed for free treatments when threshold is met
        </Text>
        <Text style={styles.bulletPoint}>• Points have no cash value</Text>
        <Text style={styles.bulletPoint}>
          • Points may not be transferred between accounts
        </Text>
        <Text style={styles.bulletPoint}>
          • We reserve the right to modify the points program with notice
        </Text>
        <Text style={styles.bulletPoint}>
          • Points may only be used to redeem treatments not products
        </Text>

        <Text style={styles.sectionTitle}>5. User Conduct</Text>
        <Text style={styles.text}>You agree NOT to:</Text>
        <Text style={styles.bulletPoint}>
          • Use the app for any illegal purposes
        </Text>
        <Text style={styles.bulletPoint}>
          • Attempt to gain unauthorized access to our systems
        </Text>
        <Text style={styles.bulletPoint}>
          • Interfere with other users' use of the service
        </Text>
        <Text style={styles.bulletPoint}>
          • Transmit harmful code or malware
        </Text>
        <Text style={styles.bulletPoint}>
          • Impersonate another person or entity
        </Text>
        <Text style={styles.bulletPoint}>
          • Collect or harvest user information
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.text}>
          All content, features, and functionality of the Skinzone app are owned
          by Skinzone and protected by international copyright, trademark, and
          other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimers</Text>
        <Text style={styles.text}>
          • The service is provided "as is" without warranties of any kind
        </Text>
        <Text style={styles.bulletPoint}>
          • We do not guarantee uninterrupted or error-free service
        </Text>
        <Text style={styles.bulletPoint}>
          • This app is for information tracking only and does not constitute
          medical advice
        </Text>
        <Text style={styles.bulletPoint}>
          • Treatment effectiveness and results may vary
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.text}>
          To the maximum extent permitted by law, Skinzone shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages resulting from your use of or inability to use the service.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.text}>We reserve the right to:</Text>
        <Text style={styles.bulletPoint}>
          • Suspend or terminate your account for violation of these terms
        </Text>
        <Text style={styles.bulletPoint}>
          • Modify or discontinue the service with or without notice
        </Text>
        <Text style={styles.bulletPoint}>
          • Refuse service to anyone for any reason
        </Text>
        <Text style={styles.text}>
          You may terminate your account at any time by using the account
          deletion feature in the app.
        </Text>

        <Text style={styles.sectionTitle}>10. Account Deletion</Text>
        <Text style={styles.text}>When you delete your account:</Text>
        <Text style={styles.bulletPoint}>
          • Your personal information will be permanently removed
        </Text>
        <Text style={styles.bulletPoint}>
          • All accumulated loyalty points will be forfeited
        </Text>
        <Text style={styles.bulletPoint}>
          • Visit history will be anonymized for record-keeping
        </Text>
        <Text style={styles.bulletPoint}>• This action cannot be undone</Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.text}>
          These Terms of Service are governed by and construed in accordance
          with the laws of South Africa. Any disputes shall be resolved in the
          courts of South Africa.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.text}>
          We reserve the right to modify these terms at any time. Changes will
          be effective immediately upon posting. Your continued use of the app
          after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        <Text style={styles.text}>
          For questions about these Terms of Service:
        </Text>
        <Text style={styles.bulletPoint}>
          • Email: itumelengmorena20@gmail.com
        </Text>
        <Text style={styles.bulletPoint}>• Company: Skinzone</Text>
        <Text style={styles.bulletPoint}>• Location: South Africa</Text>

        <Text style={styles.sectionTitle}>14. Severability</Text>
        <Text style={styles.text}>
          If any provision of these terms is found to be unenforceable, the
          remaining provisions will continue in full force.
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

export default TermsOfService;

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
