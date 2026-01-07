import React from "react";
import { Tabs } from "expo-router";
import TabBar from "@/components/TabBar";

const TabLayout = () => {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="Home"
        options={{ headerShown: false, title: "Home" }}
      />
      <Tabs.Screen
        name="HistoryPage"
        options={{ headerShown: false, title: "History" }}
      />
      <Tabs.Screen
        name="CustomerProfile"
        options={{ headerShown: false, title: "Profile" }}
      />
    </Tabs>
  );
};

export default TabLayout;
