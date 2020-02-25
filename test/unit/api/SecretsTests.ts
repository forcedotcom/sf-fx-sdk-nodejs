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
        const result = secrets.get('testGoodObject');

        // assert secret properties
        assert(typeof result === 'object', 'get call returns a JS object');
        expect(result['key1']).to.equal('value1');
        expect(result['key2']).to.equal(222);
        expect(result['key3']).to.equal(true);

        // Second read should return the same object from cache
        const chk2 = secrets.get('testGoodObject');
        assert(Object.is(chk2, result), 'Second get call pulls from cache, not filesystem');
    });

    it('should read good array secret', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);
        const result = secrets.get('testGoodArray');

        // if secret file happens to be in [x,y,z] array format, is also treated as js object
        assert(typeof result === 'object', 'get call returns a JS object');
        expect(result[0]).to.equal('one');
        expect(result[1]).to.equal(2);
        expect(result[2]).to.equal(true);

        // Second read should return the same object from cache
        const chk2 = secrets.get('testGoodArray');
        assert(Object.is(chk2, result), 'Second get call pulls from cache, not filesystem');
    });

    it('should fail silently on malformed boolean-only secret file', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        // Getting a secret file that contains a bare non-object json value should return undefined
        const result = secrets.get('testBareBoolean');
        expect(result).to.be.undefined;
    });

    it('should fail silently on malformed badString secret file', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        // Getting a malformed secret file should return undefined
        const result = secrets.get('testBadString');
        expect(result).to.be.undefined;
    });

    it('should fail silently on non-existent secret', async () => {
        const secrets = new Secrets(NO_OP_LOGGER, TEST_BASEPATH);

        // Getting non-existent secret file should return undefined
        const result = secrets.get('testDoesNotExist');
        expect(result).to.be.undefined;
    });
});
