import Cloudevent = require('cloudevents-sdk');
import * as request from 'request-promise-native';

import { ConnectionConfig, Constants, ErrorResult, ForceApi, Logger, SObject, SuccessResult, UnitOfWork } from '..';


// TODO: Migrate to an Evergreen middleware layer.  Convenice here to not dupe
// code across existing functions.
// Once SF middleware is in place, the event param will be the function's
// payload and context will be a fully setup sdk.Context instance.
// Until then, event is a CloudEvent object that we'll parse either to
// setup sdk.Context.
export function applySfFxMiddleware(event: any, context: any): any {

    if (!event) {
        throw new Error('Data not provided');
    }

    if (!context) {
        throw new Error('Context not provided');
    }

    const data = event.data;
    if (!data) {
        throw new Error('Data not provided');
    }

    // Again, this is temp: context param will be fully setup sdk.Context instance.
    const contextData = data.context;
    if (!contextData) {
        throw new Error('Context not provided');
    }

    // Not all functions will require an accessToken used for org access.
    // The accessToken will not be passed directly to functions, but instead
    // passed as part of SFContext used in SF middleware to setup API instances.
    let accessToken;
    let functionInvocationId;
    if (data.sfContext) {
        accessToken = data.sfContext.accessToken || undefined;
        functionInvocationId = data.sfContext.functionInvocationId || undefined;
        // Internal only
        delete data.sfContext;
    }


    return {
        context: Context.create(contextData, Logger.create(true), accessToken, functionInvocationId),
        event: data.payload };
}

export class UserContext {
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
            userContext.userId
        );
    }

    private constructor(
        public readonly orgDomainUrl: string,
        public readonly orgId: string,
        public readonly salesforceBaseUrl: string,
        public readonly username: string,
        public readonly userId: string
    ) {}
}

// If an accessToken is provided, helper class for saving function response to FunctionInvocationRequest.Response.
// TODO: Remove when FunctionInvocationRequest is deprecated.
export class FunctionInvocationRequest {
    public response: any;
    public status: string;

    constructor(public readonly id: string, private readonly logger: Logger, private readonly forceApi?: ForceApi) {
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

        if (this.forceApi) {
            try {
                // Prime pump (W-6841389)
                const soql = `SELECT Id, FunctionName, Status, CreatedById, CreatedDate FROM FunctionInvocationRequest WHERE Id ='${this.id}'`;
                await this.forceApi.query(soql);
            } catch (err) {
                this.logger.warn(err.message);
            }

            const fxInvocation = new SObject('FunctionInvocationRequest').withId(this.id);
            fxInvocation.setValue('ResponseBody', responseBase64);
            const result: SuccessResult | ErrorResult = await this.forceApi.update(fxInvocation);
            if (!result.success && 'errors' in result) {
                // Tells tsc that 'errors' exist and join below is okay
                const msg = `Failed to send response [${this.id}]: ${result.errors.join(',')}`;
                this.logger.error(msg);
                throw new Error(msg);
            } else {
                return result;
            }
        } else {
            throw new Error('Authorization not provided');
        }
    }

    async post(payload): Promise<any> {
        return await request.post(payload);
    }
}

export class Context {
    // data contains salesforce stuff (user context, etc) and function's payload (data.payload)
    public static create(context: any, logger: Logger, accessToken?: string, functionInvocationId?: string): Context {
        if (!context) {
            throw new Error('Context not provided.');
        }

        if (typeof context === 'string') {
            context = JSON.parse(context);
        }

        const userCtx = UserContext.create(context);
        const apiVersion = context.apiVersion || process.env.FX_API_VERSION || Constants.CURRENT_API_VERSION;

        // If accessToken was provided, setup APIs.
        let forceApi: ForceApi;
        let unitOfWork: UnitOfWork;
        let fxInvocation: FunctionInvocationRequest;
        if (accessToken) {
            const config: ConnectionConfig = new ConnectionConfig(
                userCtx.salesforceBaseUrl,
                apiVersion,
                accessToken
            );
            unitOfWork = new UnitOfWork(config, logger);
            forceApi = new ForceApi(config, logger);

            if (functionInvocationId) {
                fxInvocation = new FunctionInvocationRequest(functionInvocationId, logger, forceApi);
            }
        }

        const newCtx = new Context(apiVersion, userCtx, logger, context.payloadVersion, forceApi, unitOfWork,
            fxInvocation);

        return newCtx;
    }

    private constructor(
        public readonly apiVersion: string,
        public readonly userContext: UserContext,
        public readonly logger: Logger,
        public readonly payloadVersion: string,
        public readonly forceApi?: ForceApi,
        public readonly unitOfWork?: UnitOfWork,
        public readonly fxInvocation?: FunctionInvocationRequest

    ) {
    }
}
