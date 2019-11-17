/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import { beforeEach } from 'mocha';

import { ConnectionConfig, Constants, Context, Logger, Method, SObject, UnitOfWork, UnitOfWorkResponse, UnitOfWorkResult } from '../../../lib';
import * as tu from '../../TestUtils';

const instanceUrl: string = process.env.SFDC_URL || '<put your server url here>';
const apiVersion: string = process.env.SFDC_API_VERSION || '45.0';
const sessionId: string = process.env.SFDC_SID || '<Put your session id here>';
const connectionConfig: ConnectionConfig = new ConnectionConfig(instanceUrl, apiVersion, sessionId);
let uow: UnitOfWork;

describe('UnitOfWork Integration Tests', () => {

    let logger: Logger;

    beforeEach(async () => {
        // This needs to be reinitialized each time becauase Context#create deletes it
        const payload = {
            Context__c: {
                apiVersion: Constants.CURRENT_API_VERSION,
                userContext: {
                    orgDomainUrl: instanceUrl,
                    orgId: '00D1U0000000000',
                    salesforceBaseUrl: instanceUrl,
                    sessionId,
                    userId: '0051U0000000000',
                    username: 'test@salesforce.com'
                },
            }
        };
        logger = Logger.create(false /*verbose*/);
        const context: Context = await Context.create(payload, logger);
        uow = context.unitOfWork;
    });

    it('Insert Account', async () => {
        const account: SObject = new SObject('Account');
        account.setValue('Name', `MyAccount - uow - integration - ${new Date()}`);

        uow.registerNew(account);

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.match(/^001[A-Za-z0-9]{15}/);
    });

    it('Update Existing Account', async () => {
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(connectionConfig);
        const newAccountName:string = `Updated ${insertResponse.name}`
        const account: SObject = new SObject('Account').withId(insertResponse.id).named(newAccountName);

        uow.registerModified(account);

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = `MyAccount - uow - integration - ${new Date()}`
        const newName = `Updated ${originalName}`;
        const account: SObject = new SObject('Account');
        account.setValue('Name', originalName);

        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: UnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: UnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(connectionConfig);
        const account: SObject = new SObject('Account').withId(insertResponse.id);

        uow.registerDeleted(account);

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: UnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert Account and Contact', async () => {
        const uow: UnitOfWork = new UnitOfWork(connectionConfig, logger);
        const account: SObject = new SObject('Account');
        account.setValue('Name', `MyAccount - uow - integration - ${new Date()}`);
        uow.registerNew(account);

        const contact: SObject = new SObject('Contact');
        contact.setValue('LastName', `LastName - ${new Date()}`);
        contact.setValue('AccountId', account.fkId);
        uow.registerNew(contact);

        const uowResponse: UnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;

        const accountResults: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(account);
        expect(accountResults).to.exist;
        expect(accountResults).lengthOf(1);
        const uowResultAccount: UnitOfWorkResult = accountResults[0];
        expect(uowResultAccount.isSuccess).to.be.true;
        expect(uowResultAccount.method).to.equal(Method.POST);
        expect(uowResultAccount.id).to.exist;
        expect(uowResultAccount.id).to.match(/^001[A-Za-z0-9]{15}/);

        const contactResults: ReadonlyArray<UnitOfWorkResult> = uowResponse.getResults(contact);
        expect(contactResults).to.exist;
        expect(contactResults).lengthOf(1);
        const uowResultContact: UnitOfWorkResult = contactResults[0];
        expect(uowResultContact.isSuccess).to.be.true;
        expect(uowResultContact.method).to.equal(Method.POST);
        expect(uowResultContact.id).to.exist;
        expect(uowResultContact.id).to.match(/^003[A-Za-z0-9]{15}/);
    });
});