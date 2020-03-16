/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import {
  ConnectionConfig,
  Constants,
  Context,
  DataApi,
  InvocationEvent,
  Logger,
  Org,  
  UnitOfWork,
  User,
  Secrets} from '../../../src';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const instanceUrl = 'http://localhost:3000';
const apiVersion = Constants.CURRENT_API_VERSION;
const accessToken = 'accessToken1234';
const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

describe('Function Tests', () => {
    let event: InvocationEvent;
    let user: User;
    let org: Org;
    let secrets: Secrets;
    let context: Context;

    beforeEach(function () {
        const headers = new Map<string, ReadonlyArray<string>>();
        headers.set('header1', ['value1', 'value2'])
        event = new InvocationEvent('data', 'dataContentType', 'dataSchema', 'id', 'source', Date.now(), 'type', headers);
        user = new User('id', 'username', 'onBehalfOfUserId');
        org = new Org(apiVersion, 'baseUrl', 'domainUrl', 'id', user, new DataApi(undefined, NO_OP_LOGGER), new UnitOfWork(connectionConfig, NO_OP_LOGGER));
        secrets = new Secrets(NO_OP_LOGGER);        
        context = new Context('id', NO_OP_LOGGER, org, secrets);
    });

    it('validate event object', () => {
        expect(event.id).to.equal('id');
        expect(event.type).to.equal('type');
        expect(event.source).to.equal('source');
        expect(event.dataContentType).to.equal('dataContentType');
        expect(event.dataSchema).to.equal('dataSchema');
        expect(event.data).to.equal('data');
        expect(event.data).to.equal('data');
        expect(event.headers.size).to.have.equal(1);
        expect(event.headers.get('header1')).to.have.lengthOf(2);
    });

    it('validate user object', () => {
        expect(user.id).to.equal('id');
        expect(user.username).to.equal('username');
        expect(user.onBehalfOfUserId).to.equal('onBehalfOfUserId');
    });

    it('validate org object', () => {
        expect(org.id).to.equal('id');
        expect(org.domainUrl).to.equal('domainUrl');
        expect(org.baseUrl).to.equal('baseUrl');
        expect(org.apiVersion).to.equal(apiVersion);
        expect(org.data).to.not.be.undefined;
        expect(org.unitOfWork).to.not.be.undefined;
        expect(org.request).to.not.be.undefined;
    });

    it('validate context object', () => {
        expect(context.id).to.equal('id');
        expect(context.logger).to.not.be.undefined;
        expect(context.org).to.not.be.undefined;
  });
});
