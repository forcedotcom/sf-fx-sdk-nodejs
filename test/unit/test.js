import { expect } from 'chai';
import 'mocha';
import { invoke, sdk } from '../../dist/index.js';

describe('salesforce-fdk test', () => {
    it('should export invoke', () => {
        expect(invoke).to.not.be.undefined;
    });
    it('should export sdk', () => {
        expect(sdk).to.not.be.undefined;
    });
});