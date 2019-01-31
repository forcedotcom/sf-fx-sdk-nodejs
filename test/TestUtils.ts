import { expect } from 'chai';
import 'mocha';

import { CompositeApi } from '../lib';
import { ICompositeApi, ICompositeRequest, ICompositeResponse, ICompositeSubrequest, ICompositeSubresponse, IConfig } from '../lib/Interfaces';

const httpCodeCreated:number = 201;

export interface IInsertResponse {
    readonly id: string;
    readonly name: string;
}

export async function insertAccount(config: IConfig): Promise<IInsertResponse> {
    const accountName: string = `Account ${new Date()}`;
    const compositeApi: ICompositeApi = CompositeApi.newCompositeApi(config);
    const compositeRequest: ICompositeRequest = CompositeApi.newCompositeRequest();
    const compositeSubRequest: ICompositeSubrequest = 
    CompositeApi.insertBuilder().sObjectType('Account').named(accountName).build();
    compositeRequest.addSubrequest(compositeSubRequest);

    const compositeResponse: ICompositeResponse = await compositeApi.invoke(compositeRequest);
    expect(compositeResponse).to.exist;
    expect(compositeResponse.compositeSubresponses).to.exist;
    expect(compositeResponse.compositeSubresponses).lengthOf(1);

    const compositeSubresponse: ICompositeSubresponse = compositeResponse.compositeSubresponses[0];
    expect(compositeSubresponse.isSuccess).to.be.true;
    expect(compositeSubresponse.httpStatusCode).to.equal(httpCodeCreated);

    const accountId: string = compositeSubresponse.id;

    return { id: accountId, name: accountName } as IInsertResponse;
}