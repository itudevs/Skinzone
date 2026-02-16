export interface CustomerDetails {
    id?: string | undefined;
    Name?: string | undefined;
    Surname?: string | undefined;
    Phone?: string | undefined;
}

export interface CustomerModalprops extends CustomerDetails {
    Visible: boolean;
    Onclose: () => void;
}