import {
  AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList,
  signal, SimpleChanges, ViewChildren,
  WritableSignal
} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {formatDate} from '@angular/common';
import {RateService} from '../../services/rate/rate.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {ActivatedRoute, Router} from '@angular/router';
import {Constants} from '../../constants/constants';
import {Rate} from '../../interfaces/rate';
import {RateGrid} from '../../interfaces/rate-grid';
import {DataTable} from '../data-table/data-table';
import {GroupInfo} from '../../interfaces/group-info';
import {CostBreakdown} from '../../interfaces/cost-breakdown';
import {Customization} from '../../interfaces/customization';
import {RateRequestLineItem} from '../../interfaces/rate-request-line-item';
import {GroupsService} from '../../services/groups/groups.service';
import moment from 'moment';
import {TruckloadRatesResponse} from '../../interfaces/truckload-rate-response';
import Swal from 'sweetalert2';
import {Report} from '../../interfaces/rate-carrier-history';
import {ManualQuote} from '../../interfaces/manual-quote';
import {RateType} from '../../interfaces/rate-type';
import {UploadService} from '../../services/upload/upload.service';
import {TruckFees} from '../../interfaces/truck-fees';
import {UtilityService} from '../../services/utility/utility.service';
import {Accessorial} from '../../interfaces/accessorial';
import {ClientDropdownResponse} from '../../interfaces/client-dropdown-response';
import { CarrierDetail } from '../../interfaces/carrier-detail';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

