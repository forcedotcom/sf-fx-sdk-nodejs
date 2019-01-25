"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const jsforce = require("jsforce");
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
    getBrokerUrls() {
        return this.env.KAFKA_URL;
    }
    getBrokerTimeout() {
        return this.env.KAFKA_TIMEOUT || 10000;
    }
    getBrokerClientCert() {
        return this.env.KAFKA_CLIENT_CERT;
    }
    getBrokerClientCertKey() {
        return this.env.KAFKA_CLIENT_CERT_KEY;
    }
    getBrokerTrustedCert() {
        return this.env.KAFKA_TRUSTED_CERT;
    }
    getEventPrefix() {
        return this.env.KAFKA_PREFIX;
    }
    getEventGroupId() {
        return this.env.KAFKA_GROUP_ID;
    }
    getEventNames() {
        return this.env.CONSUME_TOPIC_NAMES;
    }
    hasMessagingConfig() {
        return this.hasValue(this.getBrokerUrls())
            && this.hasValue(this.getEventNames())
            && this.hasValue(this.getBrokerClientCert())
            && this.hasValue(this.getBrokerClientCertKey())
            && this.hasValue(this.getBrokerTrustedCert());
    }
    hasValue(value) {
        return typeof value !== 'undefined' && value !== null;
    }
}
exports.default = Config;
exports.Config = Config;
class NoOpLoggerImpl {
    log(msg, ...supportingData) { }
    shout(msg, ...supportingData) { }
    debug(msg, ...supportingData) { }
    warn(msg, ...supportingData) { }
    error(msg, ...supportingData) { }
    info(msg, ...supportingData) { }
}
class LoggerImpl {
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
const noOpLogger = new NoOpLoggerImpl();
function logInit(verbose) {
    return verbose ? new LoggerImpl() : noOpLogger;
}
exports.logInit = logInit;
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
    constructor(apiVersion, userContext, sfApi, logger) {
        this.apiVersion = apiVersion;
        this.userContext = userContext;
        this.sfApi = sfApi;
        this.logger = logger;
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
        const sfApi = new jsforce.Connection({
            accessToken: userCtx.sessionId,
            instanceUrl: userCtx.salesforceBaseUrl,
            version: context.apiVersion,
        });
        const newCtx = new Context(context.apiVersion, userCtx, sfApi, logger);
        delete payload.Context__c;
        delete payload.context;
        return newCtx;
    }
}
exports.Context = Context;
class Event {
    constructor(name, context, payload) {
        this.name = name;
        this.context = context;
        this.payload = payload;
    }
    getReplayId() {
        return this.payload.event.replayId;
    }
    getValue(key) {
        return this.payload[key];
    }
    isHttp() {
        return 'http' === this.name;
    }
}
exports.Event = Event;
//# sourceMappingURL=sf-sdk.js.map