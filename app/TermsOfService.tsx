import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Theme, useTheme } from "@/components/utils/Colours";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";

const TermsOfService = () => {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <Text style={styles(theme).title}>Terms of Service</Text>
        <Pressable onPress={() => router.back()}>
          <X color={theme.TextColour} size={28} />
        </Pressable>
      </View>

      <ScrollView
        style={styles(theme).scrollView}
        contentContainerStyle={styles(theme).content}
      >
        <Text style={styles(theme).lastUpdated}>Last Updated: March 19, 2026</Text>

        <Text style={styles(theme).sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles(theme).text}>
          By accessing or using the Skinzone Naturel mobile application and
          services, you agree to be bound by these Terms of Service. These terms
          constitute a legally binding agreement between you and Skinzone
          Naturel.
        </Text>

        <Text style={styles(theme).sectionTitle}>2. Description of Service</Text>
        <Text style={styles(theme).text}>
          Skinzone Naturel provides aesthetic treatments and a loyalty tracking
          system. Our services include:
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Aesthetic treatments (Chemical Peels, Microneedling, Laser, IV
          Infusions)
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Visit history and treatment tracking
        </Text>
        <Text style={styles(theme).bulletPoint}>• Loyalty points accumulation</Text>
        <Text style={styles(theme).bulletPoint}>
          • Notifications about appointments and offers
        </Text>

        <Text style={styles(theme).sectionTitle}>3. Medical & Health Disclaimer</Text>
        <Text style={styles(theme).text}>
          Our treatments are aesthetic in nature and do not constitute medical
          advice.
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Results (Get The Glow ) may vary based on individual physiology.
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • You must disclose all relevant medical history and allergies before
          treatment.
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • We are not liable for adverse reactions due to undisclosed
          information.
        </Text>

        <Text style={styles(theme).sectionTitle}>4. Appointments & Cancellations</Text>
        <Text style={styles(theme).text}>Please respect our scheduling policies:</Text>
        <Text style={styles(theme).bulletPoint}>
          • Please provide at least 24 hours notice for cancellations.
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Late cancellations or no-shows may incur a fee.
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Please arrive on time to ensure full treatment duration.
        </Text>

        <Text style={styles(theme).sectionTitle}>5. Loyalty Points Program</Text>
        <Text style={styles(theme).text}>
          Loyalty points are earned through visits and treatments:
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Points are awarded based on treatments received
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Points may be redeemed for free treatments when threshold is met
        </Text>
        <Text style={styles(theme).bulletPoint}>• Points have no cash value</Text>
        <Text style={styles(theme).bulletPoint}>
          • Points may not be transferred between accounts
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • We reserve the right to modify the points program with notice
        </Text>

        <Text style={styles(theme).sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles(theme).text}>
          To the maximum extent permitted by law, Skinzone Naturel and Vukosi J
          Chabangu shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages resulting from your use of the
          service.
        </Text>

        <Text style={styles(theme).sectionTitle}>7. Contact Information</Text>
        <Text style={styles(theme).text}>
          For questions about these Terms of Service:
        </Text>
        <Text style={styles(theme).bulletPoint}>
          • Email: skinzonenaturel@gmail.com
        </Text>
        <Text style={styles(theme).bulletPoint}>• Phone: +27 61 587 7918</Text>
        <Text style={styles(theme).bulletPoint}>• Owner: Vukosi J Chabangu</Text>

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

export default TermsOfService;
