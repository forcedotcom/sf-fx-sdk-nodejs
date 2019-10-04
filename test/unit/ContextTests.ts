/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { Constants } from '../../lib/Constants';
import * as sdk from '../../lib/sf-sdk';

describe('Context Tests', () => {

    const validateContext = (context: sdk.Context) => {
        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal(Constants.CURRENT_API_VERSION);

        expect(context.userContext).to.exist;
        expect(context.userContext.orgId).to.equal('00D1U0000000000');
        expect(context.userContext.username).to.equal('test@salesforce.com');
        expect(context.userContext.userId).to.equal('0051U0000000000');
        expect(context.userContext.salesforceBaseUrl).to.equal('https://na1.salesforce.com');
        expect(context.userContext.orgDomainUrl).to.equal('https://my-domain.salesforce.com');

        expect(context.forceApi).to.exist;
        expect(context.logger).to.exist;
        expect(context.unitOfWork).to.exist;
    }

    it('Create w/ Access Token', async () => {
        const accessToken = 'ACCESSTOKEN';
        const payload = {
            Account_ID__c: '0011U0000000000',
            Context__c: {
                userContext: {
                    accessToken,
                    orgDomainUrl: 'https://my-domain.salesforce.com',
                    orgId: '00D1U0000000000',
                    salesforceBaseUrl: 'https://na1.salesforce.com',
                    userId: '0051U0000000000',
                    username: 'test@salesforce.com'
                },
            }
        };

        const logger = sdk.Logger.create(false /*verbose*/);
        const context: sdk.Context = await sdk.Context.create(payload, logger);

        validateContext(context);
        expect(context.userContext.accessToken).to.equal(accessToken);
    });

    it('Create w/ JWT', async () => {
        const c2cJWT = 'JWT';
        const payload = {
            Account_ID__c: '0011U0000000000',
            Context__c: {
                userContext: {
                    c2cJWT,
                    orgDomainUrl: 'https://my-domain.salesforce.com',
                    orgId: '00D1U0000000000',
                    salesforceBaseUrl: 'https://na1.salesforce.com',
                    userId: '0051U0000000000',
                    username: 'test@salesforce.com'
                },
            }
        };

        const logger = sdk.Logger.create(false /*verbose*/);
        const context: sdk.Context = await sdk.Context.create(payload, logger);

        validateContext(context);
        expect(context.userContext.c2cJWT).to.equal(c2cJWT);
    });

    it('Override Api Version', async () => {
        const payload = {
            Account_ID__c: '0011U0000000000',
            Context__c: {
                apiVersion: '0.0',
                userContext: {
                    orgDomainUrl: 'https://my-domain.salesforce.com',
                    orgId: '00D1U0000000000',
                    salesforceBaseUrl: 'https://na1.salesforce.com',
                    sessionId: 'ASessionId',
                    userId: '0051U0000000000',
                    username: 'test@salesforce.com'
                },
            }
        };

        const logger = sdk.Logger.create(false /*verbose*/);
        const context: sdk.Context = await sdk.Context.create(payload, logger);

        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal('0.0');
    });
});