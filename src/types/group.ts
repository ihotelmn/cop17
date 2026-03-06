export type GroupRequestState = {
    error?: string;
    success?: boolean;
    message?: string;
    fieldErrors?: {
        [key: string]: string[] | undefined;
    };
};
