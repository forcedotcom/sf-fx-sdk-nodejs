/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { ConnectionConfig, Context, ForceApi, Logger, UnitOfWork, UserContext } from '../../../src';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const instanceUrl = 'http://localhost:3000';
const apiVersion = '45.0';
const accessToken = 'accessToken1234';
const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

describe('Function Tests', () => {
    let userContext: UserContext;
    let context: Context;

    beforeEach(function () {
        userContext = new UserContext('orgDomainUrl', 'orgId', 'salesforceBaseUrl', 'username', 'userId', 'onBehalfOfUserId');
        context = new Context(apiVersion, userContext, NO_OP_LOGGER, new ForceApi(undefined, NO_OP_LOGGER), new UnitOfWork(connectionConfig, NO_OP_LOGGER));
    });

    it('validate UserContext', () => {
        expect(userContext.orgDomainUrl).to.equal('orgDomainUrl');
        expect(userContext.orgId).to.equal('orgId');
        expect(userContext.salesforceBaseUrl).to.equal('salesforceBaseUrl');
        expect(userContext.username).to.equal('username');
        expect(userContext.userId).to.equal('userId');
        expect(userContext.onBehalfOfUserId).to.equal('onBehalfOfUserId');
    });

    it('validate Context', () => {
        expect(context.apiVersion).to.equal(apiVersion);
        expect(context.userContext).to.not.be.undefined
        expect(context.logger).to.not.be.undefined
        expect(context.forceApi).to.not.be.undefined
        expect(context.unitOfWork).to.not.be.undefined
  });
});
