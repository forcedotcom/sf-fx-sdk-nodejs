/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from '@salesforce/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Cache entry for a secret Map
 */
class CacheEntry {
    constructor(
        readonly secretName: string,
        readonly lastChecked: number,
        readonly lastModified: number|undefined,
        readonly values: ReadonlyMap<string,string>|undefined) {}

    getSecretName(): string {
        return this.secretName;
    }

    getValues(): ReadonlyMap<string, string>|undefined {
        return this.values;
    }

    getLastModified(): number|undefined {
        return this.lastModified;
    }

    getLastChecked(): number {
        return this.lastChecked;
    }

    private static readDirEntries(logger: Logger, dirPath: string, dirEntries: string[]): Map<string, string> {
        // only descend a single directory level, *not* recursive
        const ret = new Map<string, string>();
        for (const key of dirEntries) {
            // Ignore dotfiles or dotdirs in secret dir
            if (!key.startsWith('.')) {
                const fullPath = path.join(dirPath, key);
                try {
                    // Only load secrets from readable *files*, ignore directories
                    const pathStat = fs.statSync(fullPath);
                    if (pathStat.isFile()) {
                        const buf = fs.readFileSync(fullPath);
                        ret[key] = buf.toString();
                    }
                } catch (reason) {
                    // Silently ignore unreadable files
                    logger.debug(`Failed path=${fullPath} file load: ${reason}`);
                }
            }
        }
        return ret;
    }

    static load(logger: Logger, secretName: string, dirPath: string): CacheEntry {
        const now = Date.now();
        try {
            // only load secrets from a parent `secret` dir that exists, is a directory, and
            // has not changed since the last time we loaded secrets from that dir.
            const dirStat = fs.statSync(dirPath);
            if (dirStat.isDirectory()) {
                const ents = CacheEntry.readDirEntries(logger, dirPath, fs.readdirSync(dirPath));
                return new CacheEntry(secretName, now, dirStat.mtimeMs, ents);
            }
        } catch (reason) {
            // hide dir stat/listing error from caller, just log and return back w/undefined values
            logger.info(`Failed secret ${secretName} dir listing: ${reason}`);
        }
        return new CacheEntry(secretName, now, undefined, undefined);
    }
}

/**
 * Convenience class to access/cache Evergreen secrets.
 */
export class Secrets {
    /** default path prefix for secrets */
    public static readonly DEFAULT_BASE_PATH = '/platform/services';

    /** path suffix to load a secrets file  */
    public static readonly SUFFIX_PATH = 'secret';

    // A "secret" has a toplevel name and consists of one or more key/value pairs
    private cache = new Map<string, CacheEntry>();

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
    public get(secretName: string): ReadonlyMap<string, string>|undefined {
        let ent: CacheEntry = this.cache[secretName];
        if (!ent) {
            ent = this.loadCacheEntry(secretName);
        }
        return ent.getValues();
    }

    private loadCacheEntry(secretName: string): CacheEntry {
        const secDirPath = path.join(this.basePath, secretName, Secrets.SUFFIX_PATH);
        const ent = CacheEntry.load(this.logger, secretName, secDirPath);
        this.cache[secretName] = ent;
        return ent;
    }

}
