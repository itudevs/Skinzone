import { DropDownItems } from "./utilinterfaces";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export const GetTreatments = async (points?: number | undefined): Promise<DropDownItems[]> => {
    const query = supabase
        .from("treatments")
        .select("treatmentid,treatmentname,cost,points");
    const { data, error } = points ? await query.eq("points", points) : await query;
    if (error) {
        Alert.alert("Error", "error occured while fetching treatments");
        return [];
    }

    if (data && data.length > 0) {
        // Map data to match DropDownItems interface
        return data.map((treatment) => ({
            id: treatment.treatmentid.toString(),
            value: treatment.treatmentname,
            cost: treatment.cost?.toString() || null,
            points: treatment.points?.toString() || null
        }));
    }

    return [];
};