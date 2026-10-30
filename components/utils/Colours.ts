import { useColorScheme } from "react-native";

export type Theme = {
  Primary900: string;
  SecondaryColour100: string;
  TextColour: string;
  PrimaryBackground: string;
  bordercolor: string;
  background100: string;
  placeholder: string;
  icon: string;
  shadow: string;
  bookingBackground: string;
  modalText: string;
  modalBackground: string;
  visitDetailsModalBackground: string;
  visitationModalBackground: string;
  visitationItemText: string;
  bookingCardBackground: string;
  bookingCardText: string;
  adminBorder: string;
  notificationModalBackground: string;
  notificationModalText: string;
  treatmentModalBackground: string;
  treatmentModalText: string;
  treatmentModalItemBackground: string;
  freeTreatmentModalBackground: string;
};

const darkTheme: Theme = {
  Primary900: "#00FF5F",
  SecondaryColour100: "#1D361D",
  TextColour: "#FFFFFF",
  PrimaryBackground: "#191919",
  bordercolor: "#5f5e5e",
  background100: "#282828",
  placeholder: "#666666",
  icon: "#999999",
  shadow: "#000000",
  bookingBackground: "#111315",
  modalText: "#FFFFFF",
  modalBackground: "#10261A",
  visitDetailsModalBackground: "#10261A",
  visitationModalBackground: "#0E1C14",
  visitationItemText: "#FFFFFF",
  bookingCardBackground: "#282828",
  bookingCardText: "#FFFFFF",
  adminBorder: "#737373",
  notificationModalBackground: "#000000",
  notificationModalText: "#FFFFFF",
  treatmentModalBackground: "#10261A",
  treatmentModalText: "#FFFFFF",
  treatmentModalItemBackground: "#000000",
  freeTreatmentModalBackground: "#000000",
};

const lightTheme: Theme = {
  Primary900: "#00C94F",
  SecondaryColour100: "#E3F8E8",
  TextColour: "#000000",
  PrimaryBackground: "#FFFFFF",
  bordercolor: "#B8B8B8",
  background100: "#F2F2F2",
  placeholder: "#6B6B6B",
  icon: "#5A5A5A",
  shadow: "#000000",
  bookingBackground: "#E2E2E2",
  modalText: "#FFFFFF",
  modalBackground: "#10261A",
  visitDetailsModalBackground: "#737373",
  visitationModalBackground: "#D3D3D3",
  visitationItemText: "#FFFFFF",
  bookingCardBackground: "#FFFFFF",
  bookingCardText: "#000000",
  adminBorder: "#8A8A8A",
  notificationModalBackground: "#FFFFFF",
  notificationModalText: "#000000",
  treatmentModalBackground: "#FFFFFF",
  treatmentModalText: "#000000",
  treatmentModalItemBackground: "#FFFFFF",
  freeTreatmentModalBackground: "#FFFFFF",
};

export const getTheme = (scheme: string | null | undefined): Theme =>
  scheme === "light" ? lightTheme : darkTheme;

export const useTheme = (): Theme => getTheme(useColorScheme());

// Kept for non-component callers that still need the default palette.
const Colors = darkTheme;

export default Colors;
