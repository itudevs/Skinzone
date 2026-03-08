import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { cacheManager } from "@/lib/cache";

export const Getvisitations = async (id: string, limit?: number) => {
    const cacheKey = `visitations_${id}_${limit || 10}`;

    return cacheManager.get(
        cacheKey,
        async () => {
            return await fetchVisitations(id, limit);
        },
        { duration: 3 * 60 * 1000 } // Cache for 3 minutes
    );
};

const fetchVisitations = async (id: string, limit?: number) => {
    // First, get the visit data
    const { data: visitsData, error: visitsError } = await supabase
        .from("customervisits")
        .select(`
            csid,
            customerid,
            staffid,
            totalamountpaid,
            notes,
            visit_date,
            Freetreatment,
            customervisitlines(
                id,
                csid,
                treatmentid,
                quantity,
                totaltreatment
            )
        `)
        .eq("customerid", id)
        .order("visit_date", { ascending: false })
        .limit(limit || 10);

    if (visitsError) {

    }

    if (!visitsData) return [];

    // Get staff information separately
    const staffIds = [...new Set(visitsData.map(v => v.staffid))];
    const { data: staffData } = await supabase
        .from("User")
        .select("id, name, surname")
        .in("id", staffIds);

    // Get all unique treatment IDs
    const treatmentIds = visitsData
        .flatMap(v => v.customervisitlines?.map(line => line.treatmentid) || [])
        .filter(Boolean);

    // Get treatments information (treatmentid IS the ServiceId)
    const { data: treatmentsData } = await supabase
        .from("treatments")
        .select("treatmentid, duration_minutes")
        .in("treatmentid", treatmentIds);

    // Get services information (ServiceId matches treatmentid)
    const { data: servicesData } = await supabase
        .from("Services")
        .select("ServiceId, servicename, servicecost, servicepoints, servicecategory")
        .in("ServiceId", treatmentIds);

    // Combine the data
    const enrichedData = visitsData.map(visit => ({
        ...visit,
        staff: staffData?.find(s => s.id === visit.staffid),
        customervisitlines: visit.customervisitlines?.map(line => {
            const treatmentInfo = treatmentsData?.find(t => t.treatmentid === line.treatmentid);
            const serviceInfo = servicesData?.find(s => s.ServiceId === line.treatmentid);

            return {
                ...line,
                treatments: {
                    treatmentid: line.treatmentid,
                    duration_minutes: treatmentInfo?.duration_minutes || null,
                    Services: serviceInfo || null
                }
            };
        })
    }));

    return enrichedData;
};

export const GetTotalPoints = async (id: string | undefined) => {
    if (!id) return 0;

    const cacheKey = `points_${id}`;

    return cacheManager.get(
        cacheKey,
        async () => {
            return await calculateTotalPoints(id);
        },
        { duration: 3 * 60 * 1000 } // Cache for 3 minutes
    );
};

const calculateTotalPoints = async (id: string) => {
    let total = 0;

    const { data: visitsData, error } = await supabase
        .from("customervisits")
        .select(`
            csid,
            customervisitlines(
                id,
                csid,
                treatmentid
            )
        `)
        .eq("customerid", id)
        .neq("Freetreatment", true);

    if (error) {
        return total;
    }

    if (!visitsData) return total;

    // Get all treatment IDs
    const treatmentIds = visitsData
        .flatMap(v => v.customervisitlines?.map(line => line.treatmentid) || [])
        .filter(Boolean);

    if (treatmentIds.length === 0) return total;

    // Get services data for those treatments
    const { data: servicesData } = await supabase
        .from("Services")
        .select("ServiceId, servicepoints")
        .in("ServiceId", treatmentIds);

    // Calculate total points
    visitsData.forEach((visit) => {
        visit.customervisitlines?.forEach((visitLine: any) => {
            const service = servicesData?.find(s => s.ServiceId === visitLine.treatmentid);
            const servicePoints = service?.servicepoints || 0;
            total += servicePoints;
        });
    });

    return total;
};

export const GetTotalFinalPoints = async (
    id: string | undefined
): Promise<number> => {
    if (!id) return 0;

    let total: number = 0;
    let totalbefore = await GetTotalPoints(id);
    const { data, error } = await supabase
        .from("User")
        .select("pointsused")
        .eq("id", id)
        .single();

    if (data) {
        total = +data.pointsused;
    }

    if (error) {
        Alert.alert("Error", "could not get points");
        return 0;
    }

    return totalbefore - total;
};

export const GetLastPointvisit = async (id: string | undefined) => {
    if (!id) return 0;

    const cacheKey = `lastvisit_${id}`;

    return cacheManager.get(
        cacheKey,
        async () => {
            return await fetchLastPointVisit(id);
        },
        { duration: 3 * 60 * 1000 } // Cache for 3 minutes
    );
};

const fetchLastPointVisit = async (id: string) => {
    let last = 0;

    const { data: visitsData, error } = await supabase
        .from("customervisits")
        .select(`
            csid,
            customervisitlines(
                id,
                csid,
                treatmentid
            )
        `)
        .eq("customerid", id)
        .order("visit_date", { ascending: false })
        .limit(1);

    if (error) {
        return last;
    }

    if (!visitsData || visitsData.length === 0) return last;

    const lastVisit = visitsData[0];
    const treatmentIds = lastVisit.customervisitlines?.map(line => line.treatmentid).filter(Boolean) || [];

    if (treatmentIds.length === 0) return last;

    const { data: servicesData } = await supabase
        .from("Services")
        .select("ServiceId, servicepoints")
        .in("ServiceId", treatmentIds);

    lastVisit.customervisitlines?.forEach((visitLine: any) => {
        const service = servicesData?.find(s => s.ServiceId === visitLine.treatmentid);
        const servicePoints = service?.servicepoints || 0;
        last = servicePoints;
    });

    return last;
};

