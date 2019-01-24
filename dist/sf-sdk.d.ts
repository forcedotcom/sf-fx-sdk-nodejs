import * as jsforce from 'jsforce';
export default class Config {
    private env;
    constructor();
    isVerbose(): boolean;
    isFinest(): boolean;
    getPort(): string;
    getDyno(): string;
    getBrokerUrls(): string;
    getBrokerTimeout(): number;
    getBrokerClientCert(): string;
    getBrokerClientCertKey(): string;
    getBrokerTrustedCert(): string;
    getEventPrefix(): string;
    getEventGroupId(): string;
    getEventNames(): string;
    hasMessagingConfig(): boolean;
    private hasValue;
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
    constructor(orgId: string, username: string, userId: string, salesforceBaseUrl: string, orgDomainUrl: string, sessionId: string);
}
declare class Context {
    apiVersion: string;
    userContext: UserContext;
    sfApi: jsforce.Connection;
    logger: Logger;
    static create(payload: any, logger: Logger): Promise<Context>;
    constructor(apiVersion: string, userContext: UserContext, sfApi: jsforce.Connection, logger: Logger);
}
declare class Event {
    name: string;
    context: Context;
    payload: any;
    constructor(name: string, context: Context, payload: any);
    getReplayId(): any;
    getValue(key: string): any;
    isHttp(): boolean;
}
interface SfFunction {
    getName(): string;
    init(config: Config, logger: Logger): Promise<any>;
    invoke(event: Event): Promise<any>;
}
export { Config, Logger, logInit, UserContext, Context, Event, SfFunction };
