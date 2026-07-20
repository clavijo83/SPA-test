import {Component, Injectable, input, OnInit, output, signal, ViewChild} from '@angular/core';
import {ShipmentTracking} from '../../interfaces/shipment-tracking';
import {TrackingService} from '../../services/tracking/tracking.service';
import {DataTable} from '../data-table/data-table';
import {NgxSpinnerService} from 'ngx-spinner';
import moment from 'moment';
import {Global} from '../../common/global';
import {Constants} from '../../constants/constants';
import {DatePipe} from '@angular/common';
import {ModeDropdown} from '../../interfaces/dropdown';
import {ActivatedRoute} from '@angular/router';
import {GroupInfo} from '../../interfaces/group-info';
import {ClientDropdown} from '../client-dropdown/client-dropdown';

@Component({
  selector: 'app-tracking-filter-grid',
  standalone: false,
  templateUrl: './tracking-filter-grid.html',
  styleUrl: './tracking-filter-grid.css',
})
@Injectable()
export class TrackingFilterGrid implements OnInit {
  @ViewChild(DataTable) dt!: DataTable;
  @ViewChild(ClientDropdown) clientDropdown!: ClientDropdown;
  recordCount = output<number>();
  status = input('');
  globalTrackingData = input<ShipmentTracking[] | null>(null);
  trackingGridName = input('');
  trackingTableColumns: any;
  sortOrder: any;
  trackingData = signal<ShipmentTracking[]>([]);
  advancedFilterData: any;
  currentDate: any;
  global = Global;
  currentClient = '';
  currentGroupName = '';
  clientCode = '';
  groupID: any = '';
  groupInfo: GroupInfo | any;
  modesDropdown: ModeDropdown[] | null = null;
  modeDropdown: string[] = [];
  priority = '';
  mode = '';
  priorityId = '';
  modeId = '';

  constructor(private ts: TrackingService, private spinner: NgxSpinnerService, private datePipe: DatePipe,
              private route: ActivatedRoute) {
    this.modesDropdown = this.route.snapshot.data["modes"];
  }

  get getPriority() {
    let priority: string[] = [];
    Constants.PRIORITY_DROPDOWN.forEach(value => {
      priority.push(value.item);
    });
    return priority;
  }

