import * as sfxif from './Interfaces';

class Config implements sfxif.IConfig {
    readonly instanceUrl: string;
    readonly apiVersion: string;
    readonly sessionId: string;

    constructor(instanceUrl: string, apiVersion: string, sessionId: string) {
        this.instanceUrl = instanceUrl;
        this.apiVersion = apiVersion;
        this.sessionId = sessionId;
    }
}

export function newConfig(instanceUrl: string, apiVersion: string, sessionId: string): sfxif.IConfig {
    return new Config(instanceUrl, apiVersion, sessionId);
}
