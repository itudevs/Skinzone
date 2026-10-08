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
import { Theme, useTheme } from "@/components/utils/Colours";
import { Bell, TrendingUp, X, Calendar, Clock } from "lucide-react-native";
import Visitation from "@/components/Visitation";
import { UserSession } from "@/components/utils/GetUsersession";
import {
  GetLastPointvisit,
  GetTotalFinalPoints,
  Getvisitations,
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

interface BirthdayBonusStatus {
  awardedToday: boolean;
  points: number;
}

const BIRTHDAY_BONUS_STORAGE_KEY = "birthday_bonus_awarded";

const Home = () => {
  const theme = useTheme();
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
  const [visitations, setVisitations] = useState<any[]>([]);
  const [birthdayBonus, setBirthdayBonus] = useState<BirthdayBonusStatus>({
    awardedToday: false,
    points: 0,
  });

  useEffect(() => {
    const unsubscribe = UserSession.onSessionChange((nextSession) => {
      setSession(nextSession);
    });

    loadNotificationHistory();

    return () => {
      unsubscribe();
    };
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
    } catch {
      // Error loading notifications
    }
  };

  const loadBirthdayBonusStatus = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BIRTHDAY_BONUS_STORAGE_KEY);
      if (!raw) {
        setBirthdayBonus({ awardedToday: false, points: 0 });
        return;
      }

      const parsed = JSON.parse(raw) as {
        awardedAt?: string;
        pointsAwarded?: number;
      };

      const awardedAt = parsed.awardedAt ? new Date(parsed.awardedAt) : null;
      const now = new Date();
      const isSameDay =
        !!awardedAt &&
        awardedAt.getFullYear() === now.getFullYear() &&
        awardedAt.getMonth() === now.getMonth() &&
        awardedAt.getDate() === now.getDate();

      if (!isSameDay) {
        await AsyncStorage.removeItem(BIRTHDAY_BONUS_STORAGE_KEY);
        setBirthdayBonus({ awardedToday: false, points: 0 });
        return;
      }

      setBirthdayBonus({
        awardedToday: true,
        points: Number(parsed.pointsAwarded ?? 100),
      });
    } catch {
      setBirthdayBonus({ awardedToday: false, points: 0 });
    }
  }, []);

  // Save notification to history
  const saveNotification = useCallback(
    async (title: string, body: string) => {
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
      } catch {
        // Error saving notification
      }
    },
    [notificationHistory],
  );

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
    } catch {
      // Error marking as read
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await AsyncStorage.removeItem("notificationHistory");
      setNotificationHistory([]);
      setUnreadCount(0);
    } catch {
      // Error clearing notifications
    }
  };

  // Open notification modal
  const openNotificationModal = () => {
    setShowNotificationModal(true);
    markAllAsRead();
  };

  const hideNotificationBanner = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationBanner(false);
      setNotification(null);
    });
  }, [slideAnim]);

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
  }, [
    hideNotificationBanner,
    notificationHistory,
    saveNotification,
    session?.user.id,
    slideAnim,
  ]);

  const getUserData = useCallback(
    async (isActive: () => boolean) => {
      if (!session?.user.id) {
        if (isActive()) setLoading(false);
        return;
      }

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
      } catch {
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [session?.user.id],
  );

  const fetchpoints = useCallback(
    async (isActive: () => boolean) => {
      if (!session?.user.id) return;
      try {
        let points = await GetTotalFinalPoints(session?.user.id);
        let last = await GetLastPointvisit(session?.user.id);
        if (isActive()) {
          settotal(points);
          setlastp(last);
          if (points >= 500) {
            setQualify(true);
            setQualpoints(points);
          } else {
            setQualify(false);
            setQualpoints(0);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    [session?.user.id],
  );

  const fetchVisitations = useCallback(
    async (isActive: () => boolean) => {
      if (!session?.user.id) return;
      try {
        const data = await Getvisitations(session.user.id, 5);
        if (isActive()) {
          setVisitations(data);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [session?.user.id],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserData(() => active);
      fetchpoints(() => active);
      fetchVisitations(() => active);
      loadBirthdayBonusStatus();
      return () => {
        active = false;
      };
    }, [getUserData, fetchpoints, fetchVisitations, loadBirthdayBonusStatus]),
  );

  const handleClaimSuccess = useCallback(() => {
    const alwaysActive = () => true;

    // Refresh all Home data impacted by a free-visit claim.
    fetchpoints(alwaysActive);
    fetchVisitations(alwaysActive);
    loadBirthdayBonusStatus();
  }, [fetchpoints, fetchVisitations, loadBirthdayBonusStatus]);

  const pointsLeftToClaim = Math.max(0, 500 - total);

  return (
    <ScrollView
      style={styles(theme).container}
      contentContainerStyle={styles(theme).contentContainer}
    >
      {/* Notification Banner */}
      {showNotificationBanner && notification && (
        <Animated.View
          style={[
            styles(theme).notificationBanner,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles(theme).notificationContent}>
            <Text style={styles(theme).notificationTitle}>
              {notification.request.content.title}
            </Text>
            <Text style={styles(theme).notificationBody}>
              {notification.request.content.body}
            </Text>
          </View>
          <Pressable
            onPress={hideNotificationBanner}
            style={styles(theme).notificationClose}
          >
            <X color={theme.TextColour} size={20} />
          </Pressable>
        </Animated.View>
      )}

      {/* Header Section */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerLeft}>
          <ProfileImage imagehandler={() => {}} imageUrl={profilePicture} />
          <View style={styles(theme).welcomeContainer}>
            <Text style={styles(theme).welcomeText}>WELCOME BACK</Text>
            <Text style={styles(theme).usernameText}>
              {loading ? "Loading..." : username}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles(theme).notificationBtn}
          onPress={openNotificationModal}
        >
          <Bell color={theme.TextColour} />
          {unreadCount > 0 && (
            <View style={styles(theme).badge}>
              <Text style={styles(theme).badgeText}>{unreadCount}</Text>
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
        <View style={styles(theme).modalContainer}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Notifications</Text>
            <View style={styles(theme).modalHeaderRight}>
              {notificationHistory.length > 0 && (
                <Pressable
                  onPress={clearAllNotifications}
                  style={styles(theme).clearAllBtn}
                >
                  <Text style={styles(theme).clearAllBtnText}>Clear All</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setShowNotificationModal(false)}>
                <X color={theme.notificationModalText} size={28} />
              </Pressable>
            </View>
          </View>

          {notificationHistory.length === 0 ? (
            <View style={styles(theme).emptyState}>
              <Bell color={theme.notificationModalText} size={64} />
              <Text style={styles(theme).emptyStateText}>No notifications yet</Text>
              <Text style={styles(theme).emptyStateSubtext}>
                You&apos;ll see your visit updates here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notificationHistory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles(theme).notificationList}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles(theme).notificationItem,
                    !item.read && styles(theme).notificationItemUnread,
                  ]}
                >
                  <View style={styles(theme).notificationIconContainer}>
                    <Calendar color={theme.Primary900} size={24} />
                  </View>
                  <View style={styles(theme).notificationItemContent}>
                    <Text style={styles(theme).notificationItemTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles(theme).notificationItemBody}>{item.body}</Text>
                    <View style={styles(theme).notificationItemFooter}>
                      <Clock color={theme.notificationModalText} size={12} />
                      <Text style={styles(theme).notificationItemTime}>
                        {new Date(item.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                  {!item.read && <View style={styles(theme).unreadDot} />}
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Balance Card */}
      <View style={styles(theme).balanceCard}>
        {birthdayBonus.awardedToday && (
          <View style={styles(theme).birthdayBadge}>
            <Text style={styles(theme).birthdayBadgeText}>
              Birthday bonus awarded: +{birthdayBonus.points} pts
            </Text>
          </View>
        )}
        <View style={styles(theme).balanceAmountRow}>
          <Text style={styles(theme).balanceAmount}>
            {" "}
            {loading ? "Loading..." : total}
          </Text>
          {!loading && (
            <Text style={styles(theme).pointsLeftText}>
              {pointsLeftToClaim} points left to claim
            </Text>
          )}
        </View>
        <Text style={styles(theme).balanceLabel}>OVERALL BALANCE</Text>

        <View style={styles(theme).balanceFooter}>
          <View>
            <Text style={styles(theme).pointsAmount}>
              {loading ? "Loading..." : lastp}{" "}
              <Text style={styles(theme).pointsUnit}>pts</Text>
            </Text>
            <Text style={styles(theme).visitationLabel}>VISITATION</Text>
          </View>
          <Text style={styles(theme).trendIcon}>
            <TrendingUp />
          </Text>
        </View>
      </View>

      {/* Visitations Section */}
      <View style={styles(theme).visitationsHeader}>
        <Text style={styles(theme).visitationsTitle}>Visitations</Text>
        <Pressable style={styles(theme).recentBtn}>
          <Text style={styles(theme).recentBtnText}>Recent</Text>
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
      <Visitation id={session?.user.id} visitsData={visitations} />
    </ScrollView>
  );
};

export default Home;

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.PrimaryBackground,
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
    backgroundColor: theme.Primary900,
    padding: 15,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 1000,
    elevation: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    color: theme.TextColour,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notificationBody: {
    color: theme.TextColour,
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
    color: theme.TextColour,
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    backgroundColor: theme.adminBorder,
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
    color: theme.TextColour,
    marginBottom: 5,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  pointsLeftText: {
    fontSize: 12,
    color: "#2E7D65",
    marginBottom: 14,
    maxWidth: 140,
    textAlign: "right",
    fontWeight: "600",
  },
  birthdayBadge: {
    backgroundColor: theme.PrimaryBackground,
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  birthdayBadgeText: {
    color: "#D4F5E9",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.4,
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
    color: theme.TextColour,
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
    color: theme.TextColour,
  },
  recentBtn: {
    backgroundColor: theme.adminBorder,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentBtnText: {
    color: theme.TextColour,
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
    color: theme.TextColour,
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.notificationModalBackground,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.background100,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.notificationModalText,
  },
  modalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  clearAllBtn: {
    backgroundColor: theme.background100,
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
    color: theme.notificationModalText,
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.notificationModalText,
    marginTop: 8,
    textAlign: "center",
  },
  notificationList: {
    padding: 20,
  },
  notificationItem: {
    backgroundColor: theme.notificationModalBackground,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: theme.Primary900,
  },
  notificationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.PrimaryBackground,
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
    color: theme.notificationModalText,
    marginBottom: 5,
  },
  notificationItemBody: {
    fontSize: 14,
    color: theme.notificationModalText,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationItemFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationItemTime: {
    fontSize: 12,
    color: theme.notificationModalText,
    marginLeft: 5,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Primary900,
    marginLeft: 10,
  },
});
