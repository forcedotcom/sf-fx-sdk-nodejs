import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig,
    Error,
    Method,
    SObject
} from './../..';

import { CompositeRequest } from './CompositeRequest';

import {
    CompositeApi,
    CompositeGraphResponse,
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
import {UnitOfWorkGraph} from "./UnitOfWorkGraph";

interface IReferenceIdToCompositeSubrequests {
    [key: string]: CompositeSubrequest;
}
interface UuidToReferenceIds {
    [key: string]: Set<string>;
}

export class UnitOfWorkResult {
    public readonly method: Method;
    public readonly id: string;
    public readonly isSuccess: boolean;
    public readonly errors: ReadonlyArray<Error>;

    constructor(method: Method, id: string, isSuccess: boolean, errors: ReadonlyArray<Error>) {
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

            if (compositeSubresponses) {
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
                        const id: string = compositeSubresponse.id;
                        const success: boolean = compositeSubresponse.isSuccess;
                        let errors: ReadonlyArray<Error>;
                        if (!success) {
                            errors = compositeSubresponse.errors;
                        }

                        results.push(new UnitOfWorkResult(method, id, success, errors));

                        // 1:1 relationship. Exit if we have found everything
                        return results.length === referenceIds.size;
                    }
                });
            }
        }

        return results;
    }

    public getId(sObject: SObject): string {
        const results: ReadonlyArray<UnitOfWorkResult> = this.getResults(sObject);
        if (results && results.length > 0) {
            return results[0].id;
        }
    }
}

export class UnitOfWork {
    private readonly _compositeRequest: CompositeRequest;
    private readonly _config: ConnectionConfig;
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    private logger;

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
        const id: string = sObject.id;
        if (!id) {
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
        //Use composite API, prior to 228/apiVersion 50.0
        //Use graph API to get higher limit, planned GA in 228/apiVersion 50.0
        if(this._config.apiVersion < APIVersion.V50) {
            return await this.commitComposite();
        } else {
            return await this.commitGraph();
        }
     }

    /**
     * Use composite API, prior to 228/apiVersion v50.0
      */
    private async commitComposite(): Promise<UnitOfWorkResponse> {
        const compositeApi: CompositeApi = new CompositeApi(this._config, this.logger);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(this._compositeRequest);

        return new UnitOfWorkResponse(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );
    }

    /**
     * Use graph API to get higher limit, planned GA in 228/apiVersion=50.0
     */
    private async commitGraph(): Promise<UnitOfWorkResponse> {
        const uowGraph: UnitOfWorkGraph = new UnitOfWorkGraph(this._config, this.logger, this);
        const compositeGraphResponse: CompositeGraphResponse = await uowGraph.commit();
        const compositeResponse: CompositeResponse = compositeGraphResponse.graphResponses[0].compositeResponse;

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

    public get compositeRequest() : CompositeRequest {
        return this._compositeRequest;
    }
}
