"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cloudevent = require("cloudevents-sdk");
const request = require("request-promise-native");
const api = require("./api");
const ConnectionConfig_1 = require("./ConnectionConfig");
const Constants_1 = require("./Constants");
const SObject_1 = require("./SObject");
const unit_of_work_1 = require("./unit-of-work");
class Config {
    constructor() {
        this.env = process.env;
    }
    isVerbose() {
        return this.env.VERBOSE === 'true' || this.env.VERBOSE === '1';
    }
    isFinest() {
        return this.env.FINEST === 'true' || this.env.FINEST === '1';
    }
    getPort() {
        return this.env.PORT;
    }
    getDyno() {
        return this.env.DYNO;
    }
}
exports.Config = Config;
class Logger {
    static create(verbose) {
        return verbose ? new Logger() : NO_OP_LOGGER;
    }
    shout(msg, ...supportingData) {
        this.emitLogMessage('info', `-----> ${msg}`, supportingData);
    }
    log(msg, ...supportingData) {
        this.emitLogMessage('info', `       ${msg}`, supportingData);
    }
    debug(msg, ...supportingData) {
        this.emitLogMessage('debug', msg, supportingData);
    }
    warn(msg, ...supportingData) {
        this.emitLogMessage('warn', msg, supportingData);
    }
    error(msg, ...supportingData) {
        this.emitLogMessage('error', msg, supportingData);
    }
    info(msg, ...supportingData) {
        this.emitLogMessage('info', msg, supportingData);
    }
    emitLogMessage(msgType, msg, supportingDetails) {
        if (supportingDetails.length > 0) {
            console[msgType](msg, supportingDetails);
        }
        else {
            console[msgType](msg);
        }
    }
}
exports.Logger = Logger;
class NoOpLogger extends Logger {
    log(msg, ...supportingData) { }
    shout(msg, ...supportingData) { }
    debug(msg, ...supportingData) { }
    warn(msg, ...supportingData) { }
    error(msg, ...supportingData) { }
    info(msg, ...supportingData) { }
}
const NO_OP_LOGGER = new NoOpLogger();
class UserContext {
    constructor(orgDomainUrl, orgId, salesforceBaseUrl, username, userId, accessToken, c2cJWT) {
        this.orgDomainUrl = orgDomainUrl;
        this.orgId = orgId;
        this.salesforceBaseUrl = salesforceBaseUrl;
        this.username = username;
        this.userId = userId;
        this.accessToken = accessToken;
        this.c2cJWT = c2cJWT;
    }
    static create(context) {
        const userContext = context.userContext;
        if (!userContext) {
            const message = `UserContext not provided: ${JSON.stringify(context)}`;
            throw new Error(message);
        }
        return new UserContext(userContext.orgDomainUrl, userContext.orgId, userContext.salesforceBaseUrl, userContext.username, userContext.userId, userContext.accessToken, userContext.c2cJWT);
    }
}
exports.UserContext = UserContext;
// FOR C2C JWT only.  With Salesforce provided context.userContext.accessToken,
// standard new SObject('FunctionInvocationRequest') can be used.
// TODO: Remove when FunctionInvocationRequest is deprecated.
class FunctionInvocationRequest {
    constructor(context, id) {
        this.context = context;
        this.id = id;
        this.userCtx = context.userContext;
        this.logger = context.logger;
    }
    /**
     * Saves FunctionInvocationRequest either through API w/ accessToken or
     * FunctionInvocationRequestServlet w/ c2cJWT.
     *
     @throws err if response not provided or on failed save
     */
    async save() {
        if (!this.response) {
            throw new Error('Response not provided');
        }
        const responseBase64 = Buffer.from(JSON.stringify(this.response)).toString('base64');
        if (this.userCtx.accessToken) {
            const fxInvocation = new SObject_1.SObject('FunctionInvocationRequest').withId(this.id);
            fxInvocation.setValue('ResponseBody', responseBase64);
            const result = await this.update(fxInvocation);
            if (!result.success && 'errors' in result) { // Tells tsc that 'errors' exist and join below is okay
                const msg = `Failed to send response [${this.id}]: ${result.errors.join(',')}`;
                this.logger.error(msg);
                throw new Error(msg);
            }
            else {
                return result;
            }
        }
        else if (this.userCtx.c2cJWT) {
            return await this.saveC2C(responseBase64);
        }
        else {
            throw new Error('Authorization not provided');
        }
    }
    // Helper method to save response to FunctionInvocationRequest w/ C2C JWT
    async saveC2C(responseBase64) {
        const payload = {
            form: {
                userContext: JSON.stringify(this.context.userContext),
                id: this.id,
                response: responseBase64
            },
            headers: {
                'Authorization': `C2C ${this.userCtx.c2cJWT}`
            },
            method: 'POST',
            uri: `${this.userCtx.salesforceBaseUrl}/servlet/FunctionInvocationRequestServlet`,
        };
        try {
            const saveResponse = await this.post(payload);
            this.logger.info(`Successfully sent the result for ${this.id}`);
            return saveResponse;
        }
        catch (err) {
            this.logger.error(`Failed to send the response for ${this.id}: ${err}`);
            throw err;
        }
    }
    async update(fxInvocation) {
        return await this.context.forceApi.update(fxInvocation);
    }
    async post(payload) {
        return await request.post(payload);
    }
}
exports.FunctionInvocationRequest = FunctionInvocationRequest;
class Context {
    constructor(userContext, apiVersion, forceApi, logger, unitOfWork, functionInvocationId) {
        this.userContext = userContext;
        this.apiVersion = apiVersion;
        this.forceApi = forceApi;
        this.logger = logger;
        this.unitOfWork = unitOfWork;
        this.fxInvocation = new FunctionInvocationRequest(this, functionInvocationId);
    }
    // data contains salesforce stuff (user context, etc) and function's payload (data.payload)
    static create(data, logger) {
        let context = data.Context__c || data.context;
        if (!context) {
            const message = `Context not provided: ${JSON.stringify(data)}`;
            throw new Error(message);
        }
        if (typeof context === 'string') {
            context = JSON.parse(context);
        }
        const userCtx = UserContext.create(context);
        const apiVersion = context.apiVersion || process.env.FX_API_VERSION || Constants_1.Constants.CURRENT_API_VERSION;
        const config = new ConnectionConfig_1.ConnectionConfig(userCtx.salesforceBaseUrl, apiVersion, userCtx.accessToken || userCtx.c2cJWT);
        const unitOfWork = unit_of_work_1.UnitOfWork.newUnitOfWork(config, logger);
        const forceApi = new api.ForceApi(config, logger);
        const newCtx = new Context(userCtx, apiVersion, forceApi, logger, unitOfWork, context.functionInvocationId);
        return newCtx;
    }
}
exports.Context = Context;
// REVIEWME: Do we need w/ Lyra Function?  Currently this class just adds a
// convenience method (getPayload) to extract the custom payload.
class SfCloudevent extends Cloudevent {
    constructor(eventPayload, specVersion = '0.2') {
        super(Cloudevent.specs[specVersion]);
        if (eventPayload) {
            this.spec.payload = Object.assign(this.spec.payload, eventPayload);
        }
    }
    check() {
        this.spec.check();
    }
    getData() {
        return super.getData();
    }
    getPayload() {
        return this.getData().payload;
    }
    getPayloadVersion() {
        return this.getSource().substr(this.getSource().lastIndexOf('/') + 1);
    }
}
exports.SfCloudevent = SfCloudevent;
//# sourceMappingURL=sf-sdk.js.map