export class Option {
    symbol:string;
    quantity:number;
    callOrPut:string;
    deltaPerQty:number;
    netLiq:number;
    expirationDate:Date;
    dte:number;
    strikePrice:number;
    theta:number;
    cost:number;
}