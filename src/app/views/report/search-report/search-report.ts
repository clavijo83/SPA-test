import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Global} from '../../../common/global';
import {AbstractControl, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {NgxSpinnerService} from 'ngx-spinner';
import {Constants} from '../../../constants/constants';
import {ActivatedRoute} from '@angular/router';
import moment from 'moment';
import {ReportService} from '../../../services/report/report.service';
import {Shipment, ShipmentReport} from '../../../interfaces/shipment-report';
import {DataTable} from '../../../components/data-table/data-table';
import {CarrierProfilingService} from '../../../services/carrier-profiling/carrier-profiling.service';
import {CarrierDetail} from '../../../interfaces/carrier-detail';
import {Dropdown, ModeDropdown} from '../../../interfaces/dropdown';
import Swal from 'sweetalert2';
import {Location} from '@angular/common';
import {ReportsService} from '../../../services/reports/reports.service';

@Component({
  selector: 'app-search-report',
  standalone: false,
  templateUrl: './search-report.html',
  styleUrl: './search-report.css',
})
export class SearchReport implements OnInit, OnDestroy {
  @ViewChild(DataTable) dt!: DataTable;
  global = Global;
  reportSearchForm!: FormGroup;
  clients: any;
  clientDropdown: string[] = [];
  billToDropdown: string[] = [];
  modeDropdown: string[] = [];
  backToSearch = false;
  reportsData: Shipment[] = [] as Shipment[];
  reportsColumns: any;
  sortOrder: any;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  dollarUS = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  summaryParams = '';
  stateDropdown: string[] = [];
  suscribeLocation$: any;
  @Input() modalName = 'filterModal';
  @Input() statusesSearchList: Dropdown[] = [];
  statusDropdown: Dropdown[] = [];
  public statusLoaded = false;
  public dropdownSettings = {};
  statusesTerms: string[] = [];
  allStatusesCount = 0;
  modesDropdown: ModeDropdown[] | null = null;
  exceptionDropDown: any[] = [];

  constructor(private fb: FormBuilder, private spinner: NgxSpinnerService, private route: ActivatedRoute, private rs: ReportService,
              private rss: ReportsService, private cps: CarrierProfilingService, private location: Location) {
    this.modesDropdown = this.route.snapshot.data["modes"];
  }

  get availableCarrierList() {
    let carrierList: Dropdown[] = [];
    this.carrierList.forEach(value => {
      carrierList.push({item: value.carrierName ?? '', value: value?.carrierID?.toString() ?? ''});
    });
    return carrierList;
  }

  ngOnInit(): void {
    const carrierData = this.route?.parent?.snapshot.data["availableCarriers"];
    this.rss.getAvailableExceptions('ltl').subscribe(
      response => {
        for (const exception of response) {
          this.exceptionDropDown.push(exception);
        }
      });

    // initiate form groups
    this.initializeReportSearchForm();

    this.clients = this.route.snapshot.data["clients"];
    if (this.clients.length > 0) {
      this.setDropdownOptions(this.clients);
    }

    this.getCarrierList(carrierData);

    Constants.BILL_TO_DROPDOWN.forEach(value => {
      this.billToDropdown.push(value.item);
    });

    this.modesDropdown?.forEach(value => {
      this.modeDropdown.push(value.modDescription);
    });

    Constants.FULL_STATE_DROPDOWN.forEach(value => {
      this.stateDropdown.push(value.item);
    });

    this.sortOrder = [[0, 'desc']];

    this.reportsColumns = [
      {
        title: 'Truck ID',
        data: 'truckID',
        orderable: true,
        targets: 0,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Shipment ID',
        data: 'shipmentID',
        orderable: true,
        targets: 0,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Client Code',
        data: 'clientCode',
        orderable: true,
        targets: 1,
        width: '6%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Shipment Date',
        data: 'shipDate',
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
        title: 'Delivery Date',
        data: 'deliveryDate',
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
        title: 'Expected Delivery Date',
        data: 'OriginEDD',
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
        title: 'Mode',
        data: 'mode',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: string, type: any, row: { truckID: any; stopOrder: any; }) => {
          const mode = '<span tabindex="0">' + data + (data === 'Truckload' && row.truckID ?
            `<br>Stop ${row.stopOrder} of TL ${row.truckID}</br>` : '') + '</span>';
          return this.setData(mode);
        }
      },
      {
        title: 'Status',
        data: 'status',
        orderable: true,
        targets: 8,
        className: 'dt-nowrap',
        render: (data: any) => {
          $('#reportsTableDataTable_wrapper > div:nth-child(1) > div.col-sm-12.col-md-6.d-inline-flex.justify-content-end.btn-dt-height > div > button:nth-child(1)').css('display', 'none');
          $('#reportsTableDataTable_wrapper > div:nth-child(1) > div.col-sm-12.col-md-6.d-inline-flex.justify-content-end.btn-dt-height > div > button:nth-child(3)').css('display', 'none');
          return this.setData(data);
        }
      },
      {
        title: 'Carrier',
        data: 'carrier',
        orderable: true,
        targets: 4,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: string | null, type: any, row: { mcNumber: null; }) => {
          if (data == '-' || data == null || data == '') {
            this.setData(null);
          }
          let carrier = data;
          if (!(row.mcNumber == null || data == '')) { carrier = carrier + `<br>${row.mcNumber}</br>`; }
          return this.setData(carrier);
        }
      },
      {
        title: 'PRO Number',
        data: 'proNumber',
        orderable: true,
        targets: 5,
        className: 'dt-nowrap',
        render: (data: string) => {
          return this.setData(data?.toUpperCase());
        }
      },
      {
        title: 'BOL Number',
        data: 'bolNumber',
        orderable: true,
        targets: 5,
        className: 'dt-nowrap',
        render: (data: string) => {
          return this.setData(data?.toUpperCase());
        }
      },
      {
        title: 'PO Number',
        data: 'poNumber',
        orderable: true,
        targets: 5,
        className: 'dt-nowrap',
        render: (data: string) => {
          return this.setData(data?.toUpperCase());
        }
      },
      {
        title: 'Shipper Name',
        data: 'shipper',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { name: any; }) => {
          return this.setData(data.name);
        }
      },
      {
        title: 'Shipper City',
        data: 'shipper',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { city: any; }) => {
          return this.setData(data.city);
        }
      },
      {
        title: 'Shipper State',
        data: 'shipper',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { state: any; }) => {
          return this.setData(data.state);
        }
      },
      {
        title: 'Shipper Zip',
        data: 'shipper',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { zip: any; }) => {
          return this.setData(data.zip);
        }
      },
      {
        title: 'Shipper Address',
        data: 'shipper',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { address: string; }) => {
          let address = data.address;
          if (data.address.length > 24) {
            address = data.address.substring(0, 25) + '...';
          }
          return this.setData(address);
        }
      },
      {
        title: 'Consignee Name',
        data: 'consignee',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { name: any; }) => {
          return this.setData(data.name);
        }
      },
      {
        title: 'Consignee City',
        data: 'consignee',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { city: any; }) => {
          return this.setData(data.city);
        }
      },
      {
        title: 'Consignee State',
        data: 'consignee',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: { state: any; }) => {
          return this.setData(data.state);
        }
      },
      {
        title: 'Consignee Zip',
        data: 'consignee',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data.zip);
        }
      },
      {
        title: 'Consignee Address',
        data: 'consignee',
        orderable: true,
        className: 'dt-nowrap',
        render: (data: any) => {
          let address = data.address;
          if (data.address.length > 24) {
            address = data.address.substring(0, 25) + '...';
          }
          return this.setData(address);
        }
      },
      {
        title: 'Total Pieces',
        data: 'totalPieces',
        orderable: true,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Total H/U',
        data: 'totalHU',
        orderable: true,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Total Weight',
        data: 'totalWeight',
        orderable: true,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any) => {
          return this.setData(data);
        }
      },
      {
        title: 'Client Cost',
        data: 'clientCost',
        orderable: true,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any, type: any, row: any) => {
          if (data == null || data === '') { return ''; }
          return this.setData(data, row);
        }
      },
      {
        title: 'Carrier Cost',
        data: 'carrierCost',
        orderable: true,
        width: '7%',
        className: 'dt-nowrap',
        render: (data: any, type: any, row: any) => {
          if (data == null || data === '') { return ''; }
          return this.setData(data, row);
        }
      }
    ];

    this.suscribeLocation$ = this.location.subscribe(() => {
      if (this.backToSearch) {
        history.forward();
        this.backToSearch = false;
        $('#reportSearchTab').addClass('active');
      }
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'value',
      textField: 'item',
      itemsShowLimit: 5,
      allowSearchFilter: true,
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All'
    };
    this.reportSearchForm.get('statuses')?.setValue('');
    this.getStatusDropdown();
  }

  ngOnDestroy(): void {
    this.suscribeLocation$.unsubscribe();
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'clientCode') {
      this.reportSearchForm.get('clientCode')?.setValue(value);
    }
    if (controlName === 'terms') {
      this.reportSearchForm.get('terms')?.setValue(value);
    }
    if (controlName === 'mode') {
      this.reportSearchForm.get('mode')?.setValue(value);
    }
    if (controlName === 'carrierID') {
      this.reportSearchForm.get('carrierID')?.setValue(value.value);
      this.reportSearchForm.get('carrierName')?.setValue(value.item);
    }
    if (controlName === 'shipperState') {
      this.reportSearchForm.get('shipperState')?.setValue(value);
    }
    if (controlName === 'consigneeState') {
      this.reportSearchForm.get('consigneeState')?.setValue(value);
    }
  }

  onItemSelect(item: any) {
    this.allStatusesCount = 0;
    this.statusesTerms.push(item.value);
    this.reportSearchForm.get(['statuses'])?.setValue(this.statusesTerms);
  }

  onSelectAll(items: any) {
    this.statusesTerms = [];
    items.forEach((item: { value: string; }) => {
      this.allStatusesCount++;
      this.statusesTerms.push(item.value);
    });
    this.reportSearchForm.get(['statuses'])?.setValue(this.statusesTerms);
  }

  onDeSelect(event: any) {
    this.allStatusesCount = 0;
    const index = this.statusesTerms.indexOf(event.value);
    if (index !== -1) {
      this.statusesTerms.splice(index, 1);
    }
    this.reportSearchForm.get(['statuses'])?.setValue(this.statusesTerms);
  }

  onDeSelectAll() {
    this.statusesTerms = [];
    this.allStatusesCount = 0;
    this.reportSearchForm.get(['statuses'])?.setValue(this.statusesTerms);
  }

  setDropdownOptions(clients: any) {
    const previousClient = clients[0].clientCode;
    const previousCompany = clients[0].companyName;

    if (clients.length === 1) {
      this.clientDropdown.push(previousClient + '-' + previousCompany);
    } else {
      // REDUCE TO REMOVE DUPLICATE CLIENT CODES
      const client = this.clients.reduce((accumulator: any, current: any) => {
        if (!accumulator.some((item: { clientCode: any; }) => item.clientCode === current.clientCode)) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      client.forEach((c: any) => {
        this.clientDropdown.push(c.clientCode + '-' + c.companyName);
      });
    }
  }

  getCarrierList(carriersData: CarrierDetail[]) {
    if (carriersData && carriersData.length > 0) {
      for (const carrier of carriersData) {
        this.carrierList.push(carrier);
      }
    } else {
      this.cps.getAvailableCarriers().subscribe(
        response => {
          for (const carrier of response) {
            this.carrierList.push(carrier);
          }
        }
      );
    }
  }

  resetForm() {
    this.allStatusesCount = 0;
    this.backToSearch = false;
    this.statusesTerms = [];
    this.reportSearchForm.get(['statuses'])?.setValue([]);
    this.initializeReportSearchForm();
    $('#carrierID').val('');
    this.reportsData.length = 0;
    this.dt.rerender();
  }

  sendSearchParams() {
    this.reportsData.length = 0;
    this.dt.rerender();

    let shipmentMode = '';
    this.modesDropdown?.forEach((value) => {
      if (this.reportSearchForm.get('mode')?.value && this.reportSearchForm.get('mode')?.value == value.modDescription) {
        shipmentMode = value.modeId;
      }
    });

    let managedShipments = '0';
    if ((document.getElementById('onlyManaged') as HTMLInputElement).checked) {
      managedShipments = '1';
    }

    let pickExceptionTxt = '';
    let delExceptionTxt = '';
    this.exceptionDropDown.forEach((value) => {
      if (this.reportSearchForm.get('pickupException')?.value && this.reportSearchForm.get('pickupException')?.value == value.ExceptionID) {
        pickExceptionTxt = value.ExceptionName;
      }
      if (this.reportSearchForm.get('deliveryException')?.value &&
        this.reportSearchForm.get('deliveryException')?.value == value.ExceptionID) {
        delExceptionTxt = value.ExceptionName;
      }
    });


    const searchParams: any = {
      shipmentID: this.reportSearchForm.get('shipmentID')?.value,
      shipDate: this.reportSearchForm.get('shipDate')?.value,
      clientCode: this.reportSearchForm.get('clientCode')?.value?.split('-')[0],
      proNumber: this.reportSearchForm.get('proNumber')?.value,
      bolNumber: this.reportSearchForm.get('bolNumber')?.value,
      poNumber: this.reportSearchForm.get('poNumber')?.value,
      deliveryDate: this.reportSearchForm.get('deliveryDate')?.value,
      mode: shipmentMode,
      terms: this.reportSearchForm.get('terms')?.value,
      shipDateFrom: this.reportSearchForm.get('shipDateFrom')?.value,
      shipDateTo: this.reportSearchForm.get('shipDateTo')?.value,
      shipperName: this.reportSearchForm.get('shipperName')?.value,
      shipperAddress: this.reportSearchForm.get('shipperAddress')?.value,
      shipperCity: this.reportSearchForm.get('shipperCity')?.value,
      shipperState: this.reportSearchForm.get('shipperState')?.value,
      shipperZip: this.reportSearchForm.get('shipperZip')?.value,
      consigneeName: this.reportSearchForm.get('consigneeName')?.value,
      consigneeAddress: this.reportSearchForm.get('consigneeAddress')?.value,
      consigneeCity: this.reportSearchForm.get('consigneeCity')?.value,
      consigneeState: this.reportSearchForm.get('consigneeState')?.value,
      consigneeZip: this.reportSearchForm.get('consigneeZip')?.value,
      carrierID: this.reportSearchForm.get('carrierID')?.value,
      mcNumber: this.reportSearchForm.get('mcNumber')?.value,
      createDateFrom: this.reportSearchForm.get('createDateFrom')?.value,
      createDateTo: this.reportSearchForm.get('createDateTo')?.value,
      createDate: this.reportSearchForm.get('createDate')?.value,
      managed: managedShipments,
      pickupException: this.reportSearchForm.get('pickupException')?.value,
      deliveryException: this.reportSearchForm.get('deliveryException')?.value,
      status: this.allStatusesCount > 0 ? this.statusesTerms : this.reportSearchForm.get(['statuses'])?.value
    };

    if (searchParams.status == null || searchParams.status.length === 0) { searchParams.status = ''; }
    const carrierName = this.reportSearchForm.get('carrierName')?.value;
    const modeDescription = this.reportSearchForm.get('mode')?.value;
    this.summaryParams = Object.keys(searchParams).map(key => searchParams[key] !== '' ? this.getParamTitle(key) + ' = ' +
      (key === 'managed' ? (managedShipments === '1' ? 'Yes' : 'No') : key === 'mode' ? modeDescription : key === 'pickupException' ?
        pickExceptionTxt : (key === 'deliveryException' ? delExceptionTxt : (key === 'carrierID' ? carrierName : searchParams[key]))) : '')
      .filter(key => key !== '' && key != null).join(', ');
    if (this.summaryParams === '') { this.summaryParams = 'All'; }
    let queryParams = Object.keys(searchParams).map(key => searchParams[key] !== '' ? key + '=' + searchParams[key] : '')
      .filter(key => key !== '' && key != null).join('&');
    this.backToSearch = true;
    this.spinner.show('reportSearchSpinner').then();
    this.rs.getShipmentReport(queryParams.replace(/#/g, '%23')).subscribe({
      next: (response: any) => {
        const report: ShipmentReport = response as ShipmentReport;
        const reportData: Shipment[] = report.shipments;
        for (const shipReportData of reportData) {
          this.reportsData.push(shipReportData);
        }
        this.dt.rerender();
        this.spinner.hide('reportSearchSpinner').then();
        if (report.reportDetail.maxResultsExceeded) {
          Swal.fire('Report Search', `This search has exceeded the maximum number of records of
             ${report.reportDetail.maxResults} for a single request and only the top results are being displayed.
              Please refine your search parameters for a more specific data set`, 'info');
        }
      },
      error: () => {
        this.spinner.hide('reportSearchSpinner').then();
      }
    });
  }

  setData(data: any, format = false, center = true) {
    const classAlign = format ? 'float-end' : center ? 'text-center' : 'float-start';
    if (data == null || data === '') {
      return `<span class="${classAlign}">-</span>`;
    } else {
      return (format ? `<span class="${classAlign}">${this.dollarUS.format(data)}</span>` : `<span class="${classAlign}">${data}</span>`);
    }
  }

  getParamTitle(param: string) {
    let title = param;
    if (param === 'shipmentID') { title = 'Shipment ID'; }
    if (param === 'shipDate') { title = 'Shipment Date'; }
    if (param === 'clientCode') { title = 'Client Code'; }
    if (param === 'proNumber') { title = 'PRO Number'; }
    if (param === 'bolNumber') { title = 'BOL Number'; }
    if (param === 'poNumber') { title = 'PO Number'; }
    if (param === 'deliveryDate') { title = 'Delivery Date'; }
    if (param === 'mode') { title = 'Mode'; }
    if (param === 'terms') { title = 'Terms'; }
    if (param === 'shipDateFrom') { title = 'Shipment Date From'; }
    if (param === 'shipDateTo') { title = 'Shipment Date To'; }
    if (param === 'shipperName') { title = 'Shipper Name'; }
    if (param === 'shipperAddress') { title = 'Shipper Address'; }
    if (param === 'shipperCity') { title = 'Shipper City'; }
    if (param === 'shipperState') { title = 'Shipper State'; }
    if (param === 'shipperZip') { title = 'Shipper Zip'; }
    if (param === 'consigneeName') { title = 'Consignee Name'; }
    if (param === 'consigneeAddress') { title = 'Consignee Address'; }
    if (param === 'consigneeCity') { title = 'Consignee City'; }
    if (param === 'consigneeState') { title = 'Consignee State'; }
    if (param === 'consigneeZip') { title = 'Consignee Zip'; }
    if (param === 'carrierID') { title = 'Carrier'; }
    if (param === 'mcNumber') { title = 'MC Number'; }
    if (param === 'statuses') { title = 'Status'; }
    if (param === 'pickupException') { title = 'Pickup Exception'; }
    if (param === 'deliveryException') { title = 'Delivery Exception'; }
    if (param === 'managed') { title = 'Only show managed shipments'; }
    return title;
  }

  sortAndFilter(data: any[]) {
    return data.sort().filter((x, i, a) => !i || x != a[i - 1]);
  }

  getStatusDropdown() {
    if (this.statusesSearchList.length > 0 || this.global.statusFilterData().length > 0) {
      this.statusDropdown = this.statusesSearchList.length > 0 ? this.statusesSearchList : this.global.statusFilterData();
      this.statusLoaded = true;
      return;
    }

    this.rss.getAvailableStatuses().subscribe({
      next: (response: any) => {
        let statuses: string[] = [];
        response.forEach((value: { status: string; }) => {
          statuses.push(value.status);
        });

        this.sortAndFilter(statuses).forEach((value: any) => {
          this.statusDropdown.push({item: value, value});
        });

        this.global.statusFilterData.set(this.statusDropdown);
      },
      complete: () => {
        this.statusLoaded = true;
      }
    });
  }

  validateCreateDate() {
    const createDateToValue = this.reportSearchForm.get('createDateTo')?.value;
    const createDateFromValue = this.reportSearchForm.get('createDateFrom')?.value;

    if (createDateToValue !== null) {
      const createDateTo = new Date(createDateToValue);
      const createDateFrom = new Date(createDateFromValue);
      if (createDateTo <= createDateFrom) { this.reportSearchForm.get('createDateTo')?.setValue(''); }
    }
  }

  initializeReportSearchForm() {
    this.reportSearchForm = this.fb.group({
      shipmentID: [''],
      shipDate: [''],
      clientCode: [''],
      proNumber: [''],
      bolNumber: [''],
      poNumber: [''],
      deliveryDate: [''],
      mode: [''],
      terms: [''],
      shipDateFrom: [''],
      shipDateTo: [''],
      shipperName: [''],
      shipperAddress: [''],
      shipperCity: [''],
      shipperState: [''],
      shipperZip: [''],
      consigneeName: [''],
      consigneeAddress: [''],
      consigneeCity: [''],
      consigneeState: [''],
      consigneeZip: [''],
      carrierID: [''],
      carrierName: [''],
      mcNumber: [''],
      statuses: [''],
      createDateFrom: [''],
      createDateTo: [''],
      createDate: [''],
      managed: [''],
      pickupException: [''],
      deliveryException: ['']
    });
  }

  convertToFormControl(absCtrl: AbstractControl | null): FormControl {
    return absCtrl as FormControl;
  }
}

