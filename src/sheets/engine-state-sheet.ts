import { EngineState } from '../engine/engine-state';
import { JLog } from '../utils/jlog';
export class EngineStateSheet {
    sheetName: string = 'Engine State';

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

    read( engineState : EngineState) {
        if (JLog.isDebug()) JLog.debug("EngineStateSheet.read() started");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();

        for (var i = 2, rowCount = sheet.getLastRow(); i <= rowCount; i++) {
            let tmpName = sheet.getRange(i, 1).getValue();
            let tmpVal = sheet.getRange(i,2).getValue();

            engineState.setStateByStr(`${tmpName}`,`${tmpVal}`);
            if (JLog.isDebug()) JLog.debug(`Set this state: ${tmpName} = ${tmpVal}`);
        }
        if (JLog.isDebug()) JLog.debug("EngineStateSheet.read() ended");
    }

    write( engineState : EngineState) {
        if (JLog.isDebug()) JLog.debug("EngineStateSheet.write() started");
        let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
        if (sheet == null) sheet = this.createNewSheet();

        let spreadsheetContainsHash = {};
       
        //Loop through all spreadsheet rows, find existing state and update values
        for (var i = 2, rowCount = sheet.getLastRow(); i <= rowCount; i++) {
            let tmpName = sheet.getRange(i, 1).getValue();

            let stateVal = engineState.getStateByStr(`${tmpName}`);
            
            if (stateVal != null) {
                sheet.getRange(i,2).setValue(stateVal);
                spreadsheetContainsHash[`${tmpName}`] = stateVal;
                if (JLog.isDebug()) JLog.debug(`Wrote the state to the sheet: ${tmpName} = ${stateVal}`);
            }
            else {
                //If this state is no longer in the engine, remove it
                sheet.deleteRow(i);
                //go up one row, since we deleted
                i--;
                rowCount--;
            }
        }

        //Loop through all properties and add the values that weren't already on the spreadsheet
        for (let propName of engineState.getAllPropertyNames()) {
            if (spreadsheetContainsHash[propName] == null) {
                let lastRow = sheet.getLastRow();
                sheet.insertRowAfter(lastRow);
                lastRow++;
                sheet.getRange(lastRow,1).setValue(propName);
                sheet.getRange(lastRow,2).setValue(engineState.getStateByStr(propName));
                if (JLog.isDebug()) JLog.debug(`EngineStateSheet.write()-> Adding this new property that wasn't on the sheet: ${propName} = ${engineState.getStateByStr(propName)}`);
            }
        }
        if (JLog.isDebug()) JLog.debug("EngineStateSheet.write() ended");
    }

    private createHeaders(sheet) {
        sheet.getRange(1, 1).setValue("Engine State Data");
    }



}