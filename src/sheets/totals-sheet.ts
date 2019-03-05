import { Portfolio } from '../portfolio/portfolio';
import { JLog } from '../utils/jlog';


export class TotalsSheet {
    sheetName: string = "Totals";

    deleteSheet() {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet != null) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet);
    }

    write(portfolio: Portfolio) {
        if (JLog.isDebug()) JLog.debug("Running TotalsSheet.write()");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) {
            if (JLog.isDebug()) JLog.debug("TotalsSheet.write(): Sheet didn't exist, so creating a new one.")
            sheet = this.createNewSheet();
        }

    }



    createNewSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.sheetName);
      
        sheet.getRange(1, 1, 500, 50).applyRowBanding(SpreadsheetApp.BandingTheme.CYAN, true, true);
        this.createHeaders(sheet);
        SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
        SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(2);
        sheet.getRange(TotalsRow.TotalPLOpenPositions,1).setFontWeight("bold").setValue("Total P/L Open Positions");
        sheet.getRange(TotalsRow.TotalPLOpenPositions,2).setFormula("=SUM('Open Positions'!G2:G)");

        sheet.getRange(TotalsRow.TotalCostBasis,1).setFontWeight("bold").setValue("Total Cost Basis");
        sheet.getRange(TotalsRow.TotalCostBasis,2).setFormula("=SUM('Open Positions'!E2:E)");

        sheet.getRange(TotalsRow.TotalCollectedAdjustments,1).setFontWeight("bold").setValue("Total Collected Adjustments");
        sheet.getRange(TotalsRow.TotalCollectedAdjustments,2).setFormula("=SUM('Open Positions'!J2:J998)+SUM('Open Positions'!K2:K998)+SUM('Open Positions'!L2:L998)+SUM('Open Positions'!M2:M998)+SUM('Open Positions'!N2:N998)");

        sheet.getRange(TotalsRow.TotalOpenNetLiq,1).setFontWeight("bold").setValue("Total Open Net Liq");
        sheet.getRange(TotalsRow.TotalOpenNetLiq,2).setFormula("=SUM('Open Positions'!F2:F998)");


        sheet.getRange(TotalsRow.OpenPLChange,1).setFontWeight("bold").setValue("Open P/L Change");

        sheet.getRange(TotalsRow.HighestPLPercentPosition,1).setFontWeight("bold").setValue("Highest P/L Percent Position");
        sheet.getRange(TotalsRow.LowestPLPercentPosition,1).setFontWeight("bold").setValue("Lowest P/L Percent Position");
        sheet.getRange(TotalsRow.RealizedStats,1).setFontWeight("bold").setValue("REALIZED STATS");

        sheet.getRange(TotalsRow.TotalPLClosed,1).setFontWeight("bold").setValue("Total P/L Closed");
        sheet.getRange(TotalsRow.TotalPLClosed,2).setFormula("=SUM('Closed Positions'!G2:G)");

        sheet.getRange(TotalsRow.TotalNumClosedWinners,1).setFontWeight("bold").setValue("Number of Closed Winners");
        sheet.getRange(TotalsRow.TotalNumClosedWinners,2).setFormula("=COUNTIF('Closed Positions'!G2:G,\">-1\")");

        sheet.getRange(TotalsRow.TotalNumClosedLosers,1).setFontWeight("bold").setValue("Number of Closed Losers");
        sheet.getRange(TotalsRow.TotalNumClosedLosers,2).setFormula("=COUNTIF('Closed Positions'!G2:G,\"<0\")");

        sheet.getRange(TotalsRow.WinPercent,1).setFontWeight("bold").setValue("Win Percent");
        sheet.getRange(TotalsRow.WinPercent,2).setFormula("=(B19/(B19+B20))");

        sheet.getRange(TotalsRow.NumberClosedTrades,1).setFontWeight("bold").setValue("Number Closed Trades");
        sheet.getRange(TotalsRow.NumberClosedTrades,2).setFormula("=COUNT('Closed Positions'!G2:G)");

        sheet.getRange(TotalsRow.AveragePLPerPosition,1).setFontWeight("bold").setValue("Average P/L Per Position");
        sheet.getRange(TotalsRow.AveragePLPerPosition,2).setFormula("=B18/B22");

        sheet.getRange(TotalsRow.AverageDaysInTrade,1).setFontWeight("bold").setValue("Average Days In Trade");
        sheet.getRange(TotalsRow.AverageDaysInTrade,2).setFormula("=AVERAGE('Closed Positions'!S2:S)");


        return sheet;
    }

    private createHeaders(sheet) {
        sheet.getRange(1, 1).setValue("OPEN POSITION STATS");
    }


    getPushoverValue() : number {
        let value = 10;

        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);

        if (sheet == null) {
            if (JLog.isDebug()) JLog.debug("TotalsSheet.write(): Sheet didn't exist, so creating a new one.")
            sheet = this.createNewSheet();
        }

        let valStr = sheet.getRange(12,2).getValue();
        if (valStr != null) value = Number(valStr);

        if (value > 100) value = 100;
    
        return value;
    }
    

}


export enum TotalsColumn {

}

export enum TotalsRow {
    TotalPLOpenPositions = 1,
    TotalCostBasis = 2,
    TotalOpenNetLiq = 3,
    TotalCollectedAdjustments = 4,
    OpenPLChange = 5,
    HighestPLPercentPosition = 6,
    LowestPLPercentPosition = 7,
    RealizedStats = 17,
    TotalPLClosed = 18,
    TotalNumClosedWinners = 19,
    TotalNumClosedLosers = 20,
    WinPercent = 21,
    NumberClosedTrades = 22,
    AveragePLPerPosition = 23,
    AverageDaysInTrade = 24

}