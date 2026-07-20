import {Component} from '@angular/core';
import {LineItem, LineItem2} from '../../interfaces/line-item';
import {MileageService} from '../../services/mileage/mileage.service';
import {DensityService} from '../../services/density/density.service';
import {LinearFootService} from '../../services/linear-foot/linear-foot.service';

@Component({
  selector: 'app-freight-totals',
  standalone: false,
  templateUrl: './freight-totals.html',
  styleUrl: './freight-totals.css',
})
export class FreightTotals {
  freights!: any[];
  totalHUSum = 0;
  totalPiecesSum = 0;
  totalLbsSum = 0;
  mileage = 0;
  linearFeet = 0;
  totalUnitWeight = 0;
  totalCubicFeet = 0;
  totalDensity = 0;
  prevLineItems: LineItem2[] = [];

  constructor(private mileageService: MileageService, private densityService: DensityService, private rfs: LinearFootService) {
  }

  updateTotals(freights: any[]) {
    this.freights = [];
    this.freights = freights;
    // before recount total price needs to be reset.
    this.totalHUSum = 0;
    this.totalPiecesSum = 0;
    this.totalLbsSum = 0;

    for (const i in freights) {
      const totalHU = freights[i].handlingUnits == '' ? 0 : parseFloat(freights[i].handlingUnits);
      const totalPieces = freights[i].pieces == '' ? 0 : parseFloat(freights[i].pieces);
      const totalLbs = freights[i].totalWeight == '' ? 0 : parseFloat(freights[i].totalWeight);
      // update total price for all units
      this.totalHUSum += totalHU;
      this.totalPiecesSum += totalPieces;
      this.totalLbsSum += totalLbs;
    }

    if (this.freights.find(item => item.unitType == 'TRUCK')) {
      this.linearFeet = 53;
      this.prevLineItems = [];
    } else {
      this.calculateLinearFeet();
    }

    // Calculate Totals
    this.calculateTotalUnitWeight();
    this.calculateTotalCubicFeet();
    this.calculateTotalDensity();
  }

  calculateLinearFeet() {
    const prevlinearFeet = this.linearFeet;
    let lineItems: LineItem2[] = [];

    if (this.freights.length > 0) {

      this.freights.forEach(item => {
        if (item.length != '' && parseInt(item.length) > 0 &&
          item.width != '' && parseInt(item.width) > 0 &&
          item.height != '' && parseInt(item.height) > 0) {
          lineItems.push(this.mapLineItem(item));
        }
      });

      if (lineItems.length === 0) {
        this.linearFeet = 0;
      }
      if (lineItems.length > 0 && JSON.stringify(lineItems) == JSON.stringify(this.prevLineItems)) {
        this.linearFeet = prevlinearFeet;
      }

      if (lineItems.length > 0 && JSON.stringify(lineItems) !== JSON.stringify(this.prevLineItems)) {
        this.prevLineItems = lineItems;
        this.rfs.calculateLinearFoot(lineItems).subscribe({
          next: (response: any) => {
            this.linearFeet = response ? response : 0;
          }
        });
      }
    } else {
      this.linearFeet = 0;
    }
  }

  calculateTotalUnitWeight() {
    let lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.forEach(item => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalUnitWeight = this.densityService.getTotalUnitWeight(lineItems);
    }
  }

  calculateTotalCubicFeet() {
    let lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.forEach(item => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalCubicFeet = this.densityService.getTotalCubicFeet(lineItems);
    }
  }

  calculateTotalDensity() {
    let lineItems: LineItem[] = [];
    if (this.freights.length !== 0) {
      this.freights.forEach(item => {
        lineItems.push(this.mapLineItems(item));
      });
      this.totalDensity = this.densityService.getTotalDensity(lineItems);
    }
  }

  mapLineItems(value: any) {
    return {
      productID: value.productID,
      productCode: '',
      productDescription: value.productDescription,
      nmfc: value.nmfc,
      freightClass: value.freightClass,
      hazmat: value.hazmat,
      handlingUnits: value.handlingUnits,
      unitType: value.unitType,
      pieces: value.pieces,
      length: value.length,
      width: value.width,
      height: value.height,
      unitWeight: value.unitWeight,
      totalWeight: value.totalWeight,
      stackable: value.stackable,
      sameSkid: value.sameSkid,
      location: value.location
    };
  }

  mapLineItem(value: any) {
    let lineItem: LineItem2 = {
      freightClass: value.freightClass,
      weight: value.weight,
      handlingUnits: value.handlingUnits,
      unitType: value.unitType,
      length: value.length,
      width: value.width,
      height: value.height,
      stackable: value.stackable,
      sameSkid: value.sameSkid
    };
    return lineItem;
  }

  setMileage(shipperZip = '', consigneeZip = '', shipmentType = 'LTL') {
    this.mileageService.getMileage(shipperZip, consigneeZip, shipmentType).subscribe({
      next: response => {
        this.mileage = response.mileage;
      }, error: () => {
        this.mileage = 0;
      }
    });
  }
}
