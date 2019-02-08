import {Portfolio} from '../portfolio/portfolio';

export interface IDataLoader {
    //loadPortfolioData(callback : (portfolio:Portfolio) => void);
  //  loadPortfolioData(portfolio:Portfolio);
  //  refreshWithCSV(csvString : string, aPortfolio : Portfolio);
   // refreshData(portfolio:Portfolio);

    loadCSVData(portfolio:Portfolio);
    loadAPIQuoteData(portfolio:Portfolio);
    
}