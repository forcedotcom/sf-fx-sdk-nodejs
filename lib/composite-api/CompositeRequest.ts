import * as _ from 'lodash';

import * as sfxif from '../Interfaces';

class CompositeRequest implements sfxif.ICompositeRequest {
    private allOrNone: boolean;
    // Named to match the composite api schema. This is actually an array of ICompositeSubrequest
    private compositeRequest: Array<sfxif.ICompositeSubrequest>;

    constructor() {
        this.allOrNone = true;
        this.compositeRequest = [];
    }

    public setAllOrNone(allOrNone: boolean): void {
        this.allOrNone = allOrNone;
    }    
    
    public get isAllOrNone(): boolean {
        return this.allOrNone;
    }

    public addSubrequest(compositeSubrequest: sfxif.ICompositeSubrequest): void {
        this.compositeRequest.push(compositeSubrequest);
    }

    public get subrequests(): ReadonlyArray<sfxif.ICompositeSubrequest> {
        let ro: ReadonlyArray<sfxif.ICompositeSubrequest> = this.compositeRequest;
        return ro;
    }

    public getSubrequest(referenceId: string): sfxif.ICompositeSubrequest {
        for (let compositeSubrequest of this.compositeRequest) {
            if (compositeSubrequest.referenceId === referenceId) {
                return compositeSubrequest;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }
}

export function newCompositeRequest():sfxif.ICompositeRequest {
    return new CompositeRequest();
}