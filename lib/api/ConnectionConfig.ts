export class ConnectionConfig {
    constructor(
        public readonly accessToken: string,
        public readonly apiVersion: string,
        public readonly instanceUrl: string
    ) {}
}
