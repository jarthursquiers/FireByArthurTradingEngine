import { Constants } from '../utils/constants';
import { JLog } from '../utils/jlog';
import { HashMap } from '../utils/util-classes';
import { TradeFinderData } from '../market/trade-finder-data';


export class TradeFinderSheet {

    sheetName: string = 'Trade Finder';

    readSymbols(): string[] {
        if (JLog.isDebug()) JLog.debug("TradeFinderSheet.read(): Begin");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();

        let range;
        let values = [];
        if (sheet.getLastRow() > 1) {
            if (JLog.isDebug()) JLog.debug("TradeFinderSheet.write(): Going to get the range");
            range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
            values = range.getValues();
        }
        else {
            if (JLog.isDebug()) JLog.debug("There were no data rows in the TradeFinder, so we're leaving the values [] blank");
        }

        let symbols : string [] = [];

        
        let rowIndex = 1; //The data for the range actually starts at row 2, 
        for (let row of values) {
            rowIndex++;

            let tmpStatusVal = row[TradeFinderColumn.Symbol - 1];
            symbols.push(tmpStatusVal);
        }


        return symbols;
    }

    write(tradeFinderDataMap: HashMap) {
        if (JLog.isDebug()) JLog.debug("Running OpenPositionSheet.write()");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) {
            if (JLog.isDebug()) JLog.debug("Sheet didn't exist, so creating a new one.")
            sheet = this.createNewSheet();
        }


        //We want to query the entire range of values at once for major performance reasons.


        let range;
        let values = [];
        if (sheet.getLastRow() > 1) {
            if (JLog.isDebug()) JLog.debug("OpetionsPositionsSheet.write(): Going to get the range");
            range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
            values = range.getValues();
        }
        else {
            if (JLog.isDebug()) JLog.debug("There were no data rows in the trade finder, so we're leaving the values [] blank");
        }

        if (JLog.isDebug()) JLog.debug(`TradeFinderSheet.write(): got this many rows ${values.length}`)



        let rowIndex = 1; //The data for the range actually starts at row 2, 
        for (let row of values) {
            rowIndex++;

            let tmpSymbolVal = row[TradeFinderColumn.Symbol - 1];

            let wTradeFinderData: TradeFinderData = tradeFinderDataMap.get(`${tmpSymbolVal}`);

            if (wTradeFinderData == null) {
                JLog.error(`The position for ${tmpSymbolVal} was not found in tradeFinderDataMap so we are skipping it with this loop`);
                continue;
            }

       
            let tmpDTECell = sheet.getRange(rowIndex, TradeFinderColumn.BestDTE);
            tmpDTECell.setValue(wTradeFinderData.bestDTE);
            sheet.getRange(rowIndex, TradeFinderColumn.BidAskSpread).setValue(wTradeFinderData.bidAskSpread);
            sheet.getRange(rowIndex, TradeFinderColumn.TenDeltaCredit).setValue(wTradeFinderData.tenDeltaCredit);
            sheet.getRange(rowIndex, TradeFinderColumn.Price).setValue(wTradeFinderData.price);
            sheet.getRange(rowIndex, TradeFinderColumn.IVRating).setValue(wTradeFinderData.IVRating);
            if (wTradeFinderData.positionHeld) {
                sheet.getRange(rowIndex, TradeFinderColumn.PositionHeld).setValue("TRUE");
            }
            else {
                sheet.getRange(rowIndex, TradeFinderColumn.PositionHeld).setValue("FALSE");
            }

            // Highlight good trade opportunities
            if (wTradeFinderData.bidAskSpread <= 7 && wTradeFinderData.positionHeld == false && wTradeFinderData.price >= 20) {
                sheet.getRange(rowIndex,TradeFinderColumn.Symbol,1,10).setBackgroundRGB(152,251,152);
            }
            else {
                sheet.getRange(rowIndex,TradeFinderColumn.Symbol,1,10).setBackground(null);
            }

         
        }
    }

    createNewSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.sheetName);
        sheet.setFrozenColumns(1);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 500, 50).applyRowBanding(SpreadsheetApp.BandingTheme.CYAN, true, true);
        this.createHeaders(sheet);
        let initialTickers = Constants.TRADEABLE_ETFS;

        let rowIndex = 1;
        for (let ticker of initialTickers) {
            rowIndex++
            sheet.getRange(rowIndex, TradeFinderColumn.Symbol).setValue(ticker);
        }

        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
        SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(5);

        //Sometimes there is a Script 1 sheet there by default...I'll get rid of it if it exists.

        return sheet;
    }

    private createHeaders(sheet) {

    
        sheet.getRange(1, TradeFinderColumn.Symbol).setValue("Ticker");
        sheet.getRange(1, TradeFinderColumn.PositionHeld).setValue("Position");
        sheet.getRange(1, TradeFinderColumn.IVRating).setValue("IV Rating");
        sheet.getRange(1, TradeFinderColumn.BestDTE).setValue("Best DTE");
        sheet.getRange(1, TradeFinderColumn.BidAskSpread).setValue("Bid Ask Spread");
        sheet.getRange(1, TradeFinderColumn.Price).setValue("Price");
        sheet.getRange(1, TradeFinderColumn.TenDeltaCredit).setValue("Ten Delta Credit");
    }

}

export enum TradeFinderColumn {
    Symbol = 1,
    PositionHeld = 2,
    IVRating = 3,
    BestDTE = 4,
    BidAskSpread = 5,
    Price = 6,
    TenDeltaCredit = 7  
}