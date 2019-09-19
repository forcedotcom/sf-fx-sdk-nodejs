import Cloudevent = require('cloudevents-sdk');
import * as api from './api';
import { IUnitOfWork } from './Interfaces';
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
    orgId: string;
    username: string;
    userId: string;
    salesforceBaseUrl: string;
    orgDomainUrl: string;
    c2cJWT: string;
    static create(context: any): UserContext;
    private constructor();
}
declare class FunctionInvocationRequest {
    readonly context: Context;
    readonly id: string;
    response: any;
    status: string;
    private readonly userContext;
    private readonly logger;
    constructor(context: Context, id: string);
    save(): Promise<void>;
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
