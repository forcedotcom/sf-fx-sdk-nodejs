import { IConfig } from './Interfaces';

export class Config implements IConfig {
    constructor(
        public readonly instanceUrl: string,
        public readonly apiVersion: string,
        public readonly sessionId: string,
    ) {}
}
