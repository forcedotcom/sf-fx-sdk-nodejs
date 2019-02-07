import { IConnectionConfig, ISObject, IUnitOfWork, IUnitOfWorkResponse } from '../Interfaces';
declare class UnitOfWork implements IUnitOfWork {
    private readonly _compositeRequest;
    private readonly _config;
    private readonly _uuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests;
    constructor(config: IConnectionConfig);
    registerNew(sObject: ISObject): void;
    registerModified(sObject: ISObject): void;
    registerDeleted(sObject: ISObject): void;
    commit(): Promise<IUnitOfWorkResponse>;
    private addCompositeSubrequest;
}
export declare function newUnitOfWork(connectionConfig: IConnectionConfig): UnitOfWork;
export {};
