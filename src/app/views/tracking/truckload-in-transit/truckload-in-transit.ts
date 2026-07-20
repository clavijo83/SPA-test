import {Component, OnInit, output, signal} from '@angular/core';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-truckload-in-transit',
  standalone: false,
  templateUrl: './truckload-in-transit.html',
  styleUrl: './truckload-in-transit.css',
})
export class TruckloadInTransit implements OnInit {
  navRecordCount = output<number>();
  trackingData = signal<any>(null);

  constructor(private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.utilityService.trackingTruckloadInTransit$.subscribe(value => {
      this.trackingData.set(value);
    });
  }

  recordCount(value: number) {
    this.getRequestRecordCount(value);
  }

  getRequestRecordCount(value: number) {
    this.navRecordCount.emit(value);
  }
}
