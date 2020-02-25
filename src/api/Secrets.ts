import { Logger } from '@salesforce/core';
import { fs } from '@salesforce/core';
import * as path from 'path';

export class Secrets {
    // A "secret" has a toplevel name and consists of one or more key/value pairs
    private cache = new Map<string, Map<string, string>>();

    constructor(private logger: Logger, private basePath: string = '/platform/secrets') {}

    public get(secretName: string): Map<string, string> | undefined {
        let kv = this.cache[secretName];
        if (kv) {
            return kv;
        }
        const jsonPath = path.join(this.basePath, secretName);
        try {
            // cache successful reads
            kv = fs.readJson(jsonPath, false);
            this.cache[secretName] = kv;
        } catch (e) {
            this.logger.warn('Failed to read secret file ' + jsonPath + ': ' + e);
            kv = undefined;
        }
        return kv;
    }
}
