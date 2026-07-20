export interface TruckHistoricalEvent {
  eventDate: string | null;
  eventTime: string | null;
  trackingState: string | null;
  trackingMessage: string | null;
  currentLocation: string | null;
  currentCity: string | null;
  currentState: string | null;
  apiUpdate: boolean | false;
  enteredBy: string | null;
  exceptionSummaryCode: string | null;
  faultAssignment: string | null;
}
