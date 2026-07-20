import {Component, ViewChild} from '@angular/core';
import {ReportGrid} from '../../../components/report-grid/report-grid';

@Component({
  selector: 'app-reports-search',
  standalone: false,
  templateUrl: './reports-search.html',
  styleUrl: './reports-search.css',
})
export class ReportsSearch {
  @ViewChild(ReportGrid) rg!: ReportGrid;

  constructor() {
  }

  globalSearch(Input: string) {
    this.rg.applyGlobalSearch(Input);
  }

  searchRecords(data: any) {
    this.rg.applyRecordsSearch(data);
    this.rg.showBackBtn = true;
  }

  hideBackButton() {
    this.rg.showBackBtn = false;
  }
}
