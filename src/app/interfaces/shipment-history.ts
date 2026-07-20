import {HistoricalEvent} from './historical-event';
import {Stop} from './stop';
import {ShipmentDetails} from './shipment-details';
import {Location} from './location';
import {CarrierDetail} from './carrier-detail';
import {Client} from './client';
import {BillTo} from './bill-to';
import {ReferenceField} from './reference-field';
import {Accessorial} from './accessorial';
import {UserDetail} from './user-detail';
import {LineItem} from './line-item';
import {ManualQuote} from './manual-quote';
import {NotificationMail} from './notification-mail';
import {TrackingContacts} from './tracking-contacts';
import {SelectedRate} from './selectedRate';

// Shipment History object comprised of base shipment detail, events, and stops
export interface ShipmentHistory {
  billTo: BillTo | null;
  shipmentDetail: ShipmentDetails | null;
  historicalEvents: HistoricalEvent[] | null;
  stops: Stop [] | null;
  shipper: Location | null;
  consignee: Location | null;
  carrierDetail: CarrierDetail | null;
  client: Client | null;
  referenceFields: ReferenceField[] | null;
  accessorials: Accessorial[] | null;
  user: UserDetail | null;
  lineItems: LineItem[] | null;
  openReferenceFields: any[] | [];
  manualQuotes: ManualQuote[] | [];
  notificationMails: NotificationMail[] | [];
  trackingContacts: TrackingContacts[] | [];
  selectedRate?: SelectedRate | null;
}
