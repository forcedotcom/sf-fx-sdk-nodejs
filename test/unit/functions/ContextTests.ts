/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { Constants, Context, Logger } from '../../../lib';
import { generateData } from './functionUtils';

describe('Context Tests', () => {

    const validateContext = (data: any, context: Context) => {
        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal(Constants.CURRENT_API_VERSION);

        expect(context.userContext).to.exist;
        expect(context.userContext.orgId).to.equal(data.context.userContext.orgId);
        expect(context.userContext.username).to.equal(data.context.userContext.username);
        expect(context.userContext.userId).to.equal(data.context.userContext.userId);
        expect(context.userContext.salesforceBaseUrl).to.equal(data.context.userContext.salesforceBaseUrl);
        expect(context.userContext.orgDomainUrl).to.equal(data.context.userContext.orgDomainUrl);

        expect(context.logger).to.exist;
    }

    it('validate context WITH accessToken', async () => {
        const data = generateData(true);
        expect(data.context).to.exist;
        expect(data.sfContext.accessToken).to.exist;
        expect(data.sfContext.functionInvocationId).to.exist;

        const logger = Logger.create(false /*verbose*/);
        const context: Context = Context.create(data.context, logger, data.sfContext.accessToken,
            data.sfContext.functionInvocationId);

        validateContext(data, context);

        // Requires accessToken
        expect(context.forceApi).to.exist;
        expect(context.unitOfWork).to.exist;
        expect(context.fxInvocation).to.exist;
    });

    it('validate context WITHOUT accessToken', async () => {
        const data = generateData(true);
        expect(data.context).to.exist;

        const logger = Logger.create(false /*verbose*/);
        const context: Context = Context.create(data.context, logger);

        validateContext(data, context);

        // Requires accessToken
        expect(context.forceApi).to.not.exist;
        expect(context.unitOfWork).to.not.exist;
        expect(context.fxInvocation).to.not.exist;
    });

    it('validate API version override', async () => {
        const data = generateData(true);
        expect(data.context).to.exist;
        expect(data.context.apiVersion).to.exist;
        data.context.apiVersion = '0.0'

        const logger = Logger.create(false /*verbose*/);
        const context: Context = await Context.create(data.context, logger);

        expect(context.apiVersion).to.exist;
        expect(context.apiVersion).to.equal('0.0');
    });

    it('should FAIL to create Context', async () => {
        // Expecting missing data.context
        try {
            const logger = Logger.create(false /*verbose*/);
            Context.create({}, logger)
            expect.fail();
        } catch (err) {
            expect(err.message).to.contain('Context not provided');
        }

        return Promise.resolve(null);
    });
});