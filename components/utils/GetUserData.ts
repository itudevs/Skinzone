import { supabase } from "@/lib/supabase";
export const Getvisitations = async (id: string | undefined) => {
    const { data, error } = await supabase
        .from("customervisits")
        .select(
            `visit_date,notes,csid
      customer:User!customerid (
        name,surname
      ),
      staff:User!staffid (
        name,surname
      ),customervisitlines(
        treatments(treatmentname,duration_minutes,points))`,
        )
        .eq("customerid", id)
        .limit(5);

    if (data) {
        //store data in visitation array
        return data
    } else if (error) {
        console.log(error.message);

    }
    return [];
};
export const GetTotalPoints = async (id: string | undefined) => {
    let total = 0;

    const { data, error } = await supabase
        .from("customervisits")
        .select(`
            visit_date,
            notes,
            csid,
            customer:User!customerid (
                name,
                surname
            ),
            staff:User!staffid (
                name,
                surname
            ),
            customervisitlines(
                treatments(
                    treatmentname,
                    duration_minutes,
                    points
                )
            )
        `)
        .eq("customerid", id)

    if (data) {
        data.forEach(visit => {
            visit.customervisitlines?.forEach(visitLine => {
                // Cast treatments to any to bypass TypeScript error
                const treatmentPoints = (visitLine.treatments as any)?.points || 0;
                total += treatmentPoints;
            });
        });
    } else if (error) {
        console.log(error.message);

    }
    return total;
};

export const GetLastPointvisit = async (id: string | undefined) => {
    let total = 0;

    const { data, error } = await supabase
        .from("customervisits")
        .select(`
            visit_date,
            notes,
            csid,
            customer:User!customerid (
                name,
                surname
            ),
            staff:User!staffid (
                name,
                surname
            ),
            customervisitlines(
                treatments(
                    treatmentname,
                    duration_minutes,
                    points
                )
            )
        `)
        .eq("customerid", id)

    if (data) {
        data.forEach(visit => {
            visit.customervisitlines?.forEach(visitLine => {
                // Cast treatments to any to bypass TypeScript error
                const treatmentPoints = (visitLine.treatments as any)?.points || 0;
                total = treatmentPoints;
            });
        });
    } else if (error) {
        console.log(error.message);

    }
    return total;
};


