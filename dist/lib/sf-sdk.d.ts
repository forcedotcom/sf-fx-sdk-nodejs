import Cloudevent = require('cloudevents-sdk');
import { ISObject, IUnitOfWork } from './Interfaces';
import * as api from './api';
declare class Config {
    private env;
    constructor();
    isVerbose(): boolean;
    isFinest(): boolean;
    getPort(): string;
    getDyno(): string;
}
interface Logger {
    log(msg: string, ...supportingData: any[]): void;
    shout(msg: string, ...supportingData: any[]): void;
    debug(msg: string, ...supportingData: any[]): void;
    warn(msg: string, ...supportingData: any[]): void;
    error(msg: string, ...supportingData: any[]): void;
    info(msg: string, ...supportingData: any[]): void;
}
declare function logInit(verbose: boolean): Logger;
declare class UserContext {
    orgId: string;
    username: string;
    userId: string;
    salesforceBaseUrl: string;
    orgDomainUrl: string;
    sessionId: string;
    static create(context: any): UserContext;
    private constructor();
}
declare class Context {
    userContext: UserContext;
    apiVersion: string;
    fxInvocation: ISObject;
    forceApi: api.forceApi.IForceApi;
    logger: Logger;
    unitOfWork: IUnitOfWork;
    static create(payload: any, logger: Logger): Promise<Context>;
    private constructor();
}
interface SfFunction {
    getName(): string;
    init(config: Config, logger: Logger): Promise<any>;
    invoke(context: Context, event: Cloudevent): Promise<any>;
}
export { Cloudevent, Config, Logger, logInit, UserContext, Context, SfFunction };
