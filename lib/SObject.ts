import { v4 as uuid } from 'uuid';

import { ISObject, IValues } from './Interfaces';

export class SObject implements ISObject {
    public static generateReferenceId(type: string): string {
        return `${type}_` + uuid().replace(/-/g, '');
    }

    public readonly referenceId: string;
    public readonly sObjectType: string;
    public readonly uuid: string;
    private _id: string;
    private _values: { [key: string]: any };

    constructor(sObjectType: string) {
        this.referenceId = SObject.generateReferenceId(sObjectType);
        this.sObjectType = sObjectType;
        this.uuid = uuid();
        this._values = {};
    }
    
    public named(name: string): ISObject {
        this.setValue('Name', name);
        return this;
    }

    public setValue(key: string, value: any) {
        this._values[key] = value;
    }

    public withId(id: string): ISObject {
        this._id = id;
        return this;
    }

    public get id(): string {
        return this._id;
    }
    
    public get values(): IValues {
        return this._values as Readonly<IValues>;
    }

    public get fkId(): string {
        if (this._id) {
            return this._id;
        } else {
            return `@{${this.referenceId}.id}`;
        }
    }
}