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
    }
    connect() {
        return this.conn
            ? this.conn
            : (this.conn = new jsforce_1.Connection({
                accessToken: this.connConfig.sessionId,
                instanceUrl: this.connConfig.instanceUrl,
                version: this.connConfig.apiVersion,
            }));
    }
    /**
     * Execute the given SOQL by using "/query" API.
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    query(soql) {
        // REVIEWME: return sdk.SObject?
        return this.connect().query(soql);
    }
    /**
     * Query further records using nextRecordsURL.
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    queryMore(locator) {
        // REVIEWME: return sdk.SObject?
        return this.connect().query(locator);
    }
    /**
     * Insert a salesforce object.
     *
     * @param sobjects - same typed Salesforce objects to save
     * @returns Promise<(RecordResult)>
     */
    insert(sobject) {
        return this.connect()
            .sobject(sobject.sObjectType)
            .insert(sobject.asMap());
    }
    /**
     * Update a salesforce object.
     *
     * @param sobjects - same typed Salesforce object to save
     * @returns Promise<ForceResponse>
     */
    update(sobject) {
        return this.connect()
            .sobject(sobject.sObjectType)
            .update(sobject.asMap());
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
}
exports.ForceApi = ForceApi;
//# sourceMappingURL=ForceApi.js.map