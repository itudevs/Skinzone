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
        <Text style={styles.lastUpdated}>Last Updated: March 19, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using the Skinzone Naturel mobile application and
          services, you agree to be bound by these Terms of Service. These terms
          constitute a legally binding agreement between you and Skinzone
          Naturel (owned by Vukosi J Chabangu).
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.text}>
          Skinzone Naturel provides aesthetic treatments and a loyalty tracking
          system. Our services include:
        </Text>
        <Text style={styles.bulletPoint}>
          • Aesthetic treatments (Chemical Peels, Microneedling, Laser, IV
          Infusions)
        </Text>
        <Text style={styles.bulletPoint}>
          • Visit history and treatment tracking
        </Text>
        <Text style={styles.bulletPoint}>• Loyalty points accumulation</Text>
        <Text style={styles.bulletPoint}>
          • Notifications about appointments and offers
        </Text>

        <Text style={styles.sectionTitle}>3. Medical & Health Disclaimer</Text>
        <Text style={styles.text}>
          Our treatments are aesthetic in nature and do not constitute medical
          advice.
        </Text>
        <Text style={styles.bulletPoint}>
          • Results ("Get The Glow") may vary based on individual physiology.
        </Text>
        <Text style={styles.bulletPoint}>
          • You must disclose all relevant medical history and allergies before
          treatment.
        </Text>
        <Text style={styles.bulletPoint}>
          • We are not liable for adverse reactions due to undisclosed
          information.
        </Text>

        <Text style={styles.sectionTitle}>4. Appointments & Cancellations</Text>
        <Text style={styles.text}>Please respect our scheduling policies:</Text>
        <Text style={styles.bulletPoint}>
          • Please provide at least 24 hours' notice for cancellations.
        </Text>
        <Text style={styles.bulletPoint}>
          • Late cancellations or no-shows may incur a fee.
        </Text>
        <Text style={styles.bulletPoint}>
          • Please arrive on time to ensure full treatment duration.
        </Text>

        <Text style={styles.sectionTitle}>5. Loyalty Points Program</Text>
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

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.text}>
          To the maximum extent permitted by law, Skinzone Naturel and Vukosi J
          Chabangu shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages resulting from your use of the
          service.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Information</Text>
        <Text style={styles.text}>
          For questions about these Terms of Service:
        </Text>
        <Text style={styles.bulletPoint}>
          • Email: skinzonenaturel@gmail.com
        </Text>
        <Text style={styles.bulletPoint}>• Phone: +27 61 587 7918</Text>
        <Text style={styles.bulletPoint}>• Owner: Vukosi J Chabangu</Text>

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

export default TermsOfService;
