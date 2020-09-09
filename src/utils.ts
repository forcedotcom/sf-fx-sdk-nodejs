export enum APIVersion {
    V50 = '50.0'
}

export interface Error {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}
