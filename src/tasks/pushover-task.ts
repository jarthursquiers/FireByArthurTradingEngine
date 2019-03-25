import { ITask } from './task-interface';
import { EngineState, EngineStateProperty, DataChangedType } from '../engine/engine-state';
import { EngineConfig } from '../engine/engine-config';
import { sendPushoverFull } from '../utils/pushover-api';
import { Portfolio } from '../portfolio/portfolio';
import { JLog } from '../utils/jlog';
import { TotalsSheet } from '../sheets/totals-sheet';

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

        let datePushoverSent : Date;
        let dateDataChanged : Date;
        try {
            dateDataChanged = new Date(engineState.getState(EngineStateProperty.DataUpdatedDate));
            if (JLog.isDebug()) JLog.debug("Got date data last changed: "+dateDataChanged);
            datePushoverSent = new Date(engineState.getState(EngineStateProperty.PushoverSentDate));
            if (JLog.isDebug()) JLog.debug("Got date pushover last sent: "+datePushoverSent);
        }
        catch (e) {
            JLog.error(e);
        }
        
    
        if (dateDataChanged == null || (datePushoverSent != null && datePushoverSent.getTime() > dateDataChanged.getTime()) ) {
            if (JLog.isDebug()) JLog.debug("Data hasn't changed since last pushover sent, so we aren't pushing anything");
            return false;
        }
        

    
        let maintext = `OPL: ${Portfolio.instance().getOpenProfitAndLoss()}`;
        let hplPos = Portfolio.instance().getHighestPLPercentPosition();
        let lplPos = Portfolio.instance().getLowestPLPercentPosition();
        let subtext = `${hplPos.getPositionPLPercent()}:${hplPos.symbol}|${lplPos.getPositionPLPercent()}:${lplPos.symbol}`;

        //Get the percent formula value
        let percentStr = "10";
        try {
            let totalsSheet: TotalsSheet = new TotalsSheet();
            if (totalsSheet.getPushoverValue() < 0) percentStr = "0";
            else percentStr = totalsSheet.getPushoverValue() + "";
        }
        catch (e) {
            JLog.error(e);
        }

    

        if (JLog.isDebug()) JLog.debug(`sending pushover full-> subtext: ${subtext}, maintext ${maintext}`);
        try {
            sendPushoverFull("Portfolio",subtext, percentStr, maintext);
            engineState.setState(EngineStateProperty.PushoverSentDate, new Date());
        }
        catch (e) {
            JLog.error(e);
        }

        taskDidStuff = true;
        if (JLog.isDebug()) JLog.debug("PushoverTask.run(): End");

        return taskDidStuff;
    }

       
        
  

}