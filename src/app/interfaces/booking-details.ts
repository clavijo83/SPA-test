export interface BookingDetails {
  scheduledPickup: Date | null;
  scheduledDelivery: Date | null;
  age: number | null;
  status: string | null;
  mode: string | null;
  pickupDate: Date | null;
  deliveryDate: Date | null;
  proNum: string | null;
  pickupNumber: string | null;
}
