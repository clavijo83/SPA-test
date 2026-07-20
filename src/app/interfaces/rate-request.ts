import {RateRequestLineItem} from './rate-request-line-item';

export interface RateRequest {
  clientPlantID: number;
  fromZip: number;
  toZip: number;
  shipDate: string;
  doubleChecked: any[] | null;
  fees: any[] | null;
  lineItems: RateRequestLineItem[] | null;
  additionalValue: number;
}
