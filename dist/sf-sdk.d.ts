import Cloudevent = require('cloudevents-sdk');
import * as api from './api';
import { ISObject, IUnitOfWork } from './Interfaces';
declare class Config {
    private env;
    constructor();
    isVerbose(): boolean;
    isFinest(): boolean;
    getPort(): string;
    getDyno(): string;
}
declare class Logger {
    static create(verbose: boolean): Logger;
    shout(msg: string, ...supportingData: any[]): void;
    log(msg: string, ...supportingData: any[]): void;
    debug(msg: string, ...supportingData: any[]): void;
    warn(msg: string, ...supportingData: any[]): void;
    error(msg: string, ...supportingData: any[]): void;
    info(msg: string, ...supportingData: any[]): void;
    private emitLogMessage;
}
declare class UserContext {
    readonly orgDomainUrl: string;
    readonly orgId: string;
    readonly salesforceBaseUrl: string;
    readonly username: string;
    readonly userId: string;
    accessToken?: string;
    c2cJWT?: string;
    static create(context: any): UserContext;
    private constructor();
}
declare class FunctionInvocationRequest {
    private readonly context;
    readonly id: string;
    response: any;
    status: string;
    private readonly userCtx;
    private readonly logger;
    constructor(context: Context, id: string);
    /**
     * Saves FunctionInvocationRequest either through API w/ accessToken or
     * FunctionInvocationRequestServlet w/ c2cJWT.
     *
     @throws err if response not provided or on failed save
     */
    save(): Promise<any>;
    saveC2C(responseBase64: string): Promise<void>;
    update(fxInvocation: ISObject): Promise<api.SuccessResult | api.ErrorResult>;
    post(payload: any): Promise<any>;
}
declare class Context {
    readonly userContext: UserContext;
    readonly apiVersion: string;
    readonly forceApi: api.ForceApi;
    readonly logger: Logger;
    readonly unitOfWork: IUnitOfWork;
    static create(data: any, logger: Logger): Context;
    readonly fxInvocation: FunctionInvocationRequest;
    private constructor();
}
declare class SfCloudevent extends Cloudevent {
    constructor(eventPayload?: any, specVersion?: string);
    check(): void;
    getData(): any;
    getPayload(): any;
    getPayloadVersion(): string;
}
export { Config, Context, Logger, UserContext, SfCloudevent, FunctionInvocationRequest };
