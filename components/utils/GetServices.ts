import { DropDownItems } from "./utilinterfaces";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { cacheManager } from "@/lib/cache";

export const GetServices = async (
    points?: number,
    category?: string,
    forceRefresh?: boolean
): Promise<DropDownItems[]> => {
    const cacheKey = `services_${category || "all"}_${points || "all"}`;

    return cacheManager.get(
        cacheKey,
        async () => {
            let query = supabase
                .from("Services")
                .select("ServiceId,servicename,servicecost,servicepoints,servicecategory");

            // Only filter by category if explicitly provided
            if (category !== undefined) {
                query = query.eq("servicecategory", category);
            }

            // Only filter by points if explicitly provided
            if (points !== undefined) {
                query = query.eq("servicepoints", points);
            }

            const { data, error } = await query;

            if (error) {
                Alert.alert("Error", "Error occurred while fetching services");
                return [];
            }

            if (data && data.length > 0) {
                return data.map((service) => ({
                    id: service.ServiceId.toString(),
                    value: service.servicename,
                    cost: service.servicecost?.toString() || null,
                    points: service.servicepoints?.toString() || null,
                    category: service.servicecategory,
                }));
            }

            return [];
        },
        { duration: 10 * 60 * 1000, forceRefresh } // Cache for 10 minutes
    );
};

export const GetTreatments = async (points?: number, forceRefresh?: boolean): Promise<DropDownItems[]> => {
    return GetServices(points, "treatment", forceRefresh);
};

export const GetProducts = async (points?: number, forceRefresh?: boolean): Promise<DropDownItems[]> => {
    return GetServices(points, "product", forceRefresh);
};

export const GetAllServices = async (): Promise<DropDownItems[]> => {
    return GetServices();
};