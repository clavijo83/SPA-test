export interface ShipmentRecord {
  ClientCode: string | null;
  ShipmentID: number;
  Carrier: string | null;
  PRONumber: string | null;
  Shipper: string | null;
  Consignee: string | null;
  PUDate: string | null;
  BOLNumber: string | null;
  ActualDelivery: string | null;
  ScheduledDelivery: string | null;
  TrackingStatus: string | null;
  TrackingAvailable: string | null;
  Origin: string | null;
  Destination: string | null;
  DispatchMethod: string | null;
  groupID?: string | null;
  Priority: string | number | null;
}
