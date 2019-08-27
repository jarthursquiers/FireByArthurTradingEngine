import { Portfolio } from '../portfolio/portfolio';
import { OptionsPosition } from '../portfolio/optionsposition';
import { ClosedPositionsSheet } from './closed-positions-sheet';
import { EngineState, DataChangedType } from '../engine/engine-state';
import { JLog } from '../utils/jlog';
import { TradeAlert } from '../alerts/trade-alert';
import { AlertType } from '../alerts/alert-config';
import { Stock } from '../market/stock';


export class OpenPositionsSheet {
    sheetName: string = 'Open Positions';

    private cachedValuesForHighlight = null;

    deleteSheet() {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet != null) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet);
    }

    read(portfolio: Portfolio) {
        if (JLog.isDebug()) JLog.debug("OpenPositionsSheet.read(): Begin");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) return;

        //We want to query the entire range of values at once for major performance reasons.
        if (sheet.getLastRow() < 2) {
            JLog.info("There are no records in the sheet, so we exiting this method");
            return;
        }

        let range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
        let values = range.getValues();

        for (let row of values) {
            let wSymbol = row[OpenPositionsColumn.Symbol - 1];
            JLog.debug(`Read ${wSymbol} from OpenPositionSheet row`);
            if (wSymbol == null) {
                JLog.info(`Symbol read in is being skipped because it == null`);
                continue;
            }

            let wPosition = portfolio.getPosition(`${wSymbol}`);
            if (wPosition == null) {
                if (JLog.isDebug()) JLog.debug(`Creating  OptionsPosition() object for ${wSymbol}`);
                wPosition = new OptionsPosition();
                wPosition.symbol = `${wSymbol}`;
                //It's not a new position, we're reading it it from the sheet.
                wPosition.newPosition = false;
            }


            let wOriginalDTE: number = Number(row[OpenPositionsColumn.OriginalDTE - 1]);
            wPosition.originalDTE = wOriginalDTE;

            let wOriginalCredit: number = Number(row[OpenPositionsColumn.OriginalCredit - 1]);
            wPosition.originalCredit = wOriginalCredit;

            let wBiggestDeltaOpen: number = Number(row[OpenPositionsColumn.BiggestDeltaOpen - 1]);
            wPosition.readInBiggestDeltaOpen = wBiggestDeltaOpen;

            let wNetLiq : number = Number(row[OpenPositionsColumn.NetLiq-1]);
            wPosition.readInPositionNetLiq = wNetLiq;

            let wDaysInTrade: number = Number(row[OpenPositionsColumn.DaysInTrade -1]);
            wPosition.daysInTrade = wDaysInTrade;

            let shareCount : number = Number(row[OpenPositionsColumn.StockShares-1]);
            if (!isNaN(shareCount)) {
                let wStock : Stock = new Stock();
                wStock.symbol = `${wSymbol}`;
                wStock.shares = shareCount;
                wPosition.addStock(wStock);
            }

            
            let accountName : string = `${row[OpenPositionsColumn.AccountName -1]}`;

            if (accountName != "") wPosition.account = accountName;

            let contractCodes : string = `${row[OpenPositionsColumn.ContractCodes -1]}`;

            if (JLog.isDebug()) JLog.debug(`Read following data from sheet values: originalDTE->${wOriginalDTE}, originalCredit->${wOriginalCredit}, startingBiggestDelta->${wBiggestDeltaOpen}, contractCodes->${contractCodes}`);
            wPosition.setOptionsWithContractCodes(contractCodes);
          

            //Handle reloading roll credits
            wPosition.clearRollCredits();
            let wRollCreditValue;
            for (let a = 1; a <= OptionsPosition.NUMBER_ROLL_SLOTS; a++) {
                wRollCreditValue = row[OpenPositionsColumn["Adjustment" + a] - 1];
                if (wRollCreditValue != null && wRollCreditValue != "") {
                    wPosition.addRollCredit(Number(wRollCreditValue));
                    JLog.debug(`Added roll credit ${wRollCreditValue} to ${wPosition.symbol}`);
                }
            }

            //Need to set this so the credit and dte don't get overwritten by csv or api loads
            wPosition.newPosition = false;
            JLog.debug(`Loaded the following info into the position 
                        OriginalDTE: ${wOriginalDTE}
                        OriginalCredit: ${wOriginalCredit}
                        StartingBiggestDelta: ${wBiggestDeltaOpen}`);


            portfolio.setPosition(wPosition.symbol, wPosition);
        }

        if (JLog.isDebug()) JLog.debug("OpenPositionsSheet.read(): End");
    }

    write(portfolio: Portfolio) {
        if (JLog.isDebug()) JLog.debug("Running OpenPositionSheet.write()");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) {
            if (JLog.isDebug()) JLog.debug("Sheet didn't exist, so creating a new one.")
            sheet = this.createNewSheet();
        }

        let spreadsheetContainsHash = {};

        //We want to query the entire range of values at once for major performance reasons.


        let range;
        let values = [];
        if (sheet.getLastRow() > 1) {
            if (JLog.isDebug()) JLog.debug("OpetionsPositionsSheet.write(): Going to get the range");
            range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
            values = range.getValues();
        }
        else {
            if (JLog.isDebug()) JLog.debug("There were no data rows in the Open Sheet, so we're leaving the values [] blank");
        }

        if (JLog.isDebug()) JLog.debug(`OpenPositionsSheet.write(): got this many rows ${values.length}`)


        if (JLog.isDebug()) JLog.debug("Looping through all spreadsheet rows, finding open positions and updating values.");

        let rowIndex = 1; //The data for the range actually starts at row 2, 
        for (let row of values) {
            rowIndex++;

            let tmpStatusVal = row[OpenPositionsColumn.Status - 1];
            let tmpSymbolVal = row[OpenPositionsColumn.Symbol - 1];

            if (JLog.isDebug()) JLog.debug(`On the open position sheet record for ${tmpSymbolVal}, with a status of ${tmpStatusVal}`);

            let wPosition: OptionsPosition = portfolio.getPosition(`${tmpSymbolVal}`);

            if (wPosition == null) {
                JLog.error(`The position for ${tmpSymbolVal} was not found in portfolio.getPosition() so we are skipping it with this loop`);
                continue;
            }

            if (EngineState.instance().getDataChangedType() === DataChangedType.EquityOnly && wPosition.symbol.indexOf("./") > -1) {
                if (JLog.isDebug()) JLog.debug(`Only equity data was updated and this position is ${wPosition.symbol} so we skip it`);
                continue;
            }

            //If the position is open, we can see if we have a net liq
            if (tmpStatusVal == "Open") {
                JLog.debug(`OptionsPositionsSheet.write(): ${tmpSymbolVal} is 'Open' so we will check the open net liq`);
                var tmpNetLiq = wPosition.getOpenNetLiq();
                if (!isNaN(tmpNetLiq) && tmpNetLiq != null && tmpNetLiq != 0) {
                    JLog.debug("NetLiq is not zero, so we'll update it");
                    var tmpNetLiqCell = sheet.getRange(rowIndex, OpenPositionsColumn.NetLiq);
                    tmpNetLiqCell.setValue(tmpNetLiq);
                }

                //if there is no net liq or it's zero, we'll mark this position closed
                if (wPosition.getStatus() === "Closed") {
                    JLog.debug("OptionsPositionsSheet.write(): "+wPosition.symbol+" wPosition.getStatus() returned 'Closed' [getStatus() checks the net liq for 0]");
                    let tmpStatus = sheet.getRange(rowIndex, OpenPositionsColumn.Status);
                    tmpStatus.setValue("Closed");
                    JLog.debug(`Set the status to Closed. 
                        We'll now call EngineState.instance().clearSymbol to get rid any 
                        notification state for the symbol ${wPosition.symbol}`);
                    EngineState.instance().clearSymbol(wPosition.symbol);
                }
                else { //If we are setting this to closed, there is no need to fill in the rest of the data because
                    //it will just mess up the history.
                    if (JLog.isDebug()) JLog.debug(`OpenPositionsSheet.write(): ${wPosition.symbol} did not return CLOSED.`)
                    sheet.getRange(rowIndex, OpenPositionsColumn.BiggestDelta).setValue(wPosition.getBiggestDelta());
                    if (wPosition.getDTE()) sheet.getRange(rowIndex, OpenPositionsColumn.DTE).setValue(wPosition.getDTE());
                    sheet.getRange(rowIndex, OpenPositionsColumn.Quantity).setValue(wPosition.getQuantity());
                    sheet.getRange(rowIndex, OpenPositionsColumn.ContractCodes).setValue(wPosition.getContractCodes());
                    sheet.getRange(rowIndex, OpenPositionsColumn.StockShares).setValue(wPosition.getTotalShareCount());
                    sheet.getRange(rowIndex, OpenPositionsColumn.AccountName).setValue(wPosition.account);
                    if (!isNaN(wPosition.getDownsideNotional())) sheet.getRange(rowIndex, OpenPositionsColumn.DownsideNotionalRisk).setValue(wPosition.getDownsideNotional());
                    if (wPosition.getClass() !== "parent") {
                        sheet.getRange(rowIndex, OpenPositionsColumn.CostBasis).setValue(wPosition.getCurrentBasis());
                        sheet.getRange(rowIndex, OpenPositionsColumn.OriginalCredit).setValue(wPosition.originalCredit);
                    }
                    JLog.debug(`Set these values on the Open Sheet:
                                BiggestDelta: ${wPosition.getBiggestDelta()}
                                DTE: ${wPosition.getDTE()}
                                Quantity: ${wPosition.getQuantity()}`);

                }
                spreadsheetContainsHash[wPosition.symbol] = wPosition;
            }


        }


        //Now loop through all symbols from import and add new rows for
        //the ones that don't have open rows in the spreadsheet
        JLog.debug("Looping through all portfolio.getPositions() and adding new rows for those not in the sheet");
        for (let position of portfolio.getPositions()) {

            if (EngineState.instance().getDataChangedType() === DataChangedType.EquityOnly && position.symbol.indexOf("./") > -1) {
                if (JLog.isDebug()) JLog.debug(`Only equity data was updated and this position is ${position.symbol} so we skip it`);
                continue;
            }

            if (spreadsheetContainsHash[position.symbol] == null) {
                JLog.debug(`The sysmbol ${position.symbol} was not found in the spreadsheetContainsHash, so
                we'll add a row for it`);
                //Make sure it's not just a closed position
                if (position.getStatus() === "Open") {
                    let lastRow = sheet.getLastRow();
                    if (lastRow == 0) {
                        JLog.debug("There are now rows in the open sheet; we'll create the headers");
                        this.createHeaders(sheet);
                        lastRow = 1;
                    }
                    sheet.insertRowAfter(lastRow);
                    lastRow++;

                    sheet.getRange(lastRow, OpenPositionsColumn.Symbol).setValue(position.symbol);
                    sheet.getRange(lastRow, OpenPositionsColumn.Status).setValue("Open");
                    sheet.getRange(lastRow, OpenPositionsColumn.DTE).setValue(position.getDTE());
                    sheet.getRange(lastRow, OpenPositionsColumn.OriginalCredit).setValue(position.originalCredit);
                    if (position.getClass() === "parent") {
                        sheet.getRange(lastRow, OpenPositionsColumn.CostBasis).setFormula("=D" + lastRow + "+J" + lastRow + "+K" + lastRow + "+L" + lastRow + "+M" + lastRow + "+N" + lastRow);
                    }
                    else {
                        sheet.getRange(lastRow, OpenPositionsColumn.CostBasis).setValue(position.getCurrentBasis());
                    }
                    sheet.getRange(lastRow, OpenPositionsColumn.NetLiq).setFontWeight("bold").setValue(position.getOpenNetLiq());
                    sheet.getRange(lastRow, OpenPositionsColumn.ProfitLoss).setFormula("=E" + lastRow + "+F" + lastRow);
                    sheet.getRange(lastRow, OpenPositionsColumn.ProfitLossPercent).setFontWeight("bold").setNumberFormat("#.##%");
                    sheet.getRange(lastRow, OpenPositionsColumn.ProfitLossPercent).setFormula(`=if(D${lastRow} > 0, G${lastRow}/D${lastRow}, (G${lastRow}/D${lastRow}) * -1)`);
                    sheet.getRange(lastRow, OpenPositionsColumn.BiggestDelta).setValue(position.getBiggestDelta());
                    sheet.getRange(lastRow, OpenPositionsColumn.Quantity).setValue(position.getQuantity());
                    sheet.getRange(lastRow, OpenPositionsColumn.TargetNetLiq).setFormula("=((D" + lastRow + "/2)-E" + lastRow + ")*-1");
                    sheet.getRange(lastRow, OpenPositionsColumn.TargetMarketPrice).setFormula("=O" + lastRow + "/P" + lastRow);
                    sheet.getRange(lastRow, OpenPositionsColumn.OpenDate).setValue(Utilities.formatDate(new Date(), "CST", "MM/dd/yyyy"));
                    sheet.getRange(lastRow, OpenPositionsColumn.DaysInTrade).setFormula("=DATEDIF(R" + lastRow + ",TODAY(),\"D\")");
                    sheet.getRange(lastRow, OpenPositionsColumn.OriginalDTE).setValue(position.originalDTE);
                    sheet.getRange(lastRow, OpenPositionsColumn.BiggestDeltaOpen).setValue(position.getBiggestDelta());
                    sheet.getRange(lastRow, OpenPositionsColumn.ContractCodes).setValue(position.getContractCodes());
                    sheet.getRange(lastRow, OpenPositionsColumn.DailyProfitReached).setFormula("=AND(Z" + lastRow + " > Y"+lastRow+", H"+lastRow+" > 0.25)");
                    sheet.getRange(lastRow, OpenPositionsColumn.ExpectedDailyProfit).setFormula("=D" + lastRow + " / T"+lastRow);
                    sheet.getRange(lastRow, OpenPositionsColumn.CurrentDailyProfit).setFormula("=G" + lastRow + " / S"+lastRow);
                    sheet.getRange(lastRow, OpenPositionsColumn.StockShares).setValue(position.getTotalShareCount());
                    sheet.getRange(lastRow, OpenPositionsColumn.AccountName).setValue(position.account);
                    sheet.getRange(lastRow, OpenPositionsColumn.DownsideNotionalRisk).setValue(position.getDownsideNotional());
                    
                    JLog.debug(`Inserted the position ${position.symbol} at the end of the OpenPositions spreadsheet`);
                }
            }
        }


        // var finalRow = sheet.getLastRow();
        // if (finalRow == 0) finalRow = 2;
        let rangeC;
        let valuesC = [];
        if (sheet.getLastRow() > 1) {
            if (JLog.isDebug()) JLog.debug("OpetionsPositionsSheet.write(): Going to get the range FOR Closed search");
            rangeC = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
            valuesC = rangeC.getValues();
        }
        else {
            if (JLog.isDebug()) JLog.debug("There were no data rows in the Open Sheet, so we're leaving the values [] blank");
        }

        //Loops through the spreadsheet and find closed that can be moved
        let closedSheetObj: ClosedPositionsSheet = new ClosedPositionsSheet();
        let closedSheet = closedSheetObj.getSheet();
        JLog.debug("Looping through the spreadsheet to find the Closed rows so we can move them over to the Closed Sheet");
        let cIndex = 1;
        for (let row of valuesC) {
            cIndex++;
            var tmpStatus = row[OpenPositionsColumn.Status - 1];
            if (JLog.isDebug()) JLog.debug(`OpenPositonsShet.write(): The ${row[OpenPositionsColumn.Symbol - 1]} tmpStatus when looking for closed was ${tmpStatus}`)
            if (`${tmpStatus}` === "Closed" || !(portfolio.getPosition(row[OpenPositionsColumn.Symbol -1]))) {
                // HERE IS THE CODE TO MOVE THIS TO THE CLOSED SHEET.
                JLog.info(`The position for ${row[OpenPositionsColumn.Symbol - 1]} is Closeed and will be moved`);
                var targetRange = closedSheet.getRange(closedSheet.getLastRow() + 1, 1);
                sheet.getRange(sheet.getRange(cIndex, OpenPositionsColumn.Status).getRow(), 1, 1, sheet.getLastColumn()).moveTo(targetRange);
                var closedDateRange = closedSheet.getRange(targetRange.getRow(), OpenPositionsColumn.ClosedDate);
                closedDateRange.setValue(Utilities.formatDate(new Date(), "CST", "MM/dd/yyyy"));
                closedSheet.getRange(targetRange.getRow(), OpenPositionsColumn.DaysInTrade).setFormula("=DATEDIF(R" + targetRange.getRow() + ",W" + targetRange.getRow() + ",\"D\")");

                sheet.deleteRow(cIndex);
                //Remove the position from the portfolio so we don't get alerts on it
                Portfolio.instance().removePosition(row[OpenPositionsColumn.Symbol - 1]);
                //Since we deleted one, we need to go back one row in the loop
                cIndex--;
            }
        }
    }

    highlightAlertedField(symbol: string, alertType: AlertType, highlight: HighlightType, noteText : string) {
        JLog.debug(`OpenPositionsSheet.highlightAlertedField(${symbol},${AlertType[alertType]},${HighlightType[highlight]}): Begin`);
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) {
            JLog.debug("Sheet didn't exist, so creating a new one.")
            sheet = this.createNewSheet();
        }

        let range;
        let values = [];
        if (this.cachedValuesForHighlight != null) {
            values = this.cachedValuesForHighlight;
            if (JLog.isDebug()) JLog.debug(`Using cached values for highlight: rows->${values.length}, colums->${values[0].length}`);
        }
        else {
            if (sheet.getLastRow() > 1) {
                if (JLog.isDebug()) JLog.debug("Going to get the range FOR Closed search");
                range = sheet.getRange(2, 1, sheet.getLastRow() - 1, OpenPositionsColumn.BiggestDeltaOpen);
                values = range.getValues();
                this.cachedValuesForHighlight = values;
            }
            else {
                if (JLog.isDebug()) JLog.debug("There were no data rows in the Open Sheet, so we're leaving the values [] blank");
            }
        }


        let i = 1;
        for (let row of values) {
            i++;
            let tmpSymbol = row[OpenPositionsColumn.Symbol-1];
            if (`${tmpSymbol}` === symbol) {
                let tmpField : GoogleAppsScript.Spreadsheet.Range;
                if (alertType === AlertType.BiggestDelta) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.BiggestDelta);
                }
                else if (alertType === AlertType.DaysTillExpiration) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.DTE);
                }
                else if (alertType === AlertType.MaxGain) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.ProfitLossPercent);
                }
                else if (alertType === AlertType.DailyReturnMet) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.ProfitLoss);
                }
                else if (alertType === AlertType.MaxLoss) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.ProfitLossPercent);
        
                }
                else if (alertType == AlertType.StrikeBreached) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.Symbol);
                }
                else if (alertType == AlertType.JArthurRules) {
                    tmpField = sheet.getRange(i, OpenPositionsColumn.ProfitLossPercent);
                }

                if (highlight === HighlightType.PINK) {
                    tmpField.setBackground("pink");
                }
                else if (highlight === HighlightType.RED) {
                    tmpField.setBackground("red");
                }
                else if (highlight === HighlightType.GREEN) {
                    tmpField.setBackground("green");
                }
                else if (highlight === HighlightType.NORMAL) {
                    tmpField.setBackground(null);
                }

                if (noteText) tmpField.setNote(tmpField.getNote() + noteText+ "\n \n");
            }

        }
        if (JLog.isDebug()) JLog.debug("OpenPositionsSheet.highlightAlertedField(): End");
    }

    createNewSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.sheetName);
        sheet.setFrozenColumns(1);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 500, 50).applyRowBanding(SpreadsheetApp.BandingTheme.CYAN, true, true);
        this.createHeaders(sheet);
        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
        SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(1);

        //Sometimes there is a Script 1 sheet there by default...I'll get rid of it if it exists.

        return sheet;
    }

    private createHeaders(sheet) {
        sheet.getRange(1, OpenPositionsColumn.Symbol).setValue("Ticker");
        sheet.getRange(1, OpenPositionsColumn.Status).setValue("Status");
        sheet.getRange(1, OpenPositionsColumn.DTE).setValue("DTE");
        sheet.getRange(1, OpenPositionsColumn.OriginalCredit).setValue("Original Credit");
        sheet.getRange(1, OpenPositionsColumn.CostBasis).setValue("Total Cost Basis");
        sheet.getRange(1, OpenPositionsColumn.NetLiq).setFontWeight("bold").setValue("Open Net Liq");
        sheet.getRange(1, OpenPositionsColumn.ProfitLoss).setValue("Position P/L");
        sheet.getRange(1, OpenPositionsColumn.ProfitLossPercent).setFontWeight("bold").setValue("Position P/L Percent");
        sheet.getRange(1, OpenPositionsColumn.BiggestDelta).setValue("Biggest Delta");
        sheet.getRange(1, OpenPositionsColumn.Adjustment1).setValue("1st Adj Credit");
        sheet.getRange(1, OpenPositionsColumn.Adjustment2).setValue("2nd Adj Credit");
        sheet.getRange(1, OpenPositionsColumn.Adjustment3).setValue("3rd Adj Credit");
        sheet.getRange(1, OpenPositionsColumn.Adjustment4).setValue("4th Adj Credit");
        sheet.getRange(1, OpenPositionsColumn.Adjustment5).setValue("5th Adj Credit");
        sheet.getRange(1, OpenPositionsColumn.TargetNetLiq).setValue("Target Net Liq");
        sheet.getRange(1, OpenPositionsColumn.Quantity).setValue("Quantity");
        sheet.getRange(1, OpenPositionsColumn.TargetMarketPrice).setValue("Target Market Price");

        sheet.getRange(1, OpenPositionsColumn.OpenDate).setValue("Position Open Date");
        sheet.getRange(1, OpenPositionsColumn.DaysInTrade).setValue("Days In Trade");
        sheet.getRange(1, OpenPositionsColumn.OriginalDTE).setValue("Starting DTE");
        sheet.getRange(1, OpenPositionsColumn.BiggestDeltaOpen).setValue("Biggest Delta On Open");
        sheet.getRange(1, OpenPositionsColumn.ContractCodes).setValue("Contract Codes");
        sheet.getRange(1, OpenPositionsColumn.DailyProfitReached).setValue("DPR");
        sheet.getRange(1, OpenPositionsColumn.ExpectedDailyProfit).setValue("Expected Daily Profit");
        sheet.getRange(1, OpenPositionsColumn.CurrentDailyProfit).setValue("Current Daily Profit");
        sheet.getRange(1, OpenPositionsColumn.StockShares).setValue("Stock Shares");
        sheet.getRange(1, OpenPositionsColumn.AccountName).setValue("Account Name");
        sheet.getRange(1, OpenPositionsColumn.DownsideNotionalRisk).setValue("DS Notional Risk");
    }

}

export enum OpenPositionsColumn {
    Symbol = 1,
    Status = 2,
    DTE = 3,
    OriginalCredit = 4,
    CostBasis = 5,
    NetLiq = 6,
    ProfitLoss = 7,
    ProfitLossPercent = 8,
    BiggestDelta = 9,
    Adjustment1 = 10,
    Adjustment2 = 11,
    Adjustment3 = 12,
    Adjustment4 = 13,
    Adjustment5 = 14,
    TargetNetLiq = 15,
    Quantity = 16,
    TargetMarketPrice = 17,
    OpenDate = 18,
    DaysInTrade = 19,
    OriginalDTE = 20,
    BiggestDeltaOpen = 21,
    ContractCodes = 22,
    ClosedDate = 23,
    DailyProfitReached = 24,
    ExpectedDailyProfit = 25,
    CurrentDailyProfit = 26,
    StockShares = 27,
    AccountName = 28,
    DownsideNotionalRisk = 29
}

export enum HighlightType {
    RED,
    GREEN,
    PINK,
    NORMAL
}