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
      <Tabs.Screen
        name="StaffDashBoard"
        options={{
          headerShown: false,
          title: "Staff DashBoard",
        }}
      />
      <Tabs.Screen
        name="PrivacyPolicy"
        options={{ headerShown: false, title: "PrivacyPolicy" }}
      />
      <Tabs.Screen
        name="TermsOfService"
        options={{ headerShown: false, title: "TermsOfService" }}
      />
    </Tabs>
  );
};

export default TabLayout;
