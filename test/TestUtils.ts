import { expect } from 'chai';
import 'mocha';

import * as sfxif from '../lib/Interfaces';
const ca = require('../lib/composite-api');

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(config: sfxif.IConfig): Promise<IInsertResponse> {
    const accountName: string = 'Account ' + new Date();
    const compositeApi: sfxif.ICompositeApi = ca.newCompositeApi(config);
    const compositeRequest: sfxif.ICompositeRequest = ca.newCompositeRequest();
    const compositeSubRequest: sfxif.ICompositeSubrequest = ca.insertBuilder().sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: sfxif.ICompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: sfxif.ICompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(ca.HttpCodes.Created);

    const accountId: string = compositeSubresponse.id;

    return <IInsertResponse>{ id: accountId, name: accountName };
}