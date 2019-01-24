export enum Method {
    DELETE = "DELETE",
    GET = "GET",
    PATCH = "PATCH",
    POST = "POST",
    PUT = "PUT"
}

export interface ISObject {
    getSObjectType(): string;
    getUuid(): string;
    id(id: string): ISObject;
    getId(): string;
    getValues(): { [key: string]: any };
    setValue(key: string, value: any): any;
    named(name: string): ISObject;
    getReferenceId(): string;
    getFkId(): string;
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
    value(key: string, value: any): ICompositeSubrequestBuilder;
    values(values: { [key: string]: any }): ICompositeSubrequestBuilder;
    named(name: string): ICompositeSubrequestBuilder;
    apiVersion(apiVersion: string): ICompositeSubrequestBuilder;
    header(key: string, value: string): ICompositeSubrequestBuilder;
    headers(values: { [key: string]: string }): ICompositeSubrequestBuilder;
    build(): ICompositeSubrequest;
}

export interface ICompositeRequest {
    setAllOrNone(allOrNone: boolean): void;
    addSubrequest(compositeSubrequest: ICompositeSubrequest): void;
    readonly isAllOrNone: boolean;
    readonly subrequests: ReadonlyArray<ICompositeSubrequest>;
    getSubrequest(referenceId: string): ICompositeSubrequest;
}

export interface IError {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}

export interface ICompositeSubresponse {
    readonly body: { [key: string]: any };
    readonly httpHeaders: { [key: string]: string };
    readonly httpStatusCode: number;
    readonly referenceId: string;
    readonly isSuccess: boolean;
    readonly id: string;
    readonly errors: ReadonlyArray<IError>;
    readonly location: string;
}

export interface ICompositeResponse {
    readonly compositeSubresponses: ReadonlyArray<ICompositeSubresponse>
    getCompositeSubresponse(compositeSubrequest: ICompositeSubrequest): ICompositeSubresponse;
}

export interface IConfig {
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