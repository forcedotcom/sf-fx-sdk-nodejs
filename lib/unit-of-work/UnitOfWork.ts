import * as sfxif from '../Interfaces';
const index = require('../index.ts');

interface IReferenceIdToCompositeSubrequests { [key: string]: sfxif.ICompositeSubrequest };
interface UuidToReferenceIds { [key: string]: Set<string> };

class UnitOfWorkResult implements sfxif.IUnitOfWorkResult {
    public readonly method: sfxif.Method;
    public readonly id: string;
    public readonly isSuccess: boolean;
    public readonly errors: ReadonlyArray<sfxif.IError>;

    constructor(method: sfxif.Method, id: string, isSuccess: boolean, errors: ReadonlyArray<sfxif.IError>) {
        this.method = method;
        this.id = id;
        this.isSuccess = isSuccess;
        this.errors = errors;
    }
}

class UnitOfWorkResponse implements sfxif.IUnitOfWorkResponse {
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private readonly _compositeResponse: sfxif.ICompositeResponse;

    constructor(uuidToReferenceIds: UuidToReferenceIds, referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests, compositeResponse: sfxif.ICompositeResponse) {
        this._uuidToReferenceIds = uuidToReferenceIds;
        this._referenceIdToCompositeSubrequests = referenceIdToCompositeSubrequests;
        this._compositeResponse = compositeResponse;
    }

    public getResults(sObject: sfxif.ISObject): ReadonlyArray<sfxif.IUnitOfWorkResult> {
        const results: Array<sfxif.IUnitOfWorkResult> = new Array<sfxif.IUnitOfWorkResult>();
        const referenceIds: Set<string> = this._uuidToReferenceIds[sObject.getUuid()];

        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses: ReadonlyArray<sfxif.ICompositeSubresponse> = this._compositeResponse.compositeSubresponses;

            if (compositeSubresponses && compositeSubresponses.length > 0) {
                for (let i = 0; i < compositeSubresponses.length; i++) {
                    const compositeSubresponse: sfxif.ICompositeSubresponse = compositeSubresponses[i];
                    const referenceId: string = compositeSubresponse.referenceId;
                    if (referenceIds.has(referenceId)) {
                        const compositeSubrequest: sfxif.ICompositeSubrequest = this._referenceIdToCompositeSubrequests[referenceId];
                        if (!compositeSubrequest) {
                            throw new Error('Unable to find CompositeSubrequest with referenceId=' + referenceId);
                        }

                        const method: sfxif.Method = compositeSubrequest.method;
                        const id: string = compositeSubresponse.id;
                        const success: boolean = compositeSubresponse.isSuccess;
                        let errors: ReadonlyArray<sfxif.IError>;
                        if (!success) {
                            errors = compositeSubresponse.errors;
                        }

                        results.push(new UnitOfWorkResult(method, id, success, errors));
                        
                        // 1:1 relationship. Exit if we have found everything
                        if (results.length === referenceIds.size) {
                            break;
                        }
                    }
                }
            }
        }

        return results;
    }

    public getId(sObject: sfxif.ISObject): string {
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = this.getResults(sObject);
        if (results && results.length > 0) {
            return results[0].id;
        }
    }
}

class UnitOfWork implements sfxif.IUnitOfWork {
    private readonly _compositeRequest: sfxif.ICompositeRequest;
    private readonly _config: sfxif.IConfig;
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;

    constructor(config: sfxif.IConfig) {
        this._config = config;
        this._compositeRequest = index.compositeApi.newCompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
    }

    public registerNew(sObject: sfxif.ISObject): void {
        const insertBuilder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder();
        const compositeSubrequest: sfxif.ICompositeSubrequest = insertBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerModified(sObject: sfxif.ISObject): void {
        const patchBuilder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.patchBuilder();
        const compositeSubrequest: sfxif.ICompositeSubrequest = patchBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerDeleted(sObject: sfxif.ISObject): void {
        const id: string = sObject.getId();
        if (!id) {
            throw new Error('Id not provided');
        }

        const deleteBuilder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.deleteBuilder();
        const compositeSubrequest: sfxif.ICompositeSubrequest = deleteBuilder.sObjectType(sObject.getSObjectType()).id(id).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public async commit(): Promise<sfxif.IUnitOfWorkResponse> {
        const compositeApi: sfxif.ICompositeApi = index.compositeApi.newCompositeApi(this._config);

        const compositeResponse: sfxif.ICompositeResponse = await compositeApi.invoke(this._compositeRequest);

        return new UnitOfWorkResponse(this._uuidToReferenceIds, this._referenceIdToCompositeSubrequests, compositeResponse);
    }

    private addCompositeSubrequest(sObject: sfxif.ISObject, compositeSubrequest: sfxif.ICompositeSubrequest): void {
        const referenceId: string = compositeSubrequest.referenceId;
        const uuid: string = sObject.getUuid();
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

export function newUnitOfWork(config: sfxif.IConfig) {
    return new UnitOfWork(config);
}