/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { APIVersion, ConnectionConfig } from '../../../src';

describe('Connection Config Tests', () => {

    it('validate connection config', () => {
    const instanceUrl = 'http://localhost:3000';
    const apiVersion = APIVersion.V50.toString();
    const accessToken = 'accessToken1234';
    const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

    expect(connectionConfig).to.exist;
    expect(connectionConfig.instanceUrl).to.equal(instanceUrl);
    expect(connectionConfig.apiVersion).to.equal(apiVersion);
    expect(connectionConfig.accessToken).to.equal(accessToken);
  });
});
