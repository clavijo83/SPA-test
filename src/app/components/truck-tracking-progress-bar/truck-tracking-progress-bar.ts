import {Component, Input, OnInit} from '@angular/core';
import {TruckSave} from '../../interfaces/truck-save';
import {ShipmentSave} from '../../interfaces/shipment-save';

@Component({
  selector: 'app-truck-tracking-progress-bar',
  standalone: false,
  templateUrl: './truck-tracking-progress-bar.html',
  styleUrl: './truck-tracking-progress-bar.css',
})
export class TruckTrackingProgressBar implements OnInit {
  @Input() truck: TruckSave = {} as TruckSave;
  firstShipment: ShipmentSave | null = null;
  lastShipment: ShipmentSave | null = null;
  otherStops: ShipmentSave[] = [] as ShipmentSave[];
  currentStopIndex = 0;

  constructor() {
  }

  ngOnInit(): void {
    // Not pending or complete and has begun tracking with historial events
    this.firstShipment = this.truck.shipments ? this.truck.shipments[0] : null;
    if (this.getCurrentStatus(this.firstShipment) === 'Delivered') {
      this.currentStopIndex++;
    }
    this.lastShipment = this.truck.shipments ? this.truck.shipments[this.truck.shipments.length - 1] : null;

    // Any additional shipments to add
    if (this.truck.shipments && this.truck.shipments.length > 1) {
      for (let i = 0; i < this.truck.shipments.length - 1; i++) {
        this.otherStops.push(this.truck.shipments[i]);
        if (this.getCurrentStatus(this.otherStops[i]) === 'DELIVERED') {
          this.currentStopIndex++;
        }
      }
    }
  }

  getCurrentStatus(shipment: ShipmentSave | null) {
    const lastEvent = shipment?.historicalEvents != null ? shipment.historicalEvents[0] : null;
    return lastEvent != null ? lastEvent.trackingState : null;
  }

  isInTransit(shipment: ShipmentSave) {
    return this.getCurrentStatus(shipment) === 'In Transit' || this.getCurrentStatus(shipment) === 'IN TRANSIT';
  }
}
