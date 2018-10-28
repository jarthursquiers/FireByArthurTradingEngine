

export class HashMap {
    put(key: string, value: any) {
        this[key] = value;
    }

    get(key: string) {
        return this[key];
    }

    remove(key: string) {
        delete this[key];
    }

    getValues(): any[] {
        let values: any[] = [];
        for (let k in this) {
            if (this.hasOwnProperty(k)) {
                values.push(this[k]);
            }
        }

        return values;
    }

    getKeys(): any[] {
        let keys: any[] = [];
        for (let k in this) {
            if (this.hasOwnProperty(k)) {
                keys.push(k);
            }
        }

        return keys;
    }
}

/** 
 * Doing a date compare that drops off miliseconds.
 * If they are equal, 0 is returned otherwise date1 is returned
 * if it is the most recent, 2 returned is it is more recent
*/
export function compareDates(date1 : Date, date2 : Date) : number {
    let stringRep1 = `${date1}`;
    let stringRep2 = `${date2}`;
    let wDate1 = new Date(stringRep1);
    let wDate2 = new Date(stringRep2);

    if (wDate1.getTime() === wDate2.getTime()) {
        return 0;
    }
    else if (wDate1.getTime() > wDate2.getTime()) {
        return 1;
    }
    else {
        return 2;
    }
}


export function CSVToArray( strData, strDelimiter = ',' ){
    // Check to see if the delimiter is defined. If not,
      // then default to comma.
      strDelimiter = (strDelimiter || ",");

      // Create a regular expression to parse the CSV values.
      var objPattern = new RegExp(
          (
              // Delimiters.
              "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

              // Quoted fields.
              "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

              // Standard fields.
              "([^\"\\" + strDelimiter + "\\r\\n]*))"
          ),
          "gi"
          );


      // Create an array to hold our data. Give the array
      // a default empty first row.
      var arrData = [[]];

      // Create an array to hold our individual pattern
      // matching groups.
      var arrMatches = null;


      // Keep looping over the regular expression matches
      // until we can no longer find a match.
      while (arrMatches = objPattern.exec( strData )){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if (
              strMatchedDelimiter.length &&
              (strMatchedDelimiter != strDelimiter)
              ){

              // Since we have reached a new row of data,
              // add an empty row to our data array.
              arrData.push( [] );

          }


          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          if (arrMatches[ 2 ]){

              // We found a quoted value. When we capture
              // this value, unescape any double quotes.
              var strMatchedValue = arrMatches[ 2 ].replace(
                  new RegExp( "\"\"", "g" ),
                  "\""
                  );

          } else {

              // We found a non-quoted value.
              var strMatchedValue = arrMatches[ 3 ];

          }


          // Now that we have our value string, let's add
          // it to the data array.
          arrData[ arrData.length - 1 ].push( strMatchedValue );
      }

      // Return the parsed data.
      return( arrData );
  }