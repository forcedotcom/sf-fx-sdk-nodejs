"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hm = require("typed-rest-client/Handlers");
const httpm = require("typed-rest-client/HttpClient");
var HttpCodes;
(function (HttpCodes) {
    HttpCodes[HttpCodes["OK"] = 200] = "OK";
    HttpCodes[HttpCodes["Created"] = 201] = "Created";
    HttpCodes[HttpCodes["NoContent"] = 204] = "NoContent";
    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
class CompositeSubresponse {
    constructor(compositeSubresponse) {
        this.httpHeaders = compositeSubresponse.httpHeaders;
        this.httpStatusCode = compositeSubresponse.httpStatusCode;
        this.referenceId = compositeSubresponse.referenceId;
        // The response body has different meaning depending if there was an error
        if (compositeSubresponse.httpStatusCode < HttpCodes.BadRequest) {
            this._body = compositeSubresponse.body;
        }
        else {
            const errors = [];
            if (compositeSubresponse.body) {
                compositeSubresponse.body.forEach((element) => {
                    errors.push(element);
                });
            }
            this._errors = errors;
        }
    }
    get body() {
        if (this.httpStatusCode < HttpCodes.BadRequest) {
            return this._body;
        }
        else {
            throw new Error('Body is not valid when there has been an error. Call #errors installed.');
        }
    }
    get errors() {
        if (this.httpStatusCode >= HttpCodes.BadRequest) {
            return this._errors;
        }
        else {
            throw new Error(`Errors is not valid when there hasn't been an error. Call #errors installed.`);
        }
    }
    get id() {
        if (this.body && this.body[CompositeSubresponse.KEY_ID]) {
            return this.body[CompositeSubresponse.KEY_ID];
        }
        else {
            return undefined;
        }
    }
    get isSuccess() {
        return (this.httpStatusCode && this.httpStatusCode < HttpCodes.BadRequest);
    }
    get location() {
        if (this.httpHeaders && this.httpHeaders[CompositeSubresponse.HEADER_LOCATION]) {
            return this.httpHeaders[CompositeSubresponse.HEADER_LOCATION];
        }
        else {
            return undefined;
        }
    }
}
CompositeSubresponse.HEADER_LOCATION = 'Location';
CompositeSubresponse.KEY_ID = 'id';
;
class CompositeResponse {
    constructor(json) {
        const compositeResponseJsonObject = JSON.parse(json);
        const compositeSubResponses = compositeResponseJsonObject.compositeResponse;
        if (compositeSubResponses) {
            compositeSubResponses.forEach((element, index) => {
                // Replace the json object with one that contains the location method
                compositeSubResponses[index] = new CompositeSubresponse(element);
            });
        }
        this.compositeSubresponses = compositeSubResponses;
    }
    getCompositeSubresponse(compositeSubrequest) {
        const referenceId = compositeSubrequest.referenceId;
        for (const compositeSubResponse of this.compositeSubresponses) {
            if (compositeSubResponse.referenceId === referenceId) {
                return compositeSubResponse;
            }
        }
        throw new Error('Unknown referenceId: ' + referenceId);
    }
}
class CompositeApi {
    constructor(config) {
        this._config = config;
    }
    async invoke(compositeRequest) {
        const bearerCredentialHandler = new hm.BearerCredentialHandler(this._config.sessionId);
        const httpClient = new httpm.HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path = `/services/data/v${this._config.apiVersion}/composite/`;
        const headers = { 'Content-Type': 'application/json' };
        const data = JSON.stringify(compositeRequest);
        const response = await httpClient.post(this._config.instanceUrl + path, data, headers);
        if (response.message.statusCode === HttpCodes.OK) {
            const body = await response.readBody();
            const compositeResponse = new CompositeResponse(body);
            return compositeResponse;
        }
        else {
            throw new Error('Server returned status code: ' + response.message.statusCode);
        }
    }
}
function newCompositeApi(config) {
    return new CompositeApi(config);
}
exports.newCompositeApi = newCompositeApi;
//# sourceMappingURL=CompositeApi.js.map