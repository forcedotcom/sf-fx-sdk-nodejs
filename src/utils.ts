export class Constants {
    public static CURRENT_API_VERSION = process.env.SALESFORCE_API_VERSION || '48.0';
}

export interface Error {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}

export enum APIVersion {
    V48 = '48.0',   //CORE version 224
    V49 = '49.0',   //CORE version 226
    V50 = '50.0'    //CORE version 228
}
