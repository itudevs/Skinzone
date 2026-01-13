import React from "react";
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";

const TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="StaffDashBoard"
        options={{ headerShown: false, title: "Home" }}
      />
      <Tabs.Screen
        name="AddTreatment"
        options={{ headerShown: false, title: "Treatment" }}
      />
      <Tabs.Screen
        name="StaffProfile"
        options={{ headerShown: false, title: "Settings" }}
      />
    </Tabs>
  );
};

export default TabLayout;
