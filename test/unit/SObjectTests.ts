import { assert, expect } from 'chai';
import 'mocha';

import * as sfxif from '../../lib/Interfaces';
const index = require('../../lib')

describe('SObject Tests', () => {
    let sObject: sfxif.ISObject = null;

    beforeEach(function () {
        sObject = new index.sObject.SObject('Account');
    });

    it('sObjectType is Account', () => {
        expect(sObject.getSObjectType()).to.equal('Account');
    });

    it('uuid exists', () => {
        expect(sObject.getUuid()).to.exist;
        expect(sObject.getUuid()).to.have.lengthOf(36);
    });

    it('id is set/get', () => {
        const expectedId: string = 'an_id';

        sObject.id(expectedId);
        expect(sObject.getId()).to.equal(expectedId);
    });

    it('getReferenceId starts with sObjectType Name', () => {
        expect(sObject.getReferenceId()).to.match(/^Account_/);
        expect(sObject.getReferenceId()).to.have.lengthOf(40);
    });

    it('setValue with single value', () => {
        const key: string = 'key1';
        const value: object = { 'Name': 'a_name' };

        sObject.setValue(key, value);

        const values: { [key: string]: any } = sObject.getValues();
        expect(values).to.exist;

        const keys: string[] = Object.keys(values);
        expect(keys.length).to.equal(1);
        expect(keys[0]).to.equal(key);
        expect(values[key]).to.to.equal(value);
    });


    it('setValue with multiple values', () => {
        const key1: string = 'key1';
        const key2: string = 'key2';
        const value1: object = { 'Name': 'a_name' };
        const value2: string = 'a_string';

        sObject.setValue(key1, value1);
        sObject.setValue(key2, value2);

        const values: { [key: string]: any } = sObject.getValues();
        expect(values).to.exist;

        const keys: string[] = Object.keys(values);
        expect(keys.length).to.equal(2);
        expect(keys).to.contain(key1);
        expect(keys).to.contain(key2);
        expect(values[key1]).to.to.equal(value1);
        expect(values[key2]).to.to.equal(value2);
    });
});