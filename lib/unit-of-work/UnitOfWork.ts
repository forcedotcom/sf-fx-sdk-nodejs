import {
    ICompositeApi, ICompositeRequest, ICompositeResponse, ICompositeSubrequest, ICompositeSubrequestBuilder,
    ICompositeSubresponse, IConnectionConfig, IError, ISObject, IUnitOfWork, IUnitOfWorkResponse, IUnitOfWorkResult, Method
} from '../Interfaces';

import { CompositeApi } from '..';
import { Logger } from '../sf-sdk';

interface IReferenceIdToCompositeSubrequests { [key: string]: ICompositeSubrequest };
interface UuidToReferenceIds { [key: string]: Set<string> };

class UnitOfWorkResult implements IUnitOfWorkResult {
    public readonly method: Method;
    public readonly id: string;
    public readonly isSuccess: boolean;
    public readonly errors: ReadonlyArray<IError>;

    constructor(method: Method, id: string, isSuccess: boolean, errors: ReadonlyArray<IError>) {
        this.method = method;
        this.id = id;
        this.isSuccess = isSuccess;
        this.errors = errors;
    }
}

class UnitOfWorkResponse implements IUnitOfWorkResponse {
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private readonly _compositeResponse: ICompositeResponse;

    constructor(uuidToReferenceIds: UuidToReferenceIds,
        referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests, compositeResponse: ICompositeResponse) {
        this._uuidToReferenceIds = uuidToReferenceIds;
        this._referenceIdToCompositeSubrequests = referenceIdToCompositeSubrequests;
        this._compositeResponse = compositeResponse;
    }

    public getResults(sObject: ISObject): ReadonlyArray<IUnitOfWorkResult> {
        const results: IUnitOfWorkResult[] = [];
        const referenceIds: Set<string> = this._uuidToReferenceIds[sObject.uuid];

        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses: ReadonlyArray<ICompositeSubresponse> =
                this._compositeResponse.compositeSubresponses;

            if (compositeSubresponses) {
                // Use some so that it can short circuit after finding all relevant elements
                compositeSubresponses.some((compositeSubresponse: ICompositeSubresponse) => {
                    const referenceId: string = compositeSubresponse.referenceId;
                    if (referenceIds.has(referenceId)) {
                        const compositeSubrequest: ICompositeSubrequest =
                            this._referenceIdToCompositeSubrequests[referenceId];
                        if (!compositeSubrequest) {
                            throw new Error('Unable to find CompositeSubrequest with referenceId=' + referenceId);
                        }

                        const method: Method = compositeSubrequest.method;
                        const id: string = compositeSubresponse.id;
                        const success: boolean = compositeSubresponse.isSuccess;
                        let errors: ReadonlyArray<IError>;
                        if (!success) {
                            errors = compositeSubresponse.errors;
                        }

                        results.push(new UnitOfWorkResult(method, id, success, errors));

                        // 1:1 relationship. Exit if we have found everything
                        return (results.length === referenceIds.size);
                    }
                });
            }
        }

        return results;
    }

    public getId(sObject: ISObject): string {
        const results: ReadonlyArray<IUnitOfWorkResult> = this.getResults(sObject);
        if (results && results.length > 0) {
            return results[0].id;
        }
    }
}

class UnitOfWork implements IUnitOfWork {
    private readonly _compositeRequest: ICompositeRequest;
    private readonly _config: IConnectionConfig;
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private logger;

    constructor(config: IConnectionConfig, logger: Logger) {
        this._config = config;
        this._compositeRequest = CompositeApi.newCompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
        this.logger = logger;
    }

    public registerNew(sObject: ISObject): void {
        const insertBuilder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder();
        const compositeSubrequest: ICompositeSubrequest = insertBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerModified(sObject: ISObject): void {
        const patchBuilder: ICompositeSubrequestBuilder = CompositeApi.patchBuilder();
        const compositeSubrequest: ICompositeSubrequest = patchBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerDeleted(sObject: ISObject): void {
        const id: string = sObject.id;
        if (!id) {
            throw new Error('Id not provided');
        }

        const deleteBuilder: ICompositeSubrequestBuilder = CompositeApi.deleteBuilder();
        const compositeSubrequest: ICompositeSubrequest = deleteBuilder.sObjectType(sObject.sObjectType).id(id).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public async commit(): Promise<IUnitOfWorkResponse> {
        const compositeApi: ICompositeApi = CompositeApi.newCompositeApi(this._config, this.logger);

        const compositeResponse: ICompositeResponse = await compositeApi.invoke(this._compositeRequest);

        return new UnitOfWorkResponse(this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests, compositeResponse);
    }

    private addCompositeSubrequest(sObject: ISObject, compositeSubrequest: ICompositeSubrequest): void {
        const referenceId: string = compositeSubrequest.referenceId;
        const uuid: string = sObject.uuid;
        let referenceIds: Set<string> = this._uuidToReferenceIds[uuid];

        if (!referenceIds) {
            referenceIds = new Set<string>();
            this._uuidToReferenceIds[uuid] = referenceIds;
        }
        referenceIds.add(referenceId);
        this._compositeRequest.addSubrequest(compositeSubrequest);
        this._referenceIdToCompositeSubrequests[referenceId] = compositeSubrequest;
    }
}

export function newUnitOfWork(connectionConfig: IConnectionConfig, logger: Logger) {
    return new UnitOfWork(connectionConfig, logger);
}