import { expect } from 'chai';
import 'mocha';

import * as sfxif from '../../../lib/Interfaces';
import * as c from '../../../lib/Config';
import * as so from '../../../lib/SObject';
const u = require('../../../lib/unit-of-work');

import * as tu from '../../TestUtils';

const instanceUrl: string = process.env.SFDC_URL || '<put your server url here>';
const apiVersion: string = process.env.SFDC_API_VERSION || '45.0';
const sessionId: string = process.env.SFDC_SID || '<Put your session id here>';
const config: sfxif.IConfig = c.newConfig(instanceUrl, apiVersion, sessionId);

describe('UnitOfWork Integration Tests', () => {
    it('Insert Account', async () => {
        const uow: sfxif.IUnitOfWork = u.newUnitOfWork(config);
        const account: sfxif.ISObject = new so.SObject('Account');
        account.setValue('Name', 'MyAccount - uow - integration - ' + new Date());

        uow.registerNew(account);

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(sfxif.Method.POST);
        expect(uowResult.id).to.exist;
        expect(uowResult.id).to.match(/^001[A-Za-z0-9]{15}/);
    });

    it('Update Existing Account', async () => {
        const uow: sfxif.IUnitOfWork = u.newUnitOfWork(config);
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(config);
        const newAccountName:string = 'Updated ' + insertResponse.name;
        const account: sfxif.ISObject = new so.SObject('Account').id(insertResponse.id).named(newAccountName);

        uow.registerModified(account);

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(sfxif.Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });

    it('Insert and Update Account', async () => {
        const originalName = 'MyAccount - uow - integration - ' + new Date();
        const newName = 'Updated ' + originalName;
        const account: sfxif.ISObject = new so.SObject('Account');
        account.setValue('Name', originalName);

        const uow: sfxif.IUnitOfWork = u.newUnitOfWork(config);
        uow.registerNew(account);

        account.named(newName);
        uow.registerModified(account);

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(2);
        const uowResult0: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult0.isSuccess).to.be.true;
        expect(uowResult0.method).to.equal(sfxif.Method.POST);
        expect(uowResult0.id).to.exist;
        expect(uowResult0.id).to.match(/^001[A-Za-z0-9]{15}/);

        const uowResult1: sfxif.IUnitOfWorkResult = results[1];
        expect(uowResult1.isSuccess).to.be.true;
        expect(uowResult1.errors).to.not.exist;
        expect(uowResult1.method).to.equal(sfxif.Method.PATCH);
        // Id is not sent back on updates
        expect(uowResult1.id).to.not.exist;
    });

    it('Delete Existing Account', async () => {
        const uow: sfxif.IUnitOfWork = u.newUnitOfWork(config);
        const insertResponse:tu.IInsertResponse = await tu.insertAccount(config);
        const account: sfxif.ISObject = new so.SObject('Account').id(insertResponse.id);

        uow.registerDeleted(account);

        const uowResponse: sfxif.IUnitOfWorkResponse = await uow.commit();

        expect(uowResponse).to.exist;
        const results: ReadonlyArray<sfxif.IUnitOfWorkResult> = uowResponse.getResults(account);
        expect(results).to.exist;
        expect(results).lengthOf(1);
        const uowResult: sfxif.IUnitOfWorkResult = results[0];
        expect(uowResult.isSuccess).to.be.true;
        expect(uowResult.method).to.equal(sfxif.Method.DELETE);
        // Id is not sent back on updates
        expect(uowResult.id).to.not.exist;
    });
});