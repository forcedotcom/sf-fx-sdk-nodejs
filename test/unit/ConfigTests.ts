import { assert, expect } from 'chai';
import 'mocha';
import nock = require('nock');

import * as sfxif from '../../lib/Interfaces';
const index = require('../../lib');

describe('Config Tests', () => {
  it('Config Properties', () => {
    const instanceUrl: string = 'http://localhost:3000';
    const apiVersion: string = '45.0';
    const sessionId: string = 'sessionId1234';
    const config:sfxif.IConfig = index.config.newConfig(instanceUrl, apiVersion, sessionId);

    expect(config).to.exist;
    expect(config.instanceUrl).to.equal(instanceUrl);
    expect(config.apiVersion).to.equal(apiVersion);
    expect(config.sessionId).to.equal(sessionId);
  });
});