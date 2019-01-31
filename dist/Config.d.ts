import { IConfig } from './Interfaces';
export declare class Config implements IConfig {
    readonly instanceUrl: string;
    readonly apiVersion: string;
    readonly sessionId: string;
    constructor(instanceUrl: string, apiVersion: string, sessionId: string);
}
