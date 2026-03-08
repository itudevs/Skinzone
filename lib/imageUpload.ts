import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

/**
 * Request camera and media library permissions
 * Required by Apple's App Store guidelines (3.3.8, 3.3.16)
 */
export async function requestImagePermissions(): Promise<boolean> {
    try {
        // Request camera permissions
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

        // Request media library permissions
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'We need access to your camera and photo library to update your profile picture. You can enable this in your device settings.',
                [{ text: 'OK' }]
            );
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Show options to pick image from gallery or take a photo
 * Complies with Apple's user consent requirements (3.3.16)
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    return new Promise((resolve) => {
        Alert.alert(
            'Update Profile Picture',
            'Choose an option:',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const hasPermission = await requestImagePermissions();
                        if (!hasPermission) {
                            resolve(null);
                            return;
                        }

                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });

                        if (!result.canceled && result.assets[0]) {
                            resolve(result.assets[0]);
                        } else {
                            resolve(null);
                        }
                    },
                },
                {
                    text: 'Choose from Library',
                    onPress: async () => {
                        const hasPermission = await requestImagePermissions();
                        if (!hasPermission) {
                            resolve(null);
                            return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });

                        if (!result.canceled && result.assets[0]) {
                            resolve(result.assets[0]);
                        } else {
                            resolve(null);
                        }
                    },
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        resolve(null);
                    },
                },
            ],
            { cancelable: true }
        );
    });
}

/**
 * Upload image to Supabase Storage
 * @param userId - User's unique ID
 * @param imageUri - Local image URI
 * @returns Public URL of uploaded image or null if failed
 */
export async function uploadProfileImage(
    userId: string,
    imageUri: string
): Promise<string | null> {
    try {
        // Read file as base64 using expo-file-system (works in React Native)
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // Convert base64 to ArrayBuffer
        const arrayBuffer = decode(base64);

        // Generate unique filename
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        // Upload to Supabase Storage using ArrayBuffer
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: true,
            });

        if (error) {
            Alert.alert('Upload Failed', `Could not upload profile picture: ${error.message}`);
            return null;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
            // Don't add cache busting - use clean URL
            const finalUrl = publicUrlData.publicUrl;

            // Update User table with new profile picture URL
            const { error: updateError } = await supabase
                .from('User')
                .update({ profile_picture: finalUrl })
                .eq('id', userId);

            if (updateError) {
                Alert.alert('Update Failed', 'Could not save profile picture. Please try again.');
                return null;
            }

            return finalUrl;
        }

        return null;
    } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        return null;
    }
}

/**
 * Delete old profile picture from storage
 * @param imageUrl - Full URL of the image to delete
 */
export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split('/avatars/');
        if (urlParts.length < 2) return false;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

        if (error) {
            console.error('Delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete image error:', error);
        return false;
    }
}
