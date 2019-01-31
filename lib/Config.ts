import { IConfig } from './Interfaces';

export class Config implements IConfig {
    public readonly instanceUrl: string;
    public readonly apiVersion: string;
    public readonly sessionId: string;

    constructor(instanceUrl: string, apiVersion: string, sessionId: string) {
        this.instanceUrl = instanceUrl;
        this.apiVersion = apiVersion;
        this.sessionId = sessionId;
    }
}