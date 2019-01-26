/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { CompositeApi, SObject } from '../../../lib';
import { ICompositeSubrequest, ICompositeSubrequestBuilder, ISObject, Method } from '../../../lib/Interfaces';

describe('CompositeSubrequest Builder Tests', () => {
    /**
     * Return all known builders for generic test cases
     */
    const getBuilderFactories = (): Function[] => {
        return [
            CompositeApi.deleteBuilder,
            CompositeApi.describeBuilder,
            CompositeApi.httpGETBuilder,
            CompositeApi.insertBuilder,
            CompositeApi.patchBuilder,
            CompositeApi.putBuilder,
        ];
    };

    const assertSetValuesSucceeds = (builderFactory: Function) => {
        it(builderFactory.name + ' set values with single value', () => {
            const key: string = 'key1';
            const value: string = 'a_string';

            const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.addValue(key, value)).to.equal(builder);

            const compositeSubrequest: ICompositeSubrequest = builder.build();
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
            const value1: string = 'a_string_1';
            const value2: string = 'a_string_2';
            const expectedHeaders: { [key: string]: string } = { key1: value1, key2: value2 };

            const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.addValues(expectedHeaders)).to.equal(builder);

            const compositeSubrequest: ICompositeSubrequest = builder.build();
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
            const name: string = 'A Name';
            const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
            expect(builder.named(name)).to.equal(builder);

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            const values: { [key: string]: string } = compositeSubrequest.body;
            expect(values).to.exist;

            const keys: string[] = Object.keys(values);
            expect(keys.length).to.equal(1);
            expect(keys[0]).to.equal('Name');
            expect(values.Name).to.to.equal(name);
        });
    };

    const assertSetValuesThrows = (builderFactory: Function) => {
        it(builderFactory.name + ' value throws', () => {
            const builder: ICompositeSubrequestBuilder = builderFactory();
            expect(builder.addValue.bind(builder, 'key', 'value')).to.throw(`This request doesn't have a body`);
        });

        it(builderFactory.name + ' values throws', () => {
            const builder: ICompositeSubrequestBuilder = builderFactory();
            expect(builder.addValues.bind(builder, { key: 'value' })).to.throw(`This request doesn't have a body`);
        });

        // Name is syntactic sugar over the value method
        it(builderFactory.name + ' set name throws', () => {
            const builder: ICompositeSubrequestBuilder = builderFactory();
            expect(builder.named.bind(builder, 'A name')).to.throw(`This request doesn't have a body`);
        });
    };

    describe('Generic CompositeSubrequest Tests', () => {
        const builderFactories: Function[] = getBuilderFactories();

        // TODO: Update with ID test
        builderFactories.forEach(builderFactory => {
            it(builderFactory.name + ' throws if sObjectType is missing', () => {
                const builder: ICompositeSubrequestBuilder = builderFactory();
                expect(builder.build.bind(builder)).to.throw('Type is required');
            });

            it(builderFactory.name + ' sObjectType set via string succeeds', () => {
                const builder: ICompositeSubrequestBuilder = builderFactory();
                expect(builder.sObjectType('Opportunity')).to.equal(builder);

                const compositeSubrequest: ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Opportunity/);
            });

            it(builderFactory.name + ' sObjectType set via sobject succeeds', () => {
                const sObject: ISObject = new SObject('Case');
                const builder: ICompositeSubrequestBuilder = builderFactory();
                expect(builder.sObject(sObject)).to.equal(builder);

                const compositeSubrequest: ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Case/);
            });

            it(builderFactory.name + ' set api version', () => {
                const version: string = '4933';
                const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.apiVersion(version)).to.equal(builder);

                const compositeSubrequest: ICompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.apiVersion).to.match(/4933/);
            });

            it(builderFactory.name + ' set header with single header', () => {
                const key: string = 'key1';
                const value: string = 'a_string';

                const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.header(key, value)).to.equal(builder);

                const compositeSubrequest: ICompositeSubrequest = builder.build();
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
                const value1: string = 'a_string_1';
                const value2: string = 'a_string_2';
                const expectedHeaders: { [key: string]: string } = { key1: value1, key2: value2 };

                const builder: ICompositeSubrequestBuilder = builderFactory().sObjectType('Account');
                expect(builder.headers(expectedHeaders)).to.equal(builder);

                const compositeSubrequest: ICompositeSubrequest = builder.build();
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
            const builder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is POST', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.POST);
        });

        it('set id with value throws an exception', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder();
            expect(builder.id.bind(builder, 'an_id')).to.throw();
        });

        it('set id with null ignores caller', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder();
            builder.id(null);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.insertBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(/^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account$/);
        });

        assertSetValuesSucceeds(CompositeApi.insertBuilder);
    });

    describe('Delete CompositeSubrequest Tests', () => {
        it('test delete builder factory', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.deleteBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is DELETE', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.deleteBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.DELETE);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.deleteBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(CompositeApi.deleteBuilder);
    });

    describe('Describe CompositeSubrequest Tests', () => {
        it('test describe builder factory', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.describeBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.describeBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.GET);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.describeBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(
                /^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account\/describe$/,
            );
        });

        assertSetValuesThrows(CompositeApi.describeBuilder);
    });

    describe('HttpGET CompositeSubrequest Tests', () => {
        it('test httpGGET builder factory', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.httpGETBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.httpGETBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.GET);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.httpGETBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(CompositeApi.httpGETBuilder);
    });

    describe('Patch CompositeSubrequest Tests', () => {
        it('test patch builder factory', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.patchBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PATCH', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.patchBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.PATCH);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.patchBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(CompositeApi.patchBuilder);
    });

    describe('Put CompositeSubrequest Tests', () => {
        it('test put builder factory', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.putBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PUT', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.putBuilder().sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.PUT);
        });

        it('url is as expected', () => {
            const builder: ICompositeSubrequestBuilder = CompositeApi.putBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: ICompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(CompositeApi.putBuilder);
    });
});
