import { Connection, Query, QueryResult, RecordResult } from 'jsforce';
import { IConnectionConfig, ISObject } from '../Interfaces';
import { Logger } from '../sf-sdk';
export { Query, QueryResult, Connection, RecordResult, SuccessResult, ErrorResult } from 'jsforce';
export declare class ForceApi {
    private connConfig;
    private logger;
    private conn;
    constructor(connConfig: IConnectionConfig, logger: Logger);
    connect(): Connection;
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
     * @returns Promise<(RecordResult)>
     */
    insert(sobject: ISObject): Promise<RecordResult>;
    /**
     * Update a salesforce object.
     *
     * @param sobjects - same typed Salesforce object to save
     * @returns Promise<ForceResponse>
     */
    update(sobject: ISObject): Promise<RecordResult>;
    /**
     * TODO
     *
     * @param method
     * @param url
     * @param body
     * @param headers
     */
    request(method: string, url: string, body: string, headers?: object): Promise<object>;
}
