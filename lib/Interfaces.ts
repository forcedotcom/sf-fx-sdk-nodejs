export enum Method {
    DELETE = 'DELETE',
    GET = 'GET',
    PATCH = 'PATCH',
    POST = 'POST',
    PUT = 'PUT'
}

export interface IValues { [key: string]: any; };


export interface ISObject {
    readonly fkId: string;
    readonly id: string;
    readonly referenceId: string;
    readonly sObjectType: string;
    readonly uuid: string;
    readonly values: IValues;
    named(name: string): ISObject;
    setValue(key: string, value: any): any;
    withId(id: string): ISObject;
}

export interface ICompositeSubrequest {
    readonly httpHeaders: { [key: string]: string };
    readonly method: Method;
    readonly referenceId: string;
    readonly url: string;
    readonly body: { [key: string]: any };
    readonly sObjectType: string;
    readonly apiVersion: string;
}

export interface ICompositeSubrequestBuilder {
    id(id: string): ICompositeSubrequestBuilder;
    sObjectType(sObjectType: string): ICompositeSubrequestBuilder;
    sObject(sObject: ISObject): ICompositeSubrequestBuilder;
    addValue(key: string, value: any): ICompositeSubrequestBuilder;
    addValues(values: { [key: string]: any }): ICompositeSubrequestBuilder;
    named(name: string): ICompositeSubrequestBuilder;
    apiVersion(apiVersion: string): ICompositeSubrequestBuilder;
    header(key: string, value: string): ICompositeSubrequestBuilder;
    headers(values: { [key: string]: string }): ICompositeSubrequestBuilder;
    build(): ICompositeSubrequest;
}

export interface ICompositeRequest {
    readonly isAllOrNone: boolean;
    readonly subrequests: ReadonlyArray<ICompositeSubrequest>;
    addSubrequest(compositeSubrequest: ICompositeSubrequest): void;
    setAllOrNone(allOrNone: boolean): void;
    getSubrequest(referenceId: string): ICompositeSubrequest;
}

export interface IError {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}

export interface ICompositeSubresponse {
    /**
     * This will return undefined if isSuccess is false
     */
    readonly body: { [key: string]: any };
    readonly httpHeaders: { [key: string]: string };
    readonly httpStatusCode: number;
    readonly referenceId: string;
    readonly isSuccess: boolean;
    /**
     * This will return undefined if isSuccess is false or for PUT/PATCH operations.
     */
    readonly id: string;
    readonly errors: ReadonlyArray<IError>;
    readonly location: string;
}

export interface ICompositeResponse {
    readonly compositeSubresponses: ReadonlyArray<ICompositeSubresponse>
    getCompositeSubresponse(compositeSubrequest: ICompositeSubrequest): ICompositeSubresponse;
}

export interface IConnectionConfig {
    readonly instanceUrl: string;
    readonly apiVersion: string;
    readonly sessionId: string;
}

export interface ICompositeApi {
    invoke(compositeRequest: ICompositeRequest): Promise<ICompositeResponse>;
}

export interface IUnitOfWorkResult {
    readonly method: Method;
    readonly id: string;
    readonly isSuccess: boolean;
    readonly errors: ReadonlyArray<IError>;
}

export interface IUnitOfWorkResponse {
    getResults(sObject: ISObject): ReadonlyArray<IUnitOfWorkResult>;
    getId(sObject: ISObject): string;
}

export interface IUnitOfWork {
    registerNew(sObject: ISObject): void;
    registerModified(sObject: ISObject): void;
    registerDeleted(sObject: ISObject): void;
    commit(): Promise<IUnitOfWorkResponse>;
}