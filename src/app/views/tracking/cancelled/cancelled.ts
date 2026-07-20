import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-cancelled',
  standalone: false,
  templateUrl: './cancelled.html',
  styleUrl: './cancelled.css',
})
export class Cancelled {
  @Output() navCancelledRecordCount = new EventEmitter<number>(true);

  constructor() {
  }

  recordCount(value: number) {
    this.getCancelledRecordCount(value);
  }

  getCancelledRecordCount(value: number) {
    this.navCancelledRecordCount.emit(value);
  }
}
