export interface Methods {
    info(msg1: object, msg2: string);
    info(msg1: object | string);
    error(msg1: object, msg2: string);
    error(msg1: object | string);
    debug(msg1: object, msg2: string);
    debug(msg1: object | string);
}

export type Level = 'debug' | 'info' | 'warn' | 'error'
