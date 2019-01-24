import * as sfxif from '../Interfaces';
declare class UnitOfWork implements sfxif.IUnitOfWork {
    private readonly _compositeRequest;
    private readonly _config;
    private readonly _uuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests;
    constructor(config: sfxif.IConfig);
    registerNew(sObject: sfxif.ISObject): void;
    registerModified(sObject: sfxif.ISObject): void;
    registerDeleted(sObject: sfxif.ISObject): void;
    commit(): Promise<sfxif.IUnitOfWorkResponse>;
    private addCompositeSubrequest;
}
export declare function newUnitOfWork(config: sfxif.IConfig): UnitOfWork;
export {};
