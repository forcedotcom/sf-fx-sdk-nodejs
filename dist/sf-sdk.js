"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const Cloudevent = require("cloudevents-sdk");
const api = require("./api");
const ConnectionConfig_1 = require("./ConnectionConfig");
const Constants_1 = require("./Constants");
const SObject_1 = require("./SObject");
const unit_of_work_1 = require("./unit-of-work");
class Config {
    constructor() {
        dotenv.config();
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
    constructor(orgId, username, userId, salesforceBaseUrl, orgDomainUrl, sessionId) {
        this.orgId = orgId;
        this.username = username;
        this.userId = userId;
        this.salesforceBaseUrl = salesforceBaseUrl;
        this.orgDomainUrl = orgDomainUrl;
        this.sessionId = sessionId;
    }
    static create(context) {
        const userContext = context.userContext;
        if (!userContext) {
            const message = `UserContext not provided: ${JSON.stringify(context)}`;
            throw new Error(message);
        }
        return new UserContext(userContext.orgId, userContext.username, userContext.userId, userContext.salesforceBaseUrl, userContext.orgDomainUrl, userContext.sessionId);
    }
}
exports.UserContext = UserContext;
class Context {
    constructor(userContext, apiVersion, fxInvocation, forceApi, logger, unitOfWork) {
        this.userContext = userContext;
        this.apiVersion = apiVersion;
        this.fxInvocation = fxInvocation;
        this.forceApi = forceApi;
        this.logger = logger;
        this.unitOfWork = unitOfWork;
    }
    static async create(payload, logger) {
        let context = payload.Context__c || payload.context;
        if (!context) {
            const message = `Context not provided: ${JSON.stringify(payload)}`;
            throw new Error(message);
        }
        if (typeof context === 'string') {
            context = JSON.parse(context);
        }
        const userCtx = UserContext.create(context);
        const apiVersion = context.apiVersion || process.env.FX_API_VERSION || Constants_1.Constants.CURRENT_API_VERSION;
        const config = new ConnectionConfig_1.ConnectionConfig(userCtx.salesforceBaseUrl, apiVersion, userCtx.sessionId);
        const unitOfWork = unit_of_work_1.UnitOfWork.newUnitOfWork(config, logger);
        const forceApi = new api.ForceApi(config, logger);
        const newCtx = new Context(userCtx, apiVersion, new SObject_1.SObject('FunctionInvocationRequest').withId(context.functionInvocationId), forceApi, logger, unitOfWork);
        delete payload.Context__c;
        delete payload.context;
        return newCtx;
    }
}
exports.Context = Context;
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
    getPayload() {
        return this.getData().payload;
    }
    getPayloadVersion() {
        return this.getSource().substr(this.getSource().lastIndexOf('/') + 1);
    }
}
exports.SfCloudevent = SfCloudevent;
//# sourceMappingURL=sf-sdk.js.map