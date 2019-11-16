export class Logger {
    public static create(verbose: boolean): Logger {
        return verbose ? new Logger() : NO_OP_LOGGER;
    }

    public shout(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', `-----> ${msg}`, supportingData);
    }

    public log(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', `       ${msg}`, supportingData);
    }

    public debug(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('debug', msg, supportingData);
    }

    public warn(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('warn', msg, supportingData);
    }

    public error(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('error', msg, supportingData);
    }

    public info(msg: string, ...supportingData: any[]): void {
        this.emitLogMessage('info', msg, supportingData);
    }

    private emitLogMessage(msgType: 'debug' | 'info' | 'warn' | 'error', msg: string, supportingDetails: any[]) {
        if (supportingDetails.length > 0) {
            console[msgType](msg, supportingDetails);
        } else {
            console[msgType](msg);
        }
    }
}

class NoOpLogger extends Logger {
    public log(msg: string, ...supportingData: any[]): void {}
    public shout(msg: string, ...supportingData: any[]): void {}
    public debug(msg: string, ...supportingData: any[]): void {}
    public warn(msg: string, ...supportingData: any[]): void {}
    public error(msg: string, ...supportingData: any[]): void {}
    public info(msg: string, ...supportingData: any[]): void {}
}

export const NO_OP_LOGGER = new NoOpLogger();

export class Constants {
    public static CURRENT_API_VERSION: string = '48.0';
}

export interface Error {
    readonly message: string;
    readonly errorCode: string;
    readonly fields: ReadonlyArray<string>;
}