@Component({
  selector: 'app-rates-grid',
  standalone: false,
  templateUrl: './rates-grid.html',
  styleUrl: './rates-grid.css',
})
export class RatesGrid implements OnInit, OnChanges, AfterViewInit {
  @ViewChildren(DataTable) dt!: QueryList<DataTable>;
  selectedRateFormat: CostBreakdown[] = [] as CostBreakdown[];
  showCustomerCost = false;
  rateExceptionWarnings = false;
  rateExceptionPassthrough = false;
  allowChooseRateException = false;
  disableRateWarning = false;
  isRateExceeds = false;
  sortOrder = [[3, 'asc']];
  hadSelectedNegotiationType2 = false;
  previousBillToName = '';
  previousBillToCareOf = '';
  rateBreakdownColumns = [
    {
      title: '',
      data: 'name',
      className: 'text-left',
      orderable: true
    },
    {
      title: 'Cost',
      data: 'clientCost',
      orderable: true
    },
    {
      title: 'IL2000 Cost',
      data: 'ilCost',
      orderable: true
    },
    {
      title: 'Customer Cost',
      data: 'customerCost',
      orderable: true,
      visible: this.showCustomerCost
    }
  ];
  rateColumns: any[] = [];
  truckloadRateColumns: any[] = [];
  truckloadRateColumnsMore: any[] = [];
  ratesGridForm!: FormGroup;
  currentDate!: string;
  @Input() disableEmailBtn = true;
  emailBodyRates: any[] = [];
  htmlEmailBody = '';
  @Input() emailBtn = true;
  @Input() downloadBtn = true;
  @Input() createShipmentBtn = true;
  @Input() fetchRatesBtn = false;
  @Input() preSelectedRates?: any;
  @Input() rates?: any = null;
  @Input() hideGrid = true;
  @Input() validRates = false;
  @Output() ratesSelectedEvent = new EventEmitter<boolean>(true);
  @Output() ratesClickEvent = new EventEmitter<boolean>(true);
  @Output() ratesToSave = new EventEmitter<any>();
  @Output() fieldsRequired = new EventEmitter<any>();
  @Input() groupInfo?: GroupInfo;
  @Input() clientCode: any = '';
  @Input() client = '';
  @Input() disabled = false;
  @Input() customizations: Customization[] = [] as Customization[];
  @Input() shipmentType: 'LTL' | 'Truckload' | 'Truckload Edit' = 'LTL';
  @Input() showNonDirectPoints = false;
  responseData: Rate[] = [];
  historyResponseData: Report[] = [];
  truckloadResponseData!: TruckloadRatesResponse | null;
  ratesData: WritableSignal<RateGrid[]> = signal([]);
  truckloadRatesData: WritableSignal<RateGrid[]> = signal([]);
  @Input() hasOther = false;
  showOther = false;
  warningColumnVisible = false;
  @Input() isFromQuickRates = false;
  @Input() isQuickRate = false;
  @Input() mileage: number = 0;
  @Input() shipperAddress = '';
  @Input() shipperState = '';
  @Input() shipperCity = '';
  @Input() consigneeAddress = '';
  @Input() consigneeState = '';
  @Input() consigneeCity = '';
  @Input() terms = '';
  @Input() billToName = '';
  @Input() clientPlantID: number | null = null;
  @Input() fromZip = '';
  @Input() toZip = '';
  @Input() fees: string[] = [];
  @Input() lineItems: any[] = [];
  @Input() stopLineItems: any[] = [];
  @Input() carrierList: any[] = [];
  @Input() otherCustomRates: any[] = [];
  @Input() additionalInsurance: number | null = null;
  @Input() shipDate = '';
  @Input() doubleChecked!: [false, false, false];
  @Input() clientPlantPPA: any = '';
  @Input() clientPlantPPAAdjustment: any = -1;
  @Input() totalLinearFeet: number = 0;
  @Input() rateType: string | null = null;
  @Input() currencyType: any = '';
  @Input() carCurrencyType: any = '';
  @Input() serviceLevel: string | null = null;
  @Input() equipment: string | null = null;
  @Input() preSelectedCarrierID: string | null = null;
  @Input() preSelectedCarrierName: string | null = null;
  @Input() manualQuotes: ManualQuote[] = [] as ManualQuote[];
  @Input() truckFees: TruckFees[] = [] as TruckFees[];
  selectedRateType: RateType | null = null;
  isInternalGroupMgmt = false;
  ratesLoaded = false;
  check!: void;
  // Format rates
  dollarUS = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  @Output() formValidationEvent = new EventEmitter<boolean>(true);
  @Input() historyRatesBtn = false;
  carrierHistoryRatesData: any[] = [];
  carrierHistoryRatesLastData: any[] = [];
  hideHistoryRatesGrid = true;
  collapseRatesGrid = false;
  showMoreRates = false;
  historyTrucks: any[] = [];
  carrierHistoryRateColumns = [
    {
      title: 'Carrier Name',
      data: 'carrierName',
      className: 'text-left',
      orderable: true
    },
    {
      title: 'MC #',
      data: 'mcNumber',
      className: 'text-center',
      orderable: true
    },
    {
      title: 'DOT #',
      data: 'dotNumber',
      className: 'text-center',
      orderable: true
    },
    {
      title: 'Actual Buy Rate',
      data: 'actualBuyRate',
      orderable: true,
      render: (data: string, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'Actual Sell Rate',
      data: 'actualSellRate',
      orderable: true,
      render: (data: string, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'Actual GM $',
      data: 'actualGMDollars',
      orderable: true,
      render: (data: string, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'Actual GM %',
      data: 'actualGMPercent',
      orderable: true,
      render: (data: any) => {
        if (data == null || data === '') {
          return '<span class="text-center">-</span>';
        }
        return this.setData(data + ' %');
      }
    },
    {
      title: 'Market Buy Rate',
      data: 'marketBuyRate',
      orderable: true,
      render: (data: string, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'Buy Pct to Market Rate',
      data: 'buyToMarketPercent',
      orderable: true,
      render: (data: any) => {
        if (data == null || data === '') {
          return '<span class="text-center">-</span>';
        }
        return this.setData(data + ' %');
      }
    },
    {
      title: '',
      data: 'truckDrilldown',
      visible: false
    }
  ];

  carrierHistoryRatesDataColumns = [
    {
      title: 'Carrier Name',
      data: 'carrierName',
      className: 'text-left',
      orderable: true
    },
    {
      title: 'Loads',
      data: 'numberOfLoads',
      orderable: true,
      render: (data: any) => {
        return this.setData(data);
      }
    },
    {
      title: 'MC #',
      data: 'mcNumber',
      className: 'text-center',
      orderable: true
    },
    {
      title: 'DOT #',
      data: 'dotNumber',
      className: 'text-center',
      orderable: true
    },
    {
      title: 'ABR',
      data: 'actualBuyRate',
      orderable: true,
      render: (data: any, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'ASR',
      data: 'actualSellRate',
      orderable: true,
      render: (data: any, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'AGM $',
      data: 'actualGMDollars',
      orderable: true,
      render: (data: any, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'AGM %',
      data: 'actualGMPercent',
      orderable: true,
      render: (data: any) => {
        if (data == null || data === '') {
          return '<span class="text-center">-</span>';
        }
        return this.setData(data + ' %');
      }
    },
    {
      title: 'AMBR',
      data: 'marketBuyRate',
      orderable: true,
      render: (data: any, type: any, row: any) => {
        data = this.setData(data, row);
        return data + ' ' + this.currencyType;
      }
    },
    {
      title: 'ABPMR',
      data: 'buyToMarketPercent',
      orderable: true,
      render: (data: any) => {
        if (data == null || data === '') {
          return '<span class="text-center">-</span>';
        }
        return this.setData(data + ' %');
      }
    },
    {
      title: '',
      data: 'truckDrilldown',
      visible: false
    }
  ];
  @Input() isShipmentPage = true;
  @Input() targetBuy = '';
  @Input() targetSell = '';
  private date = new Date();
  private rateRequest: any;
  tlRateRequest: any;
  private tlRatesLoaded = false;
  @Input() quoteReferenceNumber = '';
  callbackFnc: any = null;
  @Input() isTruckloadPage = false;
  selectedRate = false;
  rateButtonText = 'View More';
  isretiveRatesCalled = false;
  hideEditButton = false;
  clients: any;
  ClientDropdownNew: string[] = [];
  rangeWeeks = 24;
  selectedEquipmentType!: string;
  selectedCustomer!: string;
  selectedCarrier: any;
  carrierNamesDropDown: (string | null)[] = [];
  carrierNameList!: CarrierDetail[];
  @Output() updateGetRatesData = new EventEmitter<any>();
  @Output() updateRetriveSelectedRatesEvent = new EventEmitter<any>();
  apiRateType = 0;
  isWhiteGlove = 0;
  isGroupCustomization = 0;
  bundleFedexRates = 0;

  constructor(
    private gs: GroupsService,
    private fb: FormBuilder,
    private rateService: RateService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private uploadService: UploadService,
    public utilityService: UtilityService,
    private route: ActivatedRoute) {
    // SET CLIENTS ON ROUTE
    this.clients = this.route.snapshot.data["clients"];
    // SET THE DROPDOWN VALUES
    if (this.clients.length > 0) {
      this.setDropdownOptions(this.clients);
    }
    this.gs.isValidPermission().then(data => {
      this.isInternalGroupMgmt = data;
    });
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    const carrierData = availableCarriers ? JSON.parse(availableCarriers) : null;
    this.getCarrierDropDown(carrierData);
  }

  setDropdownOptions(clients: any) {
    const parsedResponse: ClientDropdownResponse[] = clients as ClientDropdownResponse[];
    let previousClient = clients[0].clientCode;
    let previousCompany = clients[0].companyName;

    if (clients.length === 1) {
      this.ClientDropdownNew.push(previousClient + '-' + previousCompany);
    } else {
      // REDUCE TO REMOVE DUPLICATE CLIENT CODES
      const client = this.clients.reduce((accumulator: any, current: any) => {
        if (!accumulator.some((item: any) => item.clientCode === current.clientCode)) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      // GROUP CLIENTS WITH PLANTS
      client.forEach((c: any) => {
        this.ClientDropdownNew.push(c.clientCode + '-' + c.companyName);
        parsedResponse.forEach(option => {
          if (option.clientCode == c.clientCode) {
            previousClient = option.clientCode;
            previousCompany = option.companyName;
          }
        });
      });
    }
  }

  get ratesArray() {
    return this.ratesGridForm.get('otherRates') as FormArray;
  }

  get carriers() {
    return this.carrierList.length > 0 ?
      this.carrierList.filter((e) => {
        return (e.tiberID && e.tiberID > 0 &&
          e.tiberID.toString() !== '2514' && e.tiberID.toString() !== '23472' && e.tiberID.toString() !== '17376');
      }) : [];
  }

  get equipmentType() {
    const equipmentType: string[] = [];
    Constants.EQUIPMENT_DROPDOWN.forEach(value => {
      equipmentType.push(value.item);
    });
    return equipmentType;
  }

  ngOnInit(): void {
    this.currentDate = formatDate(this.date, 'MM-dd-yyyy', 'en', '');
    this.ratesGridForm = this.fb.group({
      otherRates: this.fb.array([this.getOtherRates()]),
      selectedRate: this.getSelectedRate(),
    });
    // SET INITIAL GRID DATA IF RATES PROVIDED
    if (this.rates) {
      this.buildRateRequest();
      if (this.shipmentType === 'LTL') {
        this.ratesData.set(this.rates);
      } else {
        this.truckloadRatesData.set(this.rates);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges | any) {
    if (this.shipmentType === 'LTL') {
      this.setRatesHeaders().then();
    } else {
      this.setTruckloadRatesHeaders();
    }

    if (this.isQuickRate) {
      this.fetchRatesBtn = false;
      this.hideGrid = true;
    } else {
      if (changes && !changes["isFromQuickRates"]) {
        if (this.isFromQuickRates) {
          this.hideFetchRatesButton();
        } else {
          if (this.rates == null) {
            this.showFetchRatesButton();
          }
        }
      }
    }
  }

  ngAfterViewInit() {
    // HIDES RETRIEVE RATES BUTTON AND SHOWS THE GRID IF WE HAVE RATES LOADED ALREADY
    if (this.rates && this.isFromQuickRates && !this.volumeRateCheck()) {
      this.hideFetchRatesButton();
    }
  }

  hideBuyRateCB() {
    $('#rateBreakdownDataTable > thead > tr > th:nth-child(3)').hide();
    $('#rateBreakdownDataTable').find('tr td:nth-child(3)').each(function() {
      $(this).hide();
    });
  }

  updateManualRates() {
    let ratesToSave = [];
    for (let i = 0; i < this.ratesData().length; i++) {
      // check if manual quote
      if (this.ratesData()[i].rateType === RateType.MANUAL_LTL || this.ratesData()[i].rateType === RateType.REDRAW) {
        this.ratesData()[i].rateType = RateType.MANUAL_LTL;
        this.ratesData()[i].ilCost = this.ratesData()[i].carrierCost;
        ratesToSave.push(this.ratesData()[i]);
      }
    }
    this.ratesToSave.emit(ratesToSave);
  }

  async setRatesHeaders() {
    this.showCustomerCost = false;
    this.rateExceptionWarnings = false;
    this.rateExceptionPassthrough = false;
    this.disableRateWarning = false;
    this.allowChooseRateException = false;

    for (const customization of this.customizations) {
      if (customization.customizationID === 26) {
        this.showCustomerCost = true;
      }
      if (customization.customizationID === 78) {
        this.rateExceptionWarnings = true;
      }
      if (customization.customizationID === 79) {
        this.rateExceptionPassthrough = true;
      }
      if (customization.customizationID === 81) {
        this.disableRateWarning = true;
      }
      if (customization.customizationID === 82) {
        this.allowChooseRateException = true;
      }
    }

    this.showCustomerCost = !await this.gs.isValidPermission();

    this.rateColumns = [{
      title: 'Select',
      defaultContent: this.fb.control(''),
      data: 'id',
      orderable: false,
      targets: 0,
      className: 'rateChk',
      render: (data: any, type: any, row: any) => {
        const checked = this.preSelectedCarrierID == row.carrierID && this.preSelectedCarrierName == row.carrierName ? 'checked' : '';
        const checkedCheckbox = `<span class="form-check m-0 float-start">` +
          `<input id="${data}" class="form-check-input editRateInput" checked="${checked}" type="checkbox" ${this.disabled ? 'disabled' : ''} name="input${data}"></span>`;
        const uncheckedCheckbox = `<span class="form-check m-0 float-start">` +
          `<input id="${data}" class="form-check-input editRateInput" type="checkbox" ${this.disabled ? 'disabled' : ''} name="input${data}"></span>`;
        // any "specialty rate",
        // match the row's rate type with selectedRateType
        if (this.selectedRateType != null) {
          // check based on the assigned boolean
          if (this.selectedRateType === RateType.MANUAL_LTL && row.rateType == RateType.MANUAL_LTL && row.assigned == true) {
            this.ratesSelectedEvent.emit(true);
            return checkedCheckbox;
          }
          if (this.selectedRateType === RateType.MANUAL_TL && row.rateType == RateType.MANUAL_TL && row.assigned == true) {
            this.ratesSelectedEvent.emit(true);
            return checkedCheckbox;
          }
          return uncheckedCheckbox;
        } else {
          if (row.rateType == RateType.TARGET_TL && this.preSelectedCarrierID == row.carrierID) {
            this.setSelectedValue(row);
            return checkedCheckbox;
          }

          if ((this.serviceLevel && this.serviceLevel.toUpperCase() !== 'VOLUME') && row.rateType == RateType.RATER_LTL &&
            this.preSelectedCarrierID == row.carrierID && this.preSelectedCarrierName == row.carrierName) {
            this.setSelectedValue(row);
            return checkedCheckbox;
          }

          if ((this.serviceLevel && this.serviceLevel.toUpperCase() === 'VOLUME') && row.rateType == RateType.RATER_VOLUME &&
            this.preSelectedCarrierID == row.carrierID && this.rateType == row.negotiationType) {
            this.setSelectedValue(row);
            return checkedCheckbox;
          }
          return uncheckedCheckbox;
        }
      }
    },
      {
        title: 'Carrier Name',
        data: 'carrierName',
        orderable: true,
        targets: 1,
        render: (data: any, type: any, row: any) => {
          if (row.isVolumeRate) {
            return data ? data + `<b> [VOLUME]</b>` : `<b>[VOLUME]</b>`;
          } else if (row.exceedsMaxWeight) {
            return data ? data + `<b> [MAX WEIGHT EXCEEDED]</b>` : `<b>[MAX WEIGHT EXCEEDED]</b>`;
          } else if (row.exceedsCubicCapacity) {
            return data ? data + `<b> [CUBIC CAPACITY EXCEEDED]</b>` : `<b>[CUBIC CAPACITY EXCEEDED]</b>`;
          } else if (row.exceedsLinearFoot) {
            return data ? data + `<b> [LINEAR FOOT EXCEEDED]</b>` : `<b>[LINEAR FOOT EXCEEDED]</b>`;
          } else {
            return data;
          }
        }
      },
      {
        title: 'Time Stamp',
        data: 'timeStamp',
        orderable: false,
        targets: 7,
        visible: true,
        render: (data: any, type: any, row: any) => {
          if (data) {
            const utcTime = data + ' utc';
            data = moment(new Date(utcTime.toLocaleString())).format('L LT');
          } else {
            data = '-';
          }
          return this.setDataForTimeStamp(data, row, true);
        }
      },
      {
        title: this.isInternalGroupMgmt ? 'Sell Rate' : 'Client Cost',
        data: 'clientCost',
        orderable: true,
        targets: 4,
        className: 'primary-blue',
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            return this.setDataForEditableRow(data, 'clientCost', row.quoteID, true);
          }
          return this.setData(data, row, true);
        }
      },
      {
        title: this.isInternalGroupMgmt ? 'Buy Rate' : 'IL2000 Cost',
        data: 'ilCost',
        orderable: true,
        targets: 3,
        className: 'red buyRate',
        visible: this.isInternalGroupMgmt,
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            return this.setDataForEditableRow(row.carrierCost, 'ilCost', row.quoteID, true);
          }
          return this.setData(data, row, true);
        }
      },
      {
        title: 'Customer Cost',
        data: 'customCost',
        orderable: false,
        targets: 5,
        visible: this.showCustomerCost,
        className: 'primary-blue',
        render: (data: any, type: any, row: any) => {
          return this.setData(data, row, true);
        }
      },
      {
        title: 'Quote Number',
        data: 'quoteNumber',
        orderable: true,
        targets: 7,
        visible: true,
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            return this.setDataForEditableRow(data, 'quoteNumber', row.quoteID, false);
          }
          return this.setData(data, false, true);
        }
      },
      {
        title: 'Transit Time',
        data: 'transitTime',
        orderable: true,
        targets: 2,
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            return this.setDataForEditableRow(data, 'transitTime', row.quoteID, false);
          }
          return this.setDataForTransitSort(data, false, row);
        }
      },
      {
        title: 'Notes',
        data: 'notes',
        orderable: false,
        targets: 7,
        visible: true,
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            return this.setDataForEditableRow(data, 'notes', row.quoteID, false);
          }
          return this.setNotes(data, row, true);
        }
      },
      {
        title: 'Edit',
        defaultContent: '',
        data: 'quoteNumber',
        orderable: false,
        targets: 8,
        className: 'rateChk',
        render: (data: any, type: any, row: any) => {
          if (row.rateType === RateType.MANUAL_LTL) {
            const styleButton = (this.hideEditButton && !row.assigned ? 'style="visibility: hidden"' : '');
            return `<div class="pt-1 icon-pointer" id="editButton" ${styleButton} onclick="$('.${row.quoteID}.editRateRowInputs.form-control.form-control-sm').show();$('.${row.quoteID}.editRateRowValues').hide()"><i class="material-icons dodger-blue">edit</i></div>`;
          }
          return '';
        }
      },
      {
        title: 'Warning',
        data: 'warning',
        orderable: false,
        targets: 6,
        width: '30%',
        visible: (this.volumeRateCheck() && this.warningColumnVisible),
        className: 'red small-font-size'
      },
    ];

    if (this.dt != undefined) {
      const foundDt = this.dt.find(t => t.gridName === 'ltlRates');
      if (foundDt) {
        foundDt.dtOption.columns = this.rateColumns;
      }
    }
  }

  selectedValue(data: any) {
    $('.buyRate').show();
    if (data == null) {
      this.updateRetriveSelectedRatesEvent.emit(data ?? []);
      this.unselectValue();
    } else {
      if (data.carrierName === 'Other') {
        this.showOther = true;
        this.preSelectedRates = undefined;
        // REMOVE OTHER CARRIER ROW AND REDRAW TABLE
        this.ratesData.set(this.ratesData().filter(value => value.carrierName !== 'Other'));
        this.dt.find(t => t.gridName === 'ltlRates')?.reDrawTable(this.ratesData());
        this.ratesArray.removeAt(0);
        this.addRate();
      } else {
        this.updateRetriveSelectedRatesEvent.emit(data ?? []);
        this.setSelectedValue(data);
        this.clearOtherSelectedRates();
      }
    }
  }

  getSelectedRate(assigned = false, carrierID = null, id = null, carrierName = '', proNumber = '',
                  quoteID = '', transitTime = 0, ilCost = 0, clientCost = 0, customCost = 0,
                  carrierQuote = null, clientQuote = null, customerQuote = null, feesMap = {}, serviceLevel = '',
                  creationDate = null, fuelSurchargeBuy = null, fuelSurchargeSell = null, targetBuy = null, targetSell = null,
                  targetRateID = null, exceedsLinearFoot = false, exceedsCubicCapacity = false,
                  exceedsMaxWeight = false, isTLRate = false, processingFee = null, negotiationType = null,
                  rateType = null, fuelSurchargeAvg = null, ratePerMileAvg = null, marketAvg = null, isVolumeRate = false,
                  marketLow = null, marketHigh = null, originName = null, originType = null, destinationName = null, destinationType = null,
                  timeFrame = null, equipment = null, mileage = null, rateUUID = '') {
    return this.fb.group({
      assigned,
      id,
      carrierID,
      carrierName,
      proNumber,
      quoteID,
      transitTime,
      ilCost,
      clientCost,
      customCost,
      carrierQuote,
      clientQuote,
      customerQuote,
      feesMap,
      serviceLevel,
      targetRateID,
      creationDate,
      fuelSurchargeBuy,
      fuelSurchargeSell,
      targetBuy,
      targetSell,
      exceedsLinearFoot,
      exceedsCubicCapacity,
      exceedsMaxWeight,
      isVolumeRate,
      isTLRate,
      processingFee,
      negotiationType,
      rateType,
      fuelSurchargeAvg,
      ratePerMileAvg,
      marketAvg,
      marketLow,
      marketHigh,
      originName,
      originType,
      destinationName,
      destinationType,
      timeFrame,
      equipment,
      mileage,
      currencyType: this.currencyType,
      serviceProviderType: null,
      carCurrencyType: this.carCurrencyType,
      rateUUID
    });
  }

  getOtherRates(id = null, carrierID = null, assigned = false, carrierName = '', quoteID = '',
                ilCost = null, clientCost = '', customCost = null, carrierQuote = null, clientQuote = null,
                customerQuote = null, feesMap = {}, carrierCost = null, quoteNumber = null, transitTime = null,
                timeStamp = null, notes = '', rateType = RateType.MANUAL_LTL) {
    return this.fb.group({
      id,
      assigned,
      carrierID,
      carrierName,
      quoteID,
      ilCost,
      clientCost,
      customCost,
      carrierQuote,
      clientQuote,
      customerQuote,
      carrierCost,
      quoteNumber,
      transitTime,
      feesMap,
      timeStamp,
      notes,
      rateType,
      currencyType: this.currencyType
    });
  }

  addRate() {
    this.ratesData().length++;
    this.ratesArray.push(this.getOtherRates());
  }

  removeRate(index: number) {
    this.ratesArray.removeAt(index);
    if (this.ratesArray.length === 0) {
      this.resetOther();
    }
  }

  getRates(rateRequest: any) {
    this.rateRequest = rateRequest;
    if (typeof rateRequest !== 'undefined' && rateRequest != null && JSON.stringify(rateRequest) != JSON.stringify({})
      && this.rateRequest.clientPlantID !== undefined) {
      // this.spinner.show('ratesGrid');
      this.ratesLoaded = false;
      let apiRateType = rateRequest.apiRateTypes;

      // Updated logic for apiRateType as mention on https://agile-il2000.atlassian.net/browse/GLOB-3402
      if (this.isGroupCustomization === 1) { apiRateType.push(1); }

      if (this.isWhiteGlove === 1) {
        apiRateType.push(0);
        const index = apiRateType.indexOf(1);
        if (index === -1) { apiRateType.push(1); }
      }

      if (this.bundleFedexRates === 1) { apiRateType.push(2); }
      rateRequest.apiRateTypes = apiRateType;
      rateRequest.fromZip = rateRequest.fromZip ? rateRequest.fromZip.trim() : null;
      rateRequest.toZip = rateRequest.toZip ? rateRequest.toZip.trim() : null;
      this.rateService.getRates(rateRequest).subscribe({
        next: response => {
          this.responseData.length = 0;
          this.responseData = response ? response.rates : [];
          // FILTER OUT RATES WITHOUT ASSOCIATED COSTS
          this.responseData = this.responseData.filter((rate): any => {
            // Check if rate has a quote or custom quote
            if ((rate.carrierQuote.quote != null || rate.clientQuote.quote != null || rate.customQuote != null)) {
              return rate;
            }
          });
        },
        error: e => {
          this.ratesLoaded = true;
          this.responseData = [];
          this.setRateGridData();
          this.showRateDisclaimer();
          Swal.fire({
            title: 'Retrieve rates',
            icon: 'warning',
            html: 'Unable to get rates. ' + (e ? e.toString() : ''),
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
        },
        complete: () => {
          this.ratesLoaded = true;
          this.setRateGridData();
          this.showRateDisclaimer();
        }
      });
    } else {
      this.spinner.hide('ratesGrid').then();
    }
  }

  onfetchRatesClicked(calledFromShipment = false) {
    this.fetchRates(null, calledFromShipment);
  }

  setActiveFees(fees: any) {
    this.fees = fees;
  }

  setRateBreakdown() {
    this.selectedRateFormat.length = 0;
    const selectedRate: RateGrid = this.ratesGridForm.get('selectedRate')?.value;

    // Gross charge
    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: 'Gross',
        ilCost: (selectedRate.carrierCharge) ?
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierCharge)} ${this.carCurrencyType}</span>` : '',
        clientCost: (selectedRate.customerCharge) ?
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerCharge)} ${this.currencyType}</span>` : '',
        customerCost: ''
      });
    } else {
      this.selectedRateFormat.push({
        name: 'Gross',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.grossCharge == null) ?
          (selectedRate.ilCost ?
            `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.ilCost))} ${this.carCurrencyType}</span>` : null) :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.grossCharge)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.grossCharge == null) ?
          (selectedRate.clientCost ?
            `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.clientCost))} ${this.currencyType}</span>` : null) :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.grossCharge)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.grossCharge == null) ?
          (selectedRate.customCost ?
            `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.customCost))} ${this.currencyType}</span>` : null) :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.grossCharge)} ${this.currencyType}</span>`
      });
    }

    // Discount
    this.selectedRateFormat.push({
      name: 'Discount',
      ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.discount == null) ? null :
        `<span class="text-center">-${this.dollarUS.format(selectedRate.carrierQuote?.discount?.replace('-', ''))} ${this.carCurrencyType}</span>`,
      clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.discount == null) ? null :
        `<span class="text-center">-${this.dollarUS.format(selectedRate.clientQuote?.discount?.replace('-', ''))} ${this.currencyType}</span>`,
      customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.discount == null) ? null :
        `<span class="text-center">-${this.dollarUS.format(selectedRate.customerQuote?.discount?.replace('-', ''))} ${this.currencyType}</span>`
    });

    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: 'Fuel',
        ilCost: (selectedRate.fuelSurchargeBuy) ?
          `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.fuelSurchargeBuy))} ${this.carCurrencyType}</span>` : '',
        clientCost: (selectedRate.fuelSurchargeSell) ?
          `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.fuelSurchargeSell))} ${this.currencyType}</span>` : '',
        customerCost: ''
      });
    }

    if (!selectedRate.isTLRate && selectedRate.serviceLevel?.toUpperCase() !== 'VOLUME') {
      this.selectedRateFormat.push({
        name: 'Fuel',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.fuel === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.fuel)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.fuel === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.fuel)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.fuel === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.fuel)} ${this.currencyType}</span>`
      });
    }

    if (!selectedRate.isTLRate && selectedRate?.carrierQuote?.gstamount != null) {
      this.selectedRateFormat.push({
        name: 'Canadian GST Tax',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.gstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.gstamount)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.gstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.gstamount)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.gstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.gstamount)} ${this.currencyType}</span>`
      });
    }

    if (!selectedRate.isTLRate && selectedRate?.carrierQuote?.hstamount != null) {
      this.selectedRateFormat.push({
        name: 'Canadian HST Tax',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.hstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.hstamount)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.hstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.hstamount)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.hstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.hstamount)} ${this.currencyType}</span>`
      });
    }

    if (!selectedRate.isTLRate && selectedRate?.carrierQuote?.pstamount != null) {
      this.selectedRateFormat.push({
        name: 'Canadian PST Tax',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.pstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.pstamount)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.pstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.pstamount)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.pstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.pstamount)} ${this.currencyType}</span>`
      });
    }

    if (!selectedRate.isTLRate && selectedRate?.carrierQuote?.qstamount != null) {
      this.selectedRateFormat.push({
        name: 'Canadian QST Tax',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.qstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.qstamount)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.qstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.qstamount)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.qstamount === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.qstamount)} ${this.currencyType}</span>`
      });
    }

    // Processing fee
    this.selectedRateFormat.push({
      name: 'Processing Fee',
      ilCost: '',
      clientCost: (selectedRate.processingFee ?
        `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.processingFee))} ${this.currencyType}</span>` : ''),
      customerCost: (selectedRate.processingFee ?
        `<span class="text-center">${this.dollarUS.format(parseFloat(selectedRate.processingFee))} ${this.currencyType}</span>` : '')
    });

    // Accessorials
    for (const key in selectedRate.feesMap) {
      this.selectedRateFormat.push({
        name: key,
        ilCost: `<span class="text-center">${this.dollarUS.format(selectedRate.feesMap[key])} ${this.carCurrencyType}</span>`,
        clientCost: `<span class="text-center">${this.dollarUS.format(selectedRate.feesMap[key])} ${this.currencyType}</span>`,
        customerCost: `<span class="text-center">${this.dollarUS.format(selectedRate.feesMap[key])} ${this.currencyType}</span>`
      });
    }

    // Additional Insurance
    if ((this.fees && this.fees.findIndex(f => f == '916') > -1) ||
      (selectedRate.carrierQuote && selectedRate.carrierQuote?.additionalInsurance) ||
      (selectedRate.clientQuote && selectedRate.clientQuote?.additionalInsurance) ||
      (selectedRate.customerQuote && selectedRate.customerQuote?.additionalInsurance)) {
      this.selectedRateFormat.push({
        name: 'Additional Insurance',
        ilCost: (selectedRate.carrierQuote == null || selectedRate?.carrierQuote?.additionalInsurance === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.carrierQuote?.additionalInsurance)} ${this.carCurrencyType}</span>`,
        clientCost: (selectedRate.clientQuote == null || selectedRate?.clientQuote?.additionalInsurance === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.clientQuote?.additionalInsurance)} ${this.currencyType}</span>`,
        customerCost: (selectedRate.customerQuote == null || selectedRate?.customerQuote?.additionalInsurance === undefined) ? null :
          `<span class="text-center">${this.dollarUS.format(selectedRate.customerQuote?.additionalInsurance)} ${this.currencyType}</span>`
      });
    }

    // Totals
    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: '<b class="dodger-blue">Total</b>',
        ilCost: (selectedRate.targetBuy ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.targetBuy))} ${this.carCurrencyType}</span>` : ''),
        clientCost: (selectedRate.targetSell ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.targetSell))} ${this.currencyType}</span>` : ''),
        customerCost: ''
      });
    } else {
      this.selectedRateFormat.push({
        name: '<b class="dodger-blue">Total</b>',
        ilCost: (selectedRate.ilCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.ilCost))} ${this.carCurrencyType}</span>` : ''),
        clientCost: (selectedRate.clientCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.clientCost))} ${this.currencyType}</span>` : ''),
        customerCost: (selectedRate.customCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.customCost))} ${this.currencyType}</span>` : '')
      });
    }
  }

  onCreateNewShipmentClick() {
    const newShipmentData = {
      rateRequest: this.rateRequest,
      totalLinearFoot: this.totalLinearFeet,
      selectedRate: this.ratesGridForm.get('selectedRate')?.value,
      rates: this.ratesData(),
      groupInfo: this.groupInfo,
      client: this.client,
      isFromQuickRates: true,
    };
    this.router.navigate(['SPAs/new'], {state: {data: newShipmentData}});
  }

  buildEmailDisplayBodyMessage(returnText = false): any {
    this.emailBodyRates.length = 0;
    this.emailBodyRates = [];
    const rates = this.ratesData();
    let ratesText = '';
    const lineItems = this.rateRequest?.lineItems;
    let lineItemText = '';
    const docKey = this.clientCode + '/' + this.fromZip + '/' + this.toZip + '/' + this.quoteReferenceNumber;

    const firstParagraph = 'Please respond with which carrier/option you want to proceed with, and we will provide a BOL with the ' +
      'applicable quote number and shipment details. All Volume Quotes expire within 24 hours.' + '\n' + '\n';

    const introMessage = 'Below is your requested quote from' + ' ' + this.rateRequest?.fromZip + ' ' + 'to' + ' ' +
      this.rateRequest?.toZip + ' ' + 'for' + '\n';

    for (const i in lineItems) {
      lineItemText += lineItems[i].handlingUnits + ' ' + 'H/Us' + ' ' + 'at' + ' ' + 'Class' + ' ' + lineItems[i].freightClass + ', ' +
        lineItems[i].weight + ' ' + 'lbs' + ', Dimensions: ' + lineItems[i].length + ' X ' + lineItems[i].width + ' X ' +
        lineItems[i].height + ' ' + '\n';
    }

    const closingMessage = '\n' + 'Thank you for your continued interest in IL2000. If you have additional questions or requests ' +
      'please contact your Logistics Planner directly at quotes@il2000.com or 1-877-373-4525.' + '\n' +
      'Rates based on ' + this.currentDate + '. ' + 'Rates subject to change.' + '\n' + '\n';

    const refText = ' Quote reference number: ' + ' ' + this.quoteReferenceNumber + ' and document key: ' + docKey;

    this.emailBodyRates.push( { text: firstParagraph, bold: true });
    this.emailBodyRates.push( { text: introMessage });
    this.emailBodyRates.push( { text: lineItemText + '\n' });

    let count = 1;
    for (const i in rates) {
      if ((this.allowChooseRateException && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight || rates[i].exceedsCubicCapacity)) ||
        (this.rateExceptionWarnings && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight || rates[i].exceedsCubicCapacity)) ||
        (!this.rateExceptionPassthrough && !this.rateExceptionWarnings && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight ||
          rates[i].exceedsCubicCapacity))) {
        ratesText += '';
      } else {
        ratesText += '\t ' + count.toString() + '. ' + rates[i].carrierName + (rates[i].isVolumeRate ? ' [VOLUME] ' : '') + ': ' +
          '$' + rates[i].clientCost + ', ' + (rates[i].transitTime ? rates[i].transitTime : '-') + ' ' + 'Transit Days' + '\n';
        this.emailBodyRates.push( {
          text: [
            { text: '\t ' + count.toString() + '. ' , preserveLeadingSpaces: true},
            { text: rates[i].carrierName + (rates[i].isVolumeRate ? ' [VOLUME] ' : '') + ': ', bold: true },
            '$' + rates[i].clientCost + ', ' + (rates[i].transitTime ? rates[i].transitTime : '-') + ' ' + 'Transit Days' + '\n'
          ]
        });
        count ++;
      }
    }

    this.emailBodyRates.push( { text: closingMessage });
    this.emailBodyRates.push( {
      text: [
        { text: 'Internal use for IL2000 only: ', bold: true },
        refText
      ]
    });

    if (returnText) {
      return firstParagraph + introMessage + lineItemText + '\n' + ratesText + '\n' + closingMessage +
        'Internal use for IL2000 only: ' + refText;
    }

    return this.emailBodyRates;
  }

  buildEmailHtmlBodyMessage(): string {
    const rates = this.ratesData();
    let ratesText = '';
    const lineItems = this.rateRequest?.lineItems;
    let htmlLineItemText = '';
    const docKey = this.clientCode + '/' + this.fromZip + '/' + this.toZip + '/' + this.quoteReferenceNumber;

    const firstParagraph = '<b>Please respond with which carrier/option you want to proceed with,' +
      'and we will provide a BOL with the </b>' + ' ' + '<br>' +
      '<b>applicable quote number and shipment details. All Volume Quotes expire within 24 hours.</b>' + '<br>';

    const introMessage = 'Below is your requested quote from' + ' ' + this.rateRequest?.fromZip + ' ' + 'to' + ' ' +
      this.rateRequest?.toZip + ' ' + 'for<br>';

    for (const i in lineItems) {
      htmlLineItemText += lineItems[i]?.handlingUnits + '  H/Us at Class  ' + lineItems[i]?.freightClass + ', ' + lineItems[i]?.weight +
        '  lbs' + ', Dimensions: ' + lineItems[i].length + ' X ' + lineItems[i].width + ' X ' + lineItems[i].height + '<br>';
    }

    let count = 1;
    for (const i in rates) {
      if ((this.allowChooseRateException && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight || rates[i].exceedsCubicCapacity)) ||
        (this.rateExceptionWarnings && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight || rates[i].exceedsCubicCapacity)) ||
        (!this.rateExceptionPassthrough && !this.rateExceptionWarnings && (rates[i].exceedsLinearFoot || rates[i].exceedsMaxWeight ||
          rates[i].exceedsCubicCapacity))) {
        ratesText += '';
      } else {
        ratesText += '&emsp;' + count + '. <b>' + rates[i].carrierName + (rates[i].isVolumeRate ? ' [VOLUME] ' : '') + '</b>' + ': ' +
          '$' + rates[i].clientCost + ', ' + (rates[i].transitTime ? rates[i].transitTime : '-') + '  Transit Days<br>';
        count ++;
      }
    }

    const closingMessage = 'Thank you for your continued interest in IL2000. If you have additional questions or requests<br>' +
      'please contact your Logistics Planner directly at quotes@il2000.com or 1-877-373-4525.<br>' +
      'Rates based on ' + this.currentDate + '. ' + 'Rates subject to change.<br>';

    const lastParagraph = '<b>Internal use for IL2000 only:</b>' + '  Quote reference number: ' + ' ' + this.quoteReferenceNumber +
      ' and document key: ' + docKey + ' ' + '<br>';

    this.htmlEmailBody = firstParagraph + '<br>' + introMessage + '<br>' + htmlLineItemText + '<br>' + '<br>' + ratesText + '<br>'
      + closingMessage + '<br/>' + '<br/>' + lastParagraph;

    return this.htmlEmailBody;
  }

  downloadRates() {
    const documentDefinition = {
      content: this.emailBodyRates
    };
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    pdfDocGenerator.getBlob((blob) => {
      this.uploadDocument(blob);
    });
    pdfDocGenerator.download(this.clientCode + this.quoteReferenceNumber + '.pdf');
    Swal.fire({
      title: '',
      html: 'Quote reference number <b>' + this.quoteReferenceNumber + '</b> successfully generated',
      icon: 'success',
      allowOutsideClick: false,
      allowEscapeKey: false
    });
  }

  updateOtherRate() {
    let i;
    const rates = this.ratesArray.value;
    let ratesToSave = [];
    for (i = 0; i < rates.length; i++) {
      const carrierName = this.getCarrierName(rates[i].carrierID);
      const emitData1 = {
        id: (i === 0 ? i : -i),
        assigned: rates[i].assigned,
        rateType: RateType.MANUAL_LTL,
        carrierID: rates[i].carrierID,
        carrierName,
        clientCost: rates[i].clientCost,
        carrierCost: rates[i].carrierCost,
        quoteNumber: rates[i].quoteNumber,
        notes: rates[i].notes,
        ilCost: rates[i].carrierCost,
        transitTime: rates[i].transitTime,
        customerQuote: null,
        currencyType: this.currencyType
      };
      ratesToSave.push(emitData1);
    }
    const manualQuotes = this.manualQuotes;
    if (manualQuotes) {
      for (i = 0; i < manualQuotes.length; i++) {
        if (manualQuotes[i].rateType == RateType.MANUAL_LTL) {
          const carrierName = this.getCarrierName(manualQuotes[i].carrierID);
          const emitData2 = {
            rateType: RateType.MANUAL_LTL,
            quoteID: manualQuotes[i].quoteID,
            carrierID: manualQuotes[i].carrierID,
            carrierName,
            clientCost: manualQuotes[i].clientCost,
            carrierCost: manualQuotes[i].carrierCost,
            quoteNumber: manualQuotes[i].quoteNumber,
            notes: manualQuotes[i].notes,
            ilCost: manualQuotes[i].carrierCost,
            transitTime: manualQuotes[i].transitTime,
            customerQuote: null,
            currencyType: this.currencyType
          };
          ratesToSave.push(emitData2);
        }
      }
    }
    // update the selected value if it changed
    for (i = 0; i < this.ratesArray.value.length; i++) {
      if (this.ratesArray.value[i].assigned) {
        this.ratesArray.value[i].id = (i === 0 ? i : -i);
        this.ratesArray.value[i].carrierName = this.getCarrierName(this.ratesArray.value[i].carrierID);
        this.ratesArray.value[i].customerQuote = null;
        this.setSelectedValue(this.ratesArray.value[i]);
      }
    }
    this.ratesToSave.emit(ratesToSave);
  }

  otherClicked(event: any, index: number) {
    $('.buyRate').show();
    const control = this.ratesGridForm.controls["otherRates"] as FormArray;
    // CLEAR SELECTED RATES IF ANY SELECTED
    let redrawData = [];
    for (const rate of this.ratesData()) {
      if (rate) {
        rate.assigned = false;
        redrawData.push(rate);
      }
    }
    this.dt.find(t => t.gridName === 'ltlRates')?.reDrawTable(redrawData);
    this.ratesArray.at(index).get('assigned')?.setValue(event.target.checked);
    // SET SELECTED RATE
    if (event.target.checked === true) {
      const carrierName = this.getCarrierName(control.at(index).get('carrierID')?.value);
      const selectedRate = {
        assigned: true,
        rateType: RateType.MANUAL_LTL,
        id: (index == 0 ? index : -index),
        carrierID: control.at(index).get('carrierID')?.value,
        carrierName,
        clientCost: control.at(index).get('clientCost')?.value,
        clientQuote: control.at(index).get('clientQuote')?.value,
        quoteNumber: control.at(index).get('quoteNumber')?.value,
        transitTime: control.at(index).get('transitTime')?.value,
        notes: control.at(index).get('notes')?.value,
        ilCost: control.at(index).get('carrierCost')?.value,
        carrierCost: control.at(index).get('carrierCost')?.value,
        customerQuote: null,
        currencyType: this.currencyType
      };
      this.setSelectedValue(selectedRate);
    } else {
      this.unselectValue();
    }
    this.clearOtherSelectedRates(index);
  }

  clearOtherSelectedRates(index: number | null = null) {
    // ONLY ALLOW ONE RATE TO BE SELECTED
    for (const ratesArrayKey in this.ratesArray.controls) {
      if (index != parseInt(ratesArrayKey)) {
        this.ratesArray.controls[ratesArrayKey].get('assigned')?.setValue(false);
      }
    }
  }

  // todo do we still need this?
  addOtherCarrierRow() {
    if (this.shipmentType === 'Truckload') {
      return;
    }
    this.showOther = false;
    this.ratesGridForm.reset();
    // INSERT ROW FOR ANOTHER CARRIER - ALWAYS have selection at the bottom labeled "Other"
    if (this.hasOther) {
      if (this.ratesData().filter(value => {
        return value.carrierName === 'Other';
      }).length > 0) {
        // DO NOTHING
      } else {
        // ADD Another ROW
        this.ratesData.update(items => [...items, {
          id: this.ratesData().length !== 0 ? -(this.ratesData().length + 1) : 0,
          rateType: null,
          carrierID: null,
          carrierName: 'Other',
          transitTime: null,
          ilCost: '',
          clientCost: '',
          customCost: '',
          carrierQuote: null,
          clientQuote: null,
          customerQuote: null,
          quoteID: null,
          warning: null,
          isVolumeRate: false,
          expirationDate: null,
          negotiationType: '',
          feesMap: {},
          targetRateID: null,
          creationDate: null,
          fuelSurchargeBuy: null,
          fuelSurchargeSell: null,
          targetBuy: null,
          targetSell: null,
          exceedsLinearFoot: false,
          exceedsCubicCapacity: false,
          exceedsMaxWeight: false,
          isTLRate: false,
          processingFee: null,
          carrierCharge: undefined,
          customerCharge: undefined,
          fuelSurchargeAvg: null,
          ratePerMileAvg: null,
          marketAvg: null,
          serviceProviderType: null,
          UUID: '',
          currencyType: this.currencyType,
          carCurrencyType: this.carCurrencyType
        }]);
      }
    }
  }

  setSelectedValue(data: any) {
    if (this.volumeExpirationDateCheck(data)) {
      this.hideGrid = true;
      this.fetchRatesBtn = true;
    } else {
      // return false
      this.utilityService.quotescheck = true;
      this.selectedRate = true;
      this.ratesSelectedEvent.emit(true);
      let control = this.ratesGridForm.controls["selectedRate"] as FormArray;
      control.get('rateType')?.setValue(data.rateType);
      control.get('assigned')?.setValue(true);
      control.get('id')?.setValue(data.id);
      control.get('carrierID')?.setValue(data.carrierID ? data.carrierID : null);
      control.get('proNumber')?.setValue(data.proNumber ? data.proNumber : '');
      control.get('quoteID')?.setValue(data.quoteID ? data.quoteID : '');
      control.get('carrierName')?.setValue(data.carrierName);
      control.get('transitTime')?.setValue(data.transitTime);

      if (this.allowChooseRateException && (data.exceedsLinearFoot || data.exceedsCubicCapacity || data.exceedsMaxWeight)) {
        if (data.customerQuote) { data.customerQuote.quote = 0; }
        control.get('ilCost')?.setValue(0);
        control.get('clientCost')?.setValue(0);
        control.get('customCost')?.setValue(0);
      } else {
        control.get('ilCost')?.setValue(data.rateType === RateType.MANUAL_LTL ? data.carrierCost : data.ilCost);
        control.get('clientCost')?.setValue(data.clientCost);
        control.get('customCost')?.setValue(data.customCost);
      }
      control.get('clientQuote')?.setValue(data.clientQuote);
      control.get('customerQuote')?.setValue(data.customerQuote);
      control.get('carrierQuote')?.setValue(data.carrierQuote);
      control.get('feesMap')?.setValue(data.feesMap);
      control.get('serviceLevel')?.setValue(data.isVolumeRate || data.isTLRate ? 'volume' : 'Direct');
      control.get('targetRateID')?.setValue(data.targetRateID ? data.targetRateID : null);
      control.get('creationDate')?.setValue(data.creationDate);
      control.get('fuelSurchargeBuy')?.setValue(data.fuelSurchargeBuy);
      control.get('fuelSurchargeSell')?.setValue(data.fuelSurchargeSell);
      control.get('targetBuy')?.setValue(data.targetBuy);
      control.get('targetSell')?.setValue(data.targetSell);
      control.get('exceedsLinearFoot')?.setValue(data.exceedsLinearFoot);
      control.get('exceedsCubicCapacity')?.setValue(data.exceedsCubicCapacity);
      control.get('exceedsMaxWeight')?.setValue(data.exceedsMaxWeight);
      control.get('isVolumeRate')?.setValue(data.isVolumeRate);
      control.get('isTLRate')?.setValue(data.isTLRate);
      control.get('processingFee')?.setValue(data.processingFee);
      control.get('negotiationType')?.setValue(data.negotiationType);
      control.get('fuelSurchargeAvg')?.setValue(data.fuelSurchargeAvg);
      control.get('ratePerMileAvg')?.setValue(data.ratePerMileAvg);
      control.get('marketAvg')?.setValue(data.marketAvg);
      control.get('serviceProviderType')?.setValue(data.serviceProviderType);
      control.get('marketLow')?.setValue((data.isTLRate ? data.marketLow : null));
      control.get('marketHigh')?.setValue((data.isTLRate ? data.marketHigh : null));
      control.get('originName')?.setValue((data.isTLRate ? data.originName : null));
      control.get('originType')?.setValue((data.isTLRate ? data.originType : null));
      control.get('destinationName')?.setValue((data.isTLRate ? data.destinationName : null));
      control.get('destinationType')?.setValue((data.isTLRate ? data.destinationType : null));
      control.get('timeFrame')?.setValue((data.isTLRate ? data.timeFrame : null));
      control.get('equipment')?.setValue((data.isTLRate ? data.equipment : null));
      control.get('mileage')?.setValue((data.isTLRate ? data.mileage : null));
      control.get('rateUUID')?.setValue(data?.UUID ?? '');

      // if the rate is IL2000 blanket negotiation type set the bill to name as IL2000
      if (this.terms === '3rd Party' || this.terms === 'Collect' && data.negotiationType == '2') {
        if (!this.hadSelectedNegotiationType2) {
          this.previousBillToName = (document.getElementById('billToName') as HTMLSelectElement).value;
          this.previousBillToCareOf = (document.getElementById('billToCareOf') as HTMLSelectElement).value;
        }
        this.hadSelectedNegotiationType2 = this.terms !== 'Collect';
        (document.getElementById('billToName') as HTMLSelectElement).value = 'IL2000';
        (document.getElementById('billToCareOf') as HTMLInputElement).value = '';
      }

      if (this.terms === '3rd Party' || this.terms === 'Collect' && data.negotiationType !== '2') {
        if (this.hadSelectedNegotiationType2) {
          (document.getElementById('billToName') as HTMLSelectElement).value = this.previousBillToName;
          (document.getElementById('billToCareOf') as HTMLInputElement).value = this.previousBillToCareOf;
          this.hadSelectedNegotiationType2 = false;
        }
      }

      // Per GLOB-2747 set to 3rd party if IL2000 Blanket
      if ((this.terms === 'Collect' || this.terms === 'Prepaid') && data.negotiationType == 2) {
        if (document.getElementById('shipmentBillTo')) {
          (document.getElementById('shipmentBillTo') as HTMLSelectElement).value = '3rd Party';
        }
      }

      if (document.getElementById('negotiationType')) {
        (document.getElementById('negotiationType') as HTMLSelectElement).value = data.negotiationType;
      }

      this.disableEmailBtn = control.get('id')?.value === null;

      if (this.shipmentType === 'LTL') {
        this.currencyType = data?.currencyType ? data.currencyType : '';
        this.carCurrencyType = data?.carCurrencyType ? data.carCurrencyType : '';
        this.setRateBreakdown();
        this.dt.find(t => t.gridName === 'rateBreakdown')?.reDrawTable(this.selectedRateFormat);
      }
    }
  }

  resetOther() {
    this.showOther = true;
    this.hideGrid = false;
    this.fetchRatesBtn = false;
    this.dt.first.reDrawTable(this.ratesData());
    this.ratesGridForm.reset();
  }

  buildRateRequest() {
    if (this.shipmentType === 'LTL') {
      let lineItems: RateRequestLineItem[] = [];
      if (this.lineItems.length !== 0) {
        for (const i in this.lineItems) {
          lineItems.push({
            handlingUnits: this.lineItems[i].handlingUnits,
            handlingUnitType: this.isQuickRate ? 'PIECES' : this.lineItems[i].unitType,
            weight: this.lineItems[i].totalWeight,
            freightClass: this.lineItems[i].freightClass,
            length: this.lineItems[i].length,
            width: this.lineItems[i].width,
            height: this.lineItems[i].height,
            stackable: this.lineItems[i].stackable,
            sameSkid: this.lineItems[i].sameSkid,
            hazmat: this.lineItems[i].hazmat == 1 || this.lineItems[i].hazmat == true,
          });
        }
      }

      // BUILD RATE REQUEST
      if (this.clientPlantPPA !== '' && this.clientPlantPPAAdjustment !== -1) {
        this.rateRequest = {
          clientPlantID: this.clientPlantID,
          fromZip: this.fromZip,
          toZip: this.toZip,
          fees: this.fees,
          lineItems,
          shipDate: this.shipDate,
          doubleChecked: this.doubleChecked,
          apiRateTypes: [],
          additionalValue: this.additionalInsurance,
          customRateRequest: {
            customRateType: this.clientPlantPPA,
            percentValue: this.clientPlantPPAAdjustment
          }
        };
      } else {
        this.rateRequest = {
          clientPlantID: this.clientPlantID,
          fromZip: this.fromZip,
          toZip: this.toZip,
          fees: this.fees,
          lineItems,
          shipDate: this.shipDate,
          doubleChecked: this.doubleChecked,
          apiRateTypes: [],
          additionalValue: this.additionalInsurance
        };
      }

      if (this.volumeRateCheck()) {
        this.rateRequest.apiRateTypes.push(4);
        this.buildTruckloadRateRequest();
      }

    } else if (this.shipmentType === 'Truckload') {
      this.buildTruckloadRateRequest();
    }

    // TEST REQUEST - UNCOMMENT TO TEST
    /*this.rateRequest = {
      clientPlantID: 4299,
      fromZip: "15501",
      toZip: "02360",
      fees: [],
      lineItems: [
        {
          freightClass: 100,
          handlingUnits: 6,
          weight: 6131,
          length: 51,
          width: 41,
          height: 92
        }
      ],
      shipDate: "2020-06-05",
      doubleChecked: [false, false, false]
    };*/
  }

  volumeExpirationDateCheck(data: any) {
    let isDateExpired = false;
    const expirationDate = data.expirationDate ? moment(data.expirationDate, 'YYYY-MM-DD') : null;
    // Check if current date is passed the expiration
    if (expirationDate) {
      isDateExpired = moment(this.currentDate, 'YYYY-MM-DD').isAfter(expirationDate);
    }
    return isDateExpired;
  }

  volumeRateCheck(): boolean {
    let getVolumeRates = false;
    const totals = this.lineItems;
    let totalWeight = 0;
    let totalHUs = 0;

    for (const i in totals) {
      totalHUs += totals[i].handlingUnits;
      totalWeight += totals[i].totalWeight;
    }

    // if weight of all line items > 5000 lbs or total handling unit count of all line items > 6
    // totalLinearFoot >=144 (inches) || totalLinearFoot >=12 (feet) -
    if (totalWeight >= 5000 || totalHUs >= 6 || this.totalLinearFeet >= 12) {
      getVolumeRates = true;
    }

    return getVolumeRates;
  }

  sortCost(data: any) {
    // CUSTOM COST SORT ON EXISTING ARRAY
    data.sort((a: { ilCost: string; }, b: { ilCost: string; }) => {
        return parseInt(a.ilCost) > parseInt(b.ilCost) ? 1 : parseInt(a.ilCost) < parseInt(b.ilCost) ? -1 : 0;
      }
    );
  }

  setRateGridData() {
    if (this.volumeRateCheck()) {
      if (this.ratesLoaded && this.tlRatesLoaded) {
        this.ratesData.set([]);
        this.setRateData();
        if (this.manualQuotes != null) {
          this.setManualQuotesData();
        }
        this.sortCost(this.ratesData());
        this.setTLRatesData();
        this.setRateExceptionData();
        this.hideGrid = false;
        if (this.callbackFnc) { this.callbackFnc(); }
        this.callbackFnc = null;
        this.dt.find(t => t.gridName === 'ltlRates')?.reDrawTable(this.ratesData());
        setTimeout(() => $('.buyRate').hide(), 100);
        this.spinner.hide('ratesGrid').then();
        this.spinner.hide('truckloadRatesGrid').then();
        this.searchSelectedRate();
      }
    } else {
      if (this.ratesLoaded) {
        this.ratesData.set([]);
        this.setRateData();
        if (this.manualQuotes != null) {
          this.setManualQuotesData();
        }
        this.sortCost(this.ratesData());
        this.setRateExceptionData();
        this.hideGrid = false;
        if (this.callbackFnc) { this.callbackFnc(); }
        this.callbackFnc = null;
        this.dt.find(t => t.gridName == 'ltlRates')?.reDrawTable(this.ratesData());
        setTimeout(() => $('.buyRate').hide(), 100);
        this.spinner.hide('ratesGrid').then();
        this.spinner.hide('truckloadRatesGrid').then();
        this.searchSelectedRate();
      }
    }
  }

  setRateData() {
    this.isRateExceeds = false;
    if (this.responseData.length !== 0) {
      for (const rate of this.responseData) {
        if (!rate.exceedsLinearFoot && !rate.exceedsCubicCapacity && !rate.exceedsMaxWeight) {
          // Non-Direct point, must have customization enabled to show in grid
          if (rate.pointType === 2) {
            if (this.showNonDirectPoints) {
              this.ratesData.update(items => [...items, {
                id: -this.ratesData().length,
                rateType: rate.volumeRate ? RateType.RATER_VOLUME : RateType.RATER_LTL,
                carrierID: rate.carrierID,
                carrierName: rate.carrierName,
                transitTime: rate.transitTime == null || rate.transitTime === 0 ? null : rate.transitTime,
                ilCost: rate.carrierQuote.quote,
                clientCost: rate.clientQuote.quote,
                customCost: '',
                feesMap: rate.feesMap,
                carrierQuote: rate.carrierQuote,
                clientQuote: rate.clientQuote,
                customerQuote: rate.customQuote,
                quoteID: rate.volumeRate ? rate.quoteID : null,
                quoteNumber: rate.volumeRate ? rate.quoteID : null,
                warning: null,
                isVolumeRate: rate.volumeRate,
                expirationDate: null,
                negotiationType: rate.negotiationType,
                targetRateID: null,
                creationDate: null,
                fuelSurchargeBuy: null,
                fuelSurchargeSell: null,
                targetBuy: null,
                targetSell: null,
                exceedsLinearFoot: rate.exceedsLinearFoot,
                exceedsCubicCapacity: rate.exceedsCubicCapacity,
                exceedsMaxWeight: rate.exceedsMaxWeight,
                isTLRate: false,
                processingFee: rate.processingFee,
                carrierCharge: undefined,
                customerCharge: undefined,
                fuelSurchargeAvg: null,
                ratePerMileAvg: null,
                marketAvg: null,
                serviceProviderType: rate?.serviceProviderType,
                UUID: (rate?.id ?? ''),
                currencyType: (rate?.clientCurrency ?? ''),
                carCurrencyType: (rate?.carrierCurrency ?? '')
              }]);
            }
          } else {
            this.ratesData.update(items => [...items, {
              id: -this.ratesData().length,
              rateType: rate.volumeRate ? RateType.RATER_VOLUME : RateType.RATER_LTL,
              carrierID: rate.carrierID,
              carrierName: rate.carrierName,
              transitTime: rate.transitTime == null || rate.transitTime === 0 ? null : rate.transitTime,  // rate.transitTime,
              ilCost: rate.carrierQuote.quote,
              clientCost: rate.clientQuote.quote,
              customCost: rate.customQuote != null ? rate.customQuote.quote : '',
              feesMap: rate.feesMap,
              carrierQuote: rate.carrierQuote,
              clientQuote: rate.clientQuote,
              customerQuote: rate.customQuote,
              quoteID: rate.volumeRate ? rate.quoteID : null,
              quoteNumber: rate.volumeRate ? rate.quoteID : null,
              warning: null,
              isVolumeRate: rate.volumeRate,
              expirationDate: null,
              negotiationType: rate.negotiationType,
              targetRateID: null,
              creationDate: null,
              fuelSurchargeBuy: null,
              fuelSurchargeSell: null,
              targetBuy: null,
              targetSell: null,
              exceedsLinearFoot: rate.exceedsLinearFoot,
              exceedsCubicCapacity: rate.exceedsCubicCapacity,
              exceedsMaxWeight: rate.exceedsMaxWeight,
              isTLRate: false,
              processingFee: rate.processingFee,
              carrierCharge: undefined,
              customerCharge: undefined,
              fuelSurchargeAvg: null,
              ratePerMileAvg: null,
              marketAvg: null,
              serviceProviderType: rate?.serviceProviderType,
              UUID: (rate?.id ?? ''),
              currencyType: (rate?.clientCurrency ?? ''),
              carCurrencyType: (rate?.carrierCurrency ?? '')
            }]);
          }
          this.updateGetRatesData.emit(this.ratesData() ?? []);
        }
      }
    }
  }

  setManualQuotesData() {
    this.isRateExceeds = false;
    if (this.manualQuotes.length !== 0) {
      this.hideEditButton = false;
      for (const rate of this.manualQuotes) {
        if (rate.rateType == null || rate.rateType == RateType.MANUAL_LTL) {
          if (rate.assigned) {
            this.selectedRateType = RateType.MANUAL_LTL;
          }
          this.ratesData.update(items => [...items, {
            assigned: rate.assigned,
            id: -this.ratesData().length,
            rateType: RateType.MANUAL_LTL,
            carrierID: rate.carrierID,
            carrierName: rate.carrierName,
            transitTime: rate.transitTime === '' ? null : parseInt(rate.transitTime),
            ilCost: rate.carrierCost,
            carrierCost: rate.carrierCost,
            clientCost: rate.clientCost,
            notes: rate.notes,
            timeStamp: rate.timeStamp,
            customCost: '',
            feesMap: null,
            carrierQuote: null,
            clientQuote: null,
            customerQuote: null,
            quoteID: rate.quoteID,
            quoteNumber: rate.quoteNumber,
            warning: null,
            isVolumeRate: false,
            expirationDate: null,
            negotiationType: null,
            targetRateID: null,
            creationDate: null,
            fuelSurchargeBuy: null,
            fuelSurchargeSell: null,
            targetBuy: null,
            targetSell: null,
            exceedsLinearFoot: null,
            exceedsCubicCapacity: null,
            exceedsMaxWeight: null,
            isTLRate: false,
            processingFee: null,
            carrierCharge: undefined,
            customerCharge: undefined,
            fuelSurchargeAvg: null,
            ratePerMileAvg: null,
            marketAvg: null,
            serviceProviderType: null,
            UUID: '',
            currencyType: this.currencyType,
            carCurrencyType: this.carCurrencyType
          }]);
        }
      }
    }
  }

  showFetchRatesButton() {
    // When we show the fetch rates button we want to hide the grid
    this.fetchRatesBtn = true;  // SHOW BUTTON
    this.hideGrid = true; // HIDE THE GRID
    this.hideHistoryRatesGrid = true;
    this.ratesGridForm = this.fb.group({
      otherRates: this.fb.array([this.getOtherRates()]),
      selectedRate: this.getSelectedRate()
    });
    const gridName = this.shipmentType === 'LTL' ? 'ltlRates' : 'truckloadRates';
    // FIND GRID AND CLEAR ROWS GRID
    const dtRates = this.dt.find(t => t.gridName === gridName);
    if (dtRates && this.ratesData().length > 0) {
      dtRates.reDrawTable([]);
    }
    this.ratesData.set([]); // CLEAR RATES DATA
    this.truckloadRatesData.set([])
  }

  hideFetchRatesButton() {
    // When we hide the fetch rates button we want to show the grid
    this.fetchRatesBtn = false;  // HIDE BUTTON
    this.hideGrid = false; // SHOW THE GRID
    this.hideHistoryRatesGrid = true;
  }

  getTruckloadRates(truckloadRateRequest: any, ignoreWarning = false) {
    if (truckloadRateRequest != undefined && Object.keys(truckloadRateRequest).length !== 0) {
      this.spinner.show('truckloadRatesGrid').then();
      this.tlRatesLoaded = false;
      this.rateService.getTruckloadRates(truckloadRateRequest).subscribe({
        next: response => {
          this.truckloadResponseData = response;
          if (Object.keys(response).length === 0) {
            Swal.fire({
              title: 'No target rates found',
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            }).then((result) => {
              if (result.isConfirmed) { Swal.close(); }
            });
          }
        },
        error: error => {
          this.tlRatesLoaded = true;
          this.truckloadResponseData = null;
          if (this.shipmentType === 'LTL') {
            this.setRateGridData();
          } else {
            this.setTruckloadRateGridData();
            this.dt.find(t => t.gridName === 'truckloadRates')?.rerender();
            this.dt.find(t => t.gridName === 'truckloadRatesMore')?.rerender();
            this.historyRatesBtn = true;
            this.hideHistoryRatesGrid = true;
            if (this.isTruckloadPage) { setTimeout(() => this.dt.first.reDrawTable(this.truckloadRatesData()), 100); }

            if (!ignoreWarning) {
              Swal.fire({
                html: '<b>Unable to get Target rates. ' + (error ? error.toString() : '') + '</b>',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
              }).then((result) => {
                if (result.isConfirmed) { Swal.close(); }
              });
            }

            if (this.callbackFnc) { this.callbackFnc(); }
            this.callbackFnc = null;
          }
        },
        complete: () => {
          this.tlRatesLoaded = true;
          if (this.shipmentType === 'LTL') {
            this.setRateGridData();
          } else {
            this.setTruckloadRateGridData();
            this.dt.find(t => t.gridName === 'truckloadRates')?.rerender();
            this.dt.find(t => t.gridName === 'truckloadRatesMore')?.rerender();
            this.historyRatesBtn = true;
            this.hideHistoryRatesGrid = true;
            sessionStorage.setItem('TLRates', '1');
            if (this.isTruckloadPage) { setTimeout(() => { this.dt.first.reDrawTable(this.truckloadRatesData()); }, 100); }
            if (this.callbackFnc) { this.callbackFnc(); }
            this.callbackFnc = null;
          }
        }
      });
    }
  }

  setTruckloadRateGridData() {
    this.truckloadRatesData.set([]);
    if (this.tlRatesLoaded) {
      this.hideGrid = false;
      this.spinner.hide('ratesGrid').then();
      this.spinner.hide('truckloadRatesGrid').then();
      this.setTruckloadRateData();
    }
  }

  setTruckloadRateData() {
    if (this.isTruckloadPage) { this.truckloadRatesData.set([]); }
    const id = this.truckloadRatesData().length !== 0 ? -this.truckloadRatesData().length : 0;
    if (this.truckloadResponseData != null) {
      const rate = this.truckloadResponseData;
      const targetbuy = Number(rate.targetBuy.targetRate);
      const targetsell = Number(rate.targetSell.targetRate);
      this.truckloadRatesData.update(items => [...items, {
        targetRateID: null,
        mileage: rate.mileage,
        rateType: RateType.MANUAL_TL,
        creationDate: rate.creationDate.toString(),
        fuelSurchargeBuy: rate.targetBuy.fuelSurcharge,
        fuelSurchargeSell: rate.targetSell.fuelSurcharge,
        targetBuy: targetbuy.toString(),
        targetSell: targetsell.toString(),
        carrierID: null,
        carrierName: null,
        carrierQuote: undefined,
        clientCost: null,
        clientQuote: undefined,
        customCost: null,
        customerQuote: undefined,
        expirationDate: null,
        feesMap: undefined,
        ilCost: null,
        isVolumeRate: false,
        negotiationType: null,
        quoteID: undefined,
        transitTime: undefined,
        warning: undefined,
        id,
        exceedsLinearFoot: false,
        exceedsCubicCapacity: false,
        exceedsMaxWeight: false,
        isTLRate: true,
        processingFee: null,
        carrierCharge: targetbuy - Number(rate.targetBuy.fuelSurcharge),
        customerCharge: (targetsell - Number(rate.targetSell.fuelSurcharge)),
        fuelSurchargeAvg: rate.fuelSurchargeAvg,
        ratePerMileAvg: rate.ratePerMileAvg,
        marketAvg: rate.marketAvg,
        marketLow: rate.marketLow,
        marketHigh: rate.marketHigh,
        originName: rate.originName,
        originType: rate.originType,
        destinationName: rate.destinationName,
        destinationType: rate.destinationType,
        timeFrame: rate.timeFrame,
        serviceProviderType: null,
        equipment: rate.equipment
      }]);
    }
  }

  setTruckloadRatesHeaders() {
    this.truckloadRateColumns = [{
      title: '',
      defaultContent: '',
      data: 'id',
      targets: 0,
      visible: false,
      render: (data: any, type: any, row: any) => {
        if (this.preSelectedRates) {
          this.setSelectedValue(this.preSelectedRates);
        } else {
          this.setSelectedValue(row);
        }
        return '';
      }
    },
      {
        title: 'Creation date',
        data: 'creationDate',
        targets: 1,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any) => {
          const fdate = data.split('-')[1] + '/' + data.split('-')[2] + '/' + data.split('-')[0];
          return this.setData(fdate, false, true);
        }
      },
      {
        title: 'Mileage',
        data: 'mileage',
        targets: 8,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any) => {
          return this.setData(data, false, true);
        }
      },
      {
        title: 'Market Low',
        data: 'marketLow',
        targets: 8,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any) => {
          return this.setData(data, true, true);
        }
      },
      {
        title: 'Market Average',
        data: 'marketAvg',
        targets: 8,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any) => {
          return this.setData(data, true, true);
        }
      }
    ];

    this.truckloadRateColumnsMore = [{
      title: '',
      defaultContent: '',
      data: 'id',
      targets: 0,
      visible: false,
      render: (data: any, type: any, row: any) => {
        if (this.preSelectedRates) {
          this.setSelectedValue(this.preSelectedRates);
        } else {
          this.setSelectedValue(row);
        }
        return '';
      }
    },
      {
        title: 'Market High',
        data: 'marketHigh',
        targets: 8,
        orderable: false,
        className: 'text-center red',
        render: (data: any) => {
          return this.setData(data, true, true);
        }
      },
      {
        title: 'Target Buy',
        data: 'targetBuy',
        targets: 6,
        orderable: false,
        className: 'text-center red',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      },
      {
        title: 'Target Sell',
        data: 'targetSell',
        targets: 7,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      },
      {
        title: 'Fuel Surcharge Buy',
        data: 'fuelSurchargeBuy',
        targets: 2,
        orderable: false,
        className: 'text-center red',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      },
      {
        title: 'Fuel Surcharge Sell',
        data: 'fuelSurchargeSell',
        targets: 3,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      },
      {
        title: 'Carrier Charge',
        data: 'carrierCharge',
        targets: 4,
        orderable: false,
        className: 'text-center red',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      },
      {
        title: 'Customer Charge',
        data: 'customerCharge',
        targets: 5,
        orderable: false,
        className: 'text-center primary-blue',
        render: (data: any, type: any, row: any) => {
          return this.setRowDescription(data, row, true, true, true);
        }
      }
    ];
  }

  selectedTruckloadValue(data: any): any {
    if (data == null) {
      this.unselectValue();
      return true;
    }
    this.setSelectedValue(data);
  }

  showVolumeRateDisclaimer(): any {
    this.utilityService.isQuickRates = true;
    const selectedRate = this.ratesGridForm.get('selectedRate')?.value;

    // verify selected rate has client and carrier cost
    if (selectedRate.clientCost && selectedRate.ilCost) {
    } else {
      Swal.fire({
        title: 'Selected rate must contain',
        html: '<h2>Client Cost & Carrier Cost</h2>',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Okay'
      });
      return false;
    }

    if (this.shipmentType === 'LTL' && this.volumeRateCheck() &&
      this.ratesGridForm.get('selectedRate')?.value.serviceLevel?.toString().toUpperCase() !== 'VOLUME') {
      Swal.fire({
        title: 'Are you sure you wish to continue booking this as an LTL shipment?',
        html: '<div style="text-align:justify">This shipment exceeds 500 cubic feet, six pallet spaces, 12 lineal feet, or 5,000 lbs.  ' +
          'This is generally the cut-off point for LTL rating. Your options are to either continue with standard LTL, select one of the ' +
          'VOLUME rates listed herein, or request IL2000 set up a Truckload shipment.</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Continue'
      }).then((result) => {
        if (result.isConfirmed) {
          this.onCreateNewShipmentClick();
        } else {
          this.cancelShipment();
        }
      });
    } else {
      this.onCreateNewShipmentClick();
    }
  }

  scrollTo(el: Element | null) {
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
    }
  }

  fetchRates(fn: any = null, retrieveRates = false, ignoreWarning = false) {
    this.spinner.show('ratesGrid').then(() => console.log('Showing ratesGrid spinner'));
    this.isretiveRatesCalled = retrieveRates;
    this.callbackFnc = null;
    sessionStorage.setItem('TLRates', '0');
    this.validateInvalidAndRemoveClass();
    if (typeof fn === 'function') { this.callbackFnc = fn; }

    const fncRates = (): any => {
      console.log('validating fields before call rates');
      if (!this.isQuickRate && !this.isTruckloadPage) {
        // verify bill to name is filled out when collect or 3rd party is selected for billing terms - verify bill to is selected
        const billTo = (document.getElementById('shipmentBillTo') as HTMLSelectElement).value;
        const modes = (document.getElementById('modes') as HTMLSelectElement).value;
        if (modes === '' && modes.length === 0) {
          this.scrollTo(document.querySelector('input#modes'));
          document.getElementById('newShipmentForm')?.classList.add('was-validated');
          this.spinner.hide('ratesGrid');
          return false;
        }
        if (billTo) {
          if (billTo === 'Collect' || billTo === '3rd Party') {
            const billToName = (document.getElementById('billToName') as HTMLSelectElement).value;
            if (billToName.length > 0) {
            } else {
              this.scrollTo(document.querySelector('input#billToName'));
              document.getElementById('newShipmentForm')?.classList.add('was-validated');
              this.spinner.hide('ratesGrid');
              return false;
            }
          }
        } else {
          this.scrollTo(document.querySelector('input#shipmentBillTo'));
          document.getElementById('newShipmentForm')?.classList.add('was-validated');
          this.spinner.hide('ratesGrid');
          return false;
        }

        // multistop - validating items required
        if (this.shipmentType === 'Truckload' && document.querySelectorAll('input[id^=\'stop-\'].ng-invalid').length > 0) {
          this.formValidationEvent.emit(true);
          document.getElementById('newShipmentForm')?.classList.add('was-validated');
          this.hideGrid = true;
          this.fetchRatesBtn = true;
          this.spinner.hide('ratesGrid');
          return false;
        }
      }

      // build the request
      this.buildRateRequest();

      if (this.isQuickRate) {
        this.getRates(this.rateRequest);
        if (this.volumeRateCheck()) { this.getTruckloadRates(this.tlRateRequest); }
      } else if (this.isTruckloadPage) {
        this.fetchRatesBtn = false;
        this.hideGrid = false;
        this.getTruckloadRates(this.tlRateRequest);
      } else {
        this.ratesClickEvent.emit(true);
        this.rates = null;
        this.preSelectedRates = undefined;
        if (this.validRates && !this.utilityService.check) {
          this.utilityService.btnRate = false;
          this.fetchRatesBtn = false;
          this.hideGrid = false;
          if (this.shipmentType === 'LTL') {
            this.getRates(this.rateRequest);
            if (this.volumeRateCheck()) { this.getTruckloadRates(this.tlRateRequest); }
          } else {
            this.getTruckloadRates(this.tlRateRequest, ignoreWarning);
          }
        } else if (this.utilityService.check) {
          document.getElementById('newShipmentForm')?.classList.add('was-validated');
          this.hideGrid = true;
          this.fetchRatesBtn = true;
          this.spinner.hide('ratesGrid');
        } else {
          this.formValidationEvent.emit(true);
          document.getElementById('newShipmentForm')?.classList.add('was-validated');
          this.hideGrid = true;
          this.fetchRatesBtn = true;
          this.spinner.hide('ratesGrid');
        }
      }
    };
    setTimeout(() => fncRates(), 300);
  }

  setRowDescription(data: any, row: any, emptyCol = false, format = false, center = false) {
    if (this.disableRateWarning) {
      return this.setData(data, format, center);
    }
    if ((this.allowChooseRateException && (row.exceedsLinearFoot || row.exceedsMaxWeight || row.exceedsCubicCapacity)) ||
      (this.rateExceptionWarnings && (row.exceedsLinearFoot || row.exceedsMaxWeight || row.exceedsCubicCapacity)) ||
      (!this.rateExceptionPassthrough && !this.rateExceptionWarnings && (row.exceedsLinearFoot || row.exceedsMaxWeight ||
        row.exceedsCubicCapacity))) {
      if (emptyCol) { return ''; }
      let exceedsText = '';
      if (row.exceedsLinearFoot) { exceedsText = exceedsText + `<b>Linear Foot Exceeded</b>`; }
      if (row.exceedsCubicCapacity) { exceedsText = exceedsText + (exceedsText === '' ? '' : '<br/>') + `<b>Cubic Capacity Exceeded</b>`; }
      if (row.exceedsMaxWeight) { exceedsText = exceedsText + (exceedsText === '' ? '' : '<br/>') + `<b>Max Weight Exceeded</b>`; }
      return exceedsText;
    } else {
      return this.setData(data, format, center);
    }
  }

  eventShowRate(data: any) {
    $(`table tbody tr[id="${data.id}"] td span input[id="${data.id}"]`).removeAttr('disabled');
    $(`table tbody tr[id="${data.id}"] td:nth-child(3)`).html(data.transitTime);
    $(`table tbody tr[id="${data.id}"] td:nth-child(4)`).html(this.dollarUS.format(data.ilCost));
    $(`table tbody tr[id="${data.id}"] td:nth-child(5)`).html(this.dollarUS.format(data.clientCost));
    this.showRateDisclaimer();
  }

  showRateDisclaimer() {
    if (this.disableRateWarning) { return; }
    if ((this.ratesLoaded && !this.volumeRateCheck() && this.isRateExceeds) ||
      (this.ratesLoaded && this.tlRatesLoaded && this.volumeRateCheck() && this.isRateExceeds)) {
      Swal.fire({
        title: 'Are you sure you wish to continue booking this as an LTL shipment?',
        html: '<div style="text-align:justify">This shipment exceeds 500 cubic feet, six pallet spaces, 12 lineal feet, or 5,000 lbs.  ' +
          'This is generally the cut-off point for LTL rating. Your options are to either continue with standard LTL, select one of the ' +
          'VOLUME rates listed herein, or request IL2000 set up a Truckload shipment.</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Continue'
      }).then((result) => {
        if (result.isConfirmed) {
          return;
        } else {
          this.cancelShipment();
        }
      });
    }
  }

  // to support the sort for transit, on rate exception set null and if no transit set 0
  setDataForTransitSort(data: any, format = false, center = false) {
    const classAlign = center ? 'text-center' : 'float-end';
    if (data == null || data === '') {
      return `<span class="${classAlign}">-</span>`;
    } else if (data === 0) {
      return null;
    } else {
      return (format ? `<span class="${classAlign}">${this.dollarUS.format(data)}</span>` : `<span class="${classAlign}">${data}</span>`);
    }
  }

  setDataForTimeStamp(data: any, format = false, center = false) {
    const classAlign = center ? 'text-center' : 'float-end';
    if (data == null || data === '' || data === 0) {
      return `<span class="${classAlign}">-</span>`;
    } else {
      return (format ? `<span class="${classAlign}">${data}</span>` : `<span class="${classAlign}">${data}</span>`);
    }
  }

  setData(data: any, format = false, center = true) {
    const classAlign = center ? 'text-center' : 'float-end';
    if (data == null || data === '') {
      return `<span class="${classAlign}">-</span>`;
    } else {
      return (format ? `<span class="${classAlign}">${this.dollarUS.format(data)}</span>` : `<span class="${classAlign}">${data}</span>`);
    }
  }

  setDataForEditableRow(data: any, column: string, quoteID: any, format = false) {
    if (data) {
      if (format) {
        return `<div class="${quoteID} editRateRowValues">${this.dollarUS.format(data)}</div>` +
          `<div class="editRateInput py-1"><input id="${column}${quoteID}" class="${quoteID} editRateRowInputs form-control form-control-sm" style="display: none;" value="${data}"></div>`;
      } else {
        return `<div class="${quoteID} editRateRowValues">${data}</div>` +
          `<div class="editRateInput py-1"><input id="${column}${quoteID}" class="${quoteID} editRateRowInputs form-control form-control-sm" style="display: none;" value="${data}"></div>`;
      }
    } else {
      return `<div class="${quoteID} editRateRowValues">-</div>` +
        `<div class="editRateInput py-1"><input id="${column}${quoteID}" class="${quoteID} editRateRowInputs form-control form-control-sm" style="display: none;" value=""></div>`;
    }
  }

  setNotes(data: any, format = false, center = false) {
    const classAlign = center ? 'text-center' : 'float-end';
    if (data == null || data === '') {
      return `<span class="${classAlign}">-</span>`;
    } else {
      return (`<span class="${classAlign}">${data}</span>`);
    }
  }

  buildTruckloadRateRequest() {
    // BUILD  TRUCKLOAD RATE REQUEST
    let truckloadWeight = 0;
    if (this.lineItems.length !== 0) {
      for (const i in this.lineItems) {
        truckloadWeight = truckloadWeight + parseFloat(this.lineItems[i].totalWeight);
      }
    }

    if (this.stopLineItems.length !== 0) {
      for (const i in this.stopLineItems) {
        if (this.stopLineItems[i].lineItems.length !== 0) {
          for (const x in this.stopLineItems[i].lineItems) {
            let weight = this.stopLineItems[i].lineItems[x].totalWeight;
            weight = weight === '' || weight == null ? 0 : parseFloat(weight);
            truckloadWeight = truckloadWeight + weight;
          }
        }
      }
    }

    this.tlRateRequest = {
      clientCode: this.clientCode,
      mileage: this.mileage,
      weight: truckloadWeight,
      shipper: {zip: this.fromZip},
      consignee: {zip: this.toZip},
      rateType: this.rateType,
      equipment: this.switchEquipmentType(this.equipment)
    };
  }

  setTLRatesData() {
    if (this.truckloadResponseData != null) {
      const rate = this.truckloadResponseData;
      // GLOB-3189: The buy rate should show the DAT 15-day average. The sell should be +16% of the buy.
      const sellRate = parseFloat(rate.marketAvg ) + (parseFloat(rate.marketAvg ) * 0.16);
      this.ratesData.update(items => [...items, {
        id: -this.ratesData().length,
        rateType: RateType.TARGET_TL,
        carrierID: '17', // TiberId for IL2000 = 17
        carrierName: 'IL2000 Truckload',
        transitTime: 0,
        ilCost: rate.marketAvg, // rate.targetBuy.targetRate,
        clientCost: sellRate.toString(), // rate.targetSell.targetRate,
        clientQuote: null,
        targetRateID: null,
        creationDate: rate.creationDate.toString(),
        fuelSurchargeBuy: rate.targetBuy.fuelSurcharge,
        fuelSurchargeSell: rate.targetSell.fuelSurcharge,
        targetBuy: rate.marketAvg, // rate.targetBuy.targetRate,
        targetSell: sellRate.toString(), // rate.targetSell.targetRate,
        carrierQuote: null,
        customCost: '',
        customerQuote: null,
        expirationDate: null,
        feesMap: null,
        isVolumeRate: false,
        negotiationType: '',
        quoteID: null,
        warning: '',
        exceedsLinearFoot: false,
        exceedsCubicCapacity: false,
        exceedsMaxWeight: false,
        isTLRate: true,
        processingFee: null,
        carrierCharge: undefined,
        customerCharge: undefined,
        fuelSurchargeAvg: rate.fuelSurchargeAvg,
        ratePerMileAvg: rate.ratePerMileAvg,
        marketAvg: rate.marketAvg,
        marketLow: rate.marketLow,
        marketHigh: rate.marketHigh,
        originName: rate.originName,
        originType: rate.originType,
        destinationName: rate.destinationName,
        destinationType: rate.destinationType,
        timeFrame: rate.timeFrame,
        serviceProviderType: null,
        equipment: rate.equipment
      }]);
    }
  }

  cancelShipment() {
    this.fetchRatesBtn = false;
    this.hideGrid = true;
    this.emailBtn = false;
    this.downloadBtn = false;
    this.createShipmentBtn = false;
    this.hideHistoryRatesGrid = true;
    this.callbackFnc = null;
  }

  setRateExceptionData() {
    this.isRateExceeds = false;
    if (this.responseData.length !== 0) {
      for (const rate of this.responseData) {
        if (rate.exceedsLinearFoot || rate.exceedsCubicCapacity || rate.exceedsMaxWeight) {
          this.isRateExceeds = true;
          if (rate.pointType === 2) {
            if (this.showNonDirectPoints) {
              this.ratesData.update(items => [...items, {
                id: -this.ratesData().length,
                rateType: RateType.EXCEPTION_LTL,
                carrierID: rate.carrierID,
                carrierName: rate.carrierName,
                transitTime: null, // + ' - Non-Direct',
                ilCost: '',
                clientCost: '',
                customCost: '',
                feesMap: rate.feesMap,
                carrierQuote: rate.carrierQuote,
                clientQuote: rate.clientQuote,
                customerQuote: rate.customQuote,
                quoteID: null,
                warning: null,
                isVolumeRate: false,
                expirationDate: null,
                negotiationType: rate.negotiationType,
                targetRateID: null,
                creationDate: null,
                fuelSurchargeBuy: null,
                fuelSurchargeSell: null,
                targetBuy: null,
                targetSell: null,
                exceedsLinearFoot: rate.exceedsLinearFoot,
                exceedsCubicCapacity: rate.exceedsCubicCapacity,
                exceedsMaxWeight: rate.exceedsMaxWeight,
                isTLRate: false,
                processingFee: rate.processingFee,
                carrierCharge: undefined,
                customerCharge: undefined,
                fuelSurchargeAvg: null,
                ratePerMileAvg: null,
                serviceProviderType: rate?.serviceProviderType,
                marketAvg: null,
                UUID: (rate?.id ?? ''),
                currencyType: (rate?.clientCurrency ?? ''),
                carCurrencyType: (rate?.carrierCurrency ?? '')
              }]);
            }
          } else {
            this.ratesData.update(items => [...items, {
              id: -this.ratesData().length,
              rateType: RateType.EXCEPTION_LTL,
              carrierID: rate.carrierID,
              carrierName: rate.carrierName,
              transitTime: null,
              ilCost: '',
              clientCost: '',
              customCost: rate.customQuote != null ? rate.customQuote.quote : '',
              feesMap: rate.feesMap,
              carrierQuote: rate.carrierQuote,
              clientQuote: rate.clientQuote,
              customerQuote: rate.customQuote,
              quoteID: null,
              warning: null,
              isVolumeRate: false,
              expirationDate: null,
              negotiationType: rate.negotiationType,
              targetRateID: null,
              creationDate: null,
              fuelSurchargeBuy: null,
              fuelSurchargeSell: null,
              targetBuy: null,
              targetSell: null,
              exceedsLinearFoot: rate.exceedsLinearFoot,
              exceedsCubicCapacity: rate.exceedsCubicCapacity,
              exceedsMaxWeight: rate.exceedsMaxWeight,
              isTLRate: false,
              processingFee: rate.processingFee,
              carrierCharge: undefined,
              customerCharge: undefined,
              fuelSurchargeAvg: null,
              ratePerMileAvg: null,
              serviceProviderType: rate?.serviceProviderType,
              marketAvg: null,
              UUID: (rate?.id ?? ''),
              currencyType: (rate?.clientCurrency ?? ''),
              carCurrencyType: (rate?.carrierCurrency ?? '')
            }]);
          }
        }
      }
    }
  }

  moreRates() {
    this.showMoreRates = !this.showMoreRates;
    if (this.showMoreRates) {
      this.rateButtonText = 'View Less';
    } else {
      this.rateButtonText = 'View More';
    }
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'equipmentType') {
      let filterCarrierGroup = this.ratesGridForm.get('filterCarrier') as FormGroup;
      filterCarrierGroup.get('equipmentType')?.setValue(value, {onlySelf: false, emmitEvent: true});
      this.selectedEquipmentType = value;
    }
    if (controlName === 'customer') {
      let filterCarrierGroup = this.ratesGridForm.get('filterCarrier') as FormGroup;
      filterCarrierGroup.get('customer')?.setValue(value, {onlySelf: false, emmitEvent: true});
      this.selectedCustomer = value;
    }
    if (controlName === 'carrierName') {
      const foundCarrier = this.carrierNameList.find(carrier => carrier.carrierName === value);
      const carrierId = value ? foundCarrier?.carrierID : null;
      let filterCarrierGroup = this.ratesGridForm.get('filterCarrier') as FormGroup;
      filterCarrierGroup.get('carrierName')?.setValue(carrierId, { onlySelf: false, emitEvent: true });
      this.selectedCarrier = value;
    }
  }

  onSearchButtonClick(): void {
    this.retrieveCarrierHistory(this.rangeWeeks);
  }

  onClearButtonClick() {
    this.selectedEquipmentType = '';
    this.selectedCustomer = '';
    this.selectedCarrier = '';
    // Clear the selected values
    this.setControlValue(null, 'equipmentType');
    this.setControlValue(null, 'customer');
    this.setControlValue(null, 'carrierName');

    this.retrieveCarrierHistory(24);
  }

  setRangeWeeks(rangeWeeks: any) {
    this.rangeWeeks = rangeWeeks;
    this.retrieveCarrierHistory(rangeWeeks);
  }

  retrieveCarrierHistory(rangeWeeks: any) {
    const control = this.ratesGridForm.controls["selectedRate"] as FormArray;
    const filter = this.ratesGridForm.get('filterCarrier') as FormArray;
    const params: any = {
      shipperAddress: this.shipperAddress,
      shipperCity: this.shipperCity,
      shipperState: this.shipperState,
      shipperZip: this.fromZip,
      consigneeAddress: this.consigneeAddress,
      consigneeCity: this.consigneeCity,
      consigneeState: this.consigneeState,
      consigneeZip: this.toZip,
      targetBuy: this.targetBuy != '' && this.targetBuy != null ? this.targetBuy : control.get('targetBuy')?.value,
      targetSell: this.targetSell != '' && this.targetSell != null ? this.targetSell : control.get('targetSell')?.value,
    };
    if (filter) {
      if (filter.get('equipmentType')?.value) {
        params.equipmentType = filter.get('equipmentType')?.value ?? null;
      }
      if (filter.get('customer')?.value) {
        const clientFilter =  filter.get('customer')?.value ?? null;
        params.customer = clientFilter.substring(0, 3);
      }
      if (filter.get('carrierName')?.value) {
        params.carrierID = filter.get('carrierName')?.value ?? null;
      }
    }

    const queryParams = Object.keys(params).map(key => params[key] !== '' ? key + '=' + params[key] : '')
      .filter(key => key !== '' && key != null).join('&');
    this.getCarrierHistoryRates(queryParams, rangeWeeks);
  }

  getCarrierDropDown(carriersData: CarrierDetail[]) {
    if (carriersData && carriersData.length > 0) {
      this.carrierNameList = carriersData;
      this.carrierNamesDropDown = carriersData.map(carrier => carrier.carrierName);
    } else {
      this.rateService.getAvailableCarriers().subscribe({
        next: (carriers: CarrierDetail[]) => {
          this.carrierNameList = carriers;
          this.carrierNamesDropDown = carriers.map(carrier => carrier.carrierName);
        }
      });
    }
  }

  getCarrierHistoryRates(rateRequest: any, rangeWeeks: any) {
    this.spinner.show('ratesGrid');
    this.carrierHistoryRatesData.length = 0;
    this.carrierHistoryRatesLastData.length = 0;
    this.rateService.getCarrierHistoryRates(rateRequest, rangeWeeks).subscribe({
      next: response => {
        this.historyResponseData.length = 0;
        this.historyResponseData = response.reports;
      },
      error: () => {
        this.spinner.hide('ratesGrid').then();
        this.historyResponseData = [];
      },
      complete: () => {
        this.setCarrierHistoryRateData();
        this.dt.find(t => t.gridName === 'carrierHistoryRates')?.rerender();
        this.dt.find(t => t.gridName === 'carrierHistoryRatesGrid')?.rerender();
        this.historyGridToolTip();
      }
    });
  }


  setCarrierHistoryRateData() {
    const filterCarrier = this.fb.group({
      equipmentType: this.fb.control(''),
      customer: this.fb.control(''),
      carrierName: this.fb.control('')
    });
    // Add the form group to your main form
    this.ratesGridForm.addControl('filterCarrier', filterCarrier);

    this.hideHistoryRatesGrid = false;
    this.historyRatesBtn = false;
    if (this.historyResponseData.length !== 0) {
      for (const rate of this.historyResponseData) {
        if (rate.reportName === 'LAST_CARRIER') {
          this.carrierHistoryRatesLastData.push({
            carrierName: rate.carrierName,
            numberOfLoads: rate.numberOfLoads,
            mcNumber: rate.mcNumber,
            dotNumber: rate.dotNumber,
            actualBuyRate: rate.actualBuyRate,
            actualSellRate: rate.actualSellRate,
            actualGMDollars: rate.actualGMDollars,
            actualGMPercent: rate.actualGMPercent,
            marketBuyRate: rate.marketBuyRate,
            buyToMarketPercent: rate.buyToMarketPercent,
            truckDrilldown: rate.truckDrilldown,
            carrierCharge: undefined,
            customerCharge: undefined,
            currencyType: this.currencyType
          });
        } else {
          this.carrierHistoryRatesData.push({
            carrierName: rate.carrierName,
            numberOfLoads: rate.numberOfLoads,
            mcNumber: rate.mcNumber,
            dotNumber: rate.dotNumber,
            actualBuyRate: rate.actualBuyRate,
            actualSellRate: rate.actualSellRate,
            actualGMDollars: rate.actualGMDollars,
            actualGMPercent: rate.actualGMPercent,
            marketBuyRate: rate.marketBuyRate,
            buyToMarketPercent: rate.buyToMarketPercent,
            truckDrilldown: rate.truckDrilldown,
            carrierCharge: undefined,
            customerCharge: undefined,
            currencyType: this.currencyType
          });
        }
      }
    }
    this.spinner.hide('ratesGrid').then();
  }

  historyGridToolTip() {
    // Allow tool tip on btn collapse
    $('#btnCollapsehistory').attr({
      'data-bs-toggle': 'tooltip',
      title: 'Collapse Report',
      'data-placement': 'bottom'
    });

    $('#btnExpandhistory').attr({
      'data-bs-toggle': 'tooltip',
      title: 'Expand Report',
      'data-placement': 'bottom'
    });

    $('#openTruckloadDetails').attr({
      'data-bs-toggle': 'tooltip',
      title: 'Click to Open Truckload Details',
      'data-placement': 'bottom'
    });

    // Enable Tool Tip On Hover
    $('[data-bs-toggle="tooltip"]').tooltip({
      trigger: 'hover'
    });
  }

  clickCollapseExpand(collapse: boolean, name: string) {
    this.collapseRatesGrid = collapse;
    $('#' + name).tooltip('hide');
  }

  clickTruckHistoryRow(data: any) {
    this.historyTrucks = [];
    this.historyTrucks.push(data);
    $('#historyTrucksModal').modal('show');
  }

  openTruckDetails(truckID: any, groupID = null) {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/SPAs/tracking/truckload-details/' + truckID + '/' + groupID]));
    window.open(url, '_blank');
  }

  uploadDocument(data: any) {
    if (this.quoteReferenceNumber == null || this.quoteReferenceNumber == '') {
      this.quoteReferenceNumber = formatDate(new Date(), 'yyyyMMddHHmmss', 'en')
    }
    const fileName = this.clientCode + this.quoteReferenceNumber + '.pdf';
    let fd = new FormData();
    fd.append('file', data, fileName);
    const pathToSave = this.clientCode + '/' + this.fromZip + '/' + this.toZip + '/';
    this.uploadService.uploadFile(fd, this.quoteReferenceNumber, 'QR', 'LTL', 'quick-rates', pathToSave, fileName)
      .subscribe();
  }

  uploadDocumentSent() {
    const documentDefinition = {
      content: this.emailBodyRates
    };
    let pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    pdfDocGenerator.getBlob((blob) => {
      this.uploadDocument(blob);
    });
  }

  unselectValue() {
    this.selectedRate = false;
    this.ratesGridForm.reset();
    this.ratesSelectedEvent.emit(true);
    this.utilityService.quotescheck = false;
  }

  isCarrierSelected(index: number) {
    const control = this.ratesGridForm.controls["otherRates"] as FormArray;
    // if (control.at(index).get('carrierID')?.value) { return true; }
    return !!control.at(index).get('carrierID')?.value;

  }

  getCarrierName(id: any) {
    let carrierName = '';
    const carrier = this.carrierList.find(c => c.tiberID == id);
    if (carrier) { carrierName = carrier.carrierName; }
    return carrierName;
  }

  switchEquipmentType(equipmentType: string | null) {
    if (equipmentType && equipmentType !== '') {
      const equipment = equipmentType.toUpperCase();
      if (equipment === 'FLATBED' || equipment === 'STEP DECK') {
        return 'FLATBED';
      }
      if (equipment === 'REEFER' || equipment === 'REEFER W/ TEAM') {
        return 'REEFER';
      }
      return 'VAN';
    }
    return 'VAN';
  }

  validateInvalidAndRemoveClass() {
    const nodeList = document.querySelectorAll('input.ng-invalid');
    for (let i = 0; i < nodeList.length; i++) {
      const inputName = nodeList[i].id;
      if ($('#' + inputName).val() !== '') { $('#' + inputName).removeClass('ng-invalid'); }
    }
  }

  setDisabledTableRates() {
    $('.buyRate').hide();
    for (let i = 0; i < this.ratesData().length; i++) {
      // Manual Quote should not be greyed out
      if (this.ratesData()[i].rateType === RateType.MANUAL_LTL) { continue; }
      let creationDate = new Date(this.ratesData()[i].creationDate ?? '');
      creationDate.setDate(creationDate.getDate() + 1);
      const expirationDate = formatDate(creationDate, 'MM-dd-yyyy', 'en', '');
      if (this.ratesData()[i].rateType === RateType.RATER_VOLUME && this.ratesData()[i].assigned == false) {
        if (this.currentDate > expirationDate) {
          $('#' + this.ratesData()[i].id).addClass('row-disabled');
          $('input[type=\'checkbox\'][id=\'' + this.ratesData()[i].id + '\']').attr('disabled', 'true');
        }
      } else {
        if (this.ratesData()[i].assigned == false) {
          $('#' + this.ratesData()[i].id).addClass('row-disabled');
          $('input[type=\'checkbox\'][id=\'' + this.ratesData()[i].id + '\']').attr('disabled', 'true');
        }
      }
    }
  }

  fillCostBreakdown(costs: Accessorial[] | []) {
    this.selectedRateFormat.length = 0;
    const selectedRate: RateGrid = this.ratesGridForm.get('selectedRate')?.value;

    // Gross charge
    let cost = costs.find(x => x.accessorialID == 1);
    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: 'Gross',
        ilCost: (cost && cost.Buy) ? `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : '',
        clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
        customerCost: ''
      });
    } else {
      this.selectedRateFormat.push({
        name: 'Gross',
        ilCost: (cost && cost.Buy) ? `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : '',
        clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
        customerCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : ''
      });
    }

    // Discount
    cost = costs.find(x => x.accessorialID === 559);
    this.selectedRateFormat.push({
      name: 'Discount',
      ilCost: (cost && cost.Buy) ? `<span class="text-center">-${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : null,
      clientCost: (cost && cost.Sell) ? `<span class="text-center">-${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null,
      customerCost: (cost && cost.Sell) ? `<span class="text-center">-${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null
    });

    // Fuel surcharge
    cost = costs.find(x => x.accessorialID === 3);
    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: 'Fuel',
        ilCost: (cost && cost.Buy) ? `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : '',
        clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
        customerCost: ''
      });
    }

    if (!selectedRate.isTLRate && selectedRate.serviceLevel?.toUpperCase() !== 'VOLUME') {
      this.selectedRateFormat.push({
        name: 'Fuel',
        ilCost: (cost && cost.Buy) ? `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : null,
        clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null,
        customerCost: (cost && cost.Sell) ?
          `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null
      });
    }

    // Processing fee
    cost = costs.find(x => x.accessorialID === 5);
    this.selectedRateFormat.push({
      name: 'Processing Fee',
      ilCost: '',
      clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
      customerCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
    });

    // Accessorials
    for (const cost of costs) {
      if (cost.accessorialID !== 1 && cost.accessorialID !== 3 && cost.accessorialID !== 5 && cost.accessorialID !== 559 &&
        cost.accessorialID !== 916) {
        this.selectedRateFormat.push({
          name: cost.accessorialName,
          ilCost: (cost && cost.Buy) ?
            `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : '',
          clientCost: (cost && cost.Sell) ?
            `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : '',
          customerCost: (cost && cost.Sell) ?
            `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : ''
        });
      }
    }

    // Additional Insurance
    cost = costs.find(x => x.accessorialID === 916);
    this.selectedRateFormat.push({
      name: 'Additional Insurance',
      ilCost: (cost && cost.Buy) ? `<span class="text-center">${this.dollarUS.format(cost.Buy)} ${this.carCurrencyType}</span>` : null,
      clientCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null,
      customerCost: (cost && cost.Sell) ? `<span class="text-center">${this.dollarUS.format(cost.Sell)} ${this.currencyType}</span>` : null
    });

    // Totals
    if (selectedRate.isTLRate) {
      this.selectedRateFormat.push({
        name: '<b class="dodger-blue">Total</b>',
        ilCost: (selectedRate.targetBuy ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.targetBuy))} ${this.carCurrencyType}</span>` : ''),
        clientCost: (selectedRate.targetSell ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.targetSell))} ${this.currencyType}</span>` : ''),
        customerCost: ''
      });
    } else {
      this.selectedRateFormat.push({
        name: '<b class="dodger-blue">Total</b>',
        ilCost: (selectedRate.ilCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.ilCost))} ${this.carCurrencyType}</span>` : ''),
        clientCost: (selectedRate.clientCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.clientCost))} ${this.currencyType}</span>` : ''),
        customerCost: (selectedRate.customCost ?
          `<b/><span class="dodger-blue">${this.dollarUS.format(parseFloat(selectedRate.customCost))} ${this.currencyType}</span>` : '')
      });
    }

    this.dt.find(t => t.gridName === 'rateBreakdown')?.reDrawTable(this.selectedRateFormat);
  }

  searchSelectedRate() {
    const data = this.ratesData().find(value => value?.assigned == true);
    if (data) { this.setSelectedValue(data); }
  }

  saveTargetRates(truckID: string) {
    this.buildTruckloadRateRequest();
    this.rateService.saveTruckloadRates(truckID, this.tlRateRequest).subscribe();
  }
}
