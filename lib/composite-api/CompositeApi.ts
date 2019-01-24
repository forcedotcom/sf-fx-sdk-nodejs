import * as hm from 'typed-rest-client/Handlers';
import * as trcIfm from 'typed-rest-client/Interfaces';
import * as httpm from 'typed-rest-client/HttpClient';

import * as sfxif from '../Interfaces';

export enum HttpCodes {
    OK = 200,
    Created = 201,
    NoContent = 204,
    MultipleChoices = 300,
    MovedPermanently = 301,
    ResourceMoved = 302,
    SeeOther = 303,
    NotModified = 304,
    UseProxy = 305,
    SwitchProxy = 306,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,
    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    NotAcceptable = 406,
    ProxyAuthenticationRequired = 407,
    RequestTimeout = 408,
    Conflict = 409,
    Gone = 410,
    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
}

class CompositeSubresponse implements sfxif.ICompositeSubresponse {
    private static HEADER_LOCATION: string = 'Location';
    private static KEY_ID: string = 'id';
    private static KEY_SUCCESS: string = 'success';

    readonly httpHeaders: { [key: string]: string; };
    readonly httpStatusCode: number;
    readonly referenceId: string;
    readonly _errors: ReadonlyArray<sfxif.IError>;
    private readonly _body: { [key: string]: any; };

    public get body(): { [key: string]: any; } {
        if (this.httpStatusCode < HttpCodes.BadRequest) {
            return this._body;
        } else {
            throw new Error('Body is not valid when there has been an error. Call #errors installed.');
        }
    }

    public get errors(): ReadonlyArray<sfxif.IError> {
        if (this.httpStatusCode >= HttpCodes.BadRequest) {
            return this._errors;
        } else {
            throw new Error("Errors is not valid when there hasn't been an error. Call #errors installed.");
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

    constructor(compositeSubresponse: sfxif.ICompositeSubresponse) {
        this.httpHeaders = compositeSubresponse.httpHeaders;
        this.httpStatusCode = compositeSubresponse.httpStatusCode;
        this.referenceId = compositeSubresponse.referenceId;
        // The response body has different meaning depending if there was an error
        if (compositeSubresponse.httpStatusCode < HttpCodes.BadRequest) {
            this._body = compositeSubresponse.body;
        } else {
            const errors: Array<sfxif.IError> = [];
            if (compositeSubresponse.body) {
                for (var i=0; i<compositeSubresponse.body.length; i++) {
                    errors.push(<sfxif.IError>compositeSubresponse.body[i]);
                }
            }
            this._errors = errors;
        }
    }
}

class CompositeResponse implements sfxif.ICompositeResponse {
    public readonly compositeSubresponses: ReadonlyArray<sfxif.ICompositeSubresponse>;

    public getCompositeSubresponse(compositeSubrequest: sfxif.ICompositeSubrequest): sfxif.ICompositeSubresponse {
        const referenceId: string = compositeSubrequest.referenceId;

        for (let compositeSubResponse of this.compositeSubresponses) {
            if (compositeSubResponse.referenceId === referenceId) {
                return compositeSubResponse;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }

    constructor(json: string) {
        const jsonAsObj: object = JSON.parse(json);
        let compositeSubResponses: Array<sfxif.ICompositeSubresponse> = <Array<CompositeSubresponse>>jsonAsObj['compositeResponse'];
        if (compositeSubResponses) {
            for (var i = 0; i < compositeSubResponses.length; i++) {
                // Replace the json object with one that contains the location method
                compositeSubResponses[i] = new CompositeSubresponse(compositeSubResponses[i]);
            }
        }
        this.compositeSubresponses = <ReadonlyArray<sfxif.ICompositeSubresponse>>compositeSubResponses;
    }
}

class CompositeApi implements sfxif.ICompositeApi {
    private _config: sfxif.IConfig;

    constructor(config: sfxif.IConfig) {
        this._config = config;
    }

    async invoke(compositeRequest: sfxif.ICompositeRequest): Promise<sfxif.ICompositeResponse> {
        const bearerCredentialHandler: hm.BearerCredentialHandler = new hm.BearerCredentialHandler(this._config.sessionId);
        const httpClient: httpm.HttpClient = new httpm.HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path: string = '/services/data/v' + this._config.apiVersion + '/composite/';
        const headers: trcIfm.IHeaders = { "Content-Type": "application/json" };
        const data: string = JSON.stringify(compositeRequest);

        const response: httpm.HttpClientResponse = await httpClient.post(this._config.instanceUrl + path, data, headers);
        if (response.message.statusCode === HttpCodes.OK) {
            const body: string = await response.readBody();
            const compositeResponse: sfxif.ICompositeResponse = new CompositeResponse(body);

            return compositeResponse;
        } else {
            throw new Error('Server returned status code: ' + response.message.statusCode);
        }
    }
}

export function newCompositeApi(config: sfxif.IConfig): sfxif.ICompositeApi {
    return new CompositeApi(config);
}