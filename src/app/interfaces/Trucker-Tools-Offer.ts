export interface TruckerToolsOffer {
  offerId: number | null;
  loadNumber: string | null;
  amount: string | null;
  notes: string | null;
  loadOfferId: number | null;
  threadId: number | null;
  offerTimestamp: string | null;
  offerType: string | null;
  carrierName: string | null;
  mcNumber: string | null;
  scacCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string;
  selected?: boolean | false;
  rejected?: boolean | false;
}
