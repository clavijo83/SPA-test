export interface ShipmentReport {
  reportDetail: ReportDetail;
  shipments: Shipment[];
}

export interface ReportDetail {
  maxResults: number;
  maxResultsExceeded: boolean;
}

export interface Shipment {
  shipmentID: number;
  truckID: number;
  clientCode: string;
  proNumber: string;
  shipDate: Date;
  deliveryDate: Date;
  carrier: string;
  shipper: Info;
  consignee: Info;
  totalPieces: string;
  totalHU: string;
  totalWeight: number;
  clientCost: string;
  carrierCost: string;
  mode: string;
  status: string;
  bolNumber: string;
  poNumber: string;
  stopOrder: number;
}

export interface Info {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}
