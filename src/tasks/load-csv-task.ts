import { ITask } from './task-interface';
import { Portfolio } from '../portfolio/portfolio';
import { EngineState, EngineStateProperty, DataChangedType } from '../engine/engine-state';
import { compareDates } from '../utils/util-classes';
import { TastyworksHub } from '../brokerage/tastyworks/tastyworks-hub';
import { IDataLoader } from '../brokerage/data-loader-interface';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { Constants } from '../utils/constants';


export class LoadCSVTask implements ITask {
    private frequency: number = 0;
    private name: string = "LoadCSVTask";
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
        engineState.setState(EngineStateProperty.CSVTaskLastRan, new Date());


        let lastFileDateStr = engineState.getState(EngineStateProperty.DateLastCSVLoad);
        let file = DriveApp.getFilesByName(engineConfig.getConfig(EngineConfigProperty.CSVLoadFileName)).next();
        let csvFileTimestamp = file.getLastUpdated();
        if (lastFileDateStr == null || compareDates(csvFileTimestamp, new Date(lastFileDateStr))) {
            let brokerHub: IDataLoader;
            if (engineConfig.getConfig(EngineConfigProperty.CSVLoadFormat) === Constants.TASTYWORKS_BROKERAGE) {
                brokerHub = new TastyworksHub();
            }
            else {
                return false;
            }
            //First get the existing portfolio
            let portfolio: Portfolio = Portfolio.instance();
            brokerHub.loadCSVData(portfolio);
            
            engineState.setDataChangedType(DataChangedType.AllDataChanged);
            engineState.setState(EngineStateProperty.DateLastCSVLoad, csvFileTimestamp);
            
            taskDidStuff = true;
        }

       
        return taskDidStuff;
    }

}