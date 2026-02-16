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