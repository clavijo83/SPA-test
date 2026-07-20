export interface DispatchRequest {
  readyBy: number;
  pickupBy: number;
  shipDate: string;
  contactName: string | '';
  contactPhone: string | '';
  contactEmail: string | '';
  dispatchMessage: string | '';
}
