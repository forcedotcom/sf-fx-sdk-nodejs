import { Logger, LoggerFormat, LoggerLevel } from '@salesforce/core/lib/logger';
import { Context, InvocationEvent, Headers, User, Org, Secrets } from "../functions";
import { UnitOfWorkGraph, UnitOfWork } from "../api/unit-of-work";
import { ConnectionConfig } from "../api/ConnectionConfig";
import { APIVersion } from "../utils";
import { DataApi } from "../api/DataApi";

interface CloudEvent {
  id:               string,
  type:             string,
  data:             JSON,
  source:           string,
  specversion:      string,
  datacontenttype?: string,
  sfcontext?:       RequestContext,
  sffncontext?:     FunctionContext,
  schemaurl?:       string,
  time?:            string,
}

interface FunctionContext {
  accessToken: string,
}

interface RequestContext {
  apiVersion?: string,
  userContext?: UserContext,
}

interface UserContext {
  orgId:             string,
  orgDomainUrl:      string,
  userId:            string,
  username:          string,
  onBehalfOfUserId:  string,
  salesforceBaseUrl: string
}

interface SdkFn {
  (InvocationEvent, Context, Logger): JSON
}

interface RawFn {
  (CloudEvent, Headers): JSON
}

// convert CloudEvent.time to milliseconds since 1970 UTC
function timeMillis(cloudEventTime?: string): number {
    if (cloudEventTime == null) {
        return new Date().getTime();
    }
    return Date.parse(cloudEventTime);
}

/**
 * Construct InvocationEvent from invocation request.
 *
 * @param fnPayload -- function payload
 * @param headers -- request headers with lower-cased keys
 * @param cloudEvent -- parsed request input CloudEvent
 * @return an InvocationEvent
 */
function createEvent(cloudEvent: CloudEvent, headers: Headers): InvocationEvent {
    return new InvocationEvent(
        cloudEvent.data,
        cloudEvent.datacontenttype,
        cloudEvent.schemaurl,
        cloudEvent.id,
        cloudEvent.source,
        timeMillis(cloudEvent.time),
        cloudEvent.type,
        headers
    );
}

/**
* Construct User object from the request context.
*
* @param userContext -- userContext object representing invoking org and user
* @return user
*/
function createUser(userContext: UserContext): User {
    return new User(
        userContext.userId,
        userContext.username,
        userContext.onBehalfOfUserId
    );
}

/**
* Construct Secrets object with logger.
*
*
* @param logger -- logger to use in case of secret load errors
* @return secrets loader/cache
*/
function createSecrets(logger: Logger): Secrets {
    return new Secrets(logger);
}

/**
* Construct Org object from the request context.
*
* @param reqContext
* @return org
*/
function createOrg(logger: Logger, reqContext: RequestContext, accessToken?: string): Org {
    const userContext = reqContext.userContext;
    if (!userContext) {
        const message = `UserContext not provided: ${JSON.stringify(reqContext)}`;
        throw new Error(message);
    }

    const apiVersion = reqContext.apiVersion || process.env.FX_API_VERSION;
    if (!apiVersion) {
        const message = `API Version not provided: ${JSON.stringify(reqContext)}`;
        throw new Error(message);
    }

    const user = createUser(userContext);

    logger.info(`accessToken${accessToken ? ' ' : ' NOT '}provided.`);
    let unitOfWorkGraph: UnitOfWorkGraph | undefined;
    const config: ConnectionConfig = new ConnectionConfig(
        accessToken,
        apiVersion,
        userContext.salesforceBaseUrl
    );
    const unitOfWork = new UnitOfWork(config, logger);
    if (apiVersion >= APIVersion.V50) {
        unitOfWorkGraph = new UnitOfWorkGraph(config, logger);
    }
    const dataApi = new DataApi(config, logger);

    return new Org(
        apiVersion,
        userContext.salesforceBaseUrl,
        userContext.orgDomainUrl,
        userContext.orgId,
        user,
        dataApi,
        unitOfWork,
        unitOfWorkGraph
    );
}

/**
* Construct Context from function payload.
*
* @param id                   -- request payload id
* @param logger               -- logger
* @param secrets              -- secrets convenience class
* @param reqContext           -- reqContext from the request, contains salesforce stuff (user reqContext, etc)
* @param accessToken          -- accessToken for function org access, if provided
* @param functionInvocationId -- FunctionInvocationRequest ID, if applicable
* @return context
*/
function createContext(id: string, logger: Logger, secrets: Secrets, reqContext?: RequestContext, accessToken?: string): Context {
    const org = reqContext ? createOrg(logger, reqContext, accessToken) : undefined;
    const context = new Context(id, logger, org, secrets);

    return context;
}

/**
 * Construct logger from request ID
 *
 * @param requestID -- optional request ID
 * @return Logger
 */
function createLogger(requestID?: string): Logger {
    const logger = new Logger({
        name: 'Salesforce Function Logger',
        format: LoggerFormat.LOGFMT,
        stream: process.stderr
    });
    const level = process.env.DEBUG ? LoggerLevel.DEBUG : LoggerLevel.INFO;
    logger.setLevel(level);

    if (requestID) {
        logger.addField('request_id', requestID);
    }

    return logger;
}

/**
 * Wraps a user function expecting serialized SDK objects into a raw
 * function that matches the expectations of the upstream invoker. Enriches
 * the function by providing serialized InvocationEvent, Context, and a Logger.
 *
 * @param sdkfn -- A function written by the end user with an arity of 3 that
 *        expects to recieve serialized SDK objects as arguments
 *
 * @return enrichedfn -- A wrapped, enriched version of the SDK function
 *        provided that is enriched with SDK serialization. It expects a 
 *        CloudEvent and Headers object, which are provided by the upstream 
 *        invoker.
 */
export const enrichFn: (SdkFn) => RawFn = function(fn) {
  return function(cloudEvent: CloudEvent, headers: Headers): JSON {
    // Validate the input request
    if (!(cloudEvent && headers)) {
        throw new Error('Request Data not provided');
    }

    // Initialize logger with request ID
    const requestId = cloudEvent.id || headers['x-request-id'].join(',');
    const logger = createLogger(requestId);

    //use secret here in lieu of DEBUG runtime environment var until we have deployment time support of config var
    const secrets = createSecrets(logger);
    const debugSecret = secrets.getValue('sf-debug', 'DEBUG');
    logger.info(`DEBUG flag is ${debugSecret ? debugSecret : 'unset'}`);
    if (debugSecret || LoggerLevel.DEBUG === logger.getLevel() || process.env.DEBUG) {
        //for dev preview, we log the ENTIRE raw request, may need to filter sensitive properties out later
        //the hard part of filtering is to know which property name to filter
        //change the logger level, so any subsequent user function's logger.debug would log as well
        logger.setLevel(LoggerLevel.DEBUG);
        logger.debug('debug raw request in middleware');
        logger.debug(`headers=${JSON.stringify(headers)}`);
        logger.debug(cloudEvent);
    }

    const ceCtx = cloudEvent.sfcontext;
    const ceFnCtx = cloudEvent.sffncontext;
    if (!ceCtx) {
        logger.warn('Context not provided in data: context is partially initialized');
    }
    let accessToken: string;
    if (ceFnCtx) {
        accessToken = ceFnCtx.accessToken;
    }


    const invocationEvent = createEvent(cloudEvent, headers);
    const context = createContext(
        cloudEvent.id,
        logger,
        secrets,
        ceCtx,
        accessToken
    );

    return fn(invocationEvent, context, logger);
  };
};
