import { Connection, Query, QueryResult, RecordResult } from 'jsforce';
import { Logger } from '@salesforce/core';

import { ConnectionConfig, SObject } from './..';

// REVIEWME: ForceApi exposes jsforce objects.  Re-think.
export { Query, QueryResult, Connection, RecordResult, SuccessResult, ErrorResult } from 'jsforce';

export class ForceApi {

    private conn: Connection | undefined;

    constructor(private connConfig: ConnectionConfig, private logger: Logger) {}

    /**
     * Execute the given SOQL by using "/query" API.
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    public query<T extends SObject = SObject>(soql: string): Query<QueryResult<T>> {
        return this.connect().query(soql);
    }

    /**
     * Query further records using nextRecordsURL.
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    public queryMore<T extends SObject = SObject>(locator: string): Promise<QueryResult<T>> {
        return this.connect().query(locator);
    }

    /**
     * Insert a salesforce object.
     *
     * @param sobjects - same typed Salesforce objects to save
     * @returns Promise<(RecordResult)>
     */
    public insert(sobject: SObject): Promise<RecordResult> {
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
    public update(sobject: SObject): Promise<RecordResult> {
        return this.connect()
            .sobject(sobject.sObjectType)
            .update(sobject.asMap());
    }

    /**
     * Invoke given URI.
     *
     * @param method
     * @param url
     * @param body
     * @param headers
     */
    public request(method: string, url: string, body: string, headers?: object): Promise<object> {
        return this.connect()
            .request({
                body,
                headers,
                method,
                url,
            });
    }

    private connect(): Connection {
        if (!this.conn) {
            this.conn = new Connection({
                accessToken: this.connConfig.accessToken,
                instanceUrl: this.connConfig.instanceUrl,
                version: this.connConfig.apiVersion,
            });
            this.logger.trace('connected to instanceUrl=%s version=%s',
                this.connConfig.instanceUrl, this.connConfig.apiVersion);
        }
        return this.conn;
    }
}
