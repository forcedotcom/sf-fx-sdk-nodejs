import { Logger } from '@salesforce/core/lib/logger';
import { assert, expect } from 'chai';
import 'mocha';
import * as Enrich from '../../../dist/functions/enrich';
import { Context, Headers, InvocationEvent } from '../../../src/functions';

describe('EnrichTests', () => {
    describe('#enrichFn', () => {
        type jsonReturnType = {
            event: InvocationEvent;
            context: Context;
            logger: Logger;
        }

        const userFn = (event, context, logger) : jsonReturnType => {
            return {event, context, logger};
        };

        it('should enrich user function', () => {
            const cloudEvent = {
                id: 'some-id',
                type: 'com.salesforce.function.test.enrich',
                data: { data: 11 },
                source: 'urn:event:from:enrichTest',
                specversion: '1.0',
                datacontenttype: 'application/json',
                sfcontext: {
                    apiVersion: '1.0',
                    userContext: {
                        orgId: 'org-id-11234567890',
                        orgDomainUrl:      'https://myorg.salesforce.com',
                        userId:            '13790',
                        username:          'melkor',
                        onBehalfOfUserId:  '24680',
                        salesforceBaseUrl: 'https://salesforce.com'
                    }
                },
                sffncontext: {
                    accessToken: 'DEADBEEF'
                }
            };

            const headers: Headers = new Map([
                ['x-custom-header', ['some custom header value']]
            ]);

            // @ts-ignore
            const enrichedFn = Enrich.enrichFn(userFn);
            const result = enrichedFn(cloudEvent, headers) as unknown as jsonReturnType;

            const { event, context, logger} = result;

            expect(event).to.not.be.null;
            expect(context).to.not.be.null;
            expect(logger).to.not.be.null;

            expect(event.data).eq(cloudEvent.data);
            expect(event.dataContentType).eq('application/json');
            expect(event.source).eq('urn:event:from:enrichTest');
            expect(event.type).eq('com.salesforce.function.test.enrich');
            expect(event.headers).eq(headers);
            expect(event.id).to.eq(cloudEvent.id);

            expect(context.logger).to.eq(logger);
            expect(context.id).to.eq(cloudEvent.id);
            expect(context.org.apiVersion).to.eq('1.0');
            expect(context.org.baseUrl).to.eq('https://salesforce.com');
            expect(context.org.domainUrl).to.eq('https://myorg.salesforce.com');
            expect(context.org.user).to.eql({ id: '13790', username: 'melkor', onBehalfOfUserId: '24680' });

            expect(logger.getName()).to.eq('Salesforce Function Logger');
            expect(logger.getBunyanLogger().fields['request_id']).eq(cloudEvent.id);
        })

        it('should fail if request context is missing user context', () => {
            const cloudEvent = {
                id: 'some-id',
                type: 'com.salesforce.function.test.enrich',
                data: { data: 11 },
                source: 'urn:event:from:enrichTest',
                specversion: '1.0',
                datacontenttype: 'application/json',
                sfcontext: {
                    apiVersion: '1.0'
                }
            };

            // @ts-ignore
            const enrichedFn = Enrich.enrichFn(userFn);
            try {
                enrichedFn(cloudEvent, {});
                assert.fail('UserContext not provided error should have been thrown');
            } catch (error) {
                expect(error.message).to.contain('UserContext not provided: {"apiVersion":"1.0"}');
            }
        })

        it('should fail if API version is NOT provided', () => {
            const cloudEvent = {
                id: 'some-id',
                type: 'com.salesforce.function.test.enrich',
                data: { data: 11 },
                source: 'urn:event:from:enrichTest',
                specversion: '1.0',
                datacontenttype: 'application/json',
                sfcontext: {
                    userContext: {}
                }
            };

            // @ts-ignore
            const enrichedFn = Enrich.enrichFn(userFn);
            try {
                enrichedFn(cloudEvent, {});
                assert.fail('API Version not provided error should have been thrown');
            } catch (error) {
                expect(error.message).to.contain('API Version not provided: {"userContext":{}}');
            }
        })

        it('should fail if missing cloud event and header args', () => {
            // @ts-ignore
            const enrichedFn = Enrich.enrichFn(userFn);
            try {
                enrichedFn(undefined, undefined);
                assert.fail('Request Data not provided error should have been thrown');
            } catch (error) {
                expect(error.message).to.contain('Request Data not provided');
            }
        })
    })
})
