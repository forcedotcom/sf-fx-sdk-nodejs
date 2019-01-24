import * as sfxif from './Interfaces';
export declare class SObject implements sfxif.ISObject {
    private _sObjectType;
    private _uuid;
    private _id;
    private _values;
    private _referenceId;
    constructor(sObjectType: string);
    getSObjectType(): string;
    getUuid(): string;
    id(id: string): sfxif.ISObject;
    getId(): string;
    getValues(): {
        [key: string]: any;
    };
    setValue(key: string, value: any): void;
    named(name: string): sfxif.ISObject;
    getReferenceId(): string;
    getFkId(): string;
    static generateReferenceId(type: string): string;
}
