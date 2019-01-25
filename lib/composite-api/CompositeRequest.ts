import * as _ from 'lodash';

import { ICompositeRequest, ICompositeSubrequest } from '../Interfaces';

class CompositeRequest implements ICompositeRequest {
    private allOrNone: boolean;
    // Named to match the composite api schema. This is actually an array of ICompositeSubrequest
    private compositeRequest: ICompositeSubrequest[];

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

    public addSubrequest(compositeSubrequest: ICompositeSubrequest): void {
        this.compositeRequest.push(compositeSubrequest);
    }

    public get subrequests(): ReadonlyArray<ICompositeSubrequest> {
        const ro: ReadonlyArray<ICompositeSubrequest> = this.compositeRequest;
        return ro;
    }

    public getSubrequest(referenceId: string): ICompositeSubrequest {
        for (const compositeSubrequest of this.compositeRequest) {
            if (compositeSubrequest.referenceId === referenceId) {
                return compositeSubrequest;
            }
        }

        throw new Error('Unknown referenceId: ' + referenceId);
    }
}

export function newCompositeRequest():ICompositeRequest {
    return new CompositeRequest();
}