Getting the FireByArthurTradingEngine up and running.

- Install Node.js and Visual Studio Code
- Install typescript module: npm install typescript --save
- Install ts-node (for running the unit tests locally): npm install ts-node --save
- Install google app script types: npm install @types/google-apps-script --save

- With the .vscode/launch file provided, you should be able to hit ctrl+F5 in Visual Studio Code and the unit tests will run
        --Note: It it not necessary to ever transpile the Typescript code with tsc.

To deploy to Google Sheets:

-Install clasp globally: npm install @google/clasp -g
-Run clasp to create a new app script project in your google account (I suggest calling the script "FireByArthurTradingEngine"): clasp create [scriptTitle] 
-Push your Google App script to your google account: clasp push
-Create a deployable version of that app with the clasp command: clasp version

-Create a new Google Sheet on docs.google.com/sheets. Go to Tools|Script Editor.
-In the script editor, go to Resources | Libraries... Paste the script id of the script app you created with clasp and click "Add". 
        (If you don't have the script id, run "clasp open" on your local command line. The script app will
        open in a new editor in your browser. Got to File|properties in that script editor and you will see the script ID).
        - Select "version 1" of the script (and select development mode so you always use the newly pushed changes).
        - Click save.

- Back on the script editor that is attached to your new Google Sheet, enter a call to the run() method on the script project.
    Like this:

function myFunction() {
   FireByArthurTradingEngine.run();
}


-In the function drop down, select your function in click run (You will have to enable permissions the first time).
    (Assuming you want a Tastyworks csv portfolio file to be imported, make sure you have a csv file somewhere in your
    Google drive named "p.csv" )
    THE FOLLOWING COLUMNS MUST BE IN THE PORTFOLIO CSV FROM TASTYWORKS: Quantity, Cost, / Delta, Theta, NetLiq, Call/Put, Strike Price, DTE
    
    After running once, you can edit the Engine Config tab to set the email address(s), csv file name, etc.

- You can create a scheduled event in the editor that will make the function run regularily. The csv import checks for a new file,
so it will only import when there is new data to be imported.



**Here are some other functions you can add to the script file attached to your Google Sheet:
(Note, if you want continuous integration running, you can create an event for the "runContinuousIntegration() method that runs every minute).


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('J. Arthur Trading')
      .addItem('Run Test Suite','runTestSuite')
      .addToUi();

}

function runTestSuite() {
  FireByArthurTrading.googleSheetsTestSuite();
}

function runContinuousIntegration() {
    if (testScriptChanged()) {
        FireByArthurTrading.runCIProcess();
    }
}

function createTestingTriggers() {
    ScriptApp.newTrigger('runContinuousIntegration')
      .timeBased()
      .everyMinutes(1)
      .create();
}



function testScriptChanged() {
   var file = DriveApp.getFilesByName("FireByArthurTrading").next();
   var fileDate = file.getLastUpdated();
   Logger.log(fileDate);
   
   var scriptUpdatedStr = PropertiesService.getScriptProperties().getProperty("SCRIPT_LAST_UPDATED");
   PropertiesService.getScriptProperties().setProperty("SCRIPT_LAST_UPDATED", fileDate+"");
   
   if (scriptUpdatedStr == null) {
       return true;
   }
   
   var scriptUpdatedDate = new Date(scriptUpdatedStr);
   if (FireByArthurTrading.compareDates(fileDate, scriptUpdatedDate) == 1) {
       return true;
   }
   else {
       return false;
   }
 
}






