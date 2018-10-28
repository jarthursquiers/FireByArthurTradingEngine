
export class AlertConfig {
    alertType : AlertType;
    alertValue : number;
    maxValue : number;
    constructor(type : AlertType, value : number) {
        this.alertType = type;
        this.alertValue = value;
    }
    
}


export enum AlertType {
    BiggestDelta,
    MaxLoss,
    MaxGain,
    DaysTillExpiration
}
