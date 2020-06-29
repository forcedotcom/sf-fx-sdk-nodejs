import { Logger } from '@salesforce/core';

import {
    ApiError,
    APIVersion,
    ConnectionConfig,
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

/**
 * Individual unit of work result.
 */
export class UnitOfWorkResult {
    public readonly method: Method;
    public readonly id: string;
    public readonly isSuccess: boolean;
    public readonly errors: ReadonlyArray<ApiError>;

    constructor(method: Method, id: string, isSuccess: boolean, errors: ReadonlyArray<ApiError>) {
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
    protected readonly _uuidToReferenceIds: UuidToReferenceIds;
    protected readonly _referenceIdToCompositeSubrequests: IReferenceIdToCompositeSubrequests;
    protected readonly _compositeResponse: CompositeResponse;

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
        const subReq: CompositeSubrequest|undefined = this._referenceIdToCompositeSubrequests[subResp.referenceId];
        if (!subReq) {
            throw new Error('Unable to find CompositeSubrequest with referenceId=' + subResp.referenceId);
        }

        const method: Method = subReq.method;
        const id: string = subResp.id;
        const success: boolean = subResp.isSuccess;
        let errors: ReadonlyArray<ApiError>;
        if (!success) {
            errors = subResp.errors;
        }
        return new UnitOfWorkResult(method, id, success, errors);
    }
}

/**
 * Successful Unit of Work Response.
 */
export class UnitOfWorkResponse {
    protected _resultMapper: UnitOfWorkResultMapper;

    constructor(
        resultMapper: UnitOfWorkResultMapper,
    ) {
        this._resultMapper = resultMapper;
    }

    public getResults(sObject: SObject): ReadonlyArray<UnitOfWorkResult> {
        return this._resultMapper.getResults(sObject);
    }

    public getId(sObject: SObject): string {
        return this._resultMapper.getId(sObject);
    }
}

/**
 * Error thrown when any step of a composite request fails.
 */
export class UnitOfWorkError extends Error {
    public static readonly DEFAULT_HTTP_STATUS = 500;
    public readonly rootCause: UnitOfWorkResult;
    public readonly otherResults: ReadonlyArray<UnitOfWorkResult>;
    public readonly httpStatus: number;

    constructor(
        rootCause: UnitOfWorkResult,
        otherResults: ReadonlyArray<UnitOfWorkResult>,
        errorMessage: string|undefined = undefined,
        httpStatus: number|undefined = undefined,
    ) {
        super(UnitOfWorkError._errorMessage(rootCause, errorMessage));

        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, UnitOfWorkError.prototype);

        this.rootCause = rootCause;
        this.otherResults = otherResults;
        this.httpStatus = httpStatus === undefined ? UnitOfWorkError.DEFAULT_HTTP_STATUS : httpStatus;
    }

    // Use errorMessage if given in ctor, fall back to first error, then fall back to just 'UNKNOWN_ERROR'
    private static _errorMessage(rootCause: UnitOfWorkResult, errorMessage: string|undefined): string {
        let msg: string|undefined = errorMessage;
        if (msg === undefined) {
            const firstErr = rootCause.errors.find(e => e.message !== undefined);
            if (firstErr) {
                msg = firstErr.message;
            }
        }
        return msg === undefined ? "UNKNOWN_ERROR" : msg;
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

    /**
     * Post this unit of work to be committed.
     * @returns async resolved {@see UnitOfWorkResponse} if successful, or rejected
     *          (thrown on `await`) with {@see UnitOfWorkError} if unsuccessful.
     */
    public async commit(): Promise<UnitOfWorkResponse> {
        //Use composite API, prior to 228/apiVersion 50.0
        //Use graph API to get higher limit, planned GA in 228/apiVersion 50.0
        if(this._config.apiVersion < APIVersion.V50) {
            return await this.commitComposite();
        } else {
            return await this.commitGraph();
        }
     }

    // Find the first CompositeSubresponse that has a body.errorCode != "PROCESSING_HALTED"
     private hasNonProcessingHaltedError(compositeSubresponse: CompositeSubresponse): boolean {
         if (compositeSubresponse && !compositeSubresponse.isSuccess && Array.isArray(compositeSubresponse.errors)) {
             if (compositeSubresponse.errors.find(e => ('errorCode' in e) && (e['errorCode'] !== 'PROCESSING_HALTED'))) {
                 return true;
             }
         }
         return false;
     }

     // Find the "root cause" failed subresponse.  If root cause not identified, find first non-success
     private rootFailedSubResponse(compositeSubresponses: ReadonlyArray<CompositeSubresponse>): CompositeSubresponse {
         let rootSub = compositeSubresponses.find(this.hasNonProcessingHaltedError);
         if (rootSub == null) {
             // If we fail to find a subresponse that has a code other than 'PROCESSING_HALTED', grab first non `isSuccess`
             rootSub = compositeSubresponses.find(r => !r.isSuccess);
         }
         return rootSub;
     }

     // Convert a failed composite response to a UnitOfWorkEr3ror
     private toUnitOfWorkError(failedResponse: CompositeResponse, resMapper: UnitOfWorkResultMapper): UnitOfWorkError {
         // Pull out the first subresponse that failed.  TODO: we need a better flag from Graph endpoint
         // indicating which subrequest caused the transaciton to be rolled back.  For now, first unsuccessful.
         const subResp: CompositeSubresponse = this.rootFailedSubResponse(failedResponse.compositeSubresponses);
         const rootCause: UnitOfWorkResult = resMapper.toUowResult(subResp);
         const otherRess: ReadonlyArray<UnitOfWorkResult> = failedResponse.compositeSubresponses
                 .filter(r => !Object.is(r, subResp))
                 .map(r => resMapper.toUowResult(r));
         this.logger.warn(`UnitOfWork failed w/root cause ${rootCause.toString()} and ${otherRess.length} rolled-back results`);
         return new UnitOfWorkError(rootCause, otherRess, undefined, subResp.httpStatusCode);
     }

     /**
      * Use composite API, prior to 228/apiVersion v50.0
      */
    private async commitComposite(): Promise<UnitOfWorkResponse> {
        const compositeApi: CompositeApi = new CompositeApi(this._config, this.logger);
        const compositeResponse: CompositeResponse = await compositeApi.invoke(this._compositeRequest);
        const errorCount: number = compositeResponse.compositeSubresponses.filter(r => !r.isSuccess).length;
        const resMapper: UnitOfWorkResultMapper = new UnitOfWorkResultMapper(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );

        if (errorCount > 0) {
            throw this.toUnitOfWorkError(compositeResponse, resMapper);
        }
        return new UnitOfWorkResponse(resMapper);
    }

    /**
     * Use graph API to get higher limit, planned GA in 228/apiVersion=50.0
     */
    private async commitGraph(): Promise<UnitOfWorkResponse> {
        const uowGraph: UnitOfWorkGraph = new UnitOfWorkGraph(this._config, this.logger, this);
        const compositeGraphResponse: CompositeGraphResponse = await uowGraph.commit();
        const compositeResponse: CompositeResponse = compositeGraphResponse.graphResponses[0].compositeResponse;
        const errorCount: number = compositeResponse.compositeSubresponses.filter(r => !r.isSuccess).length;
        const resMapper: UnitOfWorkResultMapper = new UnitOfWorkResultMapper(
            this._uuidToReferenceIds,
            this._referenceIdToCompositeSubrequests,
            compositeResponse,
        );

        if (errorCount > 0) {
            throw this.toUnitOfWorkError(compositeResponse, resMapper);
        }
        return new UnitOfWorkResponse(resMapper);
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
