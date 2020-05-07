/* eslint-disable @typescript-eslint/no-explicit-any */
import { BearerCredentialHandler } from 'typed-rest-client/Handlers';
import { HttpClient, HttpClientResponse, HttpCodes } from 'typed-rest-client/HttpClient';
import { IHeaders } from 'typed-rest-client/Interfaces';
import { Logger } from '@salesforce/core';

import { ConnectionConfig, Error } from '../..';

import { CompositeRequest } from './CompositeRequest';
import { CompositeSubrequest } from './CompositeSubrequest';

export class CompositeSubresponse {
    private static HEADER_LOCATION = 'Location';
    private static KEY_ID = 'id';

    public readonly httpHeaders: { [key: string]: string };
    public readonly httpStatusCode: number;
    public readonly referenceId: string;
    private readonly _errors: ReadonlyArray<Error>;
    private readonly _body: { [key: string]: any };

    public get body(): { [key: string]: any } {
        if (this.httpStatusCode < HttpCodes.BadRequest) {
            return this._body;
        } else {
            return undefined;
        }
    }

    public get errors(): ReadonlyArray<Error> {
        if (this.httpStatusCode >= HttpCodes.BadRequest) {
            return this._errors;
        } else {
            throw new Error(`Errors is not valid when there hasn't been an error. Call #errors installed.`);
        }
    }

    public get id(): string {
        if (this.body && this.body[CompositeSubresponse.KEY_ID]) {
            return this.body[CompositeSubresponse.KEY_ID];
        } else {
            return undefined;
        }
    }

    public get isSuccess(): boolean {
        return this.httpStatusCode && this.httpStatusCode < HttpCodes.BadRequest;
    }

    public get location(): string {
        if (this.httpHeaders && this.httpHeaders[CompositeSubresponse.HEADER_LOCATION]) {
            return this.httpHeaders[CompositeSubresponse.HEADER_LOCATION];
        } else {
            return undefined;
        }
    }

    constructor(compositeSubresponse: CompositeSubresponse) {
        this.httpHeaders = compositeSubresponse.httpHeaders;
        this.httpStatusCode = compositeSubresponse.httpStatusCode;
        this.referenceId = compositeSubresponse.referenceId;
        // The response body has different meaning depending if there was an error
        if (compositeSubresponse.httpStatusCode < HttpCodes.BadRequest) {
            this._body = compositeSubresponse.body;
        } else {
            const errors: Error[] = [];
            if (compositeSubresponse.body) {
                compositeSubresponse.body.forEach((element: Error) => {
                    errors.push(element);
                });
            }
            this._errors = errors;
        }
    }
}

/**
 * Used to avoid string access to json object below.
 */
interface CompositeResponseJsonObject {
    compositeResponse: CompositeSubresponse[];
}

export  class CompositeResponse {
    public readonly compositeSubresponses: ReadonlyArray<CompositeSubresponse>;

    public constructor(compositeResponseJsonObject: CompositeResponseJsonObject) {
        const compositeSubResponses: CompositeSubresponse[] = compositeResponseJsonObject.compositeResponse;
        if (compositeSubResponses) {
            compositeSubResponses.forEach((element: CompositeSubresponse, index: number) => {
                // Replace the json object with one that contains the location method
                compositeSubResponses[index] = new CompositeSubresponse(element);
            });
        }
        this.compositeSubresponses = compositeSubResponses as ReadonlyArray<CompositeSubresponse>;
    }

