export interface CustomerDetails {
    id: string;
    Name: string;
    Surname: string;
    Phone: string;
}

export interface CustomerModalprops extends CustomerDetails {
    Visible: boolean;
    Onclose: () => void;
}