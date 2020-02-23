import { Connection, Query, QueryResult, RecordResult } from 'jsforce';
import { Logger } from '@salesforce/core';

import { ConnectionConfig, PlatformEvent, SObject } from './..';

export { Query, QueryResult, Connection, RecordResult, SuccessResult, ErrorResult } from 'jsforce';

export class ForceApi {

    private conn: Connection;

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
     * Insert an SObject.
     *
     * @param sobject - sobject to insert
     * @returns Promise<(RecordResult)>
     */
    public insert(sobject: SObject): Promise<RecordResult> {
        return this.connect()
            .sobject(sobject.sObjectType)
            .insert(sobject.asMap());
    }

    /**
     * Update an SObject.
     *
     * @param sobject - sobject to update
     * @returns Promise<RecordResult>
     */
    public update(sobject: SObject): Promise<RecordResult> {
        return this.connect()
            .sobject(sobject.sObjectType)
            .update(sobject.asMap());
    }

    /**
     * Publish Platform Event.
     *
     * @param event - Platform Event to insert
     * @returns Promise<(RecordResult)>
     */
    public publishEvent(event: PlatformEvent): Promise<RecordResult> {
        return this.insert(event);
    }

    /**
     * Invoke given endpoint.
     * 
     * Endpoint can be:
     *   - absolute URL,
     *   - relative path from root ('/services/data/v32.0/sobjects/Account/describe'), or 
     *   - relative path from version root ('/sobjects/Account/describe').
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
