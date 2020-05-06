import { Logger } from '@salesforce/core';

import {
    APIVersion,
    ConnectionConfig
} from './../..';

import { CompositeRequest } from './CompositeRequest';

import {
    CompositeApi,
    CompositeGraphResponse
} from './CompositeApi';

import { UnitOfWork } from './UnitOfWork';


export class UnitOfWorkGraph {
    private _graphs: UnitOfWork[];
    private readonly _config: ConnectionConfig;
    private logger;

    constructor(config: ConnectionConfig, logger: Logger, _unitOfWork?: UnitOfWork) {
        if(config.apiVersion < APIVersion.V50){
            throw new Error(`UnitOfWorkGraph requires apiVersion v${APIVersion.V50} or up`);
        }
        this._config = config;
        this.logger = logger;
        this._graphs = [];

        if(_unitOfWork){
            this.addGraph(_unitOfWork);
        }
    }

    public addGraph(unitOfWork: UnitOfWork): UnitOfWorkGraph {
        this._graphs.push(unitOfWork);
        return this;
    }

    public newUnitOfWork(): UnitOfWork {
        const uow: UnitOfWork = new UnitOfWork(this._config, this.logger);
        return uow;
    }

    public getCount(): number {
        return this._graphs.length;
    }

    public async commit(): Promise<CompositeGraphResponse> {
        const compositeApi: CompositeApi = new CompositeApi(this._config, this.logger);

        //get array of compositeRequest from the array of unitOfWorks
        const compositeRequests: Array<CompositeRequest> = [];
        for (const uow of this._graphs){
            compositeRequests.push(uow.compositeRequest);
        }

        const compositeGraphResponse: CompositeGraphResponse = await compositeApi.invokeGraph(compositeRequests);

        return compositeGraphResponse;
    }
}
