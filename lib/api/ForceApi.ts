import { Connection, Query, QueryResult, RecordResult } from 'jsforce';
import { IConnectionConfig, ISObject } from '../Interfaces';
import { Logger } from '../sf-sdk';

// REVIEWME: ForceApi exposes jsforce objects.  Re-think.
export { Query, QueryResult, Connection, RecordResult, SuccessResult, ErrorResult } from 'jsforce';

export class ForceApi {
    private conn: Connection;

    constructor(private connConfig: IConnectionConfig, private logger: Logger) {}

    public connect(): Connection {
        return this.conn
            ? this.conn
            : (this.conn = new Connection({
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
    public query<T>(soql: string): Query<QueryResult<T>> {
        // REVIEWME: return sdk.SObject?
        return this.connect().query(soql);
    }

    /**
     * Query further records using nextRecordsURL.
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    public queryMore<T>(locator: string): Promise<QueryResult<T>> {
        // REVIEWME: return sdk.SObject?
        return this.connect().query(locator);
    }

    /**
     * Insert a salesforce object.
     *
     * @param sobjects - same typed Salesforce objects to save
     * @returns Promise<(RecordResult)>
     */
    public insert(sobject: ISObject): Promise<RecordResult> {
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
    public update(sobject: ISObject): Promise<RecordResult> {
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
    public request(method: string, url: string, body: string, headers?: object): Promise<object> {
        return this.conn.request({
            body,
            headers,
            method,
            url,
        });
    }
}
