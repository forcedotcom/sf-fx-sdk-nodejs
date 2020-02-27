import { Logger } from '@salesforce/core';
import { DataApi, Secrets, UnitOfWork } from '..';

/**
 * Represents a function invocation event.
 */
export class InvocationEvent {
    public constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public readonly data: any,
        public readonly dataContentType: string,
        public readonly dataSchema: string,
        public readonly id: string,
        public readonly source: string,
        public readonly time: number,
        public readonly type: string,
        public readonly headers?: ReadonlyMap<string, ReadonlyArray<string>>,
    ) {}
}

/**
 * Represents invoking user.
 */
export class User {
    public constructor(
        public readonly id: string,
        public readonly username: string,
        public readonly onBehalfOfUserId?: string,
    ) {}
}

/**
 * Represents invoking org and user.
 *
 * For convenience and if the request provides org access, API instances
 * are initialized and set on this object.
 */
export class Org {
    public constructor(
        public readonly apiVersion: string,
        public readonly baseUrl: string,
        public readonly domainUrl: string,
        public readonly id: string,
        public readonly user: User,
        public readonly data?: DataApi,
        public readonly unitOfWork?: UnitOfWork,
        public readonly secrets?: Secrets,
    ) {}

    /**
     * @see [[DataApi]]
     */
    public async request(method: string, url: string, body: string, headers?: object): Promise<object> {
        if (!this.data) {
            throw new Error('Data API not provided.');
        }
        return await this.data.request(method, url, body, headers);
    }
}

/**
 * Respresents the context of the function invocation.
 *
 * If the request originates from an org, the org object repesents
 * the invoking org and user.
 */
export class Context {
    public constructor(
        public readonly id: string,
        public readonly logger: Logger,
        public readonly org?: Org,
        ) {}
}
