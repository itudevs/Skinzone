import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "./utils/Colours";
import {
  Home,
  User,
  Settings,
  History,
  Stethoscope,
  Calendar,
} from "lucide-react-native";

const TabBar = (props: any) => {
  const { state, navigation, descriptors } = props;

  const icons: Record<
    string,
    React.ComponentType<{ color?: string; size?: number }>
  > = {
    index: Home,
    Home,
    Booking: Calendar,
    HistoryPage: History,
    CustomerProfile: User,
    StaffDashBoard: Home,
    StaffProfile: Settings,
    AddTreatment: Stethoscope,
    AdminBooking: Calendar,
  };

  return (
    <View style={styles.tabbar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const Icon = icons[route.name] ?? Home;

        return (
          <Pressable
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={
              isFocused ? { selected: true } : { selected: false }
            }
            style={styles.tabitem}
          >
            <Icon
              size={24}
              color={isFocused ? Colors.Primary900 : Colors.TextColour}
            />
            <Text
              style={{
                color: isFocused ? Colors.Primary900 : Colors.TextColour,
                marginTop: 4,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  tabbar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background100,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  tabitem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
});
