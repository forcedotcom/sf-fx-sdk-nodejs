/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';

import { Config } from '../../lib';
import { IConfig } from '../../lib/Interfaces';

describe('Config Tests', () => {
  it('Config Properties', () => {
    const instanceUrl: string = 'http://localhost:3000';
    const apiVersion: string = '45.0';
    const sessionId: string = 'sessionId1234';
    const config:IConfig = new Config(instanceUrl, apiVersion, sessionId);

    expect(config).to.exist;
    expect(config.instanceUrl).to.equal(instanceUrl);
    expect(config.apiVersion).to.equal(apiVersion);
    expect(config.sessionId).to.equal(sessionId);
  });
});