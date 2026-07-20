import {Component, OnInit, output, signal} from '@angular/core';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-truckload-dispatched',
  standalone: false,
  templateUrl: './truckload-dispatched.html',
  styleUrl: './truckload-dispatched.css',
})
export class TruckloadDispatched implements OnInit {
  navRecordCount = output<number>();
  trackingData = signal<any>(null);

  constructor(private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.utilityService.trackingTruckloadDispatched$.subscribe(value => {
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
