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

        // Verify same results with .get call:
        expect(result.get('key1')).to.equal('value1');
        expect(result.get('key2')).to.equal('222');
        expect(result.get('key3')).to.equal('true');

        // Verify same results with Secrets.getValue call:
        expect(secrets.getValue('testRegularSecret', 'key1')).to.equal('value1');
        expect(secrets.getValue('testRegularSecret', 'key2')).to.equal('222');
        expect(secrets.getValue('testRegularSecret', 'key3')).to.equal('true');

        // Second read should return the same object from cache
        const chk2 = secrets.get('testRegularSecret');
        assert(Object.is(chk2, result), 'Second get call pulls from cache, not filesystem');
    });

    it('should get undefined for secret dir that does not exist', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        const result = secrets.get('nonExistentSecret');
        expect(result).to.be.undefined;

        const resultVal = secrets.getValue('nonExistentSecret', 'key1');
        expect(resultVal).to.be.undefined;
    });

    it('should get empty map for secret dir that only contains dotfile(s)', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        // Getting a malformed secret file should return undefined
        const result = secrets.get('testEmptySecret');
        expect(result.keys()).to.be.empty;

        // result should be a Map object that implements a .get method
        expect(result.get('key1')).to.be.undefined;

        // getValue should also be undefined
        expect(secrets.getValue('testEmptySecret', 'key1')).to.be.undefined;
    });
});
