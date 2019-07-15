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
    orgId: string;
    username: string;
    userId: string;
    salesforceBaseUrl: string;
    orgDomainUrl: string;
    c2cJWT: string;
    static create(context: any): UserContext;
    private constructor();
}
declare class Context {
    userContext: UserContext;
    apiVersion: string;
    fxInvocation: ISObject;
    forceApi: api.ForceApi;
    logger: Logger;
    unitOfWork: IUnitOfWork;
    static create(payload: any, logger: Logger): Promise<Context>;
    private constructor();
}
declare class SfCloudevent extends Cloudevent {
    constructor(eventPayload?: any, specVersion?: string);
    check(): void;
    getPayload(): any;
    getPayloadVersion(): string;
}
interface SfFunction {
    getName(): string;
    init(config: Config, logger: Logger): Promise<any>;
    invoke(context: Context, event: SfCloudevent): Promise<any>;
}
export { Config, Context, Logger, UserContext, SfCloudevent, SfFunction };
