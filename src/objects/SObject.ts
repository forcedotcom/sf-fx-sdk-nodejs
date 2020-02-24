/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from 'uuid';

export interface Values {
    [key: string]: any;
}

/**
 * Represents a SObject instance.
 */
export class SObject {
    public static generateReferenceId(type: string): string {
        return `${type}_` + uuid().replace(/-/g, '');
    }

    public readonly referenceId: string;
    public readonly sObjectType: string;
    public readonly uuid: string;
    private _id: string | undefined;
    private _values: { [key: string]: any };

    constructor(sObjectType: string) {
        if (!sObjectType) {
            throw new Error('SObject type is required.')
        }
        this.referenceId = SObject.generateReferenceId(sObjectType);
        this.sObjectType = sObjectType;
        this.uuid = uuid();
        this._values = {};
    }

    public named(name: string): SObject {
        this.setValue('Name', name);
        return this;
    }

    public setValue(key: string, value: any): void {
        this._values[key] = value;
    }

    public withId(id: string): SObject {
        this._id = id;
        return this;
    }

    public get id(): string | undefined {
        return this._id;
    }

    public get values(): Values {
        return this._values as Readonly<Values>;
    }

    public get fkId(): string {
        if (this._id) {
            return this._id;
        } else {
            return `@{${this.referenceId}.id}`;
        }
    }

    public asMap(): object {
        return Object.assign({}, { Id: this._id }, this.values);
    }
}
