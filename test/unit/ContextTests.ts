/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { Constants } from '../../lib/Constants';
import * as sdk from '../../lib/sf-sdk';

describe('Context Tests', () => {
    it('Create', async () => {
        const payload = {
            Account_ID__c: '0011U0000000000',
            Context__c: {
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

        const logger = sdk.logInit(false /*verbose*/);
        const context: sdk.Context = await sdk.Context.create(payload, logger);

        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal(Constants.CURRENT_API_VERSION);

        expect(context.userContext).to.exist;
        expect(context.userContext.orgId).to.equal('00D1U0000000000');
        expect(context.userContext.username).to.equal('test@salesforce.com');
        expect(context.userContext.userId).to.equal('0051U0000000000');
        expect(context.userContext.salesforceBaseUrl).to.equal('https://na1.salesforce.com');
        expect(context.userContext.orgDomainUrl).to.equal('https://my-domain.salesforce.com');
        expect(context.userContext.sessionId).to.equal('ASessionId');

        expect(context.sfApi).to.exist;
        expect(context.logger).to.exist;
        expect(context.unitOfWork).to.exist;
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

        const logger = sdk.logInit(false /*verbose*/);
        const context: sdk.Context = await sdk.Context.create(payload, logger);

        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal('0.0');
    });
});
