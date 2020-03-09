export class Constants {
    public static CURRENT_API_VERSION = process.env.SALESFORCE_API_VERSION || '48.0';
}

export interface Error {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}