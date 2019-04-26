import { IConnectionConfig, ISObject } from '../Interfaces';
import { Logger } from '../sf-sdk';
import { Query, QueryResult, RecordResult } from 'jsforce';
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
    insert(sobjects: ISObject[]): Promise<(RecordResult | RecordResult[])>;
    /**
     * Update a salesforce object.
     *
     * @param sobjects - same typed Salesforce object to save
     * @returns Promise<ForceResponse>
     */
    update(sobjects: ISObject[]): Promise<(RecordResult | RecordResult[])>;
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
export declare function newForceApi(connectionConfig: IConnectionConfig, logger: Logger): IForceApi;
