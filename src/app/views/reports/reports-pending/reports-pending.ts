import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-reports-pending',
  standalone: false,
  templateUrl: './reports-pending.html',
  styleUrl: './reports-pending.css',
})
export class ReportsPending {
  @Output() navRecordsPendingCount = new EventEmitter<number>(true);

  constructor() {
  }

  recordCount(value: number) {
    this.getRecordPendingCount(value);
  }

  getRecordPendingCount(value: number) {
    this.navRecordsPendingCount.emit(value);
  }
}
