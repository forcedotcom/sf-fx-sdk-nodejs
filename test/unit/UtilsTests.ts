import {  expect } from 'chai';
import 'mocha';
import { APIVersion } from '../../src';

//   T E S T S

describe('Utils Tests', () => {

    it('expected API version', async () => {
        expect(APIVersion.V50.toString()).to.be.equal('50.0');
    });

});