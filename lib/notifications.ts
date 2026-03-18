import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function getFunctionAuthHeaders() {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    let accessToken = session?.access_token;

    // Refresh near-expiry tokens because edge function calls do not auto-refresh like supabase-js queries.
    const isExpiringSoon =
        !!session?.expires_at && session.expires_at * 1000 <= Date.now() + 60_000;

    if (!accessToken || isExpiringSoon) {
        const {
            data: { session: refreshedSession },
            error,
        } = await supabase.auth.refreshSession();

        if (error) {
            console.log('Unable to refresh auth session for push notifications:', error.message);
            return null;
        }

        accessToken = refreshedSession?.access_token;
    }

    if (!accessToken) {
        return null;
    }

    return {
        Authorization: "Bearer " + accessToken,
    };
}

async function invokeEdgeFunction(
    functionName: string,
    body: Record<string, unknown>,
    hasRetried = false,
) {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase env vars for function invocation');
    }

    const headers = await getFunctionAuthHeaders();
    if (!headers?.Authorization) {
        throw new Error('Cannot invoke function: no authenticated session');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: headers.Authorization,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();

        // Recover from stale local token by forcing a refresh once and retrying.
        if (!hasRetried && response.status === 401 && text.includes('Invalid JWT')) {
            const { error } = await supabase.auth.refreshSession();
            if (!error) {
                return invokeEdgeFunction(functionName, body, true);
            }
        }

        throw new Error(`Edge function ${functionName} failed (${response.status}): ${text}`);
    }

    return response.json().catch(() => null);
}

// Request notification permissions
export async function requestNotificationPermissions() {
    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (error) {
        console.log('Error requesting notification permissions:', error);
        return false;
    }
}

function getProjectId() {
    const easProjectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

    return easProjectId;
}

// Register current device push token for the authenticated user.
export async function registerPushTokenForCurrentUser() {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return false;

        const projectId = getProjectId();
        if (!projectId) return false;

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResponse.data;
        if (!token) return false;

        await invokeEdgeFunction('register-push-token', {
            token,
            platform: Platform.OS,
        });

        return true;
    } catch (error) {
        console.log("Error while registering push token:", error);
        return false;
    }
}

export async function sendVisitNotification(treatmentName: string, staffName: string, customerId: string) {
    try {
        await invokeEdgeFunction('send-visit-notification', {
            treatmentName,
            staffName,
            customerId,
        });
    } catch (error) {
        console.log("Error sending visit push notification:", error);
        throw error;
    }
}