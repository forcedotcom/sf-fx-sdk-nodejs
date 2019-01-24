import { v4 as uuid } from 'uuid';

import * as sfxif from './Interfaces';

export class SObject implements sfxif.ISObject {
    private _sObjectType: string;
    private _uuid: string;
    private _id: string;
    private _values: { [key: string]: any };
    private _referenceId: string;

    constructor(sObjectType: string) {
        this._sObjectType = sObjectType;
        this._uuid = uuid();
        this._values = {};
        this._referenceId = SObject.generateReferenceId(sObjectType);
    }

    public getSObjectType(): string {
        return this._sObjectType;
    }
    
    public getUuid(): string {
        return this._uuid;
    }

    public id(id: string): sfxif.ISObject {
        this._id = id;
        return this;
    }

    public getId(): string {
        return this._id;
    }

    public getValues(): { [key: string]: any; } {
        // TODO: ReadOnly
        return this._values;
    }

    public setValue(key: string, value: any) {
        this._values[key] = value;
    }

    public named(name: string): sfxif.ISObject {
        this.setValue('Name', name);
        return this;
    }

    public getReferenceId(): string {
        return this._referenceId;
    }

    public getFkId(): string {
        if (this.getId()) {
            return this.getId();
        } else {
            return '@{' + this.getReferenceId() + '.id}';
        }
    }

    public static generateReferenceId(type: string): string {
        return type + "_" + uuid().replace(/-/g, '');
    }
}