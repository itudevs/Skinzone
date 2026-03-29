import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

type UploadImageInput = string | ImagePicker.ImagePickerAsset;

function errorToMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

function normalizeImageMeta(image: UploadImageInput) {
    const uri = typeof image === 'string' ? image : image.uri;
    const mimeType =
        typeof image === 'string'
            ? undefined
            : image.mimeType ?? undefined;
    const fileName =
        typeof image === 'string'
            ? undefined
            : image.fileName ?? undefined;

    const cleanName = fileName ? fileName.split(/[?#]/)[0] : '';
    const extFromName = cleanName.includes('.') ? cleanName.split('.').pop()?.toLowerCase() : undefined;

    const cleanUri = uri.split(/[?#]/)[0];
    const extFromUri = cleanUri.includes('.') ? cleanUri.split('.').pop()?.toLowerCase() : undefined;

    const extFromMime = mimeType?.startsWith('image/') ? mimeType.replace('image/', '').toLowerCase() : undefined;

    const extension = extFromName || extFromUri || extFromMime || 'jpg';

    const normalizedContentType = (() => {
        if (mimeType) return mimeType;
        if (extension === 'jpg') return 'image/jpeg';
        return `image/${extension}`;
    })();

    return {
        uri,
        extension,
        contentType: normalizedContentType,
    };
}

async function readImageBase64(uri: string) {
    try {
        return await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });
    } catch (error) {
        // Some Android content:// URIs need copying to a local cache file before reading.
        if (Platform.OS === 'android' && uri.startsWith('content://') && FileSystem.cacheDirectory) {
            const cachePath = `${FileSystem.cacheDirectory}profile-upload-${Date.now()}.jpg`;
            try {
                await FileSystem.copyAsync({ from: uri, to: cachePath });
                return await FileSystem.readAsStringAsync(cachePath, {
                    encoding: 'base64',
                });
            } catch (fallbackError) {
                Alert.alert(
                    'Profile Upload Error (Read File)',
                    `Failed to read selected image after Android fallback.\nURI: ${uri}\nError: ${errorToMessage(fallbackError)}`
                );
                throw fallbackError;
            }
        }
        Alert.alert(
            'Profile Upload Error (Read File)',
            `Failed to read selected image.\nURI: ${uri}\nError: ${errorToMessage(error)}`
        );
        throw error;
    }
}

async function launchImageLibraryWithAndroidFallback() {
    if (Platform.OS === 'android') {
        // On some Android devices, editing with legacy picker can return canceled after selection.
        // Use a stable legacy config first, then retry once if needed.
        const androidPrimary = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.7,
            legacy: true,
        });

        if (!androidPrimary.canceled && androidPrimary.assets?.[0]) {
            return androidPrimary;
        }

        const androidRetry = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            legacy: true,
        });

        return androidRetry;
    }

    try {
        return await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
    } catch (error) {
        throw error;
    }
}

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
                            mediaTypes: ['images'],
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

                        try {
                            const result = await launchImageLibraryWithAndroidFallback();

                            if (!result.canceled && result.assets[0]) {
                                resolve(result.assets[0]);
                            } else {
                                Alert.alert(
                                    'No Image Selected',
                                    'Android returned no selected image. Please try again, or use Take Photo as a fallback.'
                                );
                                resolve(null);
                            }
                        } catch (error) {
                            Alert.alert(
                                'Image Picker Error',
                                'Could not open your photo library on this device. Please try taking a photo instead.'
                            );
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
    image: UploadImageInput
): Promise<string | null> {
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
            Alert.alert('Profile Upload Error (Auth)', 'No active session found. Please log in again.');
            return null;
        }

        const { uri, extension, contentType } = normalizeImageMeta(image);

        // Read file as base64 using expo-file-system (works in React Native)
        const base64 = await readImageBase64(uri);

        // Convert base64 to ArrayBuffer
        const arrayBuffer = decode(base64);

        // Generate unique filename
        const fileName = `${userId}-${Date.now()}.${extension}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to Supabase Storage using ArrayBuffer
        const { error } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
                contentType,
                upsert: true,
            });

        if (error) {
            Alert.alert(
                'Profile Upload Error (Storage)',
                `Bucket: avatars\nPath: ${filePath}\nType: ${contentType}\nError: ${error.message}`
            );
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
                Alert.alert(
                    'Profile Upload Error (DB Update)',
                    `Image uploaded but failed saving URL to profile.\nError: ${updateError.message}`
                );
                return null;
            }

            return finalUrl;
        }

        Alert.alert(
            'Profile Upload Error (Public URL)',
            `Image uploaded but public URL could not be generated.\nPath: ${filePath}`
        );

        return null;
    } catch (error) {
        Alert.alert(
            'Profile Upload Error (Unexpected)',
            errorToMessage(error)
        );
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
