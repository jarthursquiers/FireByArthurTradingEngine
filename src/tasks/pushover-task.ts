import { ITask } from './task-interface';
import { EngineState, EngineStateProperty, DataChangedType } from '../engine/engine-state';
import { EngineConfig } from '../engine/engine-config';
import { sendPushoverFull } from '../utils/pushover-api';
import { Portfolio } from '../portfolio/portfolio';
import { JLog } from '../utils/jlog';

export class PushoverTask implements ITask {
    private frequency: number = 0;
    private name: string = "PushoverTask";
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
        if (JLog.isDebug()) JLog.debug("PushoverTask.run(): Begin");

        let taskDidStuff = false;
        let engineState = EngineState.instance();
        let engineConfig = EngineConfig.instance();
        engineState.setState(EngineStateProperty.PushoverTaskLastRan, new Date());

        //Check to see if the data is changed, otherwise this isn't worth doing
        if (engineState.getDataChangedType() === DataChangedType.NotChanged) {
            if (JLog.isDebug()) JLog.debug("DataChangedType is NotChanged, so we aren't pushing anything");
            return false;
        }

    
        let maintext = `OPL: ${Portfolio.instance().getOpenProfitAndLoss()}`;
        let hplPos = Portfolio.instance().getHighestPLPercentPosition();
        let lplPos = Portfolio.instance().getLowestPLPercentPosition();
        let subtext = `${hplPos.getPositionPLPercent()}${hplPos.symbol}|${lplPos.getPositionPLPercent()}${lplPos.symbol}`;
    

        if (JLog.isDebug()) JLog.debug(`sending pushover full-> subtext: ${subtext}, maintext ${maintext}`);
        try {
            sendPushoverFull("Portfolio",subtext, "10", maintext);
        }
        catch (e) {
            JLog.error(e);
        }

        taskDidStuff = true;
        if (JLog.isDebug()) JLog.debug("PushoverTask.run(): End");

        return taskDidStuff;
    }

       
        
  

}