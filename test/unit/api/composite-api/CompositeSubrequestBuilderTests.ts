/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import {
    CompositeApi,
    CompositeSubrequest,
    CompositeSubrequestBuilder,
    DeleteCompositeSubrequestBuilder,
    DescribeCompositeSubrequestBuilder,
    HttpGETCompositeSubrequestBuilder,
    InsertCompositeSubrequestBuilder,
    PatchCompositeSubrequestBuilder,
    PutCompositeSubrequestBuilder,
    Method,
    SObject }
from '../../../../lib';

describe('CompositeSubrequest Builder Tests', () => {
    /**
     * Return all known builders for generic test cases
     */
    const getBuilderFactories = (): any[] => {
        return [
            DeleteCompositeSubrequestBuilder,
            DescribeCompositeSubrequestBuilder,
            HttpGETCompositeSubrequestBuilder,
            InsertCompositeSubrequestBuilder,
            PatchCompositeSubrequestBuilder,
            PutCompositeSubrequestBuilder,
        ];
    };

    const assertSetValuesSucceeds = (builderFactory: any) => {
        it(builderFactory.name + ' set values with single value', () => {
            const key: string = 'key1';
            const value: string = 'a_string';

            const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
            expect(builder.addValue(key, value)).to.equal(builder);

            const compositeSubrequest: CompositeSubrequest = builder.build();
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

            const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
            expect(builder.addValues(expectedHeaders)).to.equal(builder);

            const compositeSubrequest: CompositeSubrequest = builder.build();
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
            const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
            expect(builder.named(name)).to.equal(builder);

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            const values: { [key: string]: string } = compositeSubrequest.body;
            expect(values).to.exist;

            const keys: string[] = Object.keys(values);
            expect(keys.length).to.equal(1);
            expect(keys[0]).to.equal('Name');
            expect(values.Name).to.to.equal(name);
        });
    };

    const assertSetValuesThrows = (builderFactory: any) => {
        it(builderFactory.name + ' value throws', () => {
            const builder: CompositeSubrequestBuilder =  new builderFactory();
            expect(builder.addValue.bind(builder, 'key', 'value')).to.throw(`This request doesn't have a body`);
        });

        it(builderFactory.name + ' values throws', () => {
            const builder: CompositeSubrequestBuilder =  new builderFactory();
            expect(builder.addValues.bind(builder, { key: 'value' })).to.throw(`This request doesn't have a body`);
        });

        // Name is syntactic sugar over the value method
        it(builderFactory.name + ' set name throws', () => {
            const builder: CompositeSubrequestBuilder =  new builderFactory();
            expect(builder.named.bind(builder, 'A name')).to.throw(`This request doesn't have a body`);
        });
    };

    describe('Generic CompositeSubrequest Tests', () => {
        const builderFactories: any[] = getBuilderFactories();

        // TODO: Update with ID test
        builderFactories.forEach(builderFactory => {
            it(builderFactory.name + ' throws if sObjectType is missing', () => {
                const builder: CompositeSubrequestBuilder =  new (builderFactory)();
                expect(builder.build.bind(builder)).to.throw('Type is required');
            });

            it(builderFactory.name + ' sObjectType set via string succeeds', () => {
                const builder: CompositeSubrequestBuilder =  new builderFactory();
                expect(builder.sObjectType('Opportunity')).to.equal(builder);

                const compositeSubrequest: CompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Opportunity/);
            });

            it(builderFactory.name + ' sObjectType set via sobject succeeds', () => {
                const sObject: SObject = new SObject('Case');
                const builder: CompositeSubrequestBuilder =  new builderFactory();
                expect(builder.sObject(sObject)).to.equal(builder);

                const compositeSubrequest: CompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.sObjectType).to.match(/Case/);
            });

            it(builderFactory.name + ' set api version', () => {
                const version: string = '4933';
                const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
                expect(builder.apiVersion(version)).to.equal(builder);

                const compositeSubrequest: CompositeSubrequest = builder.build();
                expect(compositeSubrequest).to.exist;

                expect(compositeSubrequest.apiVersion).to.match(/4933/);
            });

            it(builderFactory.name + ' set header with single header', () => {
                const key: string = 'key1';
                const value: string = 'a_string';

                const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
                expect(builder.header(key, value)).to.equal(builder);

                const compositeSubrequest: CompositeSubrequest = builder.build();
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

                const builder: CompositeSubrequestBuilder =  new builderFactory().sObjectType('Account');
                expect(builder.headers(expectedHeaders)).to.equal(builder);

                const compositeSubrequest: CompositeSubrequest = builder.build();
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
            const builder: CompositeSubrequestBuilder =  new InsertCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is POST', () => {
            const builder: CompositeSubrequestBuilder =  new InsertCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.POST);
        });

        it('set id with value throws an exception', () => {
            const builder: CompositeSubrequestBuilder =  new InsertCompositeSubrequestBuilder();
            expect(builder.id.bind(builder, 'an_id')).to.throw();
        });

        it('set id with null ignores caller', () => {
            const builder: CompositeSubrequestBuilder =  new InsertCompositeSubrequestBuilder();
            builder.id(null);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new InsertCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(/^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account$/);
        });

        assertSetValuesSucceeds(InsertCompositeSubrequestBuilder);
    });

    describe('Delete CompositeSubrequest Tests', () => {
        it('test delete builder factory', () => {
            const builder: CompositeSubrequestBuilder =  new DeleteCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is DELETE', () => {
            const builder: CompositeSubrequestBuilder =  new DeleteCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.DELETE);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new DeleteCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(DeleteCompositeSubrequestBuilder);
    });

    describe('Describe CompositeSubrequest Tests', () => {
        it('test describe builder factory', () => {
            const builder: CompositeSubrequestBuilder =  new DescribeCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: CompositeSubrequestBuilder =  new DescribeCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.GET);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new DescribeCompositeSubrequestBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            expect(compositeSubrequest.url).to.match(
                /^\/services\/data\/v[0-9][0-9]\.[0-9]\/sobjects\/Account\/describe$/,
            );
        });

        assertSetValuesThrows(DescribeCompositeSubrequestBuilder);
    });

    describe('HttpGET CompositeSubrequest Tests', () => {
        it('test httpGGET builder factory', () => {
            const builder: CompositeSubrequestBuilder =  new HttpGETCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is GET', () => {
            const builder: CompositeSubrequestBuilder =  new HttpGETCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.GET);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new HttpGETCompositeSubrequestBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesThrows(HttpGETCompositeSubrequestBuilder);
    });

    describe('Patch CompositeSubrequest Tests', () => {
        it('test patch builder factory', () => {
            const builder: CompositeSubrequestBuilder =  new PatchCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PATCH', () => {
            const builder: CompositeSubrequestBuilder =  new PatchCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.PATCH);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new PatchCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(PatchCompositeSubrequestBuilder);
    });

    describe('Put CompositeSubrequest Tests', () => {
        it('test put builder factory', () => {
            const builder: CompositeSubrequestBuilder =  new PutCompositeSubrequestBuilder();
            expect(builder).to.not.be.null;
        });

        it('method is PUT', () => {
            const builder: CompositeSubrequestBuilder =  new PutCompositeSubrequestBuilder().sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;
            expect(compositeSubrequest.method).to.equal(Method.PUT);
        });

        it('url is as expected', () => {
            const builder: CompositeSubrequestBuilder =  new PutCompositeSubrequestBuilder();
            builder.sObjectType('Account');

            const compositeSubrequest: CompositeSubrequest = builder.build();
            expect(compositeSubrequest).to.exist;

            const regExp: RegExp = new RegExp('\\/\\@{' + compositeSubrequest.referenceId + '.id}');
            expect(compositeSubrequest.url).to.match(regExp);
        });

        assertSetValuesSucceeds(PutCompositeSubrequestBuilder);
    });
});
