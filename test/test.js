'use strict';
const expect = require('chai').expect;
const index = require('../dist/index.js');

describe('salesforce-fdk test', () => {
    it('should export run', () => {
        expect(index.run).to.not.be.undefined;
    });
    it('should export sdk', () => {
        expect(index.sdk).to.not.be.undefined;
    });
});