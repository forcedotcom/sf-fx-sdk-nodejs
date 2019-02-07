import { IConnectionConfig } from './Interfaces';

export class ConnectionConfig implements IConnectionConfig {
    constructor(
        public readonly instanceUrl: string,
        public readonly apiVersion: string,
        public readonly sessionId: string,
    ) {}
}
