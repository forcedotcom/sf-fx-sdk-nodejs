import { expect } from 'chai';
import 'mocha';

import * as sfxif from '../../../lib/Interfaces';
const index = require('../../../lib')

describe('CompositeSubrequest Builder Tests', () => {
    /**
     * Return all known builders for generic test cases
     */
    const getBuilderFactories = (): Array<Function> => {
        return [index.compositeApi.deleteBuilder, index.compositeApi.describeBuilder, index.compositeApi.httpGETBuilder, index.compositeApi.insertBuilder, index.compositeApi.patchBuilder, index.compositeApi.putBuilder];
    };

    const assertSetValuesSucceeds = (builderFactory: Function) => {
        it(builderFactory.name + ' set values with single value', () => {
            const key: string = 'key1';
            const value: string = 'a_string';


            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.value(key, value)).to.equal(builder);

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const values: { [key: string]: string } = compositeSubrequest.body;
            expect(values).to.exist;

            const keys: string[] = Object.keys(values);
            expect(keys.length).to.equal(1);
            expect(keys[0]).to.equal(key);
            expect(values[key]).to.to.equal(value);
        });

        it(builderFactory.name + ' set values with multiple values', () => {
            const key1: string = 'key1';
            const key2: string = 'key2';
            const value1: string = 'a_string_1'
            const value2: string = 'a_string_2';
            const expectedHeaders: { [key: string]: string } = { key1: value1, key2: value2 };

            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.values(expectedHeaders)).to.equal(builder);

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const values: { [key: string]: string } = compositeSubrequest.body;
            expect(values).to.exist;

            const keys: string[] = Object.keys(values);
            expect(keys.length).to.equal(2);
            expect(keys).to.contain(key1);
            expect(keys).to.contain(key2);
            expect(values[key1]).to.to.equal(value1);
            expect(values[key2]).to.to.equal(value2);
        });

        // Name is syntactic sugar over the value method
        it(builderFactory.name + ' set name', () => {
            const name: string = "A Name";
            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.named(name)).to.equal(builder);

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            const values: { [key: string]: string } = compositeSubrequest.body;
            expect(values).to.exist;

            const keys: string[] = Object.keys(values);
            expect(keys.length).to.equal(1);
            expect(keys[0]).to.equal('Name');
            expect(values['Name']).to.to.equal(name);
        });
    };

    const assertSetValuesThrows = (builderFactory: Function) => {
        it(builderFactory.name + ' value throws', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
            expect(builder.value.bind(builder, 'key', 'value')).to.throw("This request doesn't have a body");
        });

        it(builderFactory.name + ' values throws', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
            expect(builder.values.bind(builder, { 'key': 'value' })).to.throw("This request doesn't have a body");
        });

        // Name is syntactic sugar over the value method
        it(builderFactory.name + ' set name throws', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
            expect(builder.named.bind(builder, 'A name')).to.throw("This request doesn't have a body");
        });
    };

    describe('Generic CompositeSubrequest Tests', () => {
        const builderFactories: Array<Function> = getBuilderFactories();

        // TODO: Update with ID test
        builderFactories.forEach((builderFactory) => {
            it(builderFactory.name + ' throws if sObjectType is missing', () => {
                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
                expect(builder.build.bind(builder)).to.throw("Type is required");
            });

            it(builderFactory.name + ' sObjectType set via string succeeds', () => {
                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
                expect(builder.sObjectType('Opportunity')).to.equal(builder);

                const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Opportunity/);
            });

            it(builderFactory.name + ' sObjectType set via sobject succeeds', () => {
                const sObject: sfxif.ISObject = new index.sObject.SObject('Case');
                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory();
                expect(builder.sObject(sObject)).to.equal(builder);

                const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Case/);
            });

            it(builderFactory.name + ' set api version', () => {
                const version: string = "4933";
                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.apiVersion(version)).to.equal(builder);

                const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.apiVersion).to.match(/4933/);
            });

            it(builderFactory.name + ' set header with single header', () => {
                const key: string = 'key1';
                const value: string = 'a_string';

                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.header(key, value)).to.equal(builder);

                const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                const headers: { [key: string]: string } = compositeSubrequest.httpHeaders;
                expect(headers).to.exist;

                const keys: string[] = Object.keys(headers);
                expect(keys.length).to.equal(1);
                expect(keys[0]).to.equal(key);
                expect(headers[key]).to.to.equal(value);
            });

            it(builderFactory.name + ' set header with multiple headers', () => {
                const key1: string = 'key1';
                const key2: string = 'key2';
                const value1: string = 'a_string_1'
                const value2: string = 'a_string_2';
                const expectedHeaders: { [key: string]: string } = { key1: value1, key2: value2 };

                const builder: sfxif.ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.headers(expectedHeaders)).to.equal(builder);

                const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                const headers: { [key: string]: string } = compositeSubrequest.httpHeaders;
                expect(headers).to.exist;

                const keys: string[] = Object.keys(headers);
                expect(keys.length).to.equal(2);
                expect(keys).to.contain(key1);
                expect(keys).to.contain(key2);
                expect(headers[key1]).to.to.equal(value1);
                expect(headers[key2]).to.to.equal(value2);
            });
        });
    });

    describe('Insert CompositeSubrequest Tests', () => {
        it('test insert builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is POST', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.POST);
        });

        it('set id with value throws an exception', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder();
            expect(builder.id.bind(builder, 'an_id')).to.throw();
        });

        it('set id with null ignores caller', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder();
            builder.id(null);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.insertBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(/^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account$/);
        });

        assertSetValuesSucceeds(index.compositeApi.insertBuilder);
    });

    describe('Delete CompositeSubrequest Tests', () => {
        it('test delete builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.deleteBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is DELETE', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.deleteBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.DELETE);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.deleteBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(index.compositeApi.deleteBuilder);
    });

    describe('Describe CompositeSubrequest Tests', () => {
        it('test describe builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.describeBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.describeBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.GET);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.describeBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(/^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account\/describe$/);
        });

        assertSetValuesThrows(index.compositeApi.describeBuilder);
    });

    describe('HttpGET CompositeSubrequest Tests', () => {
        it('test httpGGET builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.httpGETBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.httpGETBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.GET);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.httpGETBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(index.compositeApi.httpGETBuilder);
    });

    describe('Patch CompositeSubrequest Tests', () => {
        it('test patch builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.patchBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PATCH', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.patchBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.PATCH);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.patchBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(index.compositeApi.patchBuilder);
    });


    describe('Put CompositeSubrequest Tests', () => {
        it('test put builder factory', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.putBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PUT', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.putBuilder().sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(sfxif.Method.PUT);
        });

        it('url is as expected', () => {
            const builder: sfxif.ICompositeSubrequestBuilder = index.compositeApi.putBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: sfxif.ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(index.compositeApi.putBuilder);
    });
});