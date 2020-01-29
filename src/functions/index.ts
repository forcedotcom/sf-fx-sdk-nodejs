import { Logger } from '@salesforce/core';
import { ForceApi, UnitOfWork } from '..';

/**
 * Represents invoking user.
 */
export class UserContext {
    public constructor(
        public readonly orgDomainUrl: string,
        public readonly orgId: string,
        public readonly salesforceBaseUrl: string,
        public readonly username: string,
        public readonly userId: string,
        public readonly onBehalfOfUserId?: string,
    ) {}
}

/**
 * Respresents the context of the function invocation including objects needed by functions to
 * perform their action(s), eg ForceAPI to interact with the invoking org.
 */
export class Context {
    public constructor(
        public readonly apiVersion: string,
        public readonly userContext: UserContext,
        public readonly logger: Logger,
        public readonly forceApi?: ForceApi,
        public readonly unitOfWork?: UnitOfWork
        ) { }
}
