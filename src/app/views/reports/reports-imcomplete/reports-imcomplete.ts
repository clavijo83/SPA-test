import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-reports-imcomplete',
  standalone: false,
  templateUrl: './reports-imcomplete.html',
  styleUrl: './reports-imcomplete.css',
})
export class ReportsImcomplete {
  @Output() navRecordsIncompleteCount = new EventEmitter<number>(true);

  constructor() {
  }

  recordCount(value: number) {
    this.getRecordIncompleteCount(value);
  }

  getRecordIncompleteCount(value: number) {
    this.navRecordsIncompleteCount.emit(value);
  }
}
