import Cloudevent = require('cloudevents-sdk');
import * as request from 'request-promise-native';

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
            userContext.orgDomainUrl,
            userContext.orgId,
            userContext.salesforceBaseUrl,
            userContext.username,
            userContext.userId,
            userContext.accessToken,
            userContext.c2cJWT,
        );
    }

    private constructor(
        public readonly orgDomainUrl: string,
        public readonly orgId: string,
        public readonly salesforceBaseUrl: string,
        public readonly username: string,
        public readonly userId: string,
        public accessToken?: string,
        public c2cJWT?: string,
    ) {}
}

// FOR C2C JWT only.  With Salesforce provided context.userContext.accessToken,
// standard new SObject('FunctionInvocationRequest') can be used.
// TODO: Remove when FunctionInvocationRequest is deprecated.
class FunctionInvocationRequest {
    public response: any;
    public status: string;

    private readonly userCtx: UserContext;
    private readonly logger: Logger;

    constructor(private readonly context: Context, public readonly id: string) {
        this.userCtx = context.userContext;
        this.logger = context.logger;
    }

    /**
     * Saves FunctionInvocationRequest either through API w/ accessToken or
     * FunctionInvocationRequestServlet w/ c2cJWT.
     *
     * @throws err if response not provided or on failed save
     */
    public async save(): Promise<any> {
        if (!this.response) {
            throw new Error('Response not provided');
        }

        const responseBase64 = Buffer.from(JSON.stringify(this.response)).toString('base64');

        if (this.userCtx.accessToken) {
            const fxInvocation = new SObject('FunctionInvocationRequest').withId(this.id);
            fxInvocation.setValue('ResponseBody', responseBase64);
            const result: api.SuccessResult | api.ErrorResult = await this.update(fxInvocation);
            if (!result.success && 'errors' in result) {
                // Tells tsc that 'errors' exist and join below is okay
                const msg = `Failed to send response [${this.id}]: ${result.errors.join(',')}`;
                this.logger.error(msg);
                throw new Error(msg);
            } else {
                return result;
            }
        } else if (this.userCtx.c2cJWT) {
            return await this.saveC2C(responseBase64);
        } else {
            throw new Error('Authorization not provided');
        }
    }

    // Helper method to save response to FunctionInvocationRequest w/ C2C JWT
    protected async saveC2C(responseBase64: string): Promise<void> {
        const payload = {
            form: {
                id: this.id,
                response: responseBase64,
                userContext: JSON.stringify(this.context.userContext)
            },
            headers: {
                Authorization: `C2C ${this.userCtx.c2cJWT}`,
            },
            method: 'POST',
            uri: `${this.userCtx.salesforceBaseUrl}/servlet/FunctionInvocationRequestServlet`,
        };

        try {
            const saveResponse = await this.post(payload);
            this.logger.info(`Successfully sent the result for ${this.id}`);
            return saveResponse;
        } catch (err) {
            this.logger.error(`Failed to send the response for ${this.id}: ${err}`);
            throw err;
        }
    }

    protected async update(fxInvocation: ISObject): Promise<api.SuccessResult | api.ErrorResult> {
        return await this.context.forceApi.update(fxInvocation);
    }

    protected async post(payload): Promise<any> {
        return await request.post(payload);
    }
}

class Context {
    // data contains salesforce stuff (user context, etc) and function's payload (data.payload)
    public static create(data: any, logger: Logger): Context {
        let context = data.Context__c || data.context;
        if (!context) {
            const message = `Context not provided: ${JSON.stringify(data)}`;
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
            userCtx.accessToken || userCtx.c2cJWT,
        );
        const unitOfWork = UnitOfWork.newUnitOfWork(config, logger);
        const forceApi = new api.ForceApi(config, logger);

        const newCtx = new Context(userCtx, apiVersion, forceApi, logger, unitOfWork, context.functionInvocationId);

        return newCtx;
    }

    public readonly fxInvocation: FunctionInvocationRequest;

    private constructor(
        public readonly userContext: UserContext,
        public readonly apiVersion: string,
        public readonly forceApi: api.ForceApi,
        public readonly logger: Logger,
        public readonly unitOfWork: IUnitOfWork,
        functionInvocationId: string,
    ) {
        this.fxInvocation = new FunctionInvocationRequest(this, functionInvocationId);
    }
}

// REVIEWME: Do we need w/ Lyra Function?  Currently this class just adds a
// convenience method (getPayload) to extract the custom payload.
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

export { Config, Context, Logger, UserContext, SfCloudevent, FunctionInvocationRequest };
