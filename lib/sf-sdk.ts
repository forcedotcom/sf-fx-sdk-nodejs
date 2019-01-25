import * as dotenv from 'dotenv';
import * as jsforce from 'jsforce';

export default class Config {

    private env;

    constructor() {
        dotenv.config();
        this.env = process.env;
    }

    public isVerbose(): boolean {
        return this.env.VERBOSE === 'true' || this.env.VERBOSE === '1';
    }

    public isFinest(): boolean {
        return this.env.FINEST === 'true' || this.env.FINEST === '1';
    }

    public getPort(): string {
        return this.env.PORT;
    }

    public getDyno(): string {
        return this.env.DYNO;
    }

    public getBrokerUrls(): string {
        return this.env.KAFKA_URL;
    }

    public getBrokerTimeout(): number {
        return this.env.KAFKA_TIMEOUT || 10000;
    }

    public getBrokerClientCert(): string {
        return this.env.KAFKA_CLIENT_CERT;
    }

    public getBrokerClientCertKey(): string {
        return this.env.KAFKA_CLIENT_CERT_KEY;
    }

    public getBrokerTrustedCert(): string {
        return this.env.KAFKA_TRUSTED_CERT;
    }

    public getEventPrefix(): string {
        return this.env.KAFKA_PREFIX;
    }

    public getEventGroupId(): string {
        return this.env.KAFKA_GROUP_ID;
    }

    public getEventNames(): string {
        return this.env.CONSUME_TOPIC_NAMES;
    }

    public hasMessagingConfig(): boolean {
        return this.hasValue(this.getBrokerUrls())
            && this.hasValue(this.getEventNames())
            && this.hasValue(this.getBrokerClientCert())
            && this.hasValue(this.getBrokerClientCertKey())
            && this.hasValue(this.getBrokerTrustedCert());
    }

    private hasValue(value: any): boolean {
        return typeof value !== 'undefined' && value !== null;
    }
}

interface Logger {
    log(msg: string, ...supportingData: any[]): void;
    shout(msg: string, ...supportingData: any[]): void;

    debug(msg: string, ...supportingData: any[]): void;
    warn(msg: string, ...supportingData: any[]): void;
    error(msg: string, ...supportingData: any[]): void;
    info(msg: string, ...supportingData: any[]): void;
}

class NoOpLoggerImpl implements Logger {
    public log(msg: string, ...supportingData: any[]): void {}
    public shout(msg: string, ...supportingData: any[]): void {}

    public debug(msg: string, ...supportingData: any[]): void {}
    public warn(msg: string, ...supportingData: any[]): void {}
    public error(msg: string, ...supportingData: any[]): void {}
    public info(msg: string, ...supportingData: any[]): void {}
}

class LoggerImpl implements Logger {
    public shout(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', `-----> ${msg}`, supportingData);
    }

    public log(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', `       ${msg}`, supportingData);
    }

    public debug(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('debug', msg, supportingData);
    }

    public warn(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('warn', msg, supportingData);
    }

    public error(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('error', msg, supportingData);
    }

    public info(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', msg, supportingData);
    }

    private emitLogMessage(msgType: 'debug' | 'info' | 'warn' | 'error', msg: string, supportingDetails: any[]) {
        if (supportingDetails.length > 0) {
            console[msgType](msg, supportingDetails);
        } else {
            console[msgType](msg);
        }
    }
}
const noOpLogger = new NoOpLoggerImpl();
function logInit(verbose: boolean): Logger {
    return verbose ? new LoggerImpl() : noOpLogger;
}

class UserContext {
    public static create(context: any): UserContext {
        const userContext = context.userContext;
        if (!userContext) {
            const message = `UserContext not provided: ${JSON.stringify(context)}`;
            throw new Error(message);
        }

        return new UserContext(
            userContext.orgId,
            userContext.username,
            userContext.userId,
            userContext.salesforceBaseUrl,
            userContext.orgDomainUrl,
            userContext.sessionId,
        );
    }

    private constructor(
        public orgId: string,
        public username: string,
        public userId: string,
        public salesforceBaseUrl: string,
        public orgDomainUrl: string,
        public sessionId: string,
    ) {}
}

class Context {
    public static async create(payload: any, logger: Logger): Promise<Context> {
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

    private constructor(
        public apiVersion: string,
        public userContext: UserContext,
        public sfApi: jsforce.Connection,
        public logger: Logger,
    ) {}
}

class Event {
    public constructor(public name: string, public context: Context, public payload: any) {}

    public getReplayId(): any {
        return this.payload.event.replayId;
    }

    public getValue(key: string): any {
        return this.payload[key];
    }

    public isHttp() {
        return 'http' === this.name;
    }
}

interface SfFunction {
    getName(): string;

    init(config: Config, logger: Logger): Promise<any>;

    invoke(event: Event): Promise<any>;
}

export { Config, Logger, logInit, UserContext, Context, Event, SfFunction };
