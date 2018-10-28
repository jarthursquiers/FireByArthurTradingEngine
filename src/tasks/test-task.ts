import { ITask } from './task-interface';


export class TestTask implements ITask {
    private frequency : number = 0;
    private name : string = "TestTask";
    private lastRunDate : Date;

    getFrequency() : number {
        return this.frequency;
    }

    setFrequency(minutes : number) {
        this.frequency = minutes;
    }

    getLastRunDate() {
        return this.lastRunDate;
    }

    setLastRunDate(date : Date) {
        this.lastRunDate = date;
    }

    getName() : string {
        return this.name;
    }

    run() : boolean {
    
        return true;
    }

}