export interface TruckFees {
  truckFeesId: number | null;
  truckId: number | null;
  accessorialTypeId: number | null;
  carrierCharge: boolean | true;
  customerCharge: boolean | true;
  amount: number | null;
  sellAmount: number | null;
  truckQuoteId: number | null;
  carrierId: number | null;
  feeIncurredAt: string | null;
  feeStartTime: string | null;
  feeEndTime: string | null;
  stopNum: number | null;
}
