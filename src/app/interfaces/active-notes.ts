export interface ActiveNotes {
  id: number | null;
  clientCode: string;
  clientName?: string;
  groupID: number;
  groupName?: string;
  carrierID: number | null;
  carrierName?: string;
  shipperState: string | null;
  consigneeState: string | null;
  user: string;
  note: string;
  timestamp?: string;
}
