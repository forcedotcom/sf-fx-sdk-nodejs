import { expect } from 'chai';
import 'mocha';
import { beforeEach } from 'mocha';

import * as sfxif from '../../../lib/Interfaces';
const index = require('../../../lib')

describe('CompositeSubrequest Serialization Tests', () => {
    let builder:sfxif.ICompositeSubrequestBuilder = null;

    beforeEach(function() {
        builder = index.compositeApi.insertBuilder().sObjectType('Account');
    });

    const convertToAndFromJson = (compositSubRequest:sfxif.ICompositeSubrequest):object => {
        return JSON.parse(JSON.stringify(compositSubRequest));
    };

    it('sObjectType is excluded from serialization', () => {
        const jsonObject:object = convertToAndFromJson(builder.build());
        
        Object.keys(jsonObject).forEach((key) => {
            expect(key).to.not.equal('sObjectType');
        });
    });

    it('apiVersion is excluded from serialization', () => {
        builder.apiVersion('45.0');
        const jsonObject:object = convertToAndFromJson(builder.build());
        
        Object.keys(jsonObject).forEach((key) => {
            expect(key).to.not.equal('apiVersion');
        });
    });

    it('Method is serialized', () => {
        const jsonObject:object = convertToAndFromJson(builder.build());

        expect(jsonObject['method']).to.equal('POST');
    });

    it('ReferenceId is serialized', () => {
        const jsonObject:object = convertToAndFromJson(builder.build());

        expect(jsonObject['referenceId']).to.match(/^Account_/);
        expect(jsonObject['referenceId']).lengthOf(40);
    });

    it('Url is serialized', () => {
        const jsonObject:object = convertToAndFromJson(builder.build());

        expect(jsonObject['url']).to.match(/^\/services\/data\/v[0-9]{2}\.[0-9]\/sobjects\/Account/);
    });

    it('Body is serialized', () => {
        const key1: string = 'key1';
        const value1: string = 'value1';
        const key2: string = 'key2';
        const value2: string = 'value2';
        builder.value(key1, value1);
        builder.value(key2, value2);
        const jsonObject:object = convertToAndFromJson(builder.build());

        const body:{ [key: string]: string } = jsonObject['body'];
        expect(body).to.exist;
        expect(Object.keys(body)).lengthOf(2);
        expect(body[key1]).to.equal(value1);
        expect(body[key2]).to.equal(value2);
    });

    it('Headers are serialized', () => {
        const key1: string = 'key1';
        const value1: string = 'value1';
        const key2: string = 'key2';
        const value2: string = 'value2';
        builder.header(key1, value1);
        builder.header(key2, value2);
        const jsonObject:object = convertToAndFromJson(builder.build());

        const headers:{ [key: string]: string } = jsonObject['httpHeaders'];
        expect(headers).to.exist;
        expect(Object.keys(headers)).lengthOf(2);
        expect(headers[key1]).to.equal(value1);
        expect(headers[key2]).to.equal(value2);
    });

    it('Verify no extra parameters', () => {
        const jsonObject:object = convertToAndFromJson(builder.build());
        Object.keys(jsonObject).forEach((key) => {
            expect(key).to.be.oneOf(['httpHeaders', 'method', 'referenceId', 'url', 'body']);
        });
    });
});