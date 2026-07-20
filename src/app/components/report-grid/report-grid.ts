import {Component, input, OnInit, output, signal, ViewChild, WritableSignal} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';
import {DataTable} from '../data-table/data-table';
import moment from 'moment';
import {ReportsService} from '../../services/reports/reports.service';
import {ShipmentRecord} from '../../interfaces/shipment-record';
import {Global} from '../../common/global';

@Component({
  selector: 'app-report-grid',
  standalone: false,
  templateUrl: './report-grid.html',
  styleUrl: './report-grid.css',
})
export class ReportGrid implements OnInit {
  @ViewChild(DataTable) dt!: DataTable;
  reportTableColumns: WritableSignal<any> = signal([]);
  sortOrder = [[0, 'desc']]
  recordCount = output<number>();
  reportData: WritableSignal<ShipmentRecord[]> = signal([]);
  status = input('');
  reportGridName = input('');
  advancedFilterData: WritableSignal<any> = signal([]);
  global = Global;
  showBackBtn = false;

  constructor(private spinner: NgxSpinnerService, private rs: ReportsService) {
  }

  ngOnInit(): void {
    if (this.status() === 'Search') {
      this.reportTableColumns.set([
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'trackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              const isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span tabindex="0">' +
                    '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              return '<span hidden>1</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
            }
          }
        },
        {
          title: 'Code',
          data: 'clientCode',
          orderable: true,
          targets: 0,
          width: '6%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'ID',
          data: 'shipmentID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'PU Date',
          data: 'pudate',
          orderable: true,
          targets: 2,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Original EDD',
          data: 'scheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier',
          data: 'carrier',
          orderable: true,
          targets: 4,
          width: '7%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'pronumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Shipper',
          data: 'shipper',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Consignee',
          data: 'consignee',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Tracking Status',
          data: 'trackingStatus',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        }
      ]);
    }
    if (this.status() === 'Pending' || this.status() === 'Quote') {
      this.reportTableColumns.set([
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              const isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 1) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 2) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span tabindex="0">' +
                    '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              return '<span hidden>1</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          orderable: true,
          targets: 0,
          width: '6%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'ID',
          data: 'ShipmentID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'PU Date',
          data: 'PUDate',
          orderable: true,
          targets: 2,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Original EDD',
          data: 'ScheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          orderable: true,
          targets: 4,
          width: '7%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'PRONumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Shipper',
          data: 'Shipper',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Consignee',
          data: 'Consignee',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Tracking Status',
          data: 'TrackingStatus',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        }
      ]);
    } else if (this.status() === 'Incomplete') {
      this.reportTableColumns.set([
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              const isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 1) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 2) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span tabindex="0">' +
                    '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              return '<span hidden>1</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          orderable: true,
          targets: 0,
          width: '6%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'ID',
          data: 'ShipmentID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'PU Date',
          data: 'PUDate',
          orderable: true,
          targets: 2,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Original EDD',
          data: 'ScheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          orderable: true,
          targets: 4,
          width: '7%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'PRONumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Shipper',
          data: 'Shipper',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Origin',
          data: 'Origin',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Consignee',
          data: 'Consignee',
          orderable: true,
          targets: 7,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Destination',
          data: 'Destination',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'BOLNumber',
          data: 'BOLNumber',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        }
      ]);
    } else if (this.status() === 'Delivered') {
      this.reportTableColumns.set([
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              const isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 1) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 2) {
                return '<span hidden>0</span><span tabindex="0">' +
                  '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span tabindex="0">' +
                    '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' +
                      '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              return '<span hidden>1</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          orderable: true,
          targets: 0,
          width: '6%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'ID',
          data: 'ShipmentID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'PU Date',
          data: 'PUDate',
          orderable: true,
          targets: 2,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Delivered',
          data: 'ActualDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          orderable: true,
          targets: 4,
          width: '7%',
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'PRONumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Shipper',
          data: 'Shipper',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Origin',
          data: 'Origin',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Consignee',
          data: 'Consignee',
          orderable: true,
          targets: 7,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Destination',
          data: 'Destination',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 12) + '...';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'BOLNumber',
          data: 'BOLNumber',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render: (data: any) => {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        }
      ]);
    }

    // Populate table data based on status
    this.reportData.set([])

    if (this.status() === 'Pending') {
      this.rs.getReportsPendingPickup().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(reportData);
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
        }
      });
    }

    if (this.status() === 'Quote') {
      this.rs.getReportsQuote().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(reportData);
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
        }
      });
    }

    if (this.status() === 'Incomplete') {
      this.rs.getReportsIncomplete().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(reportData);
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
          this.spinner.hide('reportGridSpinner');
        }
      });
    }

    if (this.status() === 'Delivered') {
      this.rs.getReportsDelivered().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(this.reportData());
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
        }
      });
    }
  }

  getRecordCount(value: number) {
    this.recordCount.emit(value);
  }

  checkLastUpdatedTime(data: string | null = null): boolean {
    let isIdle = false;
    if (data === '-' || data === '' || data === null || data === ' - ') {
      isIdle = false;
    } else {
      // CONVERT LAST UPDATED TO MOMENT - UTC STORED IN DB (Start Time)
      const startTime = moment(data).utc(true);
      // GET UTC TIME ZONE (End Time)
      const endTime = moment().utc();
      // If a shipment has not received an update from p44 in >12 hours change the icon from green (tracking) to yellow (idle)
      // GET DIFFERENCE IN HOURS
      const hours = moment
        .duration(moment(endTime, 'M/D/YYYY HH:mm:ss A').diff(moment(startTime, 'M/D/YYYY HH:mm:ss A'))).asHours();
      // CHECK IF PASSED THE MAX IDLE TIME OF 12 HRS - SET TO IDLE
      if (hours > 12) {
        isIdle = true;
      }
    }
    return isIdle;
  }

  getReportData(refresh: boolean) {
    this.reportData.set([]);
    if (this.status() === 'Pending') {
      this.rs.getReportsPendingPickup().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(this.reportData());
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.reDrawTable(this.reportData());
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
          this.spinner.hide('reportGridSpinner');
        }
      });
    }

    if (this.status() === 'Quote') {
      this.rs.getReportsQuote().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(this.reportData());
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.reDrawTable(this.reportData());
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
          this.spinner.hide('reportGridSpinner');
        }
      });
    }
    if (this.status() === 'Incomplete') {
      this.rs.getReportsIncomplete().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(this.reportData());
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.reDrawTable(this.reportData());
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
          this.spinner.hide('reportGridSpinner');
        }
      });
    }

    if (this.status() === 'Delivered') {
      this.rs.getReportsDelivered().subscribe({
        next: response => {
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.advancedFilterData.set(this.reportData());

            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.reDrawTable(this.reportData());
          }
        },
        complete: () => {
          this.getRecordCount(this.reportData().length);
          this.spinner.hide('reportGridSpinner');
        }
      });
    }
  }

  refreshGrids(showSpinner: boolean = false) {
    if (showSpinner) {
      this.spinner.show('reportGridSpinner');
    }
    this.reportData.set([]);
    if (this.dt) this.dt.lastUpdatedTime = new Date().toLocaleTimeString();
    this.getReportData(true);
  }

  resetReportTable(value: any) {
    if (value === true) {
      this.dt.reDrawTable(this.reportData());
    }
  }

  advancedFormFilters(formValues: any) {
    let filteredValues: any = this.reportData();

    if (formValues?.fromDate != '' && formValues?.toDate != '') {
      filteredValues = filteredValues.filter((currentElem: any) => {
        return this.compareDates(formValues.fromDate, formValues.toDate, currentElem.PUDate);
      });
    }

    if (formValues.clients?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        let value = this.status().toLowerCase() == 'search' ? currentElem.clientCode : currentElem.ClientCode;
        if (value != null) {
          return this.compareValues(formValues.clients, value);
        }
      });
    }

    if (formValues.carriers?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        let value = this.status().toLowerCase() == 'search' ? currentElem.carrier : currentElem.Carrier;
        if (value != null) {
          return this.compareValues(formValues.carriers, value);
        }
      });
    }

    if (formValues.statuses?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        let value = this.status().toLowerCase() == 'search' ? currentElem.trackingStatus : currentElem.TrackingStatus;
        if (value != null) {
          return this.compareValues(formValues.statuses, value);
        }
      });
    }

    if (formValues.shipperStates?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Origin != null) {
          return this.compareValues(formValues.shipperStates, currentElem.Origin.split(',', 2).pop()?.toString());
        }
      });
    }

    if (formValues.shipperCities?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Origin != null) {
          return this.compareValues(formValues.shipperCities, currentElem.Origin.split(',', 1).toString());
        }
      });
    }

    if (formValues.consigneeCities?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Destination != null) {
          return this.compareValues(formValues.consigneeCities, currentElem.Destination.split(',', 1).toString());
        }
      });
    }

    if (formValues.consigneeStates?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Destination != null) {
          return this.compareValues(formValues.consigneeStates, currentElem.Destination.split(',', 2).pop()?.toString());
        }
      });
    }

    if (formValues.consignees?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        let value = this.status().toLowerCase() == 'search' ? currentElem.consignee : currentElem.Consignee;
        if (value != null) {
          return this.compareValues(formValues.consignees, value);
        }
      });
    }

    if (formValues.shippers?.length !== 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        let value = this.status().toLowerCase() == 'search' ? currentElem.shipper : currentElem.Shipper;
        if (value != null) {
          return this.compareValues(formValues.shippers, value);
        }
      });
    }

    // REDRAW DATATABLE WITH FILTERED DATA SET
    this.dt.reDrawTable(filteredValues);
  }

  compareDates(fromDate: any, toDate: any, puDate: any): boolean {
    let include = false;
    if (moment(puDate, 'YYYY-MM-DD').isSameOrAfter(fromDate) && moment(puDate, 'YYYY-MM-DD').isSameOrBefore(toDate)) {
      include = true;
    }
    return include;
  }

  compareValues(filterValues: any, reportData: any) {
    let include = false;
    filterValues.forEach((value: { item: string; }) => {
      if (value.item.trim().toLocaleLowerCase().startsWith(reportData.trim().toLocaleLowerCase())) {
        include = true;
      }
    });
    return include;
  }

  applyGlobalSearch(inputSearch: string) {
    this.spinner.show('global-search');
    // Needs to be 5 or more characters or way too much stress on DB
    if (inputSearch.length > 4) {
      this.rs.getReportsShipmentSearch(inputSearch).subscribe({
        next: response => {
          this.reportData.set([]); // this.reportData.length = 0;
          if (response?.length > 0) {
            const reportData: ShipmentRecord[] = response as ShipmentRecord[];
            for (const shipReportData of reportData) {
              this.reportData.update(currentItems => [...currentItems, shipReportData]);
            }
            this.dt.reDrawTable(this.reportData());
          }
          this.spinner.hide('global-search');
        },
        error: () => {
          this.spinner.hide('global-search');
        }
      });
    } else {
      this.spinner.hide('global-search');
    }
  }

  applyRecordsSearch(data: any) {
    this.spinner.show('global-search');
    this.reportData.set([]);
    for (const shipReportData of data) {
      this.reportData.update(currentItems => [...currentItems, shipReportData]);
    }
    this.dt.reDrawTable(this.reportData())
    this.spinner.hide('global-search');
  }

  backToSearch() {
    this.showBackBtn = false;
    this.global.recordStatus.set('recordsSearch');
  }
}

