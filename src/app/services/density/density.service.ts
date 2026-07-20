import {Injectable} from '@angular/core';
import {LineItem} from '../../interfaces/line-item';

@Injectable({
  providedIn: 'root'
})
export class DensityService {

  constructor() {
  }

  getClassFromDensity(density: number) {
    // GLOB-4437: NMFTA 13-Tier Density introduced on July 19
    if (density < 1) {
      return 400;
    } else if (density >= 1 && density < 2) {
      return 300;
    } else if (density >= 2 && density < 4) {
      return 250;
    } else if (density >= 4 && density < 6) {
      return 175;
    } else if (density >= 6 && density < 8) {
      return 125;
    } else if (density >= 8 && density < 10) {
      return 100;
    } else if (density >= 10 && density < 12) {
      return 92;
    } else if (density >= 12 && density < 15) {
      return 85;
    } else if (density >= 15 && density < 22.5) {
      return 70;
    } else if (density >= 22.5 && density < 30) {
      return 65;
    } else if (density >= 30 && density < 35) {
      return 60;
    } else if (density >= 35 && density < 50) {
      return 55;
    }
    return 50;
  }

  getSuggestedClass(lineItem: LineItem | { width: any; length: any; height: any; handlingUnits: any; totalWeight: any; }) {
    const density = this.getCubicFeetForItem(lineItem) !== 0 ? (lineItem.totalWeight / this.getCubicFeetForItem(lineItem)) : 0;
    return this.getClassFromDensity(density);
  }

  getCubicFeetForItem(lineItem: LineItem | { width: any; length: any; height: any; handlingUnits: any; totalWeight: any; }) {
    const cubicFeet: number = ((lineItem.height * lineItem.length * lineItem.width) / 1728) * lineItem.handlingUnits;
    if (isNaN(cubicFeet)) { return 0; }
    return Math.round(cubicFeet) === cubicFeet ? cubicFeet : parseFloat(cubicFeet.toFixed(2));
  }

  getDensity(lineItem: LineItem): number {
    // Pounds per cubic feet
    const density: number = this.getCubicFeetForItem(lineItem) !== 0 ? ((lineItem.totalWeight ?? 0) / this.getCubicFeetForItem(lineItem)) : 0;
    if (isNaN(density)) { return 0; }
    return Math.round(density) === density ? density : parseFloat(density.toFixed(2));
  }

  getTotalUnitWeight(lineItems: LineItem[]): number {
    let totalUnitWeight = 0;
    if (lineItems.length !== 0) {
      lineItems.forEach(item => {
        totalUnitWeight += (item.unitWeight ? item.unitWeight : 0);
      });
    }
    return totalUnitWeight;
  }

  getTotalWeight(lineItems: LineItem[]): number {
    let totalWeight = 0;
    if (lineItems.length !== 0) {
      lineItems.forEach(item => {
        totalWeight += (item.totalWeight ? item.totalWeight : 0);
      });
    }
    return totalWeight;
  }

  getTotalCubicFeet(lineItems: LineItem[]): number {
    let totalCubicFeet = 0;
    if (lineItems.length !== 0) {
      lineItems.forEach(item => {
        totalCubicFeet += this.getCubicFeetForItem(item);
      });
    }
    return Math.round(totalCubicFeet) === totalCubicFeet ? totalCubicFeet : parseFloat(totalCubicFeet.toFixed(2));
  }

  getTotalDensity(lineItems: LineItem[]): number {
    const totalDensity: number = this.getTotalCubicFeet(lineItems) !== 0 ?
      (this.getTotalWeight(lineItems) / this.getTotalCubicFeet(lineItems)) : 0;
    return Math.round(totalDensity) === totalDensity ? totalDensity : parseFloat(totalDensity.toFixed(2));
  }
}

