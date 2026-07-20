import {Quote} from './quote';

export interface Rate {
  carrierID: string | null;
  carrierName: string | null;
  transitTime: number | 0;
  transitTimeText: string | null;
  mileage: number | 0;
  pointType: number | 0;
  unaccountedFees: string | null;
  accountedFees: string | null;
  negotiationType: string | null;
  quoteNoProcessing: string | null;
  isExceedsCubicCapacity: boolean | false;
  isExceedsMaxWeight: boolean | false;
  exceededMaxWeightMessage: null;
  isExceedsLinearFoot: boolean | false;
  processingFee: string | null;
  overrideProcessingFee: string | null;
  feesMap: {};
  weightBreak: any | null;
  carrierQuote: Quote;
  clientQuote: Quote;
  customQuote: Quote;
  exceedsLinearFoot: boolean | false;
  exceedsCubicCapacity: boolean | false;
  exceedsMaxWeight: boolean | false;
  serviceProviderType: string | null;
  quoteID: string | null;
  volumeRate: boolean | false;
  clientCurrency?: string | null;
  carrierCurrency?: string | null;
  id: string | null;
}
