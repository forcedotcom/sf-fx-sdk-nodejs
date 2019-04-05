import { IConnectionConfig, ISObject, IUnitOfWork, IUnitOfWorkResponse } from '../Interfaces';
import { Logger } from '../sf-sdk';
declare class UnitOfWork implements IUnitOfWork {
    private readonly _compositeRequest;
    private readonly _config;
    private readonly _uuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests;
    private logger;
    constructor(config: IConnectionConfig, logger: Logger);
    registerNew(sObject: ISObject): void;
    registerModified(sObject: ISObject): void;
    registerDeleted(sObject: ISObject): void;
    commit(): Promise<IUnitOfWorkResponse>;
    private addCompositeSubrequest;
}
export declare function newUnitOfWork(connectionConfig: IConnectionConfig, logger: Logger): UnitOfWork;
export {};