    public getCompositeSubresponse(compositeSubrequest: CompositeSubrequest): CompositeSubresponse {
        const referenceId: string = compositeSubrequest.referenceId;

        for (const compositeSubResponse of this.compositeSubresponses) {
            if (compositeSubResponse.referenceId === referenceId) {
                return compositeSubResponse;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }
}

interface GraphResponseJson {
    graphId: string;
    isSuccessful: boolean;
    graphResponse: CompositeResponseJsonObject;
}

interface GraphResponseJsonObject {
    graphs: GraphResponseJson[];
}

export class GraphResponse {
    public readonly graphId: string;
    public readonly isSuccessful: boolean;
    public compositeResponse: CompositeResponse;

    public constructor(graphResponseJson: GraphResponseJson) {
        this.graphId = graphResponseJson.graphId;
        this.isSuccessful = graphResponseJson.isSuccessful;

        const compResponseJson: CompositeResponseJsonObject = graphResponseJson.graphResponse;
        this.compositeResponse = new CompositeResponse(compResponseJson);
    }
}

export class CompositeGraphResponse {
    public readonly graphResponses: ReadonlyArray<GraphResponse>;

    public constructor(json: string) {
        const graphResponseJsonObject: GraphResponseJsonObject = JSON.parse(
            json,
        ) as GraphResponseJsonObject;
        const graphResponsesJsonArray: GraphResponseJson[] = graphResponseJsonObject.graphs;
        const graphResponsesArray: GraphResponse[] = [];
        if (graphResponsesJsonArray) {
            graphResponsesJsonArray.forEach((graphElement: GraphResponseJson) => {
                graphResponsesArray.push(new GraphResponse(graphElement));
            });
        }
        this.graphResponses = graphResponsesArray as ReadonlyArray<GraphResponse>;
    }
}

export class CompositeApi {
    private readonly _connectionConfig: ConnectionConfig;
    private readonly logger: Logger;

    constructor(connectionConfig: ConnectionConfig, logger: Logger) {
        this._connectionConfig = connectionConfig;
        this.logger = logger;
    }

    public async invoke(compositeRequest: CompositeRequest): Promise<CompositeResponse> {
        const bearerCredentialHandler: BearerCredentialHandler = new BearerCredentialHandler(
            this._connectionConfig.accessToken,
        );
        const httpClient: HttpClient = new HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path = `/services/data/v${this._connectionConfig.apiVersion}/composite/`;
        const headers: IHeaders = { 'Content-Type': 'application/json' };

        //Do not stringify 'graphId' field, which is for graph api
        const data: string = JSON.stringify(compositeRequest, (key,value) => {
            if (key != 'graphId') {
                return value;
            }
        });

        this.logger.debug(`POST ${path}`);

        const response: HttpClientResponse = await httpClient.post(
            this._connectionConfig.instanceUrl + path,
            data,
            headers,
        );

        if (response.message.statusCode === HttpCodes.OK) {
            const body: string = await response.readBody();
            const compositeResponseJsonObject: CompositeResponseJsonObject = JSON.parse(
                body,
            ) as CompositeResponseJsonObject;
            const compositeResponse: CompositeResponse = new CompositeResponse(compositeResponseJsonObject);

            return compositeResponse;
        } else {
            throw new Error('Server returned status code: ' + response.message.statusCode);
        }
    }

    public async invokeGraph(compositeRequests: CompositeRequest[]): Promise<CompositeGraphResponse> {
        const bearerCredentialHandler: BearerCredentialHandler = new BearerCredentialHandler(
            this._connectionConfig.accessToken,
        );
        const httpClient: HttpClient = new HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path = `/services/data/v${this._connectionConfig.apiVersion}/composite/graph/`;
        const headers: IHeaders = { 'Content-Type': 'application/json' };
        const graphObj = {graphs : compositeRequests};
        const data: string = JSON.stringify(graphObj);

        this.logger.debug(`POST ${path}`);

        const response: HttpClientResponse = await httpClient.post(
            this._connectionConfig.instanceUrl + path,
            data,
            headers,
        );

        if (response.message.statusCode === HttpCodes.OK) {
            const body: string = await response.readBody();
            const compositeGraphResponse: CompositeGraphResponse = new CompositeGraphResponse(body);

            return compositeGraphResponse;
        } else {
            throw new Error('Graph composite api returned status code: ' + response.message.statusCode);
        }
    }
}
