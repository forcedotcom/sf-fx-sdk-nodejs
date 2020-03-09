export class ConnectionConfig {
    constructor(
        accessToken: string,
        public readonly apiVersion: string,
        public readonly instanceUrl: string
    ) {
        // Avoid serialization (default enumerable: false)
        Object.defineProperty(this, 'accessToken', { value: accessToken, writable: false });
    }

    get accessToken(): string {
        return this.accessToken;
    }
}
