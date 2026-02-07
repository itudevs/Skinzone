import { Database, Tables, Enums } from "@/database.types"
export type { Database }
export let customervisits: Tables<'customervisits'>
export let customervisitsline: Tables<'customervisitlines'>
export let treatments: Tables<'treatments'>


export type CustomerVisitInsert = Database['public']['Tables']['customervisits']['Insert']
export type CustomerVisitLineInsert = Database['public']['Tables']['customervisitlines']['Insert']
export type TrearmentInsert = Database['public']['Tables']['treatments']['Insert']