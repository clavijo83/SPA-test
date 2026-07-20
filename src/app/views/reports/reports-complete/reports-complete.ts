import {Component, output} from '@angular/core';

@Component({
  selector: 'app-reports-complete',
  standalone: false,
  templateUrl: './reports-complete.html',
  styleUrl: './reports-complete.css',
})
export class ReportsComplete {
  navRecordsCompleteCount = output<number>();

  constructor() {
  }

  recordCount(value: number) {
    this.getRecordCompleteCount(value);
  }

  getRecordCompleteCount(value: number) {
    this.navRecordsCompleteCount.emit(value);
  }
}
