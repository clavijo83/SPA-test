import {Quote} from './quote';

export interface VolumeRate {
  carrierID: string | null;
  carrierName: string | null;
  serviceLevel: string | null;
  quoteNumber: string | null;
  transitTime: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  pointType: number | null;
  feesMap: null;
  carrierQuote: Quote | null;
  clientQuote: Quote | null;
  warning: any | null;
}
