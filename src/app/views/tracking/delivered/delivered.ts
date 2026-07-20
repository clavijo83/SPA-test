import {Component, OnInit, output, signal} from '@angular/core';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-delivered',
  standalone: false,
  templateUrl: './delivered.html',
  styleUrl: './delivered.css',
})
export class Delivered implements OnInit {
  navRecordCount = output<number>();
  trackingData = signal<any>(null);

  constructor(private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.utilityService.trackingDelivered$.subscribe(value => {
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
