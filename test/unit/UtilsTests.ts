import {  expect } from 'chai';
import 'mocha';
import { Constants } from '../../src';

//   T E S T S

describe('Utils Tests', () => {

    it('has current API version', async () => {
        expect(Constants.CURRENT_API_VERSION).to.be.equal('48.0');
    });

});