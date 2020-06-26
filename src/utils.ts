export enum APIVersion {
    V48 = '48.0',   //CORE version 224
    V49 = '49.0',   //CORE version 226
    V50 = '50.0'    //CORE version 228
}

export class Constants {
    public static CURRENT_API_VERSION = process.env.SALESFORCE_API_VERSION || APIVersion.V48;
}

export interface ApiError {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}
