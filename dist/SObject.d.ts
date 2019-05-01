import { ISObject, IValues } from './Interfaces';
export declare class SObject implements ISObject {
    static generateReferenceId(type: string): string;
    readonly referenceId: string;
    readonly sObjectType: string;
    readonly uuid: string;
    private _id;
    private _values;
    constructor(sObjectType: string);
    named(name: string): ISObject;
    setValue(key: string, value: any): void;
    withId(id: string): ISObject;
    readonly id: string;
    readonly values: IValues;
    readonly fkId: string;
    asMap(): object;
}
