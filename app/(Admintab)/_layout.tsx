import React from "react";
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";

const TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="StaffDashBoard"
        options={{ headerShown: false, title: "DashBoard" }}
      />
    </Tabs>
  );
};

export default TabLayout;
