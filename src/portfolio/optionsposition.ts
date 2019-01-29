
import { Option } from '../market/option';
import { JLog } from '../utils/jlog';

export class OptionsPosition {
    static readonly NUMBER_ROLL_SLOTS = 5;
    symbol: string;
    options: Option[] = [];
    rollCredits: number[] = [];
    newPosition : boolean = true;


    originalDTE: number = 0;
    originalCredit: number = 0;
    
    readInBiggestDeltaOpen: number = 0;
    readInPositionNetLiq: number = 0;
    daysInTrade: number = 0;
    underlyingPrice: number = 0;


    adjustments: number[];

    addOption(option: Option) {
        this.options.push(option);

        if (this.newPosition) {
            if (JLog.isDebug()) JLog.debug(`addOption(option) to new position | cost of ${option.cost}`);
            this.originalCredit += option.cost;
            if (this.originalDTE === 0 || option.dte < this.originalDTE) this.originalDTE = option.dte;
        }
    }

    clearOptions() {
        this.options = [];
    }

    addRollCredit(rollCredit: number) {
        this.rollCredits.push(rollCredit);
    }

    clearRollCredits() {
        this.rollCredits = [];
    }

    getPositionPLPercent(): number {
        let profitAmount = this.getPositionPL();
        if (JLog.isDebug()) JLog.debug(`${this.symbol} profitAmount: ${profitAmount} | originalCredit ${this.originalCredit}`);
        let percentProfit = Math.round(profitAmount / this.originalCredit * 100);
        //If the original credit is negative, this was a debit trade. Profit percent would need to swap the percent
        if (this.originalCredit <= 0) percentProfit = percentProfit * -1;
        return percentProfit;
    }

    getPositionPL(): number {
        //Note, for short options, the open net liq will be negative, which means that takes
        // away from our profit (since we are obligated to buy it back)
        return this.getTotalPositionCreditReceived() + this.getOpenNetLiq();
    }

    getOpenNetLiq(): number {  //Short options will have negative net liq
        let wNetLiq: number = 0;
        let netLiqsFound : boolean = false;
        for (let option of this.options) {
            if (option.netLiq != null && !isNaN(option.netLiq)) {
                wNetLiq += option.netLiq;
                netLiqsFound = true;
            }
            else {
                netLiqsFound = false;
            }
        }

        if (netLiqsFound)  return wNetLiq;
        else return this.readInPositionNetLiq;
    }

    getStatus() : string {
        if (this.getOpenNetLiq() != 0) return "Open"
        else return "Closed";
    }

    getDTE(): number {

        let wDTE: number = 0;
        if (JLog.isDebug()) JLog.debug(`Option count when getDTE-called: ${this.options.length}`);
        for (let option of this.options) {
            if (option.dte < wDTE || wDTE === 0) {
                wDTE = option.dte;
            }
        }

        if (JLog.isDebug()) JLog.debug(`Returning optionDTE of ${wDTE} for ${this.symbol}`);

        return wDTE;
    }

    getQuantity(): number {

        let wQuantity: number = 0;
        for (let option of this.options) {
            let optionQuantity = Math.abs(option.quantity);
            if (optionQuantity > wQuantity) {
                wQuantity = Math.abs(option.quantity);
            }
        }

        return wQuantity;
    }


    getBiggestDelta(): number {
        let biggest: number = 0;
        let wDeltasFound : boolean = false;
        for (let option of this.options) {
            if (option.deltaPerQty != null && !isNaN(option.deltaPerQty)) {
                if (Math.abs(option.deltaPerQty) > biggest) biggest = Math.abs(option.deltaPerQty);
                wDeltasFound = true;
            }
            else {
                wDeltasFound = false;
            }
        }

        if (wDeltasFound) return biggest;
        else return this.readInBiggestDeltaOpen;
    }

    isStrikeBreached(): boolean {
       
        if (this.underlyingPrice === 0) return false;

        for (let option of this.options) {
            if (option.callOrPut.toLowerCase() === "call") {
                if (this.underlyingPrice > option.strikePrice) return true;
            }
            else {
                if (this.underlyingPrice < option.strikePrice) return true;
            }
        }

        return false;
    }

    getContractCodes() : string {
        let codes : string = "";
        let sep : string = "";
        for (let option of this.options) {
            let date : Date = option.expirationDate;
            codes += sep;
            codes += `${date.toISOString().substring(0,10)}@${option.callOrPut}@${option.strikePrice}@${option.quantity}`;
            sep = ",";
        }

        return codes;
    }

    getTotalRollCredits(): number {
        let total: number = 0;
        for (let credit of this.rollCredits) {
            total += credit;
        }

        return total;
    }

    getTotalPositionCreditReceived(): number {
        return this.originalCredit + this.getTotalRollCredits();
    }

    setOptionsWithContractCodes(contractCodes : string ) {
        if (JLog.isDebug()) JLog.debug(`OpenPositionsSheet.setOptionsWithContractCodes(${contractCodes}): Begin`);
        var codesArray = contractCodes.split(",");
        for (var x=0; x < codesArray.length; x++ ) {

            var tmpCode = codesArray[x];
            var tmpArray = tmpCode.split("@");
            var tmpDate = tmpArray[0];
            var tmpType = tmpArray[1];
            var tmpStrike = tmpArray[2];
            var tmpQuantity = tmpArray[3];

            let option = new Option();
            option.symbol = this.symbol;
            option.expirationDate = new Date(tmpDate);
            if (JLog.isDebug()) JLog.debug(`expiration date created from ${tmpDate} is ${option.expirationDate}`);
            option.callOrPut = tmpType;
            option.strikePrice = Number(tmpStrike);
            option.quantity = Number(tmpQuantity);

            if (JLog.isDebug()) JLog.debug(`Adding option to this position: ${option.symbol}, callOrPut: ${option.callOrPut}`);
            this.addOption(option);
        }

        if (JLog.isDebug()) JLog.debug("OptionsPosition.setOptionsWithContractCodes: End");
    }

}