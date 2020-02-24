import { Logger } from '@salesforce/core';

import {
    ConnectionConfig,
    Error,
    Method,
    SObject
} from './../..';

import { CompositeRequest } from './CompositeRequest';

import {
    CompositeApi,
    CompositeResponse,
    CompositeSubresponse
} from './CompositeApi';

import {
    CompositeSubrequest,
    CompositeSubrequestBuilder,
    DeleteCompositeSubrequestBuilder,
    InsertCompositeSubrequestBuilder,
    PatchCompositeSubrequestBuilder
} from './CompositeSubrequest';

interface IReferenceIdToCompositeSubrequests {
    [key: string]: CompositeSubrequest;
}
interface UuidToReferenceIds {
    [key: string]: Set<string>;
}

export class UnitOfWorkResult {
    public readonly method: Method;
    public readonly id: string | undefined;
    public readonly isSuccess: boolean;
    public readonly errors: ReadonlyArray<Error> | undefined;

    constructor(method: Method, id: string | undefined, isSuccess: boolean, errors: ReadonlyArray<Error> | undefined) {
        this.method = method;
        this.id = id;
        this.isSuccess = isSuccess;
        this.errors = errors;
    }
}

export class UnitOfWorkResponse {
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private readonly _compositeResponse: CompositeResponse;

    constructor(
        uuidToReferenceIds: UuidToReferenceIds,
        referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests,
        compositeResponse: CompositeResponse,
    ) {
        this._uuidToReferenceIds = uuidToReferenceIds;
        this._referenceIdToCompositeSubrequests = referenceIdToCompositeSubrequests;
        this._compositeResponse = compositeResponse;
    }

    public getResults(sObject: SObject): ReadonlyArray<UnitOfWorkResult> {
        const results: UnitOfWorkResult[] = [];
        const referenceIds: Set<string> = this._uuidToReferenceIds[sObject.uuid];

        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses: ReadonlyArray<CompositeSubresponse> = this._compositeResponse
                .compositeSubresponses;

            if (compositeSubresponses != undefined) {
                // Use some so that it can short circuit after finding all relevant elements
                compositeSubresponses.some((compositeSubresponse: CompositeSubresponse) => {
                    const referenceId: string = compositeSubresponse.referenceId;
                    if (referenceIds.has(referenceId)) {
                        const compositeSubrequest: CompositeSubrequest = this._referenceIdToCompositeSubrequests[
                            referenceId
                        ];
                        if (!compositeSubrequest) {
                            throw new Error('Unable to find CompositeSubrequest with referenceId=' + referenceId);
                        }

                        const method: Method = compositeSubrequest.method;
                        const id: string | undefined = compositeSubresponse.id;
                        const success: boolean = compositeSubresponse.isSuccess;
                        let errors: ReadonlyArray<Error> | undefined;
                        if (!success) {
                            errors = compositeSubresponse.errors;
                        }

                        results.push(new UnitOfWorkResult(method, id, success, errors));

                        // 1:1 relationship. Exit if we have found everything
                        return results.length === referenceIds.size;
                    }
                    return false;
                });
            }
        }

        return results;
    }

    public getId(sObject: SObject): string | undefined {
        const results: ReadonlyArray<UnitOfWorkResult> = this.getResults(sObject);
        if (results && results.length > 0) {
            return results[0].id;
        }
        return undefined;
    }
}

export class UnitOfWork {
    private readonly _compositeRequest: CompositeRequest;
    private readonly _config: ConnectionConfig;
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private logger: Logger;

    constructor(config: ConnectionConfig, logger: Logger) {
        this._config = config;
        this._compositeRequest = new CompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
        this.logger = logger;
    }

    public registerNew(sObject: SObject): void {
        const insertBuilder: CompositeSubrequestBuilder = new InsertCompositeSubrequestBuilder();
        const compositeSubrequest: CompositeSubrequest = insertBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerModified(sObject: SObject): void {
        const patchBuilder: CompositeSubrequestBuilder = new PatchCompositeSubrequestBuilder();
        const compositeSubrequest: CompositeSubrequest = patchBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public registerDeleted(sObject: SObject): void {
        const id: string | undefined = sObject.id;
        if (id == undefined) {
            throw new Error('Id not provided');
        }

        const deleteBuilder: CompositeSubrequestBuilder = new DeleteCompositeSubrequestBuilder();
        const compositeSubrequest: CompositeSubrequest = deleteBuilder
            .sObjectType(sObject.sObjectType)
            .id(id)
            .build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
    }

    public async commit(): Promise<UnitOfWorkResponse> {
        const compositeApi: CompositeApi = new CompositeApi(this._config, this.logger);

        const compositeResponse: CompositeResponse = await compositeApi.invoke(this._compositeRequest);

        return new UnitOfWorkResponse(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );
    }

    private addCompositeSubrequest(sObject: SObject, compositeSubrequest: CompositeSubrequest): void {
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
