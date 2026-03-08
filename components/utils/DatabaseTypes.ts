import { Database, Tables, Enums } from "@/database.types"
export type { Database }
export let customervisits: Tables<'customervisits'>
export let customervisitsline: Tables<'customervisitlines'>
export let treatments: Tables<'treatments'>
export let Product: Tables<'Product'>
export let Services: Tables<'Services'>


export type CustomerVisitInsert = Database['public']['Tables']['customervisits']['Insert']
export type CustomerVisitLineInsert = Database['public']['Tables']['customervisitlines']['Insert']
export type TrearmentInsert = Database['public']['Tables']['treatments']['Insert']
export type ProductsInsert = Database['public']['Tables']['Product']['Insert']
export type SerivceInsert = Database['public']['Tables']['Services']['Insert']