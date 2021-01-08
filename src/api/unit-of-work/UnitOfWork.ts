import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig,
    Error as ApiError,
    Method,
    SObject
} from './../..';

import { CompositeRequest } from './CompositeRequest';

import {
    CompositeApi,
    CompositeGraphResponse,
    CompositeResponse,
    CompositeSubresponse,
    GraphResponse
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

/**
 * Individual unit of work result.
 */
export class UnitOfWorkResult {

    constructor(public readonly method: Method,
                public readonly id: string,
                public readonly isSuccess: boolean,
                public readonly errors: ReadonlyArray<ApiError>) {
        this.method = method;
        this.id = id;
        this.isSuccess = isSuccess;
        this.errors = errors;
    }

    /**
     * @returns string for logging, starts with 'ok' if successful, 'ERROR' if not.
     */
    public toString(): string {
        return this.isSuccess ? `ok ${this.method} id=${this.id}` :
            this.errors.map(e => this.errToString(e)).join(', ');
    }

    private errToString(err: ApiError): string {
        return 'ERROR' +
            (err.message == null ? '' : ` message=${err.message}`) +
            (err.errorCode == null ? '' : ` errorCode=${err.errorCode}`) +
            (err.fields == null || err.fields.length < 1 ? '' : ` fields=[${err.fields.join(',')}]`);
    }
}

/**
 * Container helper to convert composite responses to UnitOfWorkResult's for both successful
 * and failed UnitOfWork responses.
 */
class UnitOfWorkResultMapper {

    constructor(
        protected readonly _uuidToReferenceIds: UuidToReferenceIds,
        protected readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests,
        protected readonly _compositeResponse: CompositeResponse,
    ) { }

    public getResults(sObject: SObject): ReadonlyArray<UnitOfWorkResult> {
        const results: UnitOfWorkResult[] = [];
        const referenceIds: Set<string>|undefined = this._uuidToReferenceIds[sObject.uuid];

        if (referenceIds && referenceIds.size > 0) {
            const compositeSubresponses: ReadonlyArray<CompositeSubresponse> = this._compositeResponse
                .compositeSubresponses;

            if (compositeSubresponses) {
                // Use some so that it can short circuit after finding all relevant elements
                compositeSubresponses.some((compositeSubresponse: CompositeSubresponse) => {
                    const referenceId: string = compositeSubresponse.referenceId;
                    if (referenceIds.has(referenceId)) {
                        results.push(this.toUowResult(compositeSubresponse));

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

    public toUowResult(subResp: CompositeSubresponse): UnitOfWorkResult {
        const success: boolean = subResp.isSuccess;
        let errors: ReadonlyArray<ApiError>;
        if (!success) {
            errors = subResp.errors;
        }

        let method: Method;

        //in some error situations, when there is error for the whole transaction, e.g. "Limit of 500 reached for number of Nodes in the Graph" 
        //the response referenceId would be null
        if (subResp.referenceId) {
            const subReq: CompositeSubrequest|undefined = this._referenceIdToCompositeSubrequests[subResp.referenceId];
            if (!subReq) {
                throw new Error('Unable to find CompositeSubrequest with referenceId=' + subResp.referenceId);
            }
            method = subReq.method;
        }

        const id: string = subResp.id;        
        return new UnitOfWorkResult(method, id, success, errors);
    }
}

/**
 * Base Unit of Work Response.
 */
export abstract class UnitOfWorkResponse {

    constructor(
        protected _resultMapper: UnitOfWorkResultMapper,
        public readonly success: boolean,
    ) { }

    public getResults(sObject: SObject): ReadonlyArray<UnitOfWorkResult> {
        return this._resultMapper.getResults(sObject);
    }

    public getId(sObject: SObject): string {
        return this._resultMapper.getId(sObject);
    }
}

/**
 * Successful Unit of Work Response
 */
export class UnitOfWorkSuccessResponse extends UnitOfWorkResponse {

    constructor(
        resultMapper: UnitOfWorkResultMapper,
    ) {
        super(resultMapper, true);
    }
}

/**
 * Failed Unit of Work Response
 */
export class UnitOfWorkErrorResponse extends UnitOfWorkResponse {

    constructor(
        resultMapper: UnitOfWorkResultMapper,
        private _rootCause: CompositeSubresponse,
    ) {
        super(resultMapper, false);
    }

    public get rootCause(): UnitOfWorkResult {
        return this._resultMapper.toUowResult(this._rootCause);
    }
}

/**
 * UnitOfWork allows you to access salesforce SObject and work with them via salesforce composite API,
 * which executes a series of REST API requests in a single call.
 * All modifications to SObject are recorded by the UnitOfWork, at the end they may be committed as a single call.
 * The result is transactional, if an error occurs, the entire UnitOfWork request is rolled back.
 *
 * See https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_composite.htm
 *
 */
export class UnitOfWork {
    private readonly _compositeRequest: CompositeRequest;
    private readonly _uuidToReferenceIds: UuidToReferenceIds;
    private readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;

    constructor(private readonly _config: ConnectionConfig,
                private logger: Logger) {
        this._compositeRequest = new CompositeRequest();
        this._uuidToReferenceIds = {};
        this._referenceIdToCompositeSubrequests = {};
    }

    /**
     * Add new object to be inserted in this UOW.
     * @param sObject new object to be inserted.
     * @returns this to allow chaining registerNew(...).register...
     */
    public registerNew(sObject: SObject): UnitOfWork {
        const insertBuilder: CompositeSubrequestBuilder = new InsertCompositeSubrequestBuilder(this._config.apiVersion);
        const compositeSubrequest: CompositeSubrequest = insertBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
        return this;
    }

    /**
     * Add modified object to be updated in this UOW.
     * @param sObject object to be updated.
     * @returns this to allow chaining registerModified(...).register...
     */
    public registerModified(sObject: SObject): UnitOfWork {
        const patchBuilder: CompositeSubrequestBuilder = new PatchCompositeSubrequestBuilder(this._config.apiVersion);
        const compositeSubrequest: CompositeSubrequest = patchBuilder.sObject(sObject).build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
        return this;
    }

    /**
     * Add object to be deleted in this UOW.
     * @param sObject to be deleted.
     * @returns this to allow chaining registerDeleted(...).register...
     */
    public registerDeleted(sObject: SObject): UnitOfWork {
        const id: string = sObject.id;
        if (!id) {
            throw new Error('Id not provided');
        }

        const deleteBuilder: CompositeSubrequestBuilder = new DeleteCompositeSubrequestBuilder(this._config.apiVersion);
        const compositeSubrequest: CompositeSubrequest = deleteBuilder
            .sObjectType(sObject.sObjectType)
            .id(id)
            .build();

        this.addCompositeSubrequest(sObject, compositeSubrequest);
        return this;
    }

    /**
     * Post this unit of work to be committed.
     * @returns async resolved {@see UnitOfWorkSuccessResponse} if successful, or
     *     {@see UnitOfWorkErrorResponse} if failed.
     */
    public async commit(): Promise<UnitOfWorkSuccessResponse|UnitOfWorkErrorResponse> {
        //Use composite API, prior to  apiVersion 50.0
        //Use graph API to get higher limit, planned GA in apiVersion 50.0
        if(this._config.apiVersion < APIVersion.V50) {
            return await this.commitComposite();
        } else {
            return await this.commitGraph();
        }
     }

     // Filter predicate for Root Cause: unsuccessful w/a body.errorCode that is *not* "PROCESSING_HALTED"
     private isRootCause(compositeSubresponse: CompositeSubresponse): boolean {
         if (compositeSubresponse && !compositeSubresponse.isSuccess && Array.isArray(compositeSubresponse.errors)) {
             if (compositeSubresponse.errors.find(e => ('errorCode' in e) && (e['errorCode'] !== 'PROCESSING_HALTED'))) {
                 return true;
             }
         }
         return false;
     }

     // Find the "root cause" failed subresponse.  If root cause not identified, find first non-success
     private rootFailedSubResponse(compositeSubresponses: ReadonlyArray<CompositeSubresponse>): CompositeSubresponse {
         let rootSub = compositeSubresponses.find(this.isRootCause);
         if (rootSub == null) {
             // If we fail to find a subresponse that has a code other than 'PROCESSING_HALTED', grab first non `isSuccess`
             rootSub = compositeSubresponses.find(r => !r.isSuccess);
         }
         return rootSub;
     }

     // Convert a failed composite response to a UnitOfWorkErrorResponse
     private toUnitOfWorkErrorResponse(failedResponse: CompositeResponse, resMapper: UnitOfWorkResultMapper): UnitOfWorkErrorResponse {
         // Attempt to find the "root cause" subresponse, if possible.  Otherwise, falls back to the first failed response
         const rootCause: CompositeSubresponse = this.rootFailedSubResponse(failedResponse.compositeSubresponses);
         const otherCount: number = failedResponse.compositeSubresponses.length - 1;

         this.logger.warn(`UnitOfWork failed rootCause=${resMapper.toUowResult(rootCause)} and count=${otherCount} other rolled-back results`);
         return new UnitOfWorkErrorResponse(resMapper, rootCause);
     }

     /**
      * Use composite API, prior to apiVersion v50.0
      */
    private async commitComposite(): Promise<UnitOfWorkSuccessResponse|UnitOfWorkErrorResponse> {
        const compositeApi: CompositeApi = new CompositeApi(this._config, this.logger);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(this._compositeRequest);
        const errorCount = compositeResponse.compositeSubresponses.filter(r => !r.isSuccess).length;
        const resMapper = new UnitOfWorkResultMapper(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );

        if (errorCount > 0) {
            return this.toUnitOfWorkErrorResponse(compositeResponse, resMapper);
        }
        return new UnitOfWorkSuccessResponse(resMapper);
    }

    /**
     * Use graph API to get higher limit, planned GA in apiVersion=50.0
     */
    private async commitGraph(): Promise<UnitOfWorkSuccessResponse|UnitOfWorkErrorResponse> {
        const uowGraph: UnitOfWorkGraph = new UnitOfWorkGraph(this._config, this.logger, this);
        const compositeGraphResponse: CompositeGraphResponse = await uowGraph.commit();
        const graph1Response: GraphResponse = compositeGraphResponse.graphResponses[0];
        const compositeResponse: CompositeResponse = graph1Response.compositeResponse;
        const errorCount = compositeResponse.compositeSubresponses.filter(r => !r.isSuccess).length;
        const resMapper = new UnitOfWorkResultMapper(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );

        if (!graph1Response.isSuccessful || errorCount > 0) {
            return this.toUnitOfWorkErrorResponse(compositeResponse, resMapper);
        }
        return new UnitOfWorkSuccessResponse(resMapper);
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
