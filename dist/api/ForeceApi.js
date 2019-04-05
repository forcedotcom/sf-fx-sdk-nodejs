"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsforce = require("jsforce");
class ForceApi {
    constructor(connConfig, logger) {
        this.connConfig = connConfig;
        this.logger = logger;
        this.conn = new jsforce.Connection({
            accessToken: connConfig.sessionId,
            instanceUrl: connConfig.instanceUrl,
            version: connConfig.apiVersion,
        });
    }
    query(soql) {
        return this.conn.query(soql);
    }
    queryMore(locator) {
        return this.conn.query(locator);
    }
    insert(sobjects) {
        const records = [];
        sobjects.forEach(sobject => {
            records.push(sobject.values);
        });
        return this.conn.insert(sobjects[0].sObjectType, records);
    }
    update(sobjects) {
        const records = [];
        sobjects.forEach(sobject => {
            records.push(sobject.values);
        });
        return this.conn.update(sobjects[0].sObjectType, records);
    }
    request(method, url, body, headers) {
        return this.conn.request({
            method,
            url,
            body,
            headers
        });
    }
}
function newForceApi(connectionConfig, logger) {
    return new ForceApi(connectionConfig, logger);
}
exports.newForceApi = newForceApi;
//# sourceMappingURL=ForeceApi.js.map