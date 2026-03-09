import {
  Text,
  View,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  FlatList,
} from "react-native";
import ProfileImage from "@/components/ProfileImage";
import { useCallback, useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import Colors from "@/components/utils/Colours";
import { Bell, TrendingUp, X, Calendar, Clock } from "lucide-react-native";
import Visitation from "@/components/Visitation";
import { UserSession } from "@/components/utils/GetUsersession";
import {
  GetLastPointvisit,
  GetTotalFinalPoints,
  GetTotalPoints,
} from "@/components/utils/GetUserData";
import FreeVisit from "@/components/FreeVisit";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

const Home = () => {
  const [session, setSession] = useState<Session | null>(
    UserSession.getSession(),
  );
  const [username, setUsername] = useState("-");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, settotal] = useState(0);
  const [lastp, setlastp] = useState(0);
  const [Qualify, setQualify] = useState(false);
  const [Qualpoints, setQualpoints] = useState(0);
  const [notification, setNotification] = useState<any>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<
    StoredNotification[]
  >([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    setSession(UserSession.getSession());
    loadNotificationHistory();
  }, []);

  // Load notification history from storage
  const loadNotificationHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("notificationHistory");
      if (stored) {
        const notifications: StoredNotification[] = JSON.parse(stored);
        setNotificationHistory(notifications);
        setUnreadCount(notifications.filter((n) => !n.read).length);
      }
    } catch (error) {
      // Error loading notifications
    }
  };

  // Save notification to history
  const saveNotification = async (title: string, body: string) => {
    try {
      const newNotification: StoredNotification = {
        id: Date.now().toString(),
        title,
        body,
        timestamp: Date.now(),
        read: false,
      };
      const updated = [newNotification, ...notificationHistory];
      await AsyncStorage.setItem(
        "notificationHistory",
        JSON.stringify(updated),
      );
      setNotificationHistory(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    } catch (error) {
      // Error saving notification
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const updated = notificationHistory.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem(
        "notificationHistory",
        JSON.stringify(updated),
      );
      setNotificationHistory(updated);
      setUnreadCount(0);
    } catch (error) {
      // Error marking as read
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await AsyncStorage.removeItem("notificationHistory");
      setNotificationHistory([]);
      setUnreadCount(0);
    } catch (error) {
      // Error clearing notifications
    }
  };

  // Open notification modal
  const openNotificationModal = () => {
    setShowNotificationModal(true);
    markAllAsRead();
  };

  // Listen for notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Check if notification is for the current user
        const notificationCustomerId =
          notification.request.content.data?.customerId;
        const currentUserId = session?.user.id;

        if (
          notificationCustomerId &&
          currentUserId &&
          notificationCustomerId !== currentUserId
        ) {
          return;
        }

        setNotification(notification);
        setShowNotificationBanner(true);

        // Save to history
        saveNotification(
          notification.request.content.title || "Notification",
          notification.request.content.body || "",
        );

        // Slide in animation
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();

        // Auto-hide after 5 seconds
        setTimeout(() => {
          hideNotificationBanner();
        }, 5000);
      },
    );

    return () => subscription.remove();
  }, [notificationHistory, session?.user.id]);

  const hideNotificationBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationBanner(false);
      setNotification(null);
    });
  };

  const getUserData = useCallback(
    async (isActive: () => boolean) => {
      if (!session?.user.id) return;

      setLoading(true);
      try {
        const { data: userData, error: dbError } = await supabase
          .from("User")
          .select("name, profile_picture")
          .eq("id", session.user.id)
          .single();

        if (dbError || !userData) {
          console.error("Database error:", dbError);
          return;
        }

        if (isActive()) {
          setUsername(userData.name);
          setProfilePicture(userData.profile_picture);
        }
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [session?.user.id],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserData(() => active);
      return () => {
        active = false;
      };
    }, [getUserData]),
  );

  const fetchpoints = useCallback(async (userid: string | undefined) => {
    let points = await GetTotalFinalPoints(userid);
    let last = await GetLastPointvisit(userid);
    settotal(points);
    setlastp(last);
    if (points >= 500) {
      setQualify(true);
      setQualpoints(points);
    } else {
      setQualify(false);
      setQualpoints(0);
    }
  }, []);

  useEffect(() => {
    fetchpoints(session?.user.id);
  }, [session?.user.id, fetchpoints]);

  const handleClaimSuccess = useCallback(() => {
    // Refresh points after claiming a free visit
    fetchpoints(session?.user.id);
  }, [session?.user.id, fetchpoints]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Notification Banner */}
      {showNotificationBanner && notification && (
        <Animated.View
          style={[
            styles.notificationBanner,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.notificationBody}>
              {notification.request.content.body}
            </Text>
          </View>
          <Pressable
            onPress={hideNotificationBanner}
            style={styles.notificationClose}
          >
            <X color={Colors.TextColour} size={20} />
          </Pressable>
        </Animated.View>
      )}

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ProfileImage imagehandler={() => {}} imageUrl={profilePicture} />
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <Text style={styles.usernameText}>
              {loading ? "Loading..." : username}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.notificationBtn}
          onPress={openNotificationModal}
        >
          <Bell color={"white"} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={styles.modalHeaderRight}>
              {notificationHistory.length > 0 && (
                <Pressable
                  onPress={clearAllNotifications}
                  style={styles.clearAllBtn}
                >
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setShowNotificationModal(false)}>
                <X color={Colors.TextColour} size={28} />
              </Pressable>
            </View>
          </View>

          {notificationHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell color={Colors.TextColour} size={64} />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
              <Text style={styles.emptyStateSubtext}>
                You'll see your visit updates here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notificationHistory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notificationList}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.notificationItem,
                    !item.read && styles.notificationItemUnread,
                  ]}
                >
                  <View style={styles.notificationIconContainer}>
                    <Calendar color={Colors.Primary900} size={24} />
                  </View>
                  <View style={styles.notificationItemContent}>
                    <Text style={styles.notificationItemTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.notificationItemBody}>{item.body}</Text>
                    <View style={styles.notificationItemFooter}>
                      <Clock color={Colors.TextColour} size={12} />
                      <Text style={styles.notificationItemTime}>
                        {new Date(item.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceAmount}>
          {" "}
          {loading ? "Loading..." : total}
        </Text>
        <Text style={styles.balanceLabel}>OVERALL BALANCE</Text>

        <View style={styles.balanceFooter}>
          <View>
            <Text style={styles.pointsAmount}>
              {loading ? "Loading..." : lastp}{" "}
              <Text style={styles.pointsUnit}>pts</Text>
            </Text>
            <Text style={styles.visitationLabel}>VISITATION</Text>
          </View>
          <Text style={styles.trendIcon}>
            <TrendingUp />
          </Text>
        </View>
      </View>

      {/* Visitations Section */}
      <View style={styles.visitationsHeader}>
        <Text style={styles.visitationsTitle}>Visitations</Text>
        <Pressable style={styles.recentBtn}>
          <Text style={styles.recentBtnText}>Recent</Text>
        </Pressable>
      </View>
      {/**Free Visitation Area */}
      {Qualify && session?.user.id && (
        <FreeVisit
          points={Qualpoints}
          customerid={session.user.id}
          onClaimSuccess={handleClaimSuccess}
        />
      )}
      <Visitation id={session?.user.id} />
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  notificationBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.Primary900,
    padding: 15,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notificationBody: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
  },
  notificationClose: {
    padding: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 120,
    flex: 1,
  },
  welcomeContainer: {
    marginLeft: 5,
  },
  welcomeText: {
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
  },
  usernameText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    backgroundColor: "#D4F5E9",
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 25,
  },
  balanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
  },
  pointsUnit: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#666666",
  },
  visitationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#00CC88",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  trendIcon: {
    fontSize: 24,
  },
  visitationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  visitationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  recentBtn: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background100,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  clearAllBtn: {
    backgroundColor: Colors.background100,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearAllBtnText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.TextColour,
    marginTop: 8,
    textAlign: "center",
  },
  notificationList: {
    padding: 20,
  },
  notificationItem: {
    backgroundColor: Colors.background100,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.Primary900,
  },
  notificationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.PrimaryBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationItemContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  notificationItemBody: {
    fontSize: 14,
    color: Colors.TextColour,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationItemFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationItemTime: {
    fontSize: 12,
    color: Colors.TextColour,
    marginLeft: 5,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.Primary900,
    marginLeft: 10,
  },
});
