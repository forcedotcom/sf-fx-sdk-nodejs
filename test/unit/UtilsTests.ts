import {  expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { Logger, NO_OP_LOGGER } from './../..'

//   T E S T S

describe('Utils Tests', () => {

    let sandbox;
    let debug;
    let info;
    let warn;
    let error;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        debug = sandbox.stub(console, 'debug');
        info = sandbox.stub(console, 'info');
        warn = sandbox.stub(console, 'warn');
        error = sandbox.stub(console, 'error');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('logger methods were called', async () => {
        const logger = Logger.create(true);
        logger.shout('hi');
        logger.log('hi');
        logger.debug('hi');
        logger.info('hi');
        logger.warn('hi');
        logger.error('hi');

        expect(debug.callCount).to.be.eql(1);
        expect(info.callCount).to.be.eql(3);
        expect(warn.callCount).to.be.eql(1);
        expect(error.callCount).to.be.eql(1);
    });

    it('logger methods were called', async () => {
        const logger = NO_OP_LOGGER;
        logger.shout('hi');
        logger.log('hi');
        logger.debug('hi');
        logger.info('hi');
        logger.warn('hi');
        logger.error('hi');

        expect(debug.callCount).to.be.eql(0);
        expect(info.callCount).to.be.eql(0);
        expect(warn.callCount).to.be.eql(0);
        expect(error.callCount).to.be.eql(0);
    });
});