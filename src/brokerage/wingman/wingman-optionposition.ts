import { OptionsPosition } from "../../portfolio/optionsposition";

export class WingmanOptionPosition extends OptionsPosition {
    originalBasis : number = 0;
    currentBasis: number = 0;
    amount : number = 0;
    quantity : number = 0;

    getOpenNetLiq(): number { 
        return 0;
    }

    getQuantity(): number {
        return this.quantity;
    }

    getClass(): string {
        return "wingman";
    }

    getCurrentBasis() : number {
        return this.amount;
    }


}