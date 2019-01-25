import { expect } from 'chai';
import 'mocha';

import { IConfig, ISObject, IUnitOfWork, IUnitOfWorkResponse, IUnitOfWorkResult, Method } from '../../../lib/Interfaces';
import { Config, SObject, UnitOfWork } from '../../../lib';

import * as tu from '../../TestUtils';

const instanceUrl: string = process.env.SFDC_URL || '<put your server url here>';
const apiVersion: string = process.env.SFDC_API_VERSION || '45.0';
const sessionId: string = process.env.SFDC_SID || '<Put your session id here>';
const config: IConfig = new Config(instanceUrl, apiVersion, sessionId);

describe('UnitOfWork Integration Tests', () => {
    it('Insert Account', async () => {
        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        const account: ISObject = new SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        uow.registerNew(account);

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.match(/^001[A-Za-z0-9]{15}/);
    });

    it('Update Existing Account', async () => {
        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(config);
        const newAccountName:string = 'Updated ' + insertResponse.name;
        const account: ISObject = new SObject('Account').withId(insertResponse.id).named(newAccountName);

        uow.registerModified(account);

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = 'MyAccount - uow - integration - ' + new Date();
        const newName = 'Updated ' + originalName;
        const account: ISObject = new SObject('Account');
        account.setValue('Name', originalName);

        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: IUnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: IUnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        const uow: IUnitOfWork = UnitOfWork.newUnitOfWork(config);
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(config);
        const account: ISObject = new SObject('Account').withId(insertResponse.id);

        uow.registerDeleted(account);

        const uowResponse: IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });
});