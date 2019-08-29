# The Fire By Arthur Trading Engine
This is designed as a Google Sheets add on for options traders that provides sophisticated portfolio alerts, portfolio statistics, and Apple Watch face integration.

It is written in Typescript to allow for an object oriented structure, and depends on "clasp" for deploying the app to Google Apps.



## Getting the FireByArthurTradingEngine up and running.

- Install Node.js and Visual Studio Code
- Clone the FireByArthurTradingEngine repository to a directory on your computer 
- Install typescript module: npm install typescript --save
- Install ts-node (for running the unit tests locally): npm install ts-node --save
- Install google app script types: npm install @types/google-apps-script --save

- With the .vscode/launch file provided, you should be able to hit ctrl+F5 in Visual Studio Code and the unit tests will run
        --Note: It it not necessary to ever transpile the Typescript code with tsc.

## To deploy to Google Sheets:

- Install clasp globally: npm install @google/clasp -g
- It is recommended to first create a GoogleSheet and open the attached script by going to Tools | Script Editor
- At this point, you should create a separate local directory that is used for staging a deployingment to your Google Sheet. If you look at the googledeploy.cmd for an example of kicking off a deployment, you see how that directory can be named FireByArthurTradingEngineV3.
- Now, in the Google Sheet script editor, you can get the project ID of the script by going to File | Project Properties.
- Once you have that ID, you can clone the Google Script to your local deployment directory by changing to that directory and executing this command: clasp clone <Project ID>
- The Code.gs file will appear in that directory and now a deployment can be created by copying over the src directory (see googledeploy.cmd script for an example), and modifying the Code.gs.
- Push your Google App script to the sheet with: clasp push
- Keep in mind that with this method, we pushing the entire trading engine as the attached script for the Google Sheet you created. All of the scripts from the engine will appear as different files, and Code.gs is still the primary launching point.


- You want to make sure the Code.gs file contains at least contains this method.

    
```javascript
   function runEngine() {
    FBATERun();
}
```


- In the function drop down, select your function in click run (You will have to enable permissions the first time).
    (Assuming you want a Tastyworks csv portfolio file to be imported, make sure you have a csv file somewhere in your
    Google drive named "p.csv" )
    THE FOLLOWING COLUMNS MUST BE IN THE PORTFOLIO CSV FROM TASTYWORKS: Quantity, Cost, / Delta, Theta, NetLiq, Call/Put, Strike Price, DTE
    
After running once, you can edit the Engine Config tab to set the email address(s), csv file name, etc.

- You can create a scheduled event in the editor that will make the function run regularily. The csv import checks for a new file,
so it will only import when there is new data to be imported.



** Here are some other functions you can add to the script file attached to your Google Sheet:
(Note, if you want continuous integration running, you can create an event for the "runContinuousIntegration() method that runs every minute).

```javascript
  function onOpen() {
    FBATEOnOpen();  
}

function runEngine() {
    FBATERun();
}


function enableTrigger() {
   ScriptApp.newTrigger('runEngine')
      .timeBased()
      .everyMinutes(1)
      .create();
}

function disableTrigger() {
   var triggers = ScriptApp.getProjectTriggers();
   for (var i = 0; i < triggers.length; i++) {
     if (triggers[i].getHandlerFunction().equals("runEngine")) {
       ScriptApp.deleteTrigger(triggers[i]);
     }    
    
   }
  
}

function createTimedTriggers() {
  ScriptApp.newTrigger('enableTrigger')
      .timeBased()
      .atHour(6)
      .everyDays(1)
      .create();
  
  ScriptApp.newTrigger('disableTrigger')
      .timeBased()
      .atHour(16)
      .everyDays(1)
      .create();
}


function tdaTest() {
    tdAmeritradeTest();
}

function tdaLogin() {
    tdAmeritradeLogin();
}

function tdaLogoff() {
    tdaLogout();
}

function authCallback(request) {
    tdaCallback(request);
}

```

## Disclaimer

THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM “AS IS” WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR CORRECTION.






