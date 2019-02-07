/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { ConnectionConfig } from '../../lib';
import { IConnectionConfig } from '../../lib/Interfaces';

describe('Config Tests', () => {
  it('Config Properties', () => {
    const instanceUrl: string = 'http://localhost:3000';
    const apiVersion: string = '45.0';
    const sessionId: string = 'sessionId1234';
    const connectionConfig:IConnectionConfig = new ConnectionConfig(instanceUrl, apiVersion, sessionId);

    expect(connectionConfig).to.exist;
    expect(connectionConfig.instanceUrl).to.equal(instanceUrl);
    expect(connectionConfig.apiVersion).to.equal(apiVersion);
    expect(connectionConfig.sessionId).to.equal(sessionId);
  });
});