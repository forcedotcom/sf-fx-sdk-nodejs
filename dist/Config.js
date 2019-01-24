"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Config {
    constructor(instanceUrl, apiVersion, sessionId) {
        this.instanceUrl = instanceUrl;
        this.apiVersion = apiVersion;
        this.sessionId = sessionId;
    }
}
function newConfig(instanceUrl, apiVersion, sessionId) {
    return new Config(instanceUrl, apiVersion, sessionId);
}
exports.newConfig = newConfig;
//# sourceMappingURL=Config.js.map