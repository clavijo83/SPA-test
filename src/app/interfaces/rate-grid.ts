import {RateType} from './rate-type';

export interface RateGrid {
  assigned?: boolean | null;
  id: number | null;
  rateType: RateType | null;
  carrierID: string | null;
  carrierName: string | null;
  transitTime: any | null;
  ilCost: string | null;
  clientCost: string | null;
  customCost: string | null;
  feesMap: any | {};
  carrierQuote: any | null;
  notes?: any | null;
  carrierCost?: any | null;
  quoteNumber?: any | null;
  timeStamp?: any | null;
  clientQuote: any | null;
  customerQuote: any | null;
  quoteID: any | null;
  warning: any | null;
  isVolumeRate: boolean | false;
  expirationDate: string | null;
  negotiationType: string | null;
  // truckload columns
  targetRateID: number | null;
  creationDate: string | null;
  fuelSurchargeBuy: string | null;
  fuelSurchargeSell: string | null;
  targetBuy: string | null;
  targetSell: string | null;
  exceedsLinearFoot: boolean | false | null;
  exceedsCubicCapacity: boolean | false | null;
  exceedsMaxWeight: boolean | false | null;
  isTLRate: boolean | false;
  processingFee: string | null;
  mileage?: number | null;
  // Truck Fees columns
  carrierCharge: number | null | undefined;
  customerCharge: number | null | undefined;
  serviceLevel?: string | null;
  fuelSurchargeAvg: string | null;
  ratePerMileAvg: string | null;
  marketAvg: string | null;
  marketLow?: string | null;
  marketHigh?: string | null;
  originName?: string | null;
  originType?: string | null;
  destinationName?: string | null;
  destinationType?: string | null;
  timeFrame?: string | null;
  equipment?: string | null;
  currencyType?: string | null;
  serviceProviderType: string | null;
  carCurrencyType?: string | null;
  UUID?: string | null;
}
