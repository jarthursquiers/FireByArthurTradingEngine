
import {OpenPositionsColumn} from "./open-positions-sheet"

export class ClosedPositionsSheet {
    sheetName: string = 'Closed Positions';

    deleteSheet() {
       let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName); 
       if (sheet != null) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet);  
    }

    createNewSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.sheetName);
        sheet.setFrozenColumns(1);
        sheet.setFrozenRows(1);
        sheet.getRange(1,1,500,50).applyRowBanding(SpreadsheetApp.BandingTheme.CYAN,true,true);
        this.createHeaders(sheet);
        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
        SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(2);

        return sheet;
    }

    getSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();
        return sheet;
    }

    private createHeaders(sheet) {
        sheet.getRange(1, OpenPositionsColumn.Symbol).setValue("Ticker");
        sheet.getRange(1, OpenPositionsColumn.Status).setValue("Status");
        sheet.getRange(1, OpenPositionsColumn.DTE).setValue("DTE");
        sheet.getRange(1, OpenPositionsColumn.OriginalCredit).setValue("Original Credit");
        sheet.getRange(1, OpenPositionsColumn.CostBasis).setValue("Total Cost Basis");
        sheet.getRange(1, OpenPositionsColumn.NetLiq).setValue("Open Net Liq");
        sheet.getRange(1, OpenPositionsColumn.ProfitLoss).setValue("Position P/L");
        sheet.getRange(1, OpenPositionsColumn.ProfitLossPercent).setValue("Position P/L Percent");
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
        sheet.getRange(1, OpenPositionsColumn.ClosedDate).setValue("Closed Date");
    }

}