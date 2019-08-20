import { ITask } from './task-interface';
import { Portfolio } from '../portfolio/portfolio';
import { EngineState, EngineStateProperty, DataChangedType } from '../engine/engine-state';
import { compareDates } from '../utils/util-classes';
import { TastyworksHub } from '../brokerage/tastyworks/tastyworks-hub';
import { IDataLoader } from '../brokerage/data-loader-interface';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { Constants } from '../utils/constants';
import { WingmanHub } from '../brokerage/wingman/wingman-hub';


export class LoadWingmanTask implements ITask {
    private frequency: number = 0;
    private name: string = "LoadWingmanTask";
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
        engineState.setState(EngineStateProperty.WingmanTaskLastRan, new Date());


        //First get the existing portfolio
        let portfolio: Portfolio = Portfolio.instance();

        let wingmanHub: WingmanHub = new WingmanHub();
        let wingmanOpenPositionsString: string = "";

        var response = UrlFetchApp.fetch("https://wingmantracker.com/api/v1/open_positions?api_key="+engineConfig.getConfig(EngineConfigProperty.WingmanAPIKey), {
            headers: {
                Authorization: 'Bearer '+engineConfig.getConfig(EngineConfigProperty.WingmanAPIToken)
            }
        });

        Logger.log(response.getContentText());

        wingmanHub.loadOpenPositionsFromJSON(response.getContentText(),portfolio);

        engineState.setDataChangedType(DataChangedType.AllDataChanged);

        taskDidStuff = true;


        return taskDidStuff;
    }

}