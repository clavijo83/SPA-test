export interface HistoricalEvent {
  carrierScac: string | null;
  proNumber: string | null;
  bolNumber: string | null;
  poNumber: string | null;
  pickupNumber: string | null;
  eventDate: string | null;
  eventTime: string | null;
  trackingState: string | null;
  trackingMessage: string | null;
  currentLocation: string | null;
  destinationETA: string | null;
  apiUpdate: boolean | false;
  enteredBy: string | null;
  entryTimeStamp?: string | null;
}
