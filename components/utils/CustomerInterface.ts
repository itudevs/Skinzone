export interface CustomerDetails {
    Name: string;
    Surname: string;
    Phone: string;
}

export interface CustomerModalprops extends CustomerDetails {
    Visible: boolean;
    Onclose: () => void;
}