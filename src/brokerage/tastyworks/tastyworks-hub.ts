import { IDataLoader } from "../data-loader-interface";
import { Portfolio } from "../../portfolio/portfolio";
import { Option } from "../../market/option";
import { CSVToArray } from '../../utils/util-classes';
import { EngineConfig, EngineConfigProperty } from '../../engine/engine-config';
import { JLog } from '../../utils/jlog';


export class TastyworksHub implements IDataLoader {
    csvData: string;
    static csvParseFunction : (csvString : string, delim : string) => void;

    loadCSVData(portfolio: Portfolio) {
        var file = DriveApp.getFilesByName(EngineConfig.instance().getConfig(EngineConfigProperty.CSVLoadFileName)).next();
        var csvData = file.getBlob().getDataAsString();
        this.loadPortfolioFromCSV(csvData, portfolio);
    }

    loadAPIQuoteData(portfolio: Portfolio) {
        //TODO: GET DATA FROM API  

    }


    loadPortfolioFromCSV(csvString: string, aPortfolio: Portfolio) {
        if (JLog.isDebug()) JLog.debug("Running TastyworksHub.loadPortfolioFromCSV()");
        //First, create the array of headers

        // let dataArray = Utilities.parseCsv(csvString);
        //Clear options objects from the positions since we are reloading them from CSV
        aPortfolio.clearOptions();
        aPortfolio.clearReadInNetLiqs();
        let dataArray;
        if (TastyworksHub.csvParseFunction == null) dataArray = CSVToArray(csvString, ",");
        else dataArray = TastyworksHub.csvParseFunction(csvString,",");

        let headerArray: string[] = dataArray[0];

        for (var i = 1, lenCsv = dataArray.length; i < lenCsv; i++) {
            let wOption = new Option();
            if (dataArray[i].length < dataArray[0].length) continue;
            
            let typeArray = dataArray[i][headerArray.indexOf("Symbol")].split(' ');
            wOption.symbol = typeArray[0];
            let tmpType = typeArray[typeArray.length-1];
            let expDate = "20" + tmpType.toString().substring(0,2) + "-" + tmpType.toString().substring(2,4)+ "-" + tmpType.toString().substring(4,6);
            if (JLog.isDebug()) JLog.debug(`Expire date of option was loaded as ${expDate} for ${wOption.symbol}`);
            wOption.expirationDate = new Date(expDate);
            wOption.quantity = parseInt(dataArray[i][headerArray.indexOf("Quantity")].replace(",",""));
            wOption.cost = parseFloat(dataArray[i][headerArray.indexOf("Cost")].replace(",",""));
            wOption.deltaPerQty = parseFloat(dataArray[i][headerArray.indexOf("/ Delta")]) * 100;
            wOption.theta = parseFloat(dataArray[i][headerArray.indexOf("Theta")].replace(",",""));
            wOption.netLiq = parseFloat(dataArray[i][headerArray.indexOf("NetLiq")].replace(",",""));
            wOption.callOrPut = dataArray[i][headerArray.indexOf("Call/Put")];
            wOption.strikePrice = parseFloat(dataArray[i][headerArray.indexOf("Strike Price")].replace(",",""));
            wOption.dte = parseInt(dataArray[i][headerArray.indexOf("DTE")].split('d')[0]);

            if (JLog.isDebug()) {
                JLog.debug(`Adding read csv TW opton with symbol ${wOption.symbol} with netliq of ${wOption.netLiq}, DTE of ${wOption.dte} and a Cost of ${wOption.cost}`);
            }
            aPortfolio.addOption(wOption);
        }

    }
}

