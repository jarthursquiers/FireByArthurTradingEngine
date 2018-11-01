import { ITask } from './task-interface';
import { EngineState, EngineStateProperty, DataChangedType } from '../engine/engine-state';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { IDataLoader } from '../brokerage/data-loader-interface';
import { Constants } from '../utils/constants';
import { TDAmeritradeHub } from '../brokerage/tdameritrade/tdameritrade-hub';
import { Portfolio } from '../portfolio/portfolio';
import { isMarketOpen } from '../brokerage/tdameritrade/tda-api';


export class LoadQuotesTask implements ITask {
    private frequency: number = 0;
    private name: string = "LoadQuotesTask";
    private lastRunDate: Date;

    getFrequency(): number {
        return this.frequency;
    }

    setFrequency(minutes: number) {
        this.frequency = minutes;
    }

    getLastRunDate() {
        return this.lastRunDate;
    }

    setLastRunDate(date: Date) {
        this.lastRunDate = date;
    }

    getName(): string {
        return this.name;
    }

    /* Returns true if it "did something" that may have changed data */
    run(): boolean {

        let taskDidStuff = false;
        let engineState = EngineState.instance();
        let engineConfig = EngineConfig.instance();
        engineState.setState(EngineStateProperty.QuoteAPITaskLastRan, new Date());


        let brokerHub: IDataLoader;
        if (engineConfig.getConfig(EngineConfigProperty.APIBroker) === Constants.TDAMERITRADE_BROKERAGE) {
            let tdHub : TDAmeritradeHub = new TDAmeritradeHub();
            //Check is market is open
            if (!tdHub.marketOpen()) {
                return false;
            }

            brokerHub = tdHub;
        }
        else {
            return false;
        }
        //First get the existing portfolio
        let portfolio: Portfolio = Portfolio.instance();
        brokerHub.loadAPIQuoteData(portfolio);
        if (engineState.getDataChangedType() === DataChangedType.NotChanged) engineState.setDataChangedType(DataChangedType.EquityOnly);


        taskDidStuff = true;
        return taskDidStuff;
    }

       
        
  

}