import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import AdminHeader from "@/components/admin/AdminHeader";
import { Colors } from "@/constants/Colors";
import { FontFamilies } from "@/constants/typography";

// Shared admin chrome: the AdminHeader (emblem + PERUN + ADMIN badge + avatar)
// sits above the tab navigator, so all four tab screens inherit it. The
// create/edit form lives outside this group and renders its own nav bar.
export default function AdminTabsLayout() {
  return (
    <View style={styles.container}>
      <AdminHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 70,
            backgroundColor: "rgba(255, 255, 255, 0.97)",
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.burgundy,
          tabBarInactiveTintColor: "#B3A9B2",
          tabBarLabelStyle: {
            fontFamily: FontFamilies.hanken[700],
            fontSize: 11,
          },
          tabBarIconStyle: { marginBottom: -2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Pregled",
            tabBarIcon: ({ color, size }) => (
              <Feather name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Korisnici",
            tabBarIcon: ({ color, size }) => (
              <Feather name="users" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Treninzi",
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Statistika",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
});
