import {VolumeRateLocation} from './volume-rate-location';
import {VolumeRateLineItem} from './volume-rate-line-item';

export interface VolumeRateRequest {
  clientCode: string | null;
  shipper: VolumeRateLocation | null;
  consignee: VolumeRateLocation | null;
  shipDate: string | null;
  terms: string | null;
  fees: any[] | null;
  lineItems: VolumeRateLineItem[] | [];
  totalLinearFoot: number | null;
}
