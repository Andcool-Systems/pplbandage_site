export interface FileUploadEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

export interface AccordionItemProps {
    header: React.ReactNode;
    dark?: Boolean;
    [key: string]: any;
}

export interface rerenderInterface {
    (param: string): void;
}
export interface ComponentProps {
	triggerEvent: rerenderInterface;
}

export interface Option {
    readonly value?: string;
    readonly label: React.JSX.Element;
    readonly isDisabled?: boolean;
}

export interface Bandage {
    id: number;
    external_id: string,
    base64: string,
    userId: number,
    creation_date: Date,
    verified: boolean,
    stars_count: number,
    starred: boolean,
    title: string,
    description: string,
    author: {
        id: number,
        username: string,
        name: string
    },
    categories: Category[],
    me_profile?: {
        uuid: string,
        nickname: string
    },
    permissions_level: number,
    check_state: string | null
}

export interface Category {
    id: number,
    name: string,
    icon: string,
    enabled?: boolean
}

export interface BandageResponse {
    data: Bandage[],
    totalCount: number,
    next_page: number
}