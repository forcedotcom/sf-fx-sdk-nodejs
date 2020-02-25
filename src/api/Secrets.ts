import { Logger } from '@salesforce/core';
import * as fs from 'fs';
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

        // Attempt read of secret file
        const jsonPath = path.join(this.basePath, secretName);
        let fileBody: string | undefined;
        try {
            fileBody = fs.readFileSync(jsonPath).toString('utf-8');
        } catch (e) {
            this.logger.warn('Failed to read secret file ' + jsonPath + ': ' + e);
        }

        // Attempt JSON decode to type: object
        try {
            const decoded = JSON.parse(fileBody);
            if (typeof decoded === 'object') {
                kv = decoded;
                this.cache[secretName] = kv;
            } else {
                this.logger.warn('Invalid secret (' + secretName + ') content of type: ' + (typeof decoded));
            }
        } catch (e) {
            this.logger.warn('Failed to decode secret file ' + jsonPath + ' as json: ' + e);
        }
        return kv;
    }
}
