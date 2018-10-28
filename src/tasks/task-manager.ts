import { ITask } from './task-interface';
import { LoadCSVTask } from './load-csv-task';
import { EngineState, EngineStateProperty } from '../engine/engine-state';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { JLog } from '../utils/jlog';
import { LoadQuotesTask } from './load-quotes-task';
import { PushoverTask } from './pushover-task';


export class TaskManager {
    private tasks : ITask[] = [];
    private taskRunCount : number = 0;

    loadTasks() {
        if (JLog.isDebug()) JLog.debug("TaskManager.loadTasks(): Begin");
        let engineConfig : EngineConfig = EngineConfig.instance();
        let engineState : EngineState = EngineState.instance();

        
        //LOAD CSV Task
        let csvTask : LoadCSVTask = new LoadCSVTask();
        let csvTaskFrequency : number = Number(engineConfig.getConfig(EngineConfigProperty.CSVLoadCheckFrequency));
        csvTask.setFrequency(csvTaskFrequency);
        let taskLastRanDateStr : string = engineState.getState(EngineStateProperty.CSVTaskLastRan);
        if (taskLastRanDateStr !== "") {
            csvTask.setLastRunDate(new Date(taskLastRanDateStr));
        }
        if (JLog.isDebug()) JLog.debug(`Loading the task LoadCSVTask into the TaskManager`);
        this.tasks.push(csvTask);

        //Load API Quotes Task
        //LOAD CSV Task
        let loadQuotesTask : LoadQuotesTask = new LoadQuotesTask();
        let quoteTaskFrequency : number = Number(engineConfig.getConfig(EngineConfigProperty.QuoteAPICallFrequency));
        loadQuotesTask.setFrequency(quoteTaskFrequency);
        let quoteTaskLastRanDateStr : string = engineState.getState(EngineStateProperty.QuoteAPITaskLastRan);
        if (quoteTaskLastRanDateStr !== "") {
            loadQuotesTask.setLastRunDate(new Date(quoteTaskLastRanDateStr));
        }
        if (JLog.isDebug()) JLog.debug(`Loading the task LoadQuotesTask into the TaskManager`);
        this.tasks.push(loadQuotesTask);

        //Load Pushover Task
        let pushoverTask : PushoverTask = new PushoverTask();
        let pushoverTaskFrequency : number = Number(engineConfig.getConfig(EngineConfigProperty.WatchFaceUpdateFrequency));
        pushoverTask.setFrequency(pushoverTaskFrequency);
        let pushoverTaskLastRanDateStr : string = engineState.getState(EngineStateProperty.PushoverTaskLastRan);
        if (pushoverTaskLastRanDateStr !== "") {
            pushoverTask.setLastRunDate(new Date(pushoverTaskLastRanDateStr));
        }
        if (JLog.isDebug()) JLog.debug("Loading the task PushoverTask into the TaskManager");
        this.tasks.push(pushoverTask);

        if (JLog.isDebug()) JLog.debug("TaskManager.loadTasks(): End");
    }

    addTask(task : ITask) {
        this.tasks.push(task);
    }


    runTasks() {
        if (JLog.isDebug()) JLog.debug("TaskManager.runTasks(): Begin");
        let currentDate = new Date();
        let shouldPersistState : boolean = false;
        for (let task of this.tasks) {
            let lastRunDateMilli : number = 0;
            if (task.getFrequency() === 0) {
                if (JLog.isDebug()) JLog.debug(`Task ${task.getName()} has a frequency setting of 0, so we don't run it`);
                continue; //Don't run a task that is configured for 0
            }
            if (task.getLastRunDate() != null) lastRunDateMilli = task.getLastRunDate().getTime();

            let nextMilliToRun : number = lastRunDateMilli + (60000 * task.getFrequency());
            if (currentDate.getTime() > nextMilliToRun) {
                if (JLog.isDebug()) JLog.debug(`It is time to run the ${task.getName()} curr-milli: ${currentDate.getTime()} and nextMilliToRun`);
         
                let taskDidStuff = task.run();
                shouldPersistState = true; // We want to keep track of the last run attempt, even if no real stuff was done.
                //because they will only want it to run a check every so many minutes
                if (taskDidStuff) this.taskRunCount++;
            }
        }

        if (shouldPersistState) {
            if (JLog.isDebug()) JLog.debug("Persisting state because at least one task did run (regardless if it actuall did stuff)");
            EngineState.instance().persist();
        }

        if (JLog.isDebug()) JLog.debug("TaskManager.loadTasks(): End");
    }

    getTaskRunCount() : number {
        return this.taskRunCount;
    }

    resetRunCount() {
        this.taskRunCount = 0;
    }
}