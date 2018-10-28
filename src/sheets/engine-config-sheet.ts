import { EngineConfig } from '../engine/engine-config';
import { JLog } from '../utils/jlog';

export class EngineConfigSheet {
    sheetName: string = 'Engine Config';

    deleteSheet() {
       let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName); 
       if (sheet != null) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(sheet);  
    }

    createNewSheet(): any {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.sheetName);
        sheet.getRange(1,1,500,50).applyRowBanding(SpreadsheetApp.BandingTheme.CYAN,true,true);
        this.createHeaders(sheet);

        return sheet;
    }

    read( engineConfig : EngineConfig) {
        if (JLog.isDebug()) JLog.debug("EngineConfigSheet.read() started");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();

        for (var i = 2, rowCount = sheet.getLastRow(); i <= rowCount; i++) {
            let tmpName = sheet.getRange(i, 1).getValue();
            let tmpVal = sheet.getRange(i,2).getValue();

            engineConfig.setConfigByStr(`${tmpName}`,`${tmpVal}`);
            if (JLog.isDebug()) JLog.debug(`Set the config: ${tmpName} to ${tmpVal}`);
        }
        if (JLog.isDebug()) JLog.debug("EngineConfig.read() ended");
    }

    write( engineConfig : EngineConfig) {
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();

        let spreadsheetContainsHash = {};
       
        //Loop through all spreadsheet rows, find existing state and update values
        for (var i = 2, rowCount = sheet.getLastRow(); i <= rowCount; i++) {
            let tmpName = sheet.getRange(i, 1).getValue();

            let stateVal = engineConfig.getConfigByStr(`${tmpName}`);
            
            if (stateVal != null) {
                sheet.getRange(i,2).setValue(stateVal);
                spreadsheetContainsHash[`${tmpName}`] = stateVal;
            }
        }

        //Loop through all properties and add the values that weren't already on the spreadsheet
        for (let propName of engineConfig.getAllPropertyNames()) {
            if (spreadsheetContainsHash[propName] == null) {
                let lastRow = sheet.getLastRow();
                sheet.insertRowAfter(lastRow);
                lastRow++;
                sheet.getRange(lastRow,1).setValue(propName);
                sheet.getRange(lastRow,2).setValue(engineConfig.getConfigByStr(propName));
            }
        }
    }

    private createHeaders(sheet) {
        sheet.getRange(1, 1).setValue("Engine Configurations");
    }



}