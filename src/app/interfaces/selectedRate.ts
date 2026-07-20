export interface SelectedRate {
  carrierType: string;
  rateDate: string;
  rates: string;
}

export interface OriginalRate {
  quoteNumber: string;
  carrierCode: string;
  transitTime: string;
  currencyCode: string;
  serviceLevel: string;
  serviceLevelCode: string;
  amount: string;
  charges: Charges[];
  rateExpireDate: string;
  fuelDate: string;
  deliveryDate: string;
  notes: string;
}

export interface Charges {
  code: string;
  description: string;
  amount: string;
}

