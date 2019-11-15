/* tslint:disable: no-unused-expression */
import { assert, expect } from 'chai';
import 'mocha';

import { SObject } from '../../../lib';

describe('SObject Tests', () => {
    let sObject: SObject = null;

    beforeEach(function () {
        sObject = new SObject('Account');
    });

    it('sObjectType is Account', () => {
        expect(sObject.sObjectType).to.equal('Account');
    });

    it('uuid exists', () => {
        expect(sObject.uuid).to.exist;
        expect(sObject.uuid).to.have.lengthOf(36);
    });

    it('id is set/get', () => {
        const expectedId: string = 'an_id';

        sObject.withId(expectedId);
        expect(sObject.id).to.equal(expectedId);
    });

    it('getReferenceId starts with sObjectType Name', () => {
        expect(sObject.referenceId).to.match(/^Account_/);
        expect(sObject.referenceId).to.have.lengthOf(40);
    });

    it('setValue with single value', () => {
        const key: string = 'key1';
        const value: object = { 'Name': 'a_name' };

        sObject.setValue(key, value);

        const values: { [key: string]: any } = sObject.values;
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

        const values: { [key: string]: any } = sObject.values;
        expect(values).to.exist;

        const keys: string[] = Object.keys(values);
        expect(keys.length).to.equal(2);
        expect(keys).to.contain(key1);
        expect(keys).to.contain(key2);
        expect(values[key1]).to.to.equal(value1);
        expect(values[key2]).to.to.equal(value2);
    });
});