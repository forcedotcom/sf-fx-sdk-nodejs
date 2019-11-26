/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import {
    CompositeApi,
    CompositeRequest,
    CompositeResponse,
    CompositeSubrequest,
    CompositeSubresponse,
    ConnectionConfig,
    Context,
    InsertCompositeSubrequestBuilder,
    NO_OP_LOGGER }
from '../lib';

const httpCodeCreated:number = 201;

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(connectionConfig: ConnectionConfig): Promise<IInsertResponse> {
    const accountName: string = `Account ${new Date()}`;
    const compositeApi: CompositeApi = new CompositeApi(connectionConfig, NO_OP_LOGGER);
    const compositeRequest: CompositeRequest = new CompositeRequest();
    const compositeSubRequest: CompositeSubrequest =
    (new InsertCompositeSubrequestBuilder()).sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: CompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: CompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(httpCodeCreated);

    const accountId: string = compositeSubresponse.id;

    return { id: accountId, name: accountName } as IInsertResponse;
}

