// TODO: look at using Logger from '@salesforce/core' instead of Winston
import * as Winston from 'winston';
import * as LoggerTypes from './types/logger';

export class MyLogger implements LoggerTypes.Methods {

    private static formatMessage(msg1: object | string, msg2?: string) {
        let logEntry: object;
        if (msg2) {
            logEntry = { ...msg1 as object, ...{ message: msg2 } };
        } else if (typeof msg1 === 'object') {
            logEntry = msg1;
        } else {
            logEntry = { message: msg1 };
        }
        return logEntry;
    }
    private readonly requestId: string;
    private log: Winston.Logger;

    constructor(level: LoggerTypes.Level = 'info', requestId?: string) {
        this.requestId = requestId;
        this.log = this.createLogger(level, requestId);
    }

    public info(msg1: object | string, msg2?: string) {
        this.log.info(MyLogger.formatMessage(msg1, msg2))
    }

    public error(msg1: object | string, msg2?: string) {
        this.log.error(MyLogger.formatMessage(msg1, msg2))
    }

    public debug(msg1: object | string, msg2?: string) {
        this.log.debug(MyLogger.formatMessage(msg1, msg2))
    }

    public setLevel(level: LoggerTypes.Level) {
        this.log = this.createLogger(level, this.requestId)
    }

    private createLogger(level: LoggerTypes.Level, requestId?: string): Winston.Logger {
        let winstonLogger = Winston.createLogger({
            level,
            transports: [
                new Winston.transports.Console(),
            ],
        });
        if (requestId) {
            winstonLogger = winstonLogger.child({
                request_id: requestId,
            });
        }

        return winstonLogger;
    }
}
