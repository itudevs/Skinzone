import { DropDownItems } from "./utilinterfaces";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export const GetTreatments = async (): Promise<DropDownItems[]> => {
    const { data, error } = await supabase
        .from("treatments")
        .select("treatmentid,treatmentname,cost,points");

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