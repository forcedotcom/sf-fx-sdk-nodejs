/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert, expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
use(chaiAsPromised);
import * as path from 'path';

import { Logger, Secrets } from '../../../src';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const TEST_BASEPATH = path.resolve(__dirname, 'secrets');

//   T E S T S

describe('Secrets Tests', () => {

    it('should read good object secret', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);
        const result = secrets.get('testRegularSecret');

        // assert secret properties
        assert(typeof result === 'object', 'get call returns a string -> string Map');
        expect(result['key1']).to.equal('value1');
        expect(result['key2']).to.equal('222');  // result is string, not number
        expect(result['key3']).to.equal('true'); // result is string not boolean

        // Second read should return the same object from cache
        const chk2 = secrets.get('testRegularSecret');
        assert(Object.is(chk2, result), 'Second get call pulls from cache, not filesystem');
    });

    it('should get undefined for secret dir that does not exist', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        const result = secrets.get('nonExistentSecret');
        expect(result).to.be.undefined;
    });

    it('should get empty map for secret dir that only contains dotfile(s)', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        // Getting a malformed secret file should return undefined
        const result = secrets.get('testEmptySecret');
        expect(result.keys()).to.be.empty;
    });
});
