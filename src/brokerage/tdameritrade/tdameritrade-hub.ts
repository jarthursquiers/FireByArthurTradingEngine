import { IDataLoader } from "../data-loader-interface";
import { Portfolio } from '../../portfolio/portfolio';
import { getTDAOptionsQuote, isMarketOpen } from "./tda-api";
import { JLog } from '../../utils/jlog';
import { EngineState, EngineStateProperty } from '../../engine/engine-state';

export class TDAmeritradeHub implements IDataLoader {

    loadCSVData(portfolio: Portfolio) {

    }

    loadAPIQuoteData(portfolio: Portfolio) {
        let positions = portfolio.getPositions();

        for (let position of positions) {
            let options = position.options;
            for (let option of options) {
                if (option.symbol == null || option.symbol.indexOf("./") > -1) {
                    if (JLog.isDebug()) JLog.debug(`TDAmeritradeHub.loadAPIQuoteData(): skipping quote call for ${option.symbol} as TDA does not support futures API calls`);
                    continue;
                }
                if (JLog.isDebug()) JLog.debug(`TDAmeritradeHub.loadAPIQuoteData(): calling getTDAOptionsQuote(${option.symbol},${option.callOrPut},${option.strikePrice},${option.expirationDate})`);
                let quoteStr = "";
                try {
                    quoteStr = getTDAOptionsQuote(option.symbol, option.callOrPut.toUpperCase(), `${option.strikePrice}`, option.expirationDate);
                    if (JLog.isDebug()) JLog.debug(`TDAmeritradeHub.loadAPIQuoteData(): The quote returned from API is: ${quoteStr}`);
                  
                } catch (e) {
                    JLog.error(e);
                    return;
                }

                var isDelayed = this.getValueFromJSON(quoteStr, "isDelayed");
                if (JLog.isDebug()) JLog.debug(`The value of isDelayed from the TDA result is ${isDelayed}`);
                if (isDelayed == false) {
                   EngineState.instance().setState(EngineStateProperty.QuotesDelayed,"false");
                }
                else {
                  EngineState.instance().setState(EngineStateProperty.QuotesDelayed,"true");
                }

                let deltaStr = this.getValueFromJSON(quoteStr, "delta");
                let lastPrice = this.getValueFromJSON(quoteStr, "mark");
                let daysToExpiration = this.getValueFromJSONOccurance(quoteStr, "daysToExpiration", 2);

                if (JLog.isDebug()) JLog.debug(`daysToExpiration-read from tdameritrade quote was ${daysToExpiration} for ${option.symbol}`);

                option.dte = parseInt(daysToExpiration);

                if (JLog.isDebug()) JLog.debug(`dte-set-on-option is: ${option.dte}`);
                option.netLiq = option.quantity * Number(lastPrice) * 100;
                option.deltaPerQty = Math.round(Math.abs(parseFloat(deltaStr)) * 100);

            }

        }
    }

    marketOpen(): boolean {
        try {
           return isMarketOpen();
       //   return true;
        } catch (e) {
            JLog.error(e);
            return false;
        }
    }

    private getValueFromJSON(jsonString, name) {
        var nameLocation = jsonString.indexOf(name);
        var aSub = jsonString.substring(nameLocation, jsonString.length);
        nameLocation = aSub.indexOf(",");
        if (nameLocation == -1) nameLocation = aSub.indexOf("}");
        var bSub = aSub.substring(0, nameLocation);
        var jsonStringtmp = "{\"" + bSub + "}";
        var data = JSON.parse(jsonStringtmp);
        var returnStr = eval("data." + name);
        return returnStr;
    }

    private getValueFromJSONOccurance(jsonString, name, occurance) {
        var tmpJSON = jsonString;


        //This just lops off the first occurances
        for (var i = 1; i < occurance; i++) {
            var loc = tmpJSON.indexOf(name);
            var sub = tmpJSON.substring(loc, tmpJSON.length);
            loc = sub.indexOf(",");
            if (loc == -1) loc = sub.indexOf("}");
            tmpJSON = sub.substring(loc, sub.length);
        }

        var nameLocation = tmpJSON.indexOf(name);
        var aSub = tmpJSON.substring(nameLocation, tmpJSON.length);
        nameLocation = aSub.indexOf(",");
        if (nameLocation == -1) nameLocation = aSub.indexOf("}");
        var bSub = aSub.substring(0, nameLocation);
        var jsonStringTmp = "{\"" + bSub + "}";
        var data = JSON.parse(jsonStringTmp);
        var returnStr = eval("data." + name);
        return returnStr;
    }

}