  ngOnInit() {
    if (this.globalTrackingData() != null) {
      this.trackingData.set(this.globalTrackingData() ?? []);
      this.advancedFilterData = this.trackingData();
      this.getRecordCount(this.trackingData().length);
      this.spinner.hide('trackingGridSpinner');
    } else {
      this.getTrackingData(false);
    }

    if (this.modesDropdown) {
      this.modesDropdown.forEach(value => {
        this.modeDropdown.push(value.modDescription);
      });
    }

    this.currentDate = moment.utc().local();
    let thisComponent = this;

    // title is column name  - data is datafield
    if (this.status() === 'Priority' || this.status() === 'Expedited' || this.status() === 'PickupExpedited' || this.status() === 'PickupElevated'
      || this.status() === 'AppointmentRequired' || this.status() === 'Delivered' || this.status() === 'DeliveryToday' ||
      this.status() === 'DeliveryOSD' || this.status() === 'Returns' || this.status() === 'Problem' || this.status() === 'Ocean') {
      this.sortOrder = [[3, 'asc']];
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              if (row.Priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              } else if (row.Priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
              }
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          width: '6%',
          orderable: true,
          targets: 0,
          className: 'dt-nowrap',
          render(data: any) {
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
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'BOL Number',
          data: 'BOLNumber',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render(data: any) {
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
          type: 'string',
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              if (row.PickedupBy && row.ReadyBy) {
                return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
              } else {
                return `${moment(data).format('M/D/YYYY')} 08:00 - 17:00`;
              }
            }
          }
        },
        {
          title: 'Actual PU Date',
          data: 'ActualShipDate',
          orderable: true,
          type: 'date',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              return moment(data).format('M/D/YYYY');
            }
          }
        },
        {
          title: 'Original EDD',
          data: 'ScheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            }
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '<span tabindex="0">' + data + '</span>';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier EDD',
          data: 'NewEDD',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          visible: false,
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            }
            let d = new Date(data);
            if (row.AppointmentSet === true) {
              // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
              if (isNaN(d.getTime())) {
                return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
              } else {
                return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
              }
            } else {
              if (isNaN(d.getTime())) {
                return '<span tabindex="0">' + data + '</span>';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          }
        },
        {
          title: 'Actual DD',
          data: 'ActualDeliveryDate',
          orderable: true,
          type: 'date',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              return moment(data).format('M/D/YYYY');
            }
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'PROnumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
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
          render(data: any) {
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
          targets: 7,
          className: 'dt-nowrap',
          render(data: any) {
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
          title: 'Status',
          data: 'TrackingStatus',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Message',
          data: 'TrackingMessage',
          orderable: true,
          targets: 9,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 15);
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Last Updated',
          data: 'LastUpdated',
          orderable: true,
          targets: 10,
          className: 'dt-nowrap',
          render: (data: any) => {
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '-';
            }
            return data ? moment.utc(new Date(data.toLocaleString())).format('MM/DD/YYYY hh:mm A') : '-';
          }
        }
      ];
    } else if (this.status() === 'TruckloadAll' || this.status() === 'TruckloadProblem' || this.status() === 'TruckloadFailure' ||
      this.status() === 'TruckloadAppointmentRequired') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'Truck ID',
          data: 'truckID'
        },
        {
          title: 'Equipment Type',
          data: 'equipmentType',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data.toUpperCase();
          }
        },
        {
          title: 'Client Code',
          data: 'ClientCode',
          width: '3%',
          orderable: true,
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'GroupID',
          data: 'GroupID',
          visible: false
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Status',
          data: 'state',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Last Transit Message',
          data: 'trackingMessage',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Last Transit Date',
          data: 'trackingDate',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            let timezoneMap: any = Constants.TIMEZONE_MAP;
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '-';
            }
            let timezoneOffset = moment(d).utcOffset();
            let timezone = timezoneMap[timezoneOffset] ?? '';
            if (timezone != '') {
              return data ? moment.utc(data).local().format('MM/DD/YYYY hh:mm A ') + timezone : '-';
            } else {
              return '-';
            }
          }
        },
        {
          title: 'Last Updated',
          data: 'lastUpdated',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            let timezoneMap: any = Constants.TIMEZONE_MAP;
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '-';
            }
            let timezoneOffset = moment(d).utcOffset();
            let timezone = timezoneMap[timezoneOffset] ?? '';
            if (timezone != '') {
              return data ? moment.utc(data).local().format('MM/DD/YYYY hh:mm A ') + timezone : '-';
            } else {
              return '-';
            }
          }
        },
        {
          title: 'Tracking',
          data: '',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any, type: any, row: any) => {
            if (row.trackingDate == null || row.trackingDate == '') {
              return '<span style="color:red">No Tracking Updates</span>';
            }
            if (row.currentCity || row.currentState) {
              return '<span style style="color:green">' + row.currentCity + ', ' + row.currentState + '</span>';
            }
            return '<span style="color: blue">No Location Provided</span>';
          }
          // }
        },
        {
          title: 'Load Posted',
          data: 'isLoadPosted',
          render(data: any) {
            if (data[0] == true) {
              return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:10px">check</i>' + '</span>';
            } else {
              return '<span hidden>4</span><span tabindex="0">' + '<span style="color:red; font-size:10px">X</span>' + '</span>';
            }
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'Pending' || this.status() === 'RequestForQuote' || this.status() === 'SubmittedQuotes' ||
      this.status() === 'BookedNotLate' || this.status() === 'LatePickup') {
      this.sortOrder = [[3, 'asc']];
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '5%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          width: '6%',
          orderable: true,
          targets: 0,
          className: 'dt-nowrap',
          render(data: any) {
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
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'BOL Number',
          data: 'BOLNumber',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render(data: any) {
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
          type: 'string',
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              if (row.PickedupBy && row.ReadyBy) {
                return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
              } else {
                return `${moment(data).format('M/D/YYYY')} 08:00 - 17:00`;
              }
            }
          }
        },
        {
          title: 'Original EDD',
          data: 'ScheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            }
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '<span tabindex="0">' + data + '</span>';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Carrier EDD',
          data: 'NewEDD',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          visible: false,
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            }
            let d = new Date(data);
            if (row.AppointmentSet === true) {
              // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
              if (isNaN(d.getTime())) {
                return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
              } else {
                return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
              }
            } else {
              if (isNaN(d.getTime())) {
                return '<span tabindex="0">' + data + '</span>';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PRO',
          data: 'PROnumber',
          orderable: true,
          targets: 5,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
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
          render(data: any) {
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
          targets: 7,
          className: 'dt-nowrap',
          render(data: any) {
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
          title: 'Status',
          data: 'TrackingStatus',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Message',
          data: 'TrackingMessage',
          orderable: true,
          targets: 9,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            if (data.length > 12) {
              data = data.substring(0, 15);
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Last Updated',
          data: 'LastUpdated',
          orderable: true,
          targets: 10,
          className: 'dt-nowrap',
          render: (data: any) => {
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '-';
            }
            return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
          }
        }
      ];
    } else if (this.status() === 'TruckloadRequestForQuote' || this.status() === 'TruckloadSubmittedQuotes' ||
      this.status() === 'LateQuoteResponses') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'QuoteID',
          data: 'quoteID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '-';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Client Name',
          data: 'ClientCode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            return row.companyName ? row.companyName : '' + ' ' + row.ClientCode;
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Mode',
          data: 'mode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Equipment Type',
          data: 'equipmentType',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'TruckloadPending') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'TruckID',
          data: 'truckID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Client Name',
          data: 'ClientCode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            return row.companyName ? row.companyName : '' + ' ' + row.ClientCode;
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Mode',
          data: 'mode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Equipment Type',
          data: 'equipmentType',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'PrebookedNoteLate' || this.status() === 'PrebookedAndLate' || this.status() === 'PickupDateAndTimePassed') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'Status',
          data: 'state',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'TruckID',
          data: 'truckID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Client Name',
          data: 'ClientCode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            return row.companyName ? row.companyName : '' + ' ' + row.ClientCode;
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Weight',
          data: 'weight',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Commodity',
          data: 'comodity',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Mode',
          data: 'mode',
          render(data: any) {
            if (data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Equipment Type',
          data: 'equipmentType',
          render(data: any) {
            if (data == null || data == '') {
              return '-';
            }
            return data.toUpperCase();
          }
        },
        {
          title: 'Customer Rate',
          data: 'sell',
          render(data: any) {
            if (data == 'null' || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'AtDeliveryLocation' || this.status() === 'AtPickupStop' || this.status() === 'TruckloadDispatched' ||
      this.status() === 'TruckloadInTransit' || this.status() === 'MissingTransitUpdate' || this.status() === 'TruckloadDelivered') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'Status',
          data: 'state',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'TruckID',
          data: 'truckID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Client Name',
          data: 'ClientCode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            return row.companyName ? row.companyName : '' + ' ' + row.ClientCode;
          }
        },
        {
          title: 'CarrierName',
          data: 'carrierName',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Tracking',
          data: '',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any, type: any, row: any) => {
            if (row.trackingDate == null || row.trackingDate == '') {
              return '<span style="color:red">No Tracking Updates</span>';
            }
            if (row.currentCity || row.currentState) {
              return '<span style style="color:green">' + row.currentCity + ', ' + row.currentState + '</span>';
            }
            return '<span style="color: blue">No Location Provided</span>';
          }
        },
        {
          title: 'Last Transit Message',
          data: 'trackingMessage',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Last Updated',
          data: 'lastUpdated',
          orderable: true,
          className: 'dt-nowrap',
          render: (data: any) => {
            let timezoneMap: any = Constants.TIMEZONE_MAP;
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '-';
            }
            let timezoneOffset = moment(d).utcOffset();
            let timezone = timezoneMap[timezoneOffset] ?? '';
            if (timezone != '') {
              return data ? moment.utc(data).local().format('MM/DD/YYYY hh:mm A ') + timezone : '-';
            } else {
              return '-';
            }
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'LateDelivery' || this.status() === 'DeliveredNeedsPOD') {
      this.sortOrder = [[3, 'asc']];
      let thisComponent = this;
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: 'Status',
          data: 'state',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'TruckID',
          data: 'truckID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Client Name',
          data: 'ClientCode',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            return row.companyName ? row.companyName : '' + ' ' + row.ClientCode;
          }
        },
        {
          title: 'Origin',
          data: 'originCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.originCity.toUpperCase() + ', ' + row.originState.toUpperCase();
          }
        },
        {
          title: 'Destination',
          data: 'destinationCity',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return row.destinationCity.toUpperCase() + ', ' + row.destinationState.toUpperCase();
          }
        },
        {
          title: 'Sch PU',
          data: 'pickupStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.pickupStop == '-' ||
              row.pickupStop == null || row.pickupStop == '' || row.pickupStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.shipperTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.pickupStop) + ' ' + timezone;
          }
        },
        {
          title: 'Sch Del',
          data: 'deliveryStart',
          type: 'date',
          width: '7%',
          render(data: any, type: any, row: any) {
            if (data == '-' || data == null || data == '' || data == '0000-00-00 00:00:00' || row.deliveryStop == '-' ||
              row.deliveryStop == null || row.deliveryStop == '' || row.deliveryStop == '0000-00-00 00:00:00') {
              return '-';
            }
            const timezone = moment.tz(moment(), row.consigneeTimezone).format('z');
            return thisComponent.formatDate(data) + '-' + thisComponent.formatTime(row.deliveryStop) + ' ' + timezone;
          }
        },
        {
          title: 'Mode',
          data: 'mode',
          render(data: any) {
            if (data == null || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Equipment Type',
          data: 'equipmentType',
          render(data: any) {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data.toUpperCase();
          }
        },
        {
          title: 'Customer Rate',
          data: 'sell',
          render(data: any) {
            if (data == 'null' || data == '') {
              return '-';
            }
            return data;
          }
        },
        {
          title: 'Agent',
          data: 'salesRep',
          width: '7%',
          render: (data: any) => {
            if (data == '-' || data == null || data == '') {
              return '-';
            }
            return data;
          }
        }
      ];
    } else if (this.status() === 'Cannot Track') {
      // set column sort order [index,order]
      // failed init. (reason column) sort first, client, ship, carrier
      this.sortOrder = [[8, 'asc'], [1, 'asc'], [3, 'asc'], [4, 'asc']];
      this.trackingTableColumns = [
          {
            title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
            data: 'TrackingStatus',
            orderable: true,
            width: '5%',
            render: (data: any, type: any, row: any) => {
              if (data == 'INITIALIZED' || data == 'YES') {
                let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                }
                if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  if (isIdle) {
                    // SET IDLE ICON
                    return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                  } else {
                    if (row.DispatchMethod == 'AUTO') {
                      return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                    } else {
                      return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                    }
                  }
                }
              } else {
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                } else if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
                }
              }
            }
          },
          {
            title: 'Code',
            data: 'ClientCode',
            width: '6%',
            orderable: true,
            targets: 0,
            className: 'dt-nowrap',
            render(data: any) {
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
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'BOL Number',
            data: 'BOLNumber',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
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
            type: 'string',
            className: 'dt-nowrap',
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                if (row.PickedupBy && row.ReadyBy) {
                  return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Original EDD',
            data: 'ScheduledDelivery',
            orderable: true,
            targets: 2,
            type: 'date',
            className: 'dt-nowrap',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '<span tabindex="0">' + data + '</span>';
              }
              return moment(data).format('M/D/YYYY');
            }
          },
          {
            title: 'Carrier',
            data: 'Carrier',
            width: '7%',
            orderable: true,
            targets: 3,
            className: 'dt-nowrap',
            render(data: any, type: any, row: any) {
              if (data === null) {
                data = '';
              }
              if (row.TrackingAPIEnabled == 0) {
                return '<div style="background-color: #e0f7dd"><span tabindex="0">' + data.toUpperCase() + '</span></div>';
              } else {
                return '<span tabindex="0">' + data.toUpperCase() + '</span>';
              }
            }
          },
          {
            title: 'PRO',
            data: 'PROnumber',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Origin',
            data: 'Origin',
            orderable: true,
            targets: 5,
            className: 'dt-nowrap',
            render(data: any) {
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
            render(data: any) {
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
            title: 'Reason',
            data: 'TrackingStatus',
            orderable: true,
            targets: 7,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Last Updated',
            data: 'LastUpdated',
            className: 'dt-nowrap',
            orderable: true,
            targets: 9,
            type: 'date',
            render: (data: any) => {
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '-';
              }
              return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
            }
          }
        ];
    } else if (this.status() === 'Delivery Date Exception' || this.status() === 'Transit Delayed') {
      if (this.status() === 'Delivery Date Exception') {
        this.sortOrder = [3, 'asc'];
      } else if (this.status() === 'Transit Delayed') {
        this.sortOrder = [10, 'desc'];
      }
      this.trackingTableColumns = [
          {
            title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
            data: 'TrackingAvailable',
            orderable: true,
            width: '5%',
            render: (data: any, type: any, row: any) => {
              if (data == 'INITIALIZED' || data == 'YES') {
                let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                }
                if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  if (isIdle) {
                    // SET IDLE ICON
                    return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                  } else {
                    if (row.DispatchMethod == 'AUTO') {
                      return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                    } else {
                      return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                    }
                  }
                }
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
              }
            }
          },
          {
            title: 'Code',
            data: 'ClientCode',
            width: '6%',
            orderable: true,
            targets: 0,
            className: 'dt-nowrap',
            render(data: any) {
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
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'BOL Number',
            data: 'BOLNumber',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
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
            type: 'string',
            className: 'dt-nowrap',
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                if (row.PickedupBy && row.ReadyBy) {
                  return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual PU Date',
            data: 'ActualShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Original EDD',
            data: 'ScheduledDelivery',
            orderable: true,
            targets: 2,
            type: 'date',
            className: 'dt-nowrap',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '<span tabindex="0">' + data + '</span>';
              }
              return moment(data).format('M/D/YYYY');
            }
          },
          {
            title: 'Carrier EDD',
            data: 'NewEDD',
            orderable: true,
            targets: 3,
            type: 'date',
            className: 'dt-nowrap',
            visible: false,
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (row.AppointmentSet === true) {
                // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
                if (isNaN(d.getTime())) {
                  return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
                } else {
                  return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
                }
              } else {
                if (isNaN(d.getTime())) {
                  return '<span tabindex="0">' + data + '</span>';
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual DD',
            data: 'ActualDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier',
            data: 'Carrier',
            orderable: true,
            targets: 4,
            width: '7%',
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'PRO',
            data: 'PROnumber',
            orderable: true,
            targets: 5,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
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
            render(data: any) {
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
            title: 'Status',
            data: 'TrackingStatus',
            orderable: true,
            targets: 7,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Message',
            data: 'TrackingMessage',
            orderable: true,
            targets: 8,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              if (data.length > 12) {
                data = data.substring(0, 15);
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'Last Updated',
            data: 'LastUpdated',
            className: 'dt-nowrap',
            orderable: true,
            targets: 9,
            render: (data: any) => {
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '-';
              }
              return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
            }
          }
        ];
    } else if (this.status() === 'Unable To Deliver') {
      this.sortOrder = [3, 'asc'];
      this.trackingTableColumns = [
          {
            title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
            data: 'TrackingAvailable',
            orderable: true,
            width: '5%',
            render: (data: any, type: any, row: any) => {
              if (data == 'INITIALIZED' || data == 'YES') {
                let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                }
                if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  if (isIdle) {
                    // SET IDLE ICON
                    return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                  } else {
                    if (row.DispatchMethod == 'AUTO') {
                      return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                    } else {
                      return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                    }
                  }
                }
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
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
            render(data: any) {
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
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'BOL Number',
            data: 'BOLNumber',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'PU Date',
            data: 'ShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Actual PU Date',
            data: 'ActualShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Original EDD',
            data: 'ScheduledDelivery',
            orderable: true,
            targets: 2,
            type: 'date',
            className: 'dt-nowrap',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '<span tabindex="0">' + data + '</span>';
              }
              return moment(data).format('M/D/YYYY');
            }
          },
          {
            title: 'Carrier EDD',
            data: 'NewEDD',
            orderable: true,
            targets: 3,
            type: 'date',
            className: 'dt-nowrap',
            visible: false,
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (row.AppointmentSet === true) {
                // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
                if (isNaN(d.getTime())) {
                  return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
                } else {
                  return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
                }
              } else {
                if (isNaN(d.getTime())) {
                  return '<span tabindex="0">' + data + '</span>';
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual DD',
            data: 'ActualDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier',
            data: 'Carrier',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'PRO',
            data: 'PROnumber',
            orderable: true,
            targets: 5,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
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
            render(data: any) {
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
            title: 'Status',
            data: 'TrackingStatus',
            orderable: true,
            targets: 7,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Message',
            data: 'TrackingMessage',
            orderable: true,
            targets: 8,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              if (data.length > 12) {
                data = data.substring(0, 15);
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'Last Updated',
            data: 'LastUpdated',
            orderable: true,
            targets: 9,
            className: 'dt-nowrap',
            render: (data: any) => {
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '-';
              }
              return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
            }
          }
        ];
    } else if (this.status() === 'Pickup Missed') {
      // } else if (this.status() === 'LatePickup') {
      this.sortOrder = [3, 'asc'];
      this.trackingTableColumns = [
          {
            title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
            data: 'TrackingAvailable',
            orderable: true,
            width: '5%',
            render: (data: any, type: any, row: any) => {
              if (data == 'INITIALIZED' || data == 'YES') {
                let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                }
                if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  if (isIdle) {
                    // SET IDLE ICON
                    return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                  } else {
                    if (row.DispatchMethod == 'AUTO') {
                      return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                    } else {
                      return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                    }
                  }
                }
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
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
            render(data: any) {
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
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'BOL Number',
            data: 'BOLNumber',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
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
            type: 'string',
            className: 'dt-nowrap',
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                if (row.PickedupBy && row.ReadyBy) {
                  return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual PU Date',
            data: 'ActualShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Original EDD',
            data: 'ScheduledDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier EDD',
            data: 'NewEDD',
            orderable: true,
            targets: 3,
            type: 'date',
            className: 'dt-nowrap',
            visible: false,
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              let d = new Date(data);
              if (row.AppointmentSet === true) {
                // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
                if (isNaN(d.getTime())) {
                  return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
                } else {
                  return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
                }
              } else {
                if (isNaN(d.getTime())) {
                  return '<span tabindex="0">' + data + '</span>';
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual DD',
            data: 'ActualDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier',
            data: 'Carrier',
            orderable: true,
            targets: 3,
            width: '7%',
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'PRO',
            data: 'PROnumber',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Origin',
            data: 'Origin',
            orderable: true,
            targets: 5,
            className: 'dt-nowrap',
            render(data: any) {
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
            title: 'Status',
            data: 'TrackingStatus',
            orderable: true,
            targets: 6,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Message',
            data: 'TrackingMessage',
            orderable: true,
            targets: 7,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              if (data.length > 12) {
                data = data.substring(0, 15);
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'Last Updated',
            data: 'LastUpdated',
            className: 'dt-nowrap',
            orderable: true,
            targets: 8,
            render: (data: any) => {
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '-';
              }
              return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
            }
          }
        ];
    } else if (this.status() === 'MABD') {
      this.sortOrder = [3, 'desc'];
      this.trackingTableColumns = [
          {
            title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
            data: 'TrackingAvailable',
            orderable: true,
            width: '5%',
            render: (data: any, type: any, row: any) => {
              if (data == 'INITIALIZED' || data == 'YES') {
                let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
                if (row.Priority === 'ELEVATED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
                }
                if (row.Priority === 'EXPEDITED') {
                  return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
                } else {
                  if (isIdle) {
                    // SET IDLE ICON
                    return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                  } else {
                    if (row.DispatchMethod == 'AUTO') {
                      return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                    } else {
                      return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                    }
                  }
                }
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
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
            render(data: any) {
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
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'BOL Number',
            data: 'BOLNumber',
            width: '7%',
            orderable: true,
            targets: 4,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'MABD',
            data: 'MABD',
            orderable: true,
            targets: 2,
            type: 'date',
            className: 'dt-nowrap',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              return moment(data).format('M/D/YYYY');
            }
          },
          {
            title: 'PU Date',
            data: 'ShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Actual PU Date',
            data: 'ActualShipDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Original EDD',
            data: 'ScheduledDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier EDD',
            data: 'NewEDD',
            orderable: true,
            targets: 3,
            type: 'date',
            className: 'dt-nowrap',
            visible: false,
            render(data: any, type: any, row: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              }
              // validate date first
              let d = new Date(data);
              if (row.AppointmentSet === true) {
                // ADD CUSTOM CLASS WHEN APPOINTMENT SET IS TRUE
                if (isNaN(d.getTime())) {
                  return '<span style="color: dodgerblue; font-weight: bold;" tabindex="0">' + data + '</span>';
                } else {
                  return '<span style="color: dodgerblue; font-weight: bold;">' + moment(data).format('M/D/YYYY') + '</span>';
                }
              } else {
                if (isNaN(d.getTime())) {
                  return '<span tabindex="0">' + data + '</span>';
                } else {
                  return moment(data).format('M/D/YYYY');
                }
              }
            }
          },
          {
            title: 'Actual DD',
            data: 'ActualDeliveryDate',
            orderable: true,
            type: 'date',
            render(data: any) {
              if (thisComponent.isInvalidDate(data)) {
                return '-';
              } else {
                return moment(data).format('M/D/YYYY');
              }
            }
          },
          {
            title: 'Carrier',
            data: 'Carrier',
            orderable: true,
            targets: 4,
            width: '7%',
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'PRO',
            data: 'PROnumber',
            orderable: true,
            targets: 5,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
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
            render(data: any) {
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
            targets: 7,
            className: 'dt-nowrap',
            render(data: any) {
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
            title: 'Status',
            data: 'TrackingStatus',
            orderable: true,
            targets: 8,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              return '<span tabindex="0">' + data.toUpperCase() + '</span>';
            }
          },
          {
            title: 'Message',
            data: 'TrackingMessage',
            orderable: true,
            targets: 9,
            className: 'dt-nowrap',
            render(data: any) {
              if (data === null) {
                data = '';
              }
              if (data.length > 12) {
                data = data.substring(0, 15);
              }
              return '<span tabindex="0">' + data + '</span>';
            }
          },
          {
            title: 'Last Updated',
            data: 'LastUpdated',
            orderable: true,
            targets: 10,
            className: 'dt-nowrap',
            render: (data: any) => {
              let d = new Date(data);
              if (isNaN(d.getTime())) {
                return '-';
              }
              return data ? moment(data).format('MM/DD/YYYY hh:mm A') : '-';
            }
          }
        ];
    } else if (this.status() === 'Whiteboard') {
      this.sortOrder = [[3, 'asc']];
      this.trackingTableColumns = [
        {
          visible: false,
          data: 'RowType'
        },
        {
          title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
          data: 'TrackingAvailable',
          orderable: true,
          width: '3%',
          render: (data: any, type: any, row: any) => {
            if (data == 'INITIALIZED' || data == 'YES') {
              let isIdle = this.checkLastUpdatedTime(row.LastUpdated);
              if (row.Priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              }
              if (row.Priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                if (isIdle) {
                  // SET IDLE ICON
                  return '<span hidden>2</span><span  tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">pause</i>' + '</span>';
                } else {
                  if (row.DispatchMethod == 'AUTO') {
                    return '<span hidden>4</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:9px">play_arrow</i>' + '</span>';
                  } else {
                    return '<span hidden>3</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i>' + '</span>';
                  }
                }
              }
            } else {
              if (row.Priority === 'ELEVATED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
              } else if (row.Priority === 'EXPEDITED') {
                return '<span hidden>0</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
              } else {
                return '<span hidden>1</span><span tabindex="0">' + '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
              }
            }
          }
        },
        {
          title: 'Created',
          data: 'Created',
          orderable: true,
          type: 'string',
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              return moment(data).format('M/D/YYYY');
            }
          }
        },
        {
          title: 'Code',
          data: 'ClientCode',
          width: '6%',
          orderable: true,
          targets: 0,
          className: 'dt-nowrap',
          render: (data: any, type: any, row: any) => {
            if (data === null) {
              data = '';
            }
            // 0 = LTL; 6 = Ocean; 9 = small package; 4 = spot; 5 = Guaranteed LTL
            let colorMode = ((row.Priority == 'GUARANTEED' || row.Mode.toString() == '4' || row.Mode.toString() == '5') ? 'blue' :
              row.Priority == 'ELEVATED' ? '#FF6600' :
                row.Priority == 'EXPEDITED' ? 'red' :
                  row.Mode.toString() == '9' ? 'purple' :
                    (row.Mode.toString() == '0' && row.PROnumber == '') ? 'green' :
                      row.Mode.toString() == '0' ? 'black' :
                        row.Mode.toString() == '6' ? '#FF00FF' : 'darkred');
            return '<span style="font-weight:bold;color: ' + colorMode + '" tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'ID',
          data: 'ShipmentID',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render: (data: any, type: any, row: any) => {
            if (data === null) {
              data = '';
            }
            // 0 = LTL; 6 = Ocean; 9 = small package; 4 = spot; 5 = Guaranteed LTL
            let colorMode = ((row.Priority == 'GUARANTEED' || row.Mode.toString() == '4' || row.Mode.toString() == '5') ? 'blue' :
              row.Priority == 'ELEVATED' ? '#FF6600' :
                row.Priority == 'EXPEDITED' ? 'red' :
                  row.Mode.toString() == '9' ? 'purple' :
                    (row.Mode.toString() == '0' && row.PROnumber == '') ? 'green' :
                      row.Mode.toString() == '0' ? 'black' :
                        row.Mode.toString() == '6' ? '#FF00FF' : 'darkred');
            return '<span style="font-weight:bold;color: ' + colorMode + '" tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Mode',
          data: 'ModeDesc',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render: (data: any, type: any, row: any) => {
            if (data === null || data == '') {
              data = '';
            }
            // 0 = LTL; 6 = Ocean; 9 = small package; 4 = spot; 5 = Guaranteed LTL
            let colorMode = ((row.Priority == 'GUARANTEED' || row.Mode.toString() == '4' || row.Mode.toString() == '5') ? 'blue' :
              row.Priority == 'ELEVATED' ? '#FF6600' :
                row.Priority == 'EXPEDITED' ? 'red' :
                  row.Mode.toString() == '9' ? 'purple' :
                    (row.Mode.toString() == '0' && row.PROnumber == '') ? 'green' :
                      row.Mode.toString() == '0' ? 'black' :
                        row.Mode.toString() == '6' ? '#FF00FF' : 'darkred');
            return '<span style="font-weight:bold;color: ' + colorMode + '" tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Equipment',
          data: 'equipmentType',
          orderable: true,
          targets: 1,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data + '</span>';
          }
        },
        {
          title: 'Origin',
          data: 'Origin',
          orderable: true,
          targets: 6,
          className: 'dt-nowrap',
          render(data: any) {
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
          targets: 7,
          className: 'dt-nowrap',
          render(data: any) {
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
          title: 'Consignee Name',
          data: 'Consignee',
          orderable: true,
          targets: 7,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            // if (data.length > 12) {
            //   data = data.substring(0, 12) + '...';
            // }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'Carrier',
          data: 'Carrier',
          width: '7%',
          orderable: true,
          targets: 4,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        },
        {
          title: 'PU Date',
          data: 'PUDate',
          orderable: true,
          type: 'string',
          className: 'dt-nowrap',
          render(data: any, type: any, row: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              if (row.PickedupBy && row.ReadyBy) {
                return `${moment(data).format('M/D/YYYY')} ${row.ReadyBy.slice(0, 2) + ':' + row.ReadyBy.slice(2)}-${row.PickedupBy.slice(0, 2) + ':' + row.PickedupBy.slice(2)}`;
              } else {
                return `${moment(data).format('M/D/YYYY')} 08:00 - 17:00`;
              }
            }
          }
        },
        {
          title: 'Actual PU Date',
          data: 'ActualShipDate',
          orderable: true,
          type: 'date',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              return moment(data).format('M/D/YYYY');
            }
          }
        },
        {
          title: 'Original EDD',
          data: 'ScheduledDelivery',
          orderable: true,
          targets: 3,
          type: 'date',
          className: 'dt-nowrap',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            }
            let d = new Date(data);
            if (isNaN(d.getTime())) {
              return '<span tabindex="0">' + data + '</span>';
            }
            return moment(data).format('M/D/YYYY');
          }
        },
        {
          title: 'Actual DD',
          data: 'ActualDeliveryDate',
          orderable: true,
          type: 'date',
          render(data: any) {
            if (thisComponent.isInvalidDate(data)) {
              return '-';
            } else {
              return moment(data).format('M/D/YYYY');
            }
          }
        },
        {
          title: 'Status',
          data: 'TrackingStatus',
          orderable: true,
          targets: 8,
          className: 'dt-nowrap',
          render(data: any) {
            if (data === null) {
              data = '';
            }
            return '<span tabindex="0">' + data.toUpperCase() + '</span>';
          }
        }
      ];
    }
  }

  getRecordCount(value: number) {
    this.recordCount.emit(value);
  }

  compareValues(filterValues: any, trackingData: any) {
    let include = false;
    filterValues.forEach((value: any) => {
      if (value.item.trim().toLocaleLowerCase().startsWith(trackingData.trim().toLocaleLowerCase())) {
        include = true;
      }
    });
    return include;
  }

  refreshGrids(showSpinner: boolean) {
    if (showSpinner) {
      this.spinner.show('trackingGridSpinner');
    }
    this.trackingData.update(() => []);
    this.dt.lastUpdatedTime = new Date().toLocaleTimeString();
    this.getTrackingData(true);
  }

  advancedFormFilters(formValues: any) {
    let filteredValues = this.trackingData();

    // FILTER PICKUP DATE
    if (formValues?.fromDate != '' || formValues?.toDate != '') {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        return this.compareDates(formValues.fromDate, formValues.toDate, currentElem.PUDate);
      });
    }

    // FILTER DELIVERY DATE
    if (formValues?.deliveryFromDate != '' || formValues?.deliveryToDate != '') {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // Use the Carrier EDD. If Carrier EDD is null, then default to the original EDD
        return this.compareDates(formValues.deliveryFromDate, formValues.deliveryToDate, currentElem.NewEDD != ' - ' ? currentElem.NewEDD : currentElem.ScheduledDelivery);
      });
    }

    if (formValues.clients?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.ClientCode != null) {
          return this.compareValues(formValues.clients, currentElem.ClientCode);
        }
      });
    }

    if (formValues.carriers?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Carrier != null) {
          return this.compareValues(formValues.carriers, currentElem.Carrier);
        }
      });
    }

    if (formValues.statuses?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.TrackingStatus != null) {
          return this.compareValues(formValues.statuses, currentElem.TrackingStatus);
        }
      });
    }

    if (formValues.shipperStates?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Origin != null) {
          if (currentElem.Origin.split(',', 2).pop()?.toString().trim()) {
            return this.compareValues(formValues.shipperStates, currentElem.Origin.split(',', 2).pop()?.toString());
          }
        }
      });
    }

    if (formValues.shipperCities?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Origin != null) {
          if (currentElem.Origin.split(',', 1).toString()) {
            return this.compareValues(formValues.shipperCities, currentElem.Origin.split(',', 1).toString());
          }
        }
      });
    }

    if (formValues.consigneeCities?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Destination != null) {
          if (currentElem.Destination.split(',', 1).toString()) {
            return this.compareValues(formValues.consigneeCities, currentElem.Destination.split(',', 1).toString());
          }
        }
      });
    }

    if (formValues.consigneeStates?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Destination != null) {
          if (currentElem.Destination.split(',', 2).pop()?.toString().trim()) {
            return this.compareValues(formValues.consigneeStates, currentElem.Destination.split(',', 2).pop()?.toString());
          }
        }
      });
    }

    if (formValues.consignees?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Consignee != null) {
          return this.compareValues(formValues.consignees, currentElem.Consignee);
        }
      });
    }

    if (formValues.shippers?.length != 0) {
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.Shipper != null) {
          return this.compareValues(formValues.shippers, currentElem.Shipper);
        }
      });
    }

    if (formValues.teamPodEmail?.length != 0) {
      let teamEmail: any[] = [];
      formValues.teamPodEmail.forEach((email: any) => {
        teamEmail.push({value: email.value, item: email.value});
      });
      filteredValues = filteredValues.filter((currentElem: any): any => {
        // CHECK FOR NULL VALUE
        if (currentElem.GroupEmail != null) {
          return this.compareValues(teamEmail, currentElem.GroupEmail);
        }
      });
    }

    // REDRAW DATATABLE WITH FILTERED DATA SET
    this.dt.reDrawTable(filteredValues);
  }

  compareDates(fromDate: any, toDate: any, date: any): boolean {
    let include = false;

    if (fromDate != '' && toDate === '') {
      if (moment(date, 'YYYY-MM-DD').isSame(fromDate)) {
        include = true;
      }
    } else if (fromDate === '' && toDate != '') {
      if (moment(date, 'YYYY-MM-DD').isSame(toDate)) {
        include = true;
      }
    } else if (moment(date, 'YYYY-MM-DD').isSameOrAfter(fromDate) && moment(date, 'YYYY-MM-DD').isSameOrBefore(toDate)) {
      include = true;
    }
    return include;
  }

  // BOOLEAN VALUE TO DRAW TABLE WITH ORIGINAL VALUES
  resetTrackingTable(value: any) {
    if (value === true) {
      this.dt.reDrawTable(this.trackingData());
    }
  }

  getTrackingData(refresh: boolean) {
    if (this.status() === 'Delivered') {
      this.ts.getTrackingDelivered().subscribe({
        next: response => {
          if (response.length > 0) {
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Priority') {
      this.global.trackPriorityRecCount.set(0);
      this.ts.getTrackingElevated().subscribe({
        next: response => {
          // FILTER FOR ELEVATED SHIPMENTS ONLY
          if (response.length > 0) {
            this.global.trackPriorityRecCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Expedited') {
      this.global.trackExpeditedRecCount.set(0);
      this.ts.getTrackingExpedited().subscribe({
        next: response => {
          // FILTER FOR EXPEDITED SHIPMENTS ONLY
          if (response.length > 0) {
            this.global.trackExpeditedRecCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'AppointmentRequired') {
      this.global.trackAppointmentRequiredRecCount.set(0);
      this.ts.getTrackingAppointmentRequired().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackAppointmentRequiredRecCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadRequestForQuote') {
      this.global.trackRequestForQuoteRecCount.set(0);
      this.ts.getTLTrackingRequestForQuote().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackRequestForQuoteRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadDispatched') {
      this.global.trackTruckloadDispatchedRecCount.set(0);
      this.ts.getTLTrackingDispatched().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadDispatchedRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadProblem') {
      this.global.trackTruckloadProblemRecCount.set(0);
      this.ts.getTLTrackingProblem().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadProblemRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadFailure') {
      this.global.trackTruckloadFailureRecCount.set(0);
      this.ts.getTLTrackingFailure().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadFailureRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadAll') {
      this.global.trackTruckloadAllRecCount.set(0);
      this.ts.getTLTrackingAll().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadAllRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'LateQuoteResponses') {
      this.global.trackLateQuoteResponsesRecCount.set(0);
      this.ts.getTLTrackingLateQuote().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackLateQuoteResponsesRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadSubmittedQuotes') {
      this.global.trackSubmittedQuotesRecCount.set(0);
      this.ts.getTLTrackingSubmittedQuote().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackSubmittedQuotesRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadInTransit') {
      this.global.trackTruckloadInTransitRecCount.set(0);
      this.ts.getTLTrackingInTransit().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadInTransitRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'PrebookedNoteLate') {
      this.global.trackPrebookedNoteLateRecCount.set(0);
      this.ts.getTLTrackingPrebookedNotLate().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackPrebookedNoteLateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'PrebookedAndLate') {
      this.global.trackPrebookedAndLateRecCount.set(0);
      this.ts.getTLTrackingBookedNotLate().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackPrebookedAndLateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'PickupDateAndTimePassed') {
      this.global.trackPickupDateAndTimePassedRecCount.set(0);
      this.ts.getTLTrackingPUMiss().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackPickupDateAndTimePassedRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'MissingTransitUpdate') {
      this.global.trackMissingTransitUpdateRecCount.set(0);
      this.ts.getTLTrackingMissingTransitUpdate().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackMissingTransitUpdateRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'LateDelivery') {
      this.global.trackLateDeliveryRecCount.set(0);
      this.ts.getTLTrackingLateDelivery().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackLateDeliveryRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'DeliveryToday') {
      this.global.trackDeliveryTodayCount.set(0);
      this.ts.getTrackingDeliveryToday().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackDeliveryTodayCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'DeliveredNeedsPOD') {
      this.global.trackDeliveredNeedsPODRecCount.set(0);
      this.ts.getTLTrackingDeliveredMissingPOD().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackDeliveredNeedsPODRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'BookedNotLate') {
      this.global.trackNotLateCount.set(0);
      this.ts.getTrackingBookedNotLate().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackNotLateCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'LatePickup') {
      this.global.trackLatePickupsCount.set(0);
      this.ts.getTrackingLatePickup().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackLatePickupsCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Pending') {
      this.global.trackPendingRecCount.set(0);
      this.ts.getTrackingPending().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackPendingRecCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Transit Delayed') {
      this.global.trackDelayRecCount.set(0);
      this.ts.getTrackingDelayed().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackDelayRecCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Cancelled') {
      this.ts.getTrackingAll().subscribe({
        next: response => {
          if (response.length > 0) {
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            const cancelled = trackingData.filter(items => items.TrackingStatus?.toUpperCase() == 'CANCELLED');
            this.trackingData.update(()=> cancelled);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Cannot Track') {
      this.global.noTrackRecordCount.set(0);
      this.ts.getCannotTrack().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.noTrackRecordCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Delivery Date Exception') {
      this.global.trackDeliveryDateExceptionRecordCount.set(0);
      this.ts.getTrackingDeliveryDateException().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackDeliveryDateExceptionRecordCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Unable To Deliver') {
      this.ts.getTrackingUnableToDeliver().subscribe({
        next: response => {
          if (response.length > 0) {
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'MABD') {
      this.ts.getTrackingMABD().subscribe({
        next: response => {
          if (response.length > 0) {
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }

        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadPending') {
      this.global.trackTruckloadPendingRecCount.set(0);
      this.ts.getTLTrackingPending().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckloadPendingRecCount.set(response.length);
            let trackingData: any[] = response as any[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner').then();
          }
        }
      });
    }

    // if (this.status() === 'PickupExpedited') {
    //   this.ts.getTrackingPickupExpedited().subscribe({
    //    next:
    //     response => {
    //       if (response.length > 0) {
    //         let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
    //         for (let shipTrackData of trackingData) {
    //           shipTrackData.RowType = 'tracking'
    //           this.trackingData.push(shipTrackData);
    //         }
    //         this.advancedFilterData = this.trackingData();
    //         if (refresh) {
    //           this.dt.refreshTable();
    //         }
    //         this.dt.rerender();
    //       }
    //     },
    //     () => {
    //       this.getRecordCount(this.trackingData().length);
    //       if (refresh) this.spinner.hide('trackingGridSpinner');
    //     }
    //   });
    // }

    // if (this.status() === 'PickupElevated') {
    //   this.ts.getTrackingPickupElevated().subscribe({
    //    next:
    //     response => {
    //       if (response.length > 0) {
    //         let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
    //         for (let shipTrackData of trackingData) {
    //           shipTrackData.RowType = 'tracking'
    //           this.trackingData.push(shipTrackData);
    //         }
    //         this.advancedFilterData = this.trackingData();
    //         if (refresh) {
    //           this.dt.refreshTable();
    //         }
    //         this.dt.rerender();
    //       }
    //     },
    //     () => {
    //       this.getRecordCount(this.trackingData().length);
    //       if (refresh) this.spinner.hide('trackingGridSpinner');
    //     }
    //   });
    // }

    if (this.status() === 'DeliveryOSD') {
      this.global.trackDeliveryOsdCount.set(0);
      this.ts.getTrackingDeliveryOSD().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackDeliveryOsdCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'SubmittedQuotes') {
      this.global.trackSubmittedQuoteCount.set(0);
      this.ts.getTrackingSubmittedQuote().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackSubmittedQuoteCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'RequestForQuote') {
      this.global.trackRequestQuoteCount.set(0);
      this.ts.getTrackingRequestForQuote().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackRequestQuoteCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Returns') {
      this.global.noTrackReturns.set(0);
      this.ts.getTrackingReturns().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.noTrackReturns.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Whiteboard') {
      this.global.trackWhiteboardCount.set(0);
      this.ts.getTrackingWhiteboard(this.clientCode, this.groupID, this.priorityId, this.modeId).subscribe({
        next: response => {
          this.global.trackWhiteboardCount.set(response.length);
          if (response.length > 0) {
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
          }
          if (refresh) {
            this.dt.refreshTable();
          }
          this.dt.rerender();
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Ocean') {
      this.global.trackOceanCount.set(0);
      this.ts.getTrackingOcean().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackOceanCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'Problem') {
      this.global.trackProblemCount.set(0);
      this.ts.getTrackingProblem().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackProblemCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'PrebookedRolled') {
      this.global.trackPrebookedRolledCount.set(0);
      this.ts.getTLTrackingPrebookRolled().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackPrebookedRolledCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'AtPickupStop') {
      this.global.trackTruckAtPickupCount.set(0);
      this.ts.getTLTrackingAtPickup().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckAtPickupCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'AtDeliveryLocation') {
      this.global.trackTruckAtDeliveryCount.set(0);
      this.ts.getTLTrackingAtDelivery().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckAtDeliveryCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }

    if (this.status() === 'TruckloadDelivered') {
      this.global.trackTruckDeliveredCount.set(0);
      this.ts.getTLTrackingDelivered().subscribe({
        next: response => {
          if (response.length > 0) {
            this.global.trackTruckDeliveredCount.set(response.length);
            let trackingData: ShipmentTracking[] = response as ShipmentTracking[];
            trackingData.forEach(shipTrackData => {
              shipTrackData.RowType = 'tltracking';
            });
            this.trackingData.update(()=> trackingData);
            this.advancedFilterData = this.trackingData();
            if (refresh) {
              this.dt.refreshTable();
            }
            this.dt.rerender();
          }
        },
        error: () => { if (refresh) { this.spinner.hide('trackingGridSpinner');}},
        complete: () => {
          this.getRecordCount(this.trackingData().length);
          if (refresh) {
            this.spinner.hide('trackingGridSpinner');
          }
        }
      });
    }
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
        .duration(moment(endTime, 'M/D/YYYY HH:mm:ss A')
          .diff(moment(startTime, 'M/D/YYYY HH:mm:ss A'))
        ).asHours();
      // CHECK IF PASSED THE MAX IDLE TIME OF 12 HRS - SET TO IDLE
      if (hours > 12) {
        isIdle = true;
      }
    }
    return isIdle;
  }

  formatDate(data: string): string {
    try {
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        const formattedDate = this.datePipe.transform(data, 'MM/dd/yyyy HH:mm');
        if (formattedDate) {
          return formattedDate;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return '';
  }

  formatTime(data: string): string {
    try {
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        const formattedTime = this.datePipe.transform(data, 'HH:mm');
        if (formattedTime) {
          return formattedTime;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return '';
  }

  isInvalidDate(data: any) {
    return data == '' || data == null || data == '-' || (data && data.replace(/\s/g, '') === '-') || (data && data.includes('0000-00-00'));
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'priority') {
      this.priority = value;
    }
    if (controlName === 'mode') {
      this.mode = value;
    }
  }

  groupEventHandler($event: GroupInfo) {
    this.groupInfo = $event;
    this.groupID = this.clientDropdown.groupForm.get('plant')?.value !== '' ? this.groupInfo.groupID.toString() : null;
    this.clientCode = this.groupInfo.clientCode;
  }

  onClientChange() {
    this.groupInfo = null;
    this.groupID = null;
    this.clientCode = this.clientDropdown.groupForm.get('client')?.value !== '' ?
      this.clientDropdown.groupForm.get('client')?.value.split('-')[0] : '';
  }

  resetForm() {
    this.groupInfo = null;
    this.groupID = '';
    this.clientCode = '';
    this.priority = '';
    this.mode = '';
    this.priorityId = '';
    this.modeId = '';
    $('body#trackingGrid input#client').val('');
    $('body#trackingGrid input#plant').val('');
    this.refreshGrids(true);
  }

  sendSearchParams() {
    this.priorityId = '';
    this.modeId = '';
    this.modesDropdown?.forEach((value) => {
      if (this.mode && this.mode === value.modDescription) {
        this.modeId = value.modeId;
      }
    });

    if (this.priority && this.priority !== '') {
      this.priorityId = this.priority.toUpperCase() === 'ELEVATED' ? '1' :
        this.priority.toUpperCase() === 'EXPEDITED' ? '2' : this.priority.toUpperCase() === 'GUARANTEED' ? '3' : '0';
    }

    this.refreshGrids(true);
  }
}
