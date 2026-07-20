import {Component, Input, OnInit} from '@angular/core';
import {ShipmentHistory} from '../../interfaces/shipment-history';
import {Stop} from '../../interfaces/stop';

@Component({
  selector: 'app-tracking-progress-bar',
  standalone: false,
  templateUrl: './tracking-progress-bar.html',
  styleUrl: './tracking-progress-bar.css',
})
export class TrackingProgressBar implements OnInit {
  @Input() shipmentHistory: ShipmentHistory = {} as ShipmentHistory;
  public originStop!: Stop[];
  public destinationStop!: Stop[];
  public stops!: Stop[];
  public latestStopIndex: number[] = [];
  public currentStopIndex: number | undefined;
  public currentStatus: any = '';
  public origin: any = '';
  public destination: any = '';

  constructor() {
  }

  ngOnInit(): void {
    // shipmentHistory.stop array, if provided, will always include an origin and destination
    // all others are intermittent stops / terminals
    if (this.shipmentHistory.stops && this.shipmentHistory.stops.length > 0) {
      this.originStop = this.shipmentHistory.stops.filter(value => value.stopType === 'ORIGIN');
      this.destinationStop = this.shipmentHistory.stops.filter(value => value.stopType === 'DESTINATION');
      this.stops = this.shipmentHistory.stops.filter(value => value.stopType === 'TERMINAL');


      // IF THERE ARE MULTIPLE ARRIVED STATUSES - GET THE LATEST
      this.stops.forEach((value, index) => {
        if (value.statusCode === 'ARRIVED') {
          this.latestStopIndex.push(index);
        }
      });
      this.currentStopIndex = this.latestStopIndex.pop();
      this.checkStopStatus();
    } else {
      this.currentStatus = this.shipmentHistory?.shipmentDetail?.shipmentStatus;
      this.origin = this.shipmentHistory?.shipper?.city + ', ' + this.shipmentHistory?.shipper?.state;
      this.destination = this.shipmentHistory?.consignee?.city + ',' + this.shipmentHistory?.consignee?.state;
    }
  }

  checkStopStatus() {
    // METHOD GETS THE INDEX WHERE STATUS CODE IS NULL AND SETS TO UNKNOWN - CASES WHERE STATUS CODE ISN'T BEING UPDATED AND IS NULL
    let currentIndex = 0;
    this.shipmentHistory.stops?.forEach((value, index) => {
        if (value.statusCode === null) {
          currentIndex = index;
          if (this.shipmentHistory.stops) {
            this.shipmentHistory.stops[currentIndex].statusCode = 'UNKNOWN';
          }
        }
      }
    );
  }
}
