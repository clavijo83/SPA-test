import {Component, OnInit, output, signal} from '@angular/core';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-pickup-date-and-time-passed',
  standalone: false,
  templateUrl: './pickup-date-and-time-passed.html',
  styleUrl: './pickup-date-and-time-passed.css',
})
export class PickupDateAndTimePassed implements OnInit {
  navRecordCount = output<number>();
  trackingData = signal<any>(null);

  constructor(private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.utilityService.trackingPickupDateAndTimePassed$.subscribe(value => {
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
