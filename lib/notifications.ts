import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

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

async function invokeEdgeFunction(
    functionName: string,
    body: Record<string, unknown>,
    hasRetried = false,
) {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body,
    });

    if (error) {
        const message = error.message ?? '';
        const status = (error as any)?.context?.status;

        // Recover from stale local token by forcing a refresh once and retrying.
        if (!hasRetried && status === 401 && message.includes('Invalid JWT')) {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError) {
                return invokeEdgeFunction(functionName, body, true);
            }
        }

        throw new Error(
            `Edge function ${functionName} failed${status ? ` (${status})` : ''}: ${message}`,
        );
    }

    return data ?? null;
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

export async function allocateBirthdayPointsIfEligible() {
    try {
        return await invokeEdgeFunction('allocate-birthday-points', {});
    } catch (error) {
        console.log("Error allocating birthday points:", error);
        return null;
    }
}