

export class JLog {

    private static _logMethod : (text : string) => void;
    private static _instance: JLog;
    private logLevel;

    private contructor() {
        this.logLevel = JLogLevel.INFO;
        JLog._logMethod = (text) => { console.log(text)};
    }

    static instance() {
        return JLog._instance || (JLog._instance = new JLog());
    }

    static setLoggingMethod(logMethod : (text : string) => void) {
        JLog._logMethod = logMethod;
    }

    static setLogLevel(level : JLogLevel) {
        this.instance().logLevel = level;
    }

    static isDebug() : boolean {
        return (this.instance().logLevel === JLogLevel.DEBUG);
    }

    static debug(text:string) {
        if (this.instance().logLevel === JLogLevel.DEBUG) JLog._logMethod(`DEBUG: ${text}`);
    }

    static info(text:string) {
        if (this.instance().logLevel <= JLogLevel.INFO) JLog._logMethod(`INFO: ${text}`);
    }

    static error(text:string) {
        if (this.instance().logLevel <= JLogLevel.ERROR) JLog._logMethod(`!!ERROR!!: ${text}`);
    }


}


export enum JLogLevel {
    DEBUG,
    INFO,
    ERROR,
    OFF
}