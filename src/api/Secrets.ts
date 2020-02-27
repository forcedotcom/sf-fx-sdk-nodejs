import { Logger } from '@salesforce/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Convenience class to access/cache Evergreen secrets.
 */
export class Secrets {
    /** default path prefix for secrets */
    public static readonly DEFAULT_BASE_PATH = '/platform/secrets';

    /** path suffix to load a secrets file  */
    public static readonly SUFFIX_PATH = 'secret';

    // A "secret" has a toplevel name and consists of one or more key/value pairs
    private cache = new Map<string, Map<string, string>>();

    /**
     * Construct with logger and optional base path.
     * @param logger logger to use if unable to load/decode secret.
     * @param basePath 
     */
    constructor(
        private logger: Logger,
        private basePath: string = Secrets.DEFAULT_BASE_PATH,
        ) {}

    /**
     * Get a secret object.
     *
     * @param secretName name of the secret to load.
     * @returns secret key/value object if successful, undefined on failure or missing.
     */
    public get(secretName: string): Map<string, string> | undefined {
        let kv = this.cache[secretName];
        if (kv) {
            return kv;
        }

        // Attempt read of secret file
        const jsonPath = path.join(this.basePath, secretName, Secrets.SUFFIX_PATH);
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
                this.logger.debug('Successfully loaded/cached secret '+secretName);
            } else {
                this.logger.warn('Invalid secret (' + secretName + ') content of type: ' + (typeof decoded));
            }
        } catch (e) {
            this.logger.warn('Failed to decode secret file ' + jsonPath + ' as json: ' + e);
        }
        return kv;
    }
}
