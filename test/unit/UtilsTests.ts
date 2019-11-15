import {  expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { Logger, NO_OP_LOGGER } from './../..'

//   T E S T S

describe('Utils Tests', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('logger methods were called', async () => {
        const emitLogMessage = sandbox.stub(Logger.prototype, 'emitLogMessage');
        const logger = Logger.create(true);
        logger.shout('hi');
        logger.log('hi');
        logger.debug('hi');
        logger.info('hi');
        logger.warn('hi');
        logger.error('hi');

        expect(emitLogMessage.callCount).to.be.eql(6);
    });

    it('logger methods were called', async () => {
        const emitLogMessage = sandbox.stub(Logger.prototype, 'emitLogMessage');
        const logger = NO_OP_LOGGER;
        logger.shout('hi');
        logger.log('hi');
        logger.debug('hi');
        logger.info('hi');
        logger.warn('hi');
        logger.error('hi');

        expect(emitLogMessage.callCount).to.be.eql(0);
    });
});