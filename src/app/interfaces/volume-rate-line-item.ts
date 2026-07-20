export interface VolumeRateLineItem {
  productDescription: string | null;
  unitType: string | null;
  freightClass: number | null;
  handlingUnits: number | null;
  totalWeight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  stackable: boolean | false;
}
