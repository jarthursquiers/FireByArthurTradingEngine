import { HashMap } from '../utils/util-classes';



export class EngineState {
    private stateHash : HashMap = new HashMap();
    private static _instance : EngineState;
    private static _persistStateFunction : (state : EngineState) => void;
    private dataChangedType : DataChangedType = DataChangedType.NotChanged;

    private constructor() {

    }

    static instance() : EngineState {
        return EngineState._instance || (EngineState._instance = new EngineState());
    }

    static setPersistStateFunction(persistStateFunction : (state : EngineState) => void) {
        EngineState._persistStateFunction = persistStateFunction;
    }

    persist() {
        if (EngineState._persistStateFunction != null) {
            EngineState._persistStateFunction(this);
        }
    }

    getDataChangedType() : DataChangedType {
        return this.dataChangedType;
    }

    setDataChangedType(changedType : DataChangedType) {
        if (changedType === DataChangedType.AllDataChanged || changedType == DataChangedType.EquityOnly)
            this.setState(EngineStateProperty.DataUpdatedDate, new Date());
        this.dataChangedType = changedType;
    }

    setState(propertyName : EngineStateProperty, value : string | number | Date) {
        this.stateHash.put(EngineStateProperty[propertyName],value);
    }

    getState(propertyName : EngineStateProperty) : string {
        return this.getStateByStr(EngineStateProperty[propertyName]);
    }

    getStateByStr(propertyName : string) : string {
        if (this.stateHash.get(propertyName) == null) return null;
        else return `${this.stateHash.get(propertyName)}`;
    }

    setStateByStr(propertyName : string, value : string | number | Date) {
        this.stateHash.put(propertyName,value);
    }

    getAllPropertyNames() {
        return this.stateHash.getKeys();
    }

    clearSymbol(symbol : string) {
        let keys : string[] = this.stateHash.getKeys();
        for (let key of keys) {
            if (key.indexOf(symbol+"-") === 0) {
                this.stateHash.remove(key);
            }
        }
    }

}

export enum DataChangedType {
    NotChanged,
    EquityOnly,
    AllDataChanged
}




export enum EngineStateProperty {
    DateLastCSVLoad,
    CSVTaskLastRan,
    QuoteAPITaskLastRan,
    PushoverTaskLastRan,
    MarketOpen,
    QuotesDelayed,
    DataUpdatedDate,
    PushoverSentDate
}