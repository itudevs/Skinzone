import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

// Send a local notification when a visit is added
export async function sendVisitNotification(treatmentName: string, staffName: string, customerId: string) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: ' New Visit Added',
                body: `Your "${treatmentName}" visit has been added by ${staffName}`,
                data: {
                    type: 'visit_added',
                    customerId: customerId,
                },
            },
            trigger: null, // Send immediately
        });
        // Notification sent successfully
    } catch (error) {
        console.log('Error sending notification:', error);
    }
}
