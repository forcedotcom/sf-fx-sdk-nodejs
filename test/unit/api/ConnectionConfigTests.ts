/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { ConnectionConfig } from '../../../lib';

describe('Connection Config Tests', () => {

    it('validate connection config', () => {
    const instanceUrl: string = 'http://localhost:3000';
    const apiVersion: string = '45.0';
    const accessToken: string = 'accessToken1234';
    const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);

    expect(connectionConfig).to.exist;
    expect(connectionConfig.instanceUrl).to.equal(instanceUrl);
    expect(connectionConfig.apiVersion).to.equal(apiVersion);
    expect(connectionConfig.accessToken).to.equal(accessToken);
  });
});