import Cloudevent = require('cloudevents-sdk');

import * as api from './api';
import { ConnectionConfig } from './ConnectionConfig';
import { Constants } from './Constants';
import { IConnectionConfig, ISObject, IUnitOfWork } from './Interfaces';
import { SObject } from './SObject';
import { UnitOfWork } from './unit-of-work';

class Config {
    private env;

    constructor() {
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
}

class Logger {
    public static create(verbose: boolean): Logger {
        return verbose ? new Logger() : NO_OP_LOGGER;
    }

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

class NoOpLogger extends Logger {
    public log(msg: string, ...supportingData: any[]): void {}
    public shout(msg: string, ...supportingData: any[]): void {}
    public debug(msg: string, ...supportingData: any[]): void {}
    public warn(msg: string, ...supportingData: any[]): void {}
    public error(msg: string, ...supportingData: any[]): void {}
    public info(msg: string, ...supportingData: any[]): void {}
}

const NO_OP_LOGGER = new NoOpLogger();

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
            userContext.c2cJWT,
        );
    }

    private constructor(
        public orgId: string,
        public username: string,
        public userId: string,
        public salesforceBaseUrl: string,
        public orgDomainUrl: string,
        public c2cJWT: string,
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

        const apiVersion = context.apiVersion || process.env.FX_API_VERSION || Constants.CURRENT_API_VERSION;
        const config: IConnectionConfig = new ConnectionConfig(
            userCtx.salesforceBaseUrl,
            apiVersion,
            userCtx.c2cJWT,
        );
        const unitOfWork = UnitOfWork.newUnitOfWork(config, logger);
        const forceApi = new api.ForceApi(config, logger);

        const newCtx = new Context(
            userCtx,
            apiVersion,
            new SObject('FunctionInvocationRequest').withId(context.functionInvocationId),
            forceApi,
            logger,
            unitOfWork,
        );

        delete payload.Context__c;
        delete payload.context;

        return newCtx;
    }

    private constructor(
        public userContext: UserContext,
        public apiVersion: string,
        public fxInvocation: ISObject,
        public forceApi: api.ForceApi,
        public logger: Logger,
        public unitOfWork: IUnitOfWork,
    ) {}
}

class SfCloudevent extends Cloudevent {
    constructor(eventPayload?: any, specVersion: string = '0.2') {
        super(Cloudevent.specs[specVersion]);

        if (eventPayload) {
            this.spec.payload = Object.assign(this.spec.payload, eventPayload);
        }
    }

    public check(): void {
        this.spec.check();
    }

    public getData(): any {
        return super.getData();
    }

    public getPayload(): any {
        return this.getData().payload;
    }

    public getPayloadVersion(): string {
        return this.getSource().substr(this.getSource().lastIndexOf('/') + 1);
    }
}

interface SfFunction {
    getName(): string;

    init(config: Config, logger: Logger): Promise<any>;

    invoke(context: Context, event: SfCloudevent): Promise<any>;
}

export { Config, Context, Logger, UserContext, SfCloudevent, SfFunction };
