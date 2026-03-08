import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const CACHE_PREFIX = "cache_";
const CACHE_TIMESTAMP_PREFIX = "cache_ts_";
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheOptions {
    duration?: number;
    forceRefresh?: boolean;
}

class CacheManager {
    private subscriptions: Map<string, any> = new Map();

    /**
     * Get cached data or fetch from database
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const { duration = DEFAULT_CACHE_DURATION, forceRefresh = false } = options;

        if (!forceRefresh) {
            const cached = await this.getCached<T>(key, duration);
            if (cached !== null) {
                return cached;
            }
        }

        // Fetch fresh data
        const data = await fetcher();
        await this.set(key, data);
        return data;
    }

    /**
     * Get cached data if valid
     */
    private async getCached<T>(key: string, duration: number): Promise<T | null> {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;

            const [cachedData, timestamp] = await Promise.all([
                AsyncStorage.getItem(cacheKey),
                AsyncStorage.getItem(timestampKey),
            ]);

            if (!cachedData || !timestamp) {
                return null;
            }

            const age = Date.now() - parseInt(timestamp);
            if (age > duration) {
                // Cache expired
                await this.invalidate(key);
                return null;
            }

            return JSON.parse(cachedData);
        } catch (error) {
            console.error("Cache read error:", error);
            return null;
        }
    }

    /**
     * Set cache data
     */
    async set(key: string, data: any): Promise<void> {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;

            await Promise.all([
                AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
                AsyncStorage.setItem(timestampKey, Date.now().toString()),
            ]);
        } catch (error) {
            console.error("Cache write error:", error);
        }
    }

    /**
     * Invalidate specific cache key
     */
    async invalidate(key: string): Promise<void> {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;
            await Promise.all([
                AsyncStorage.removeItem(cacheKey),
                AsyncStorage.removeItem(timestampKey),
            ]);
        } catch (error) {
            console.error("Cache invalidation error:", error);
        }
    }

    /**
     * Invalidate all caches matching pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const matchingKeys = keys.filter((key) =>
                key.includes(CACHE_PREFIX + pattern)
            );
            const timestampKeys = matchingKeys.map((key) =>
                key.replace(CACHE_PREFIX, CACHE_TIMESTAMP_PREFIX)
            );
            await AsyncStorage.multiRemove([...matchingKeys, ...timestampKeys]);
        } catch (error) {
            console.error("Cache pattern invalidation error:", error);
        }
    }

    /**
     * Clear all cache
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(
                (key) =>
                    key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)
            );
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error("Cache clear error:", error);
        }
    }

    /**
     * Subscribe to table changes for cache invalidation
     */
    subscribeToTable(
        table: string,
        callback: (payload: any) => void
    ): () => void {
        const key = `subscription_${table}`;

        if (this.subscriptions.has(key)) {
            return () => { }; // Already subscribed
        }

        const subscription = supabase
            .channel(`${table}_changes`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: table },
                (payload) => {
                    // Cache invalidation triggered
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions.set(key, subscription);

        // Return unsubscribe function
        return () => {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
        };
    }

    /**
     * Setup realtime subscriptions for automatic cache invalidation
     */
    setupRealtimeInvalidation() {
        // Services table changes
        this.subscribeToTable("Services", () => {
            this.invalidatePattern("services");
            this.invalidatePattern("treatments");
            this.invalidatePattern("products");
        });

        // Visits changes
        this.subscribeToTable("customervisits", () => {
            this.invalidatePattern("visitations");
            this.invalidatePattern("points");
        });

        // Visit lines changes
        this.subscribeToTable("customervisitlines", () => {
            this.invalidatePattern("visitations");
            this.invalidatePattern("points");
        });

        // User changes
        this.subscribeToTable("User", () => {
            this.invalidatePattern("user");
            this.invalidatePattern("staff");
        });

        // Treatments changes
        this.subscribeToTable("treatments", () => {
            this.invalidatePattern("services");
            this.invalidatePattern("treatments");
        });

        // Products changes
        this.subscribeToTable("Product", () => {
            this.invalidatePattern("services");
            this.invalidatePattern("products");
        });
    }

    /**
     * Cleanup all subscriptions
     */
    cleanup() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    }
}

export const cacheManager = new CacheManager();

// Initialize realtime invalidation
cacheManager.setupRealtimeInvalidation();
