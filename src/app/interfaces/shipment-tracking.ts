export interface ShipmentTracking {
  ClientCode: string | null;
  ShipmentID: number;
  Carrier: string | null;
  PROnumber: string | null;
  Origin: string | null;
  Destination: string | null;
  ScheduledDelivery: string | null;
  BOLNumber: string | null;
  PUDate: string | null;
  EstimatedDelivery: string | null;
  TrackingStatus: string | null;
  DeliveryTime: string | null;
  Exception: string | null;
  Shipper: string | null;
  Consignee: string | null;
  NewEDD: string | null;
  RowType: string | null;
  NeedsManagement: boolean | false;
  Priority: string | null;
  GroupID: string | null;
  GroupEmail: string | null;
  ActualShipDate: string | null;
  ActualDeliveryDate: string | null;
  PickedupBy: string | null;
  ReadyBy: string | null;
  Mode: string | null;
}
