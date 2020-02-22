/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { Event } from '../../../src';

describe('Event Tests', () => {
    const eventType = 'SomethingHappened__e';
    let event: Event;

    beforeEach(function () {
        event = new Event(eventType);
    });

    it(`sObjectType is ${eventType}`, () => {
        expect(event.sObjectType).to.equal(eventType);
    });

    it(`sObjectType has __e`, () => {
        const anotherEvent = new Event('SomethingHappened');
        expect(anotherEvent.sObjectType).to.equal(eventType);
    });

    it('uuid exists', () => {
        expect(event.uuid).to.exist;
        expect(event.uuid).to.have.lengthOf(36);
    });

    it('id is set/get', () => {
        const expectedId = 'an_id';

        event.withId(expectedId);
        expect(event.id).to.equal(expectedId);
    });

    it('getReferenceId starts with sObjectType Name', () => {
        const regex = new RegExp(`^${eventType}`);
        expect(event.referenceId).to.match(regex);
        expect(event.referenceId).to.have.lengthOf(53);
    });

    it('setValue with single value', () => {
        const key = 'key1';
        const value: object = { 'Name': 'a_name' };

        event.setValue(key, value);

        const values = event.values;
        expect(values).to.exist;

        const keys: string[] = Object.keys(values);
        expect(keys.length).to.equal(1);
        expect(keys[0]).to.equal(key);
        expect(values[key]).to.to.equal(value);
    });


    it('setValue with multiple values', () => {
        const key1 = 'key1';
        const key2 = 'key2';
        const value1: object = { 'Name': 'a_name' };
        const value2 = 'a_string';

        event.setValue(key1, value1);
        event.setValue(key2, value2);

        const values = event.values;
        expect(values).to.exist;

        const keys: string[] = Object.keys(values);
        expect(keys.length).to.equal(2);
        expect(keys).to.contain(key1);
        expect(keys).to.contain(key2);
        expect(values[key1]).to.to.equal(value1);
        expect(values[key2]).to.to.equal(value2);
    });
});
