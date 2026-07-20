import {TargetRate} from './target-rate';

export interface TruckloadRatesResponse {
  creationDate: Date;
  equipment: string;
  mileage: number;
  targetBuy: TargetRate;
  targetSell: TargetRate;
  fuelSurchargeAvg: string;
  ratePerMileAvg: string;
  marketAvg: string;
  marketLow: string;
  marketHigh: string;
  originName: string;
  originType: string;
  destinationName: string;
  destinationType: string;
  timeFrame: string;
}
