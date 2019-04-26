import * as jsforce from 'jsforce';
import { IConnectionConfig, ISObject } from '../Interfaces';
import { Logger } from '../sf-sdk';
import { Query, QueryResult, Connection, RecordResult } from 'jsforce';

// REVIEWME: ForceApi exposes jsforce objects.  Re-think.
export { Query, QueryResult, Connection, RecordResult } from 'jsforce';

export interface IForceApi {
    /**
     * Execute the given SOQL by using "/query" API.
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    query<T>(soql: string): Query<QueryResult<T>>;

    /**
     * Query further records using nextRecordsURL.
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    queryMore<T>(locator: string): Promise<QueryResult<T>>;

    /**
     * Insert a salesforce object.
     *
     * @param sobjects - same typed Salesforce objects to save
     * @returns Promise<(RecordResult | RecordResult[])>
     */
    insert(sobjects: ISObject[]): Promise<RecordResult | RecordResult[]>;

    /**
     * Update a salesforce object.
     *
     * @param sobjects - same typed Salesforce object to save
     * @returns Promise<ForceResponse>
     */
    update(sobjects: ISObject[]): Promise<RecordResult | RecordResult[]>;

    /**
     * TODO
     *
     * @param method
     * @param url
     * @param body
     * @param headers
     */
    request(method: string, url: string, body: string, headers?: object): Promise<Object>;
}

class ForceApi implements IForceApi {
    public readonly conn: Connection;

    constructor(private connConfig: IConnectionConfig, private logger: Logger) {
        this.conn = new jsforce.Connection({
            accessToken: connConfig.sessionId,
            instanceUrl: connConfig.instanceUrl,
            version: connConfig.apiVersion,
        });
    }

    query<T>(soql: string): Query<QueryResult<T>> {
        return this.conn.query(soql);
    }

    queryMore<T>(locator: string): Promise<QueryResult<T>> {
        return this.conn.query(locator);
    }

    insert(sobjects: ISObject[]): Promise<RecordResult | RecordResult[]> {
        const records: Array<any> = sobjects.map(sobject => sobject.asMap());
        return this.conn.insert(sobjects[0].sObjectType, records);
    }

    update(sobjects: ISObject[]): Promise<RecordResult | RecordResult[]> {
        const records: Array<any> = sobjects.map(sobject => sobject.asMap());
        return this.conn.update(sobjects[0].sObjectType, records);
    }

    request(method: string, url: string, body: string, headers?: object): Promise<Object> {
        return this.conn.request({
            method,
            url,
            body,
            headers,
        });
    }
}

export function newForceApi(connectionConfig: IConnectionConfig, logger: Logger): IForceApi {
    return new ForceApi(connectionConfig, logger);
}
