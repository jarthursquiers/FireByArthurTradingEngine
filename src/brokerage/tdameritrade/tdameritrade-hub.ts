import { IDataLoader } from "../data-loader-interface";
import { Portfolio } from '../../portfolio/portfolio';
import { getTDAOptionsQuote, isMarketOpen, getTDAOptionsChainList, getTDAFullChain } from './tda-api';
import { JLog } from '../../utils/jlog';
import { EngineState, EngineStateProperty } from '../../engine/engine-state';
import { TradeFinderData } from '../../market/trade-finder-data';
import { HashMap } from '../../utils/util-classes';

export class TDAmeritradeHub implements IDataLoader {

    getTradeFinderData(symbol : string, authenticate : boolean) : TradeFinderData {
        let beginDate = new Date();
        //100 days from now
        beginDate.setTime(beginDate.getTime()  + 100 * 24 * 60 * 60 * 1000)
        let endDate = new Date();
        //150 days from now
        endDate.setTime(endDate.getTime() + 200 * 24 * 60 * 60 * 1000);

        let chainString = getTDAOptionsChainList(symbol, beginDate, endDate, authenticate);

        if (JLog.isDebug()) JLog.debug(chainString);

        let prefExpireDate = this.getPreferredExpirationDate(chainString);

        let fullChainString = getTDAFullChain(symbol, prefExpireDate, authenticate);


        return this.getTradeDataFromFullChain(fullChainString);
        
        
    }

    getTradeDataFromFullChain(fullChainString : string) : any {
        let data = JSON.parse(fullChainString);

        let callExpMap = data.callExpDateMap;

        let aTradeFinderData : TradeFinderData = this.getIdealTradeFinderData(callExpMap);

        let putExpMap = data.putExpDateMap;

        let putTradeFinderData : TradeFinderData = this.getIdealTradeFinderData(putExpMap);

        //We only care about the put or call side with the worst bid/ask spread...to represent the liquidity
        if (putTradeFinderData.bidAskSpread > aTradeFinderData.bidAskSpread) aTradeFinderData = putTradeFinderData;

        aTradeFinderData.price = Number(data.underlyingPrice);
        aTradeFinderData.symbol = data.symbol;


        return aTradeFinderData;
    }

    private getIdealTradeFinderData(putOrCallMap : any) {

        let tradeFinderData : TradeFinderData = new TradeFinderData();
        tradeFinderData.targetDelta = 0;

        for (let expDate in putOrCallMap) {
        
            let expObj = putOrCallMap[expDate];
            for (let strikeStr in expObj) {
                let strike = expObj[strikeStr];
                let strikeData = strike["0"]; 
                let deltaStr = strikeData.delta;  
                let prettyDelta = Math.round(Math.abs(parseFloat(deltaStr)) * 100);
                if (prettyDelta <= 10 && prettyDelta > tradeFinderData.targetDelta) {
                    let bid = parseFloat(strikeData.bid);
                    let ask = parseFloat(strikeData.ask);
                    let spread = Math.round((ask - bid) * 100);
                    let theoreticalVolatility = Number(strikeData.volatility);
                    let mark = Number(strikeData.mark);
                    let daysToExpiration = Number(strikeData.daysToExpiration);
                    tradeFinderData.currentIV = theoreticalVolatility;
                    tradeFinderData.bestDTE = daysToExpiration;
                    tradeFinderData.targetDelta = prettyDelta;
                    tradeFinderData.tenDeltaCredit = Number(mark) * 100;
                    tradeFinderData.bidAskSpread = spread;
                    tradeFinderData.callOrPutSample = strikeData.putCall;
                }
            }
        }

        return tradeFinderData;

    }

    getPreferredExpirationDate(chainString : string) : string {
        let data = JSON.parse(chainString);

        let dateArray = data.callExpDateMap;

        let bestDate : string = null;
        let expireDateMap : HashMap = new HashMap();

        let bestDTEUnder150 : number = 0;
        let bestDTEOver150 : number = 300;

        for (let expiration in dateArray) {
            let objExp = dateArray[expiration];
            for (let strikeStr in objExp) {
                let strike = objExp[strikeStr];
                let strikeData = strike["0"];
                let dte = Number(strikeData.daysToExpiration);
                if (dte  <= 150 && dte > bestDTEUnder150) {
                    bestDTEUnder150 = dte;
                }
                else if (dte > 150 && dte < bestDTEOver150) {
                    bestDTEOver150 = dte;
                }

                expireDateMap.put(`${dte}`,expiration.substring(0,10));

            }
        }
        
        if (bestDTEUnder150 != 0) bestDate = expireDateMap.get(`${bestDTEUnder150}`);
        else if (bestDTEOver150 != 300) bestDate = expireDateMap.get(`${bestDTEOver150}`);
        return bestDate;
    }

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
                let underlyingPrice = this.getValueFromJSON(quoteStr, "underlyingPrice");
                position.underlyingPrice = Number(underlyingPrice);

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