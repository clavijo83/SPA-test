import {Component, OnInit, output, signal} from '@angular/core';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-whiteboard',
  standalone: false,
  templateUrl: './whiteboard.html',
  styleUrl: './whiteboard.css',
})
export class Whiteboard implements OnInit {
  navRecordCount = output<number>();
  trackingData = signal<any>(null);

  constructor(private utilityService: UtilityService) {
  }

  ngOnInit() {
    this.utilityService.trackingWhiteboard$.subscribe(value => {
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
