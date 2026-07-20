export interface TruckloadRateRequest {
  clientCode: string;
  mileage: string;
  weight: string;
  shipper: Zip;
  consignee: Zip;
  rateType: string;
  equipment: string;
}

export interface Zip {
  zip: string;
}
