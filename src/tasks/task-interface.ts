
export interface ITask {
    getFrequency() : number;

    getLastRunDate() : Date;

    setLastRunDate(date : Date);

    getName() : string;

    run() : boolean;
}