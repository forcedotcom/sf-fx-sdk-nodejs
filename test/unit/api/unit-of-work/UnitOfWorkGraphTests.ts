/* tslint:disable: no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import nock = require('nock');
import { restore } from 'sinon';
import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig,
    Constants,
    UnitOfWork,
    UnitOfWorkGraph,
}
    from '../../../../src';

const NO_OP_LOGGER = new Logger({name: 'test', level: 100});
const instanceUrl = 'http://localhost:3000';
const apiVersion = Constants.CURRENT_API_VERSION;
const accessToken = 'accessToken1234';
const connectionConfig: ConnectionConfig = new ConnectionConfig(accessToken, apiVersion, instanceUrl);
const connectionConfig228: ConnectionConfig = new ConnectionConfig(accessToken, APIVersion.V50, instanceUrl);

describe('UnitOfWorkGraph Tests', () => {
    afterEach(() => {
        nock.cleanAll();
        restore();
    });

    it('New Unit Of Work Graph', async () => {
        const uowg: UnitOfWorkGraph = new UnitOfWorkGraph(connectionConfig228, NO_OP_LOGGER);
        expect(uowg.getCount()).to.equal(0);
        const uow1 = uowg.newUnitOfWork();
        const uow2 = uowg.newUnitOfWork();
        expect(uowg.getCount()).to.equal(0);

        uowg.addGraph(uow1)
            .addGraph(uow2);

        expect(uowg.getCount()).to.equal(2);
    });

    it('New Unit Of Work Graph With UOW', async () => {
        const uow = new UnitOfWork(connectionConfig228, NO_OP_LOGGER);
        const uowg: UnitOfWorkGraph = new UnitOfWorkGraph(connectionConfig228, NO_OP_LOGGER, uow);

        expect(uowg.getCount()).to.equal(1);
    });

    it('New Unit Of Work Graph Requires apiVersion v50.0', async () => {
        expect(() => { new UnitOfWorkGraph(connectionConfig, NO_OP_LOGGER); }).to.throw('UnitOfWorkGraph requires apiVersion v50.0 or above');
    });
});
