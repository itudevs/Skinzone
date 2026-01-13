import React from "react";
import { View, StyleSheet } from "react-native";
import { useLinkBuilder, useTheme } from "@react-navigation/native";
import { Text, PlatformPressable } from "@react-navigation/elements";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Colors from "./utils/Colours";
import {
  Home,
  User,
  Settings,
  History,
  Stethoscope,
} from "lucide-react-native";
import StaffDashBoard from "@/app/(Admintab)/StaffDashBoard";

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();
  const icons: Record<
    string,
    React.ComponentType<{ color?: string; size?: number }>
  > = {
    index: Home,
    Home,
    HistoryPage: History,
    CustomerProfile: User,
    StaffDashBoard: Home,
    StaffProfile: Settings,
    AddTreatment: Stethoscope,
  };
  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
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

        return (
          <PlatformPressable
            href={buildHref(route.name, route.params)}
            accessibilityState={
              isFocused ? { selected: true } : { selected: false }
            }
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabitem}
            key={route.name}
          >
            {(() => {
              const Icon = icons[route.name] ?? Home;
              return (
                <Icon
                  size={24}
                  color={isFocused ? Colors.Primary900 : Colors.TextColour}
                />
              );
            })()}
            {typeof label === "function" ? (
              label({
                focused: isFocused,
                color: isFocused ? Colors.Primary900 : Colors.TextColour,
                position: "beside-icon",
                children: route.name,
              })
            ) : (
              <Text
                style={{
                  color: isFocused ? Colors.Primary900 : Colors.TextColour,
                }}
              >
                {label}
              </Text>
            )}
          </PlatformPressable>
        );
      })}
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  tabbar: {
    position: "absolute",
    bottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background100,
    marginHorizontal: 80,
    borderRadius: 20,
    elevation: 4,
    shadowColor: Colors.PrimaryBackground,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  tabitem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    margin: 5,
  },
});
