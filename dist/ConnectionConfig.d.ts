import { IConnectionConfig } from './Interfaces';
export declare class ConnectionConfig implements IConnectionConfig {
    readonly instanceUrl: string;
    readonly apiVersion: string;
    readonly sessionId: string;
    constructor(instanceUrl: string, apiVersion: string, sessionId: string);
}
