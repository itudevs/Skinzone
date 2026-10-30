export interface DropDownItems {
    value: string;
    id: string;
    cost?: string | null;
    points?: string | null;
    category?: string | null;


}
export enum BookingStatus {
    Completed = "Completed",
    Pending = "Pending",
    Booked = "Booked",
    Cancelled = "Cancelled"
}