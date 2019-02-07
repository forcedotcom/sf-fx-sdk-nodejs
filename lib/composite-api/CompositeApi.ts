import { BearerCredentialHandler } from 'typed-rest-client/Handlers';
import { HttpClient, HttpClientResponse, HttpCodes } from 'typed-rest-client/HttpClient';
import { IHeaders} from 'typed-rest-client/Interfaces';

import { ICompositeApi, ICompositeRequest, ICompositeResponse, ICompositeSubrequest, ICompositeSubresponse, IConnectionConfig, IError } from '../Interfaces';

class CompositeSubresponse implements ICompositeSubresponse {
    private static HEADER_LOCATION: string = 'Location';
    private static KEY_ID: string = 'id';

    public readonly httpHeaders: { [key: string]: string; };
    public readonly httpStatusCode: number;
    public readonly referenceId: string;
    private readonly _errors: ReadonlyArray<IError>;
    private readonly _body: { [key: string]: any; };

    public get body(): { [key: string]: any; } {
        if (this.httpStatusCode < HttpCodes.BadRequest) {
            return this._body;
        } else {
            return undefined;
        }
    }

    public get errors(): ReadonlyArray<IError> {
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
        return (this.httpStatusCode && this.httpStatusCode < HttpCodes.BadRequest);
    }

    public get location(): string {
        if (this.httpHeaders && this.httpHeaders[CompositeSubresponse.HEADER_LOCATION]) {
            return this.httpHeaders[CompositeSubresponse.HEADER_LOCATION];
        } else {
            return undefined;
        }
    }

    constructor(compositeSubresponse: ICompositeSubresponse) {
        this.httpHeaders = compositeSubresponse.httpHeaders;
        this.httpStatusCode = compositeSubresponse.httpStatusCode;
        this.referenceId = compositeSubresponse.referenceId;
        // The response body has different meaning depending if there was an error
        if (compositeSubresponse.httpStatusCode < HttpCodes.BadRequest) {
            this._body = compositeSubresponse.body;
        } else {
            const errors: IError[] = [];
            if (compositeSubresponse.body) {
                compositeSubresponse.body.forEach((element: IError) => {
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
    compositeResponse:ICompositeSubresponse[];
};

class CompositeResponse implements ICompositeResponse {
    public readonly compositeSubresponses: ReadonlyArray<ICompositeSubresponse>;

    public constructor(json: string) {
        const compositeResponseJsonObject:CompositeResponseJsonObject = JSON.parse(json) as CompositeResponseJsonObject;
        const compositeSubResponses: ICompositeSubresponse[] = compositeResponseJsonObject.compositeResponse;
        if (compositeSubResponses) {
            compositeSubResponses.forEach((element: ICompositeSubresponse, index: number) => {
                // Replace the json object with one that contains the location method
                compositeSubResponses[index] = new CompositeSubresponse(element);
            });
        }
        this.compositeSubresponses = compositeSubResponses as ReadonlyArray<ICompositeSubresponse>;
    }

    public getCompositeSubresponse(compositeSubrequest: ICompositeSubrequest): ICompositeSubresponse {
        const referenceId: string = compositeSubrequest.referenceId;

        for (const compositeSubResponse of this.compositeSubresponses) {
            if (compositeSubResponse.referenceId === referenceId) {
                return compositeSubResponse;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }
}

class CompositeApi implements ICompositeApi {
    private _connectionConfig: IConnectionConfig;

    constructor(connectionConfig: IConnectionConfig) {
        this._connectionConfig = connectionConfig;
    }

    public async invoke(compositeRequest: ICompositeRequest): Promise<ICompositeResponse> {
        const bearerCredentialHandler: BearerCredentialHandler =
            new BearerCredentialHandler(this._connectionConfig.sessionId);
        const httpClient: HttpClient = new HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path: string = `/services/data/v${this._connectionConfig.apiVersion}/composite/`;
        const headers: IHeaders = { 'Content-Type': 'application/json' };
        const data: string = JSON.stringify(compositeRequest);

        const response: HttpClientResponse =
            await httpClient.post(this._connectionConfig.instanceUrl + path, data, headers);
        if (response.message.statusCode === HttpCodes.OK) {
            const body: string = await response.readBody();
            const compositeResponse: ICompositeResponse = new CompositeResponse(body);

            return compositeResponse;
        } else {
            throw new Error('Server returned status code: ' + response.message.statusCode);
        }
    }
}

export function newCompositeApi(connectionConfig: IConnectionConfig): ICompositeApi {
    return new CompositeApi(connectionConfig);
}