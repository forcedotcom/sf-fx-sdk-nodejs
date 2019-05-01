"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsforce_1 = require("jsforce");
// REVIEWME: ForceApi exposes jsforce objects.  Re-think.
var jsforce_2 = require("jsforce");
exports.Query = jsforce_2.Query;
exports.Connection = jsforce_2.Connection;
class ForceApi {
    constructor(connConfig, logger) {
        this.connConfig = connConfig;
        this.logger = logger;
        this.conn = this.connect();
    }
    /**
     * Execute the given SOQL by using "/query" API.
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    query(soql) {
        return this.conn.query(soql);
    }
    /**
     * Query further records using nextRecordsURL.
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    queryMore(locator) {
        return this.conn.query(locator);
    }
    /**
     * Insert a salesforce object.
     *
     * @param sobjects - same typed Salesforce objects to save
     * @returns Promise<(RecordResult)>
     */
    insert(sobject) {
        return this.conn.sobject(sobject.sObjectType).insert(sobject.asMap());
    }
    /**
     * Update a salesforce object.
     *
     * @param sobjects - same typed Salesforce object to save
     * @returns Promise<ForceResponse>
     */
    update(sobject) {
        return this.conn.sobject(sobject.sObjectType).update(sobject.asMap());
    }
    /**
     * TODO
     *
     * @param method
     * @param url
     * @param body
     * @param headers
     */
    request(method, url, body, headers) {
        return this.conn.request({
            method,
            url,
            body,
            headers,
        });
    }
    connect() {
        return new jsforce_1.Connection({
            accessToken: this.connConfig.sessionId,
            instanceUrl: this.connConfig.instanceUrl,
            version: this.connConfig.apiVersion,
        });
    }
}
exports.ForceApi = ForceApi;
//# sourceMappingURL=ForceApi.js.map