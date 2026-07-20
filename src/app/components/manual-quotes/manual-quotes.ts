import {Component, forwardRef, input, model, OnInit, output, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {Dropdown} from '../../interfaces/dropdown';
import {TLManualQuote} from '../../interfaces/manual-quote';
import {CarrierProfilingService} from '../../services/carrier-profiling/carrier-profiling.service';
import {NgxSpinnerService} from 'ngx-spinner';
import Swal from 'sweetalert2';
import {CarrierInfo} from '../../interfaces/carrier-rmis-attach';
import {CarrierRMIS, Coverage} from '../../interfaces/carrier-rmis';
import {Constants} from '../../constants/constants';
import moment from 'moment';
import {ReportsService} from '../../services/reports/reports.service';
import {EmailModal} from '../email-modal/email-modal';
import {TruckSave} from '../../interfaces/truck-save';
import {formatDate} from '@angular/common';
import {FastForexService} from '../../services/fast-forex/fast-forex.service';
import {TruckFees} from '../../interfaces/truck-fees';
import {CarrierMcLeodResponse, Payee} from '../../interfaces/carrier-mcleod';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-manual-quotes',
  standalone: false,
  templateUrl: './manual-quotes.html',
  styleUrl: './manual-quotes.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ManualQuotes),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ManualQuotes),
      multi: true
    }
  ]
})
export class ManualQuotes implements OnInit {
  @ViewChild(EmailModal) emailModalComponent!: EmailModal;
  manualQuotesForm!: FormGroup;
  firstQuoteChecked = false;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  carrierMonitoringData: any;
  newCarrier = false;
  onboardCarrier = false;
  modalNetwotkTT = false;
  carrierCertified = false;
  certificationVerified: string | null = null;
  isEquipmentRequired: boolean[] = [false];
  disabled = input(false);
  manualQuotes = input<any[]>([]);
  carrierName: string | null = '';
  carrierIndex: any;
  formClickEvent = output<boolean>();
  dropdownList: Dropdown[] = [];
  dropdownSettings = {};
  mcNumber: string | null = null;
  dotNumber: string | null = null;
  carrierSource = environment.CARRIER_SOURCE; // 'RMIS' | 'MCLEOD'
  carrierInfo!: CarrierInfo | null;
  selectCarrierEvent = output<boolean>();
  trackingDetails = input(false);
  changeEvent = output<boolean>();
  flagCerticateInsurance = false;
  flagCarrierCerticated = false;
  flagSafetyRating = false;
  flagMonthsInService = false;
  exceptionDropDown: any = [];
  carrierNameException = '';
  mcNumberException = '';
  carrierIndexException = -1;
  carrierExceptionEvent = output<any>();
  removeQuoteEvent = output<any>();
  showCheckInsuranceAmount = input(false);
  checkedInsuranceAmount = false;
  truck = model<TruckSave | any>(null);
  currencyType: any = input('USD');
  carCurrencyType: any  = model('USD');
  emailSendSubject = '';
  emailSendAttachment: any = [];
  emailSendDocumentType = '';
  selectedManualDocument: any = '';
  shipmentIDs: any[] = [];
  carrierConfirmationDocument: any = [];
  clientQuoteDocument: any = [];
  tnuConfirmationDocument: any = [];
  loadComplete = output<boolean>();
  quoteDeselected = output<boolean>();
  selectedQuoteRemoved = output<boolean>();
  emailSent = output<boolean>();
  newCarrierEvent = output<boolean>();
  exchangeRate = 1;
  quotesRemoved: any = [];

  constructor(private fb: FormBuilder, private cps: CarrierProfilingService, private spinner: NgxSpinnerService,
              private rs: ReportsService, private ffs: FastForexService) {
  }

  get quotes() {
    return this.manualQuotesForm.get('quotes') as FormArray;
  }

  get equipment() {
    const equipment: string[] = [];
    Constants.EQUIPMENT_TL_DROPDOWN.forEach(value => {
      equipment.push(value.item);
    });
    return equipment;
  }

  get reasonCodes() {
    const reasonList: string[] = [];
    Constants.REASON_CODE_TL_DROPDOWN.forEach(value => {
      reasonList.push(value.item);
    });
    return reasonList;
  }

  ngOnInit() {
    this.exceptionDropDown = Constants.OVERRIDE_EXCEPTIONS_DROPDOWN;
    this.dropdownSettings = {
      singleSelection: true,
      idField: 'value',
      textField: 'item',
      allowSearchFilter: true,
      closeDropDownOnSelection: true,
      searchPlaceholderText: 'Type MC Number or DOT Number',
      itemsShowLimit: 5
    };

    if (this.manualQuotes() && this.manualQuotes().length !== 0) {
      this.manualQuotesForm = this.fb.group({
        quotes: this.fb.array([]),
        overrideException: this.fb.control(''),
        overrideExceptionText: this.fb.control('')
      });
      const fn = () => {
        this.setInitialManualQuotes(this.manualQuotes());
      };
      this.getCarrierList(fn);
    } else {
      this.getCarrierList();
      this.manualQuotesForm = this.fb.group({
        quotes: this.fb.array([
          this.getQuote()
        ]),
        overrideException: this.fb.control(''),
        overrideExceptionText: this.fb.control('')
      });
    }

    const component = this;
    $('#missingExceptionModal').on('hidden.bs.modal', () => {
      component.closeCarrierValidationModal(false);
    });

    if (this.truck()) {
      if (this.truck()?.shipments) {
        for (const shipment of (this.truck()?.shipments ?? [])) {
          this.shipmentIDs.push(shipment?.shipmentDetail?.shipmentID);
        }
      }

      const originalCCFileName = '124/' + this.truck()?.truckID + 'C.pdf';
      this.carrierConfirmationDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Original Carrier Confirmation',
        fileName: originalCCFileName,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });

      this.tnuConfirmationDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Original Carrier Confirmation',
        fileName: null,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });

      const originalCQFileName = '124/' + this.truck()?.truckID + 'Q.pdf';
      this.clientQuoteDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Client Quote',
        fileName: originalCQFileName,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });
    }
  }

  getCarrierList(fn: any = null, refresh = false) {
    this.spinner.show('spinnerManualQuotesForm').then();
    const carriersOnboard = sessionStorage.getItem('carriersOnboard');
    if (!carriersOnboard || refresh) {
      this.cps.getOnboardedCarriers().subscribe({
        next: response => {
          if (response) { sessionStorage.setItem('carriersOnboard', JSON.stringify(response)); }
          this.onboardedCarrierList(response);
        },
        error: () => {
          this.spinner.hide('spinnerManualQuotesForm').then();
          this.loadComplete.emit(true);
        },
        complete: () => {
          if (typeof fn === 'function') {
            fn();
          }
        }
      });
    } else {
      this.onboardedCarrierList(JSON.parse(carriersOnboard));
      if (typeof fn === 'function') {
        fn();
      }
    }
  }

  addQuotes() {
    this.isEquipmentRequired.push(false);
    this.quotes.push(this.getQuote());
    this.removeButtons();
    setTimeout(() => this.addEvent(this.quotes.length - 1), 500);
  }

  removeQuote(index: number) {
    if (this.quotes.at(index).get('quoteID')?.value && this.quotes.at(index).get('quoteID')?.value !== '') {
      this.quotesRemoved.push(this.quotes.at(index).get('quoteID')?.value);
    }
    if (this.quotes.at(index).get('assigned')?.value === true && this.quotes.at(index).get('quoteID')?.value &&
      this.quotes.at(index).get('quoteID')?.value !== '') {
      this.selectedQuoteRemoved.emit(true);
    }
    this.removeQuoteEvent.emit(index);
    const emptyProductControl = this.fb.group({
      quoteID: [null],
      carrierID: [''],
      carrierName: [''],
      clientCost: [''],
      carrierCost: [''],
      quoteNumber: [''],
      transitTime: [''],
      notes: [''],
      assigned: [false],
      mcNumber: [''],
      dotNumber: [''],
      selected: [null],
      clientQuote: [false],
      truckNotUsed: [false],
      equipment: [''],
      reasonCode: [''],
      lostReasonNotes: [''],
      hideReasonCode: [true],
      currencyID: [1],
      defaultCurrencyID: [1],
      exchangeRate: [1],
      rateDate: [''],
      exchangeInfo: ['']
    });

    // delete more than one or clear one quote line
    if (this.quotes.length > 1) {
      this.removeButtons();
      this.quotes.removeAt(index);
      this.isEquipmentRequired.splice(index, 1);
    } else {
      this.quotes.setControl(0, emptyProductControl);
      this.firstQuoteChecked = false;
    }
    this.changeEvent.emit(true);
  }

  checkCarrierStatus(index: any) {
    this.resetCarrierSearchFields();
    this.carrierIndex = index;
    this.spinner.show('spinnerManualQuotesForm').then();
    const thisCarrier: CarrierDetail = this.getCarrierFn(index);
    this.cps.getCarrier(thisCarrier.dotNumber, 'DOT').subscribe({
      next: response => {
        this.modalNetwotkTT = response.inNetworkTT;
        this.carrierCertified = response?.isCertified;
        this.certificationVerified = response?.certificationVerified;
        if (this.carrierSource === 'RMIS') {
          this.cps.getCarrierFromRmis(thisCarrier?.mcNumber).subscribe({
            next: resp => {
              this.spinner.hide('spinnerManualQuotesForm').then();
              if (resp.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
                this.carrierMonitoringData = resp;
                this.carrierName = this.carrierMonitoringData.RMISCarrierStatusExpanded.Carrier.CompanyName;
                this.mcNumber =  this.carrierMonitoringData.RMISCarrierStatusExpanded.Carrier.MCNumber;
                this.dotNumber =  this.carrierMonitoringData.RMISCarrierStatusExpanded.Carrier.DOTNumber;
                $('#carrierMonitoringModal').modal('show');
              } else {
                Swal.fire('Search Carrier', 'Carrier Not found in RMIS', 'warning');
                return;
              }
            },
            error: e => {
              this.spinner.hide('spinnerManualQuotesForm').then();
              Swal.fire('Search Carrier', e, 'warning');
              return;
            }
          });
        } else {
          this.cps.searchCarrier(thisCarrier.dotNumber).subscribe({
            next: resp => {
              this.spinner.hide('spinnerManualQuotesForm').then();
              if (resp && resp.payee) {
                const payee: Payee = Array.isArray(resp.payee) ? resp.payee[0] : resp.payee;
                this.carrierMonitoringData = resp;
                this.carrierName = payee['@name'];
                this.dotNumber =  payee['@dot_number'] ?? '';
                this.mcNumber =  payee.drs_payee['@icc_number'];
                $('#carrierMonitoringModal').modal('show');
              } else {
                Swal.fire('Search Carrier', 'Carrier with DOT Number <b>' + thisCarrier.dotNumber + '</b> Not found.', 'warning');
                return;
              }
            },
            error: e => {
              this.spinner.hide('spinnerManualQuotesForm').then();
              Swal.fire('Search Carrier', e, 'warning');
              return;
            }
          });
        }
      },
      error: e => {
        this.spinner.hide('spinnerManualQuotesForm').then();
        Swal.fire('Search Carrier', e, 'warning');
        return;
      }
    });
  }

  setControlValue(value: any, select: boolean, index: number) {
    this.quotes.at(index).get('carrierID')?.setValue(select ? value.value : null, {onlySelf: false, emmitEvent: true});
    this.quotes.at(index).get('carrierName')?.setValue(select ? value.item : null, {onlySelf: false, emmitEvent: true});
    const thisCarrier: CarrierDetail = this.getCarrierFn(value.value);
    this.carrierName = select ? thisCarrier.carrierName : '';
    this.quotes.at(index).get('mcNumber')?.setValue('');
    this.quotes.at(index).get('dotNumber')?.setValue('');
    this.onboardCarrier = false;
    this.newCarrier = false;
    this.mcNumber = null;
    this.dotNumber = null;
    this.carrierIndex = index;
    this.selectCarrierEvent.emit(select);
    if (select) {
      this.isEquipmentRequired[index] = true;
      this.validateEquipment(index);
      this.changeCurrency(index, thisCarrier.currencyID, true);
      const dotNum = thisCarrier.dotNumber;
      if (dotNum && dotNum !== '') {
        this.spinner.show('spinnerManualQuotesForm').then();
        if (this.carrierSource === 'RMIS') {
          const mcNum = thisCarrier.mcNumber;
          if (mcNum && mcNum !== '') {
            this.spinner.show('spinnerManualQuotesForm').then();
            this.cps.getCarrierFromRmis(mcNum).subscribe({
              next: response => {
                this.spinner.hide('spinnerManualQuotesForm').then();
                this.carrierName = response.RMISCarrierStatusExpanded?.Carrier?.CompanyName;
                this.validatingCarrierExceptionRMIS(response, index);
              },
              error: () => {
                this.spinner.hide('spinnerManualQuotesForm').then();
              }
            });
          } else {
            this.spinner.show('spinnerManualQuotesForm').then();
            this.cps.getCarrierFromRmisByDOT(dotNum).subscribe({
              next: response => {
                this.carrierName = response.RMISCarrierStatusExpanded?.Carrier?.CompanyName;
                this.spinner.hide('spinnerManualQuotesForm').then();
                this.validatingCarrierExceptionRMIS(response, index);
              },
              error: () => {
                this.spinner.hide('spinnerManualQuotesForm').then();
              }
            });
          }
        } else {
          this.cps.searchCarrier(dotNum).subscribe({
            next: response => {
              this.spinner.hide('spinnerManualQuotesForm').then();
              this.carrierName = Array.isArray(response.payee) ? response.payee[0]['@name'] : response.payee['@name'];
              if (this.validatingCarrierMcLeod(response)) {
                this.validatingCarrierExceptionMcleod(response, index);
              } else {
                Swal.fire('Search Carrier', 'Carrier ' + this.carrierName + ' Does not meet requirements', 'warning');
                this.resetCarrierValues(index);
              }
            },
            error: () => {
              this.spinner.hide('spinnerManualQuotesForm').then();
            }
          });
        }
      }
    }
  }

  setManualQuotesForEdit(manualQuotes: TLManualQuote[], truck: TruckSave | null) {
    if (!this.truck() && truck) { this.truck.update(() => truck); }
    for (const quote of manualQuotes) {
      const carriername = this.getCarrierValue(quote.carrierID);
      const hideReasonCode = !(quote.assigned == true &&
        this.validateBuyGreaterThanSell(quote.clientCost, quote.carrierCost, quote.exchangeRate));
      const quoteControl = this.fb.group({
        quoteID: [quote.quoteID],
        carrierID: [quote.carrierID],
        carrierName: [carriername],
        clientCost: [quote.clientCost],
        carrierCost: [quote.carrierCost],
        quoteNumber: [quote.quoteNumber],
        transitTime: [quote.transitTime],
        notes: [quote.notes],
        assigned: [quote.assigned],
        mcNumber: [quote.mcNumber],
        dotNumber: [quote.dotNumber],
        selected: [quote.selected],
        clientQuote: [quote.carrierID && quote.carrierID == '1'],
        truckNotUsed: [quote.truckNotUsed],
        equipment: [quote.equipment],
        reasonCode: [quote.reasonCode],
        lostReasonNotes: [quote.lostReasonNotes],
        hideReasonCode: [hideReasonCode],
        currencyID: [quote.currencyID ? quote.currencyID : 1],
        defaultCurrencyID: [quote.currencyID ? quote.currencyID : 1],
        exchangeRate: [quote.exchangeRate],
        rateDate: [quote.rateDate],
        exchangeInfo: [quote.exchangeInfo],
      });

      // First freight item, set instead of push
      if (this.quotes.length === 1 && !this.firstQuoteChecked) {
        this.quotes.setControl(0, quoteControl);
        // Identifies that first freight has been set since incrementing length will cause issues
        this.firstQuoteChecked = true;
      } else {
        this.quotes.push(quoteControl);
      }
    }
  }

  assignQuote(index: number, value: boolean) {
    if (!value && this.quotes.at(index).get('assigned')?.value == true &&
      this.quotes.at(index).get('quoteID')?.value && this.quotes.at(index).get('quoteID')?.value !== '') {
      if (this.truck()) this.truck.update(values => ({
        ...values, salesRep: null
      }));
      this.quoteDeselected.emit(true);
    }
    for (let i = 0; i < this.quotes.length; i++) {
      this.quotes.at(i).get('assigned')?.setValue(false);
      this.hideReasonCode(i);
      if (i != index && this.quotes.at(i).get('assigned')?.value == true && this.quotes.at(i).get('quoteID')?.value &&
        this.quotes.at(i).get('quoteID')?.value !== '') {
        this.quoteDeselected.emit(true);
      }
    }
    this.quotes.at(index).get('assigned')?.setValue(value);
    this.hideReasonCode(index);
    this.changeEvent.emit(true);
  }

  getCarrierValue(id: any, type = '') {
    let val: any;
    for (const carrier of this.carrierList) {
      if (carrier.carrierID?.toString() === id.toString()) {
        val = type === 'MC' ? carrier.mcNumber : carrier.carrierName;
        break;
      }
    }
    return val;
  }

  isCarrierOnboarded(id: any) {
    let val = false;
    if (id) {
      for (const carrier of this.carrierList) {
        if (carrier.carrierID?.toString() === id.toString()) {
          val = Boolean(carrier.onboarded);
          break;
        }
      }
    }
    return val;
  }

  refreshCarrierList() {
    this.getCarrierList(null, true);
    this.formClickEvent.emit(true);
  }

  private getQuote(
    quoteID: any = null,
    carrierID: any = '',
    carrierName = '',
    clientCost: any = '',
    carrierCost: any = '',
    quoteNumber: any = '',
    transitTime: any = '',
    notes: any = '',
    assigned: any = false,
    mcNumber: any = '',
    dotNumber: any = '',
    selected: any = [],
    clientQuote: any = false,
    truckNotUsed: any = false,
    equipment: any = '',
    reasonCode: any = '',
    lostReasonNotes: any = '',
    hideReasonCode: any = true,
    currencyID: number = 1,
    exchangeRate: any = 1,
    rateDate: any = '',
    exchangeInfo: any = ''
  ) {
    return this.fb.group({
      quoteID: [quoteID],
      carrierID: [carrierID],
      carrierName: [carrierName],
      clientCost: [clientCost],
      carrierCost: [carrierCost],
      quoteNumber: [quoteNumber],
      transitTime: [transitTime],
      notes: [notes],
      assigned: [assigned],
      mcNumber: [mcNumber],
      dotNumber: [dotNumber],
      selected: [selected],
      clientQuote: [clientQuote],
      truckNotUsed: [truckNotUsed],
      equipment: [equipment],
      reasonCode: [reasonCode],
      lostReasonNotes: [lostReasonNotes],
      hideReasonCode: [hideReasonCode],
      currencyID: [currencyID],
      defaultCurrencyID: [currencyID],
      exchangeRate: [exchangeRate],
      rateDate: [rateDate],
      exchangeInfo: [exchangeInfo]
    });
  }

  private setInitialManualQuotes(manualQuotes: TLManualQuote[]) {
    this.isEquipmentRequired.push(false);
    manualQuotes.forEach(value => {
      this.quotes.push(
        this.getQuote(
          value.quoteID,
          value.carrierID,
          this.getCarrierValue(value.carrierID),
          value.clientCost,
          value.carrierCost,
          value.quoteNumber,
          value.transitTime,
          value.notes,
          value.assigned,
          value.mcNumber,
          value.dotNumber,
          value.selected,
          (value.carrierID && value.carrierID == '1'),
          value.truckNotUsed,
          value.equipment,
          value.reasonCode,
          value.lostReasonNotes,
          !(this.validateBuyGreaterThanSell(value.clientCost, value.carrierCost, value.exchangeRate) && value.assigned == true),
          (value.currencyID ? value.currencyID : 1),
          value.exchangeRate,
          value.rateDate,
          value.exchangeInfo
        ));
    });
  }

  carrierFilterChange(value: any, index: number) {
    this.quotes.at(index).get('mcNumber')?.setValue(value);
  }

  searchCarrierByMcNumber(mcNumber: string, index: any) {
    if (mcNumber === '') {
      Swal.fire('Search Carrier', 'Please type MC Number to search Carrier', 'warning');
      return;
    }
    this.resetCarrierSearchFields();
    this.carrierSource = 'RMIS';
    this.carrierIndex = index;
    this.spinner.show('spinnerManualQuotesForm').then();
    this.quotes.at(index).get('mcNumber')?.setValue('');
    this.cps.getCarrierFromRmis(mcNumber).subscribe({
      next: response => {
        this.onboardCarrier = true;
        this.newCarrier = true;
        this.spinner.hide('spinnerManualQuotesForm').then();
        if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
          this.carrierMonitoringData = response;
          this.carrierName = this.carrierMonitoringData.RMISCarrierStatusExpanded.Carrier.CompanyName;
          this.getCarrier(mcNumber, 'MC');
        } else {
          this.quotes.at(index).get('mcNumber')?.setValue('');
          this.prequalifyCarrier(mcNumber);
        }
      },
      error: e => {
        this.spinner.hide('spinnerManualQuotesForm').then();
        Swal.fire('Search Carrier', 'Unable to get Carrier info. ' + (e ? e : ''), 'warning');
        return;
      }
    });
  }

  getNewCarrier(value: CarrierDetail, index: any) {
    if (value) {
      const mcNumber = value.mcNumber ? 'MC: #' + value.mcNumber + '. ' : '';
      const dotNumber = value.dotNumber ? 'DOT: #' + value.dotNumber : '';
      const descNumbers = mcNumber + dotNumber;
      const item = {
        item: value.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''),
        value: value.carrierID?.toString()
      };
      this.carrierList.push(value);
      this.dropdownList.push(<Dropdown>item);
      const selectedValue = [item];
      this.quotes.at(index).get('carrierID')?.setValue(value.carrierID?.toString(), {onlySelf: false, emmitEvent: true});
      this.quotes.at(index).get('carrierName')?.setValue(value.carrierName , {onlySelf: false, emmitEvent: true});
      this.quotes.at(index).get('selected')?.setValue(selectedValue, {onlySelf: false, emmitEvent: true});
      $('#rowQuote' + index).trigger('click');

      if (value.mcNumber && value.mcNumber !== '') {
        this.spinner.show('spinnerManualQuotesForm').then();
        if (this.carrierSource === 'RMIS') {
          this.cps.getCarrierFromRmis(value.mcNumber).subscribe({
            next: response => {
              this.carrierName = response.RMISCarrierStatusExpanded?.Carrier?.CompanyName;
              this.spinner.hide('spinnerManualQuotesForm').then();
              this.validatingCarrierExceptionRMIS(response, index);
              this.newCarrierEvent.emit(true);
            },
            error: () => {
              this.newCarrierEvent.emit(false);
              this.spinner.hide('spinnerManualQuotesForm').then();
            }
          });
        } else {
          this.cps.searchCarrier(value.mcNumber, 'MC').subscribe({
            next: response => {
              this.carrierName = Array.isArray(response.payee) ? response.payee[0]['@name'] : response.payee['@name'];
              this.spinner.hide('spinnerManualQuotesForm').then();
              if (this.validatingCarrierMcLeod(response)) {
                this.validatingCarrierExceptionMcleod(response, index);
                this.newCarrierEvent.emit(true);
              } else {
                Swal.fire('Search Carrier', 'Carrier ' + this.carrierName + ' Does not meet requirements', 'warning');
                this.newCarrierEvent.emit(false);
                this.resetCarrierValues(index);
              }
            },
            error: () => {
              this.newCarrierEvent.emit(false);
              this.spinner.hide('spinnerManualQuotesForm').then();
            }
          });
        }
      } else {
        if (value.dotNumber && value.dotNumber !== '') {
          this.spinner.show('spinnerManualQuotesForm').then();
          if (this.carrierSource === 'RMIS') {
            this.cps.getCarrierFromRmisByDOT(value.dotNumber).subscribe({
              next: response => {
                this.carrierName = response.RMISCarrierStatusExpanded?.Carrier?.CompanyName;
                this.spinner.hide('spinnerManualQuotesForm').then();
                this.validatingCarrierExceptionRMIS(response, index);
                this.newCarrierEvent.emit(true);
              },
              error: () => {
                this.newCarrierEvent.emit(false);
                this.spinner.hide('spinnerManualQuotesForm').then();
              }
            });
          } else {
            this.cps.searchCarrier(value.dotNumber).subscribe({
              next: response => {
                this.carrierName = Array.isArray(response.payee) ? response.payee[0]['@name'] : response.payee['@name'];
                this.spinner.hide('spinnerManualQuotesForm').then();
                if (this.validatingCarrierMcLeod(response)) {
                  this.validatingCarrierExceptionMcleod(response, index);
                  this.newCarrierEvent.emit(true);
                } else {
                  Swal.fire('Search Carrier', 'Carrier ' + this.carrierName + ' Does not meet requirements', 'warning');
                  this.newCarrierEvent.emit(false);
                  this.resetCarrierValues(index);
                }
              },
              error: () => {
                this.newCarrierEvent.emit(false);
                this.spinner.hide('spinnerManualQuotesForm').then();
              }
            });
          }
        }
      }
    }
  }

  prequalifyCarrier(textNumber: string, typeNumber= 'MC') {
    this.cps.qualifyCarrier(textNumber, typeNumber).subscribe({
      next: response => {
        this.onboardCarrier = true;
        this.newCarrier = true;
        this.carrierMonitoringData = null;
        this.carrierInfo = response.NonAttachedCarrierStatusRequestAPI.CarrierInfo;
        this.carrierName = this.carrierInfo?.CompanyName ?? '';
        this.getCarrier(textNumber, typeNumber);
      },
      error: () => {
        this.spinner.hide('spinnerManualQuotesForm').then();
        Swal.fire('Search Carrier', 'Carrier with ' + typeNumber + ' Number <b>' + textNumber + '</b> Not found in RMIS', 'warning');
      },
      complete: () => {
        this.spinner.hide('spinnerManualQuotesForm').then();
      }
    });
  }

  validatingCarrierExceptionRMIS(data: CarrierRMIS, index: any) {
    this.flagCerticateInsurance = false;
    this.flagCarrierCerticated = false;
    this.flagSafetyRating = false;
    this.flagMonthsInService = false;
    this.carrierNameException = '';
    this.mcNumberException = '';
    this.carrierIndexException = -1;
    if (data && data.RMISCarrierStatusExpanded.Header.Result !== 'ERROR') {
      this.carrierNameException = data.RMISCarrierStatusExpanded.Carrier.CompanyName;
      this.mcNumberException = data.RMISCarrierStatusExpanded.Carrier.MCNumber;
      const dotInfo = data.RMISCarrierStatusExpanded.DOTTestingInfo;
      const coverages = data.RMISCarrierStatusExpanded.Coverages;
      if (coverages.Coverage) {
        const insurance: Coverage | undefined = coverages.Coverage.find(c => c.Status === 'Valid' && c.CoverageDescription === 'CARGO');
        if (!insurance) {
          this.flagCerticateInsurance = true;
        }
      }
      if (data.RMISCarrierStatusExpanded.CertificationStatus) {
        if (data.RMISCarrierStatusExpanded.CertificationStatus.IsCertified === 'False') {
          this.flagCarrierCerticated = true;
        }
      }
      if (dotInfo.SafetyRating && dotInfo.SafetyRating.toLowerCase() !== 'none' &&
        dotInfo.SafetyRating.toLowerCase() !== 'satisfactory') { this.flagSafetyRating = true; }
      const grantDate = moment(dotInfo.OriginalAuthorityGrantDate, 'M/D/YYYY').add(6, 'months');
      if (grantDate > moment()) { this.flagMonthsInService = true; }
      if (this.flagSafetyRating || this.flagMonthsInService || this.flagCerticateInsurance || this.flagCarrierCerticated) {
        this.carrierIndexException = index;
        $('#missingExceptionModal').modal('show');
      }
    }
  }

  onClickOverrideException() {
    this.spinner.show('spinnerManualQuotesForm').then();

    const fnc = () => {
      this.spinner.hide('spinnerManualQuotesForm').then();
      const reason = (this.manualQuotesForm.get('overrideException')?.value == -1 ?
        this.manualQuotesForm.get('overrideExceptionText')?.value :
        this.exceptionDropDown.find((e: { ExceptionID: any; }) => e.ExceptionID == this.manualQuotesForm.get('overrideException')?.value).ExceptionName);
      const noteText = 'Carrier ' + this.carrierNameException  + ' onboarded. Exception added, reason: ' + reason;
      const note = {
        index: this.carrierIndexException,
        note: noteText
      };
      this.carrierIndexException = -1;
      $('#missingExceptionModal').modal('hide');
      this.carrierExceptionEvent.emit(note);
    };

    this.cps.attachCarrier(this.mcNumberException, 'MC', this.carrierSource).subscribe({
      next: () => {
        fnc();
      },
      error: () => {
        fnc();
      }
    });
  }

  disableOverrideButton() {
    const response = true;
    if (this.manualQuotesForm.get('overrideException')?.value == -1 &&
      this.manualQuotesForm.get('overrideExceptionText')?.value == '') { return response; }
    if (this.manualQuotesForm.get('overrideException')?.value == -1 &&
      this.manualQuotesForm.get('overrideExceptionText')?.value !== '') { return false; }
    if (this.manualQuotesForm.get('overrideException')?.value == 1 ||
      this.manualQuotesForm.get('overrideException')?.value == 2) { return false; }
    return response;
  }

  closeCarrierValidationModal(close = true) {
    if (this.carrierIndexException > -1) {
      this.resetCarrierValues(this.carrierIndexException);
    }
    this.carrierName = '';
    this.manualQuotesForm.get('overrideException')?.setValue('');
    this.manualQuotesForm.get('overrideExceptionText')?.setValue('');
    this.carrierIndexException = -1;
    if (close) { $('#missingExceptionModal').modal('hide'); }
  }

  onCheckingInsuranceAmount() {
    if ((document.getElementById('checkInsuranceAmount') as HTMLInputElement).checked) {
      $('#checkInsuranceAmount').removeClass('is-invalid');
      this.checkedInsuranceAmount = true;
    } else {
      this.checkedInsuranceAmount = false;
    }
    this.changeEvent.emit(true);
  }

  checkInsuranceAmount() {
    if (this.showCheckInsuranceAmount()) { return !this.checkedInsuranceAmount; }
    return false;
  }

  checkSelectedQuoteandInsuranceAmount() {
    let quoteSelected = false;
    for (let i = 0; i < this.quotes.length; i++) {
      if (this.quotes.at(i).get('carrierID')?.value && this.quotes.at(i).get('carrierID')?.value !== '' &&
        this.quotes.at(i).get('assigned')?.value == true) {
        quoteSelected = true;
      }
    }

    if (this.showCheckInsuranceAmount() && quoteSelected) {
      return this.checkedInsuranceAmount;
    }
    return true;
  }

  checkTwoDecimals(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    const input = event.target.value + String.fromCharCode(event.charCode);
    if (!reg.test(input)) { event.preventDefault(); }
  }

  openGenerateDocumentsModal(index: any) {
    const quoteId = this.quotes.at(index).get('quoteID')?.value;

    const documentOptions = !this.quotes.at(index).get('truckNotUsed')?.value ? {
      carrierconfirmation: 'Carrier Confirmation',
      clientquote: 'Client Quote',
    } : {
      tnuconfirmation: 'TNU Carrier Confirmation ',
    };

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-sm btn-primary p-2 w-25',
        denyButton: 'btn btn-sm btn-success p-2 w-25',
        cancelButton: 'btn btn-sm btn-danger p-2 w-25'
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: 'Generate Documents',
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Email <i class="material-icons text-center blue" style="font-size: 14px; color:white;">email</i>',
      denyButtonText: 'Download <i class="material-icons text-center blue" style="font-size: 14px; color:white">download</i>',
      cancelButtonText: 'Close',
      returnInputValueOnDeny: true,
      input: 'select',
      inputOptions: documentOptions,
      inputLabel: 'Please select document type: ',
      inputPlaceholder: 'Select Document',
      didOpen: () => {
        $('div.swal2-actions').css('justify-content', 'space-evenly').css('width', '100%');
        $('select.swal2-select').addClass('form-select form-select-sm custom-select pt-1');
        $('select.swal2-select').css('font-size', '1em').css('width', '90%');
      },
      inputValidator: (value): any => {
        if (!value) { return 'Document type must be selected!'; }
      }
    }).then((result) => {
      if (result.isConfirmed || result.isDenied) {
        if (result.isConfirmed) { this.getQuoteDocument(quoteId, result.value); }
        if (result.isDenied) { this.downloadQuoteDocument(quoteId, result.value); }
      } else {
        return;
      }
    });
  }

  downloadQuoteDocument(quoteId: string, typeDoc: any) {
    this.rs.getDocumentFromLambda(quoteId, typeDoc).subscribe({
      next: response => {
        const toPdf = this.base64ToBlob(response.pdf);
        const file = new Blob([toPdf], {type: 'application/pdf'});
        const fileURL = URL.createObjectURL(file);
        let link = document.createElement('a');
        link.href = fileURL;
        link.download = (typeDoc === 'carrierconfirmation' ? 'carrierconfirmation.pdf' :
          typeDoc === 'tnuconfirmation' ? 'tnuconfirmation.pdf' : 'clientquote.pdf');
        link.click();
      },
      error: () => {
        const title = (typeDoc === 'carrierconfirmation' ? 'Carrier Confirmation Document' :
          typeDoc === 'tnuconfirmation' ? 'TNU Confirmation Document' : 'Client Quote Document');
        Swal.fire(title, '<b><i>Document could not be generated</i></b>', 'warning');
      }
    });
  }

  emailDocument(quoteId: string, typeDoc: string) {
    if (typeDoc === 'tnuconfirmation') { this.tnuConfirmationDocument[0].fileName = '124/' + quoteId + 'T.pdf'; }
    this.emailModalComponent.ccSender = false;
    this.emailModalComponent.ccEmail = null;
    this.emailModalComponent.noteEmailBody = null;
    this.selectedManualDocument = typeDoc;
    this.emailSendAttachment = (typeDoc === 'carrierconfirmation' ? this.carrierConfirmationDocument :
      typeDoc === 'tnuconfirmation' ? this.tnuConfirmationDocument : this.clientQuoteDocument);
    this.emailSendSubject = (typeDoc === 'carrierconfirmation' ? 'Carrier Confirmation - Truck ' :
        typeDoc === 'tnuconfirmation' ? 'TNU Confirmation - Truck ' : 'Client Quote - Truck ') +
      this.truck()?.truckID?.toString() + ' - Quote ID ' + quoteId;
    this.emailSendDocumentType = (typeDoc === 'carrierconfirmation' ? 'Carrier Confirmation' :
      typeDoc === 'tnuconfirmation' ? 'TNU Confirmation' : 'Quote Response');
    this.emailModalComponent.emailBody = this.statusEmailBody(quoteId);
    this.emailModalComponent.noteEmailBody = this.emailBodyNote(quoteId);

    const fnc = () => {
      if (typeDoc === 'carrierconfirmation' || typeDoc === 'clientquote') {
        this.emailModalComponent.ccSender = true;
        this.emailModalComponent.ccEmail = 'tl@il2000.com';
      }
      this.emailModalComponent.fromEmailAddress = 'tl@il2000.com';
      this.emailModalComponent.getEmailAttachmentBody();
      $('#emailModalManualQuoteDocumentEmail').modal('show');
    };
    setTimeout(fnc, 1000);
  }

  getQuoteDocument(quoteId: string, typeDoc: any) {
    this.rs.getDocumentFromLambda(quoteId, typeDoc).subscribe({
      next: () => {
        this.emailDocument(quoteId, typeDoc);
      },
      error: () => {
        const title = (typeDoc == 'carrierconfirmation' ? 'Carrier Confirmation Document' :
          typeDoc == 'tnuconfirmation' ? 'TNU Confirmation Document' : 'Client Quote Document');
        Swal.fire(title, '<b><i>Document could not be generated</i></b>', 'warning');
      }
    });
  }

  base64ToBlob(base64String: string) {
    base64String = 'data:application/pdf;base64,' + base64String;
    const byteString = atob(base64String.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'application/pdf'});
  }

  getListBOLNumbers() {
    const BOLs = [];
    if (this.truck()?.shipments){
      for (const shipment of (this.truck()?.shipments ?? [])) {
        BOLs.push(' ' + shipment.shipmentDetail?.bolNumber);
      }
    }
    return BOLs;
  }

  statusEmailBody(quoteId: any) {
    let emailBody = '';
    const origin = this.truck()?.shipments?.[0].shipper ?? null;
    const destination = this.truck()?.shipments?.[(this.truck()?.shipments?.length ?? 0) - 1].consignee ?? null;
    emailBody += '\n' + '____________________________________________________________________________________________' +
      '_________________________________' + '\n' +
      'Truck ID: ' + (this.truck()?.truckID ? this.truck()?.truckID : '') + '\n' +
      'Quote ID: ' + quoteId + '\n' +
      'BOL#s:' +  this.getListBOLNumbers() + '\n' +
      'Ship Date: ' + (this.truck()?.shipDate ? formatDate((this.truck()?.shipDate ?? ''), 'MM/dd/yyyy', 'en', '') : '') + '\n' +
      'Origin: ' + (origin?.city && origin?.state ? origin?.city.toUpperCase() + ', ' + origin?.state + ' ' : '') + '\n' +
      'Destination: ' + (destination?.city && destination?.state ?
        destination?.city.toUpperCase() + ', ' + destination?.state.toUpperCase() + ' ' : '') + '\n\n' +
      'If you have additional questions or requests please contact your Logistics Planner directly at truckload@il2000.com' +
      '\n' + 'or 1-877-373-4525.';
    return emailBody;
  }

  setFormControlValue(value: any, index: any, controlName: string) {
    if (value) { $('#' + controlName + index).removeClass('is-invalid'); }
    this.quotes.at(index).get(controlName)?.setValue(value, {onlySelf: false, emmitEvent: true});
    this.changeEvent.emit(true);
  }

  hideReasonCode(index: any) {
    const sell: string = this.quotes.at(index).get('clientCost')?.value;
    const buy: string = this.quotes.at(index).get('carrierCost')?.value;
    const excRate: string = this.quotes.at(index).get('exchangeRate')?.value;
    $('#reasonCode' + index).removeClass('is-invalid');
    this.quotes.at(index).get('hideReasonCode')?.setValue(true);
    if (this.validateBuyGreaterThanSell(sell, buy, excRate) && this.quotes.at(index).get('assigned')?.value == true) {
      this.quotes.at(index).get('hideReasonCode')?.setValue(false);
      this.validateReasonCode(index);
    } else {
      this.quotes.at(index).get('reasonCode')?.setValue('');
      this.quotes.at(index).get('lostReasonNotes')?.setValue('');
    }
  }

  validateBuyGreaterThanSell(sell: any, buy: any, excRate: any) {
    const response = false;
    if (sell == null || sell.toString() == '') { return response; }
    if (buy == null || buy.toString() == '') { return response; }
    if (excRate == null || excRate.toString() == '') { excRate = 1; }
    const carrierCharge = this.getChargeAmount('carrier');
    const customerCharge = this.getChargeAmount('client');
    const buyValue: number = parseFloat(buy) * excRate;
    if ((buyValue + carrierCharge) > (parseFloat(sell) + customerCharge) && parseFloat(sell) >= 0) { return true; }
    return response;
  }

  validateReasonCode(index: any) {
    const sell: string = this.quotes.at(index).get('clientCost')?.value;
    const buy: string = this.quotes.at(index).get('carrierCost')?.value;
    const excRate: string = this.quotes.at(index).get('exchangeRate')?.value;
    const reason: string = this.quotes.at(index).get('reasonCode')?.value;
    if (this.validateBuyGreaterThanSell(sell, buy, excRate) && (reason == null || reason == '')) {
      $('#reasonCode' + index).addClass('is-invalid');
    }
    return this.validateBuyGreaterThanSell(sell, buy, excRate) && (reason == null || reason == '');
  }

  validateEquipment(index: any) {
    const equipment: string = this.quotes.at(index).get('equipment')?.value;
    if (equipment == null || equipment == '') {
      $('#equipment' + index).addClass('is-invalid');
    } else {
      $('#equipment' + index).removeClass('is-invalid');
    }
  }

  addEvent(index: any) {
    $('#carrier' + index + ' > div > div.dropdown-list > ul.item1 > li > input').on('keypress', (e): any => {
      if (String.fromCharCode(e.which).match(/[^0-9]/g)) { return false; }
    });
    this.appendButtons(index);
  }

  getChargeAmount(type: string) {
    let cc = 0;
    if (this.truck()) {
      this.truck()?.truckFees.forEach((tf: TruckFees) => {
        if (type === 'carrier') {
          cc += parseFloat(tf.amount?.toString() ?? '0');
        }
        if (type === 'client') {
          cc += parseFloat(tf.sellAmount?.toString() ?? '0');
        }
      });
    }
    return cc;
  }

  appendButtons(index: any) {
    if ($('input#btnDOT' + index).length === 0) {

      const btnMC = $('<input/>').attr({
        type: 'button',
        id: 'btnMC' + index,
        class: 'btn btn-sm btn-primary mr-2 mt-2',
        value: 'Search by MC Number'
      });
      $('#carrier' + index + ' > div > div.dropdown-list > ul.item1 > li').append(btnMC);

      const btnDOT = $('<input/>').attr({
        type: 'button',
        id: 'btnDOT' + index,
        class: 'btn btn-sm btn-primary mt-2',
        value: 'Search by DOT Number'
      });
      $('#carrier' + index + ' > div > div.dropdown-list > ul.item1 > li').append(btnDOT);

      let insideThis = this;
      setTimeout(() => {
        $('#btnDOT' + index).on('click', () => {
          if (this.carrierSource === 'MCLEOD') {
            insideThis.searchCarrierFromMcLeod(insideThis.quotes.at(index).get('mcNumber')?.value, index);
          }
          if (this.carrierSource === 'RMIS') {
            insideThis.searchCarrierByDOT(insideThis.quotes.at(index).get('mcNumber')?.value, index);
          }
          $('#rowQuote' + index).trigger('click');
        });

        $('#btnMC' + index).on('click', () => {
          if (this.carrierSource === 'MCLEOD') {
            insideThis.searchCarrierFromMcLeod(insideThis.quotes.at(index).get('mcNumber')?.value, index, 'MC');
          }
          if (this.carrierSource === 'RMIS') {
            insideThis.searchCarrierByMcNumber(insideThis.quotes.at(index).get('mcNumber')?.value, index);
          }
          $('#rowQuote' + index).trigger('click');
        });
      }, 10);
    }
  }

  searchCarrierByDOT(dotNumber: string, index: any) {
    if (dotNumber === '') {
      Swal.fire('Search Carrier', 'Please type DOT Number to search Carrier', 'warning');
      return;
    }
    this.resetCarrierSearchFields();
    this.carrierSource = 'RMIS';
    this.carrierIndex = index;
    this.spinner.show('spinnerManualQuotesForm').then();
    this.quotes.at(index).get('mcNumber')?.setValue('');
    this.cps.getCarrierFromRmisByDOT(dotNumber).subscribe({
      next: response => {
        this.onboardCarrier = true;
        this.newCarrier = true;
        this.spinner.hide('spinnerManualQuotesForm').then();
        if (response.RMISCarrierStatusExpanded.Header.Result === 'SUCCESS') {
          this.carrierMonitoringData = response;
          this.carrierName = this.carrierMonitoringData.RMISCarrierStatusExpanded?.Carrier?.CompanyName;
          this.getCarrier(dotNumber, 'DOT');
        } else {
          this.quotes.at(index).get('mcNumber')?.setValue('');
          this.prequalifyCarrier(dotNumber, 'DOT');
        }
      },
      error: e => {
        this.spinner.hide('spinnerManualQuotesForm').then();
        Swal.fire('Search Carrier', 'Unable to get Carrier info. ' + (e ? e : ''), 'warning');
        return;
      }
    });
  }

  removeButtons() {
    if ($('input[id^=\'btnMC\']').length > 0) {
      $('input[id^=\'btnMC\']').remove();
      $('input[id^=\'btnDOT\']').remove();
    }
  }

  onMailSent() {
    this.emailSent.emit(true);
  }

  emailBodyNote(quoteId: any) {
    const origin = this.truck()?.shipments?.[0].shipper ?? null;
    const destination = this.truck()?.shipments?.[(this.truck()?.shipments?.length ?? 0) - 1].consignee ?? null;
    let messageBody = 'Truck ID: ' + (this.truck()?.truckID ? this.truck()?.truckID : '') + '. ' +
      'Quote ID: ' + quoteId + '. ' +
      'BOL#s:' +  this.getListBOLNumbers() + '. ' +
      'Ship Date: ' + (this.truck()?.shipDate ? formatDate((this.truck()?.shipDate ?? ''), 'MM/dd/yyyy', 'en', '') : '') + '. ' +
      'Origin: ' + (origin?.city && origin?.state ?
        origin?.city.toUpperCase() + ', ' + origin?.state + ' ' : '') + '. ' +
      'Destination: ' + (destination?.city && destination?.state ?
        destination?.city.toUpperCase() + ', ' + destination?.state.toUpperCase() + ' ' : '') + '. ';

    if (this.selectedManualDocument == 'carrierconfirmation' && this.truck()?.tlQuotes) {
      for (const tlQuote of (this.truck()?.tlQuotes ?? [])) {
        if (tlQuote.assigned == true) { messageBody += 'Carrier Rate: ' + (tlQuote.carrierCost ? tlQuote.carrierCost : '') + '.'; }
      }
    }
    return messageBody;
  }

  changeCurrency(index: number, value: any, defaultCurrency = false) {
    this.quotes.at(index).get('currencyID')?.setValue(value);
    if (defaultCurrency) { this.quotes.at(index).get('defaultCurrencyID')?.setValue(value); }
    this.carCurrencyType.set(value == 2 ? 'CAD' : 'USD');
    this.changeEvent.emit(true);
  }

  fetchRateAndCalculate(index: number) {
    let sell = 0;
    let exchangeRate = 1;
    const clientCur = this.currencyType();
    const carrierCur = this.quotes.at(index).get('currencyID')?.value == 2 ? 'CAD' : 'USD';

    const fn = () => {
      sell = this.calculateCost(index, exchangeRate);
      this.showExchangeInfoDiv(index);
      this.quotes.at(index).get('clientCost')?.setValue(sell);
      this.changeEvent.emit(true);
      this.hideReasonCode(index);
    };

    const fnEmpty = () => {
      this.quotes.at(index).get('exchangeRate')?.setValue(1);
      this.quotes.at(index).get('rateDate')?.setValue('');
      this.quotes.at(index).get('exchangeInfo')?.setValue('');
    };

    if (clientCur && carrierCur && clientCur != carrierCur) {
      this.spinner.show('spinnerManualQuotesForm').then();
      this.ffs.getExchangeRate(carrierCur, clientCur).subscribe({
        next: response => {
          this.spinner.hide('spinnerManualQuotesForm').then();
          if (response?.result) {
            exchangeRate = response.result[clientCur];
            this.quotes.at(index).get('exchangeRate')?.setValue(exchangeRate);
            this.quotes.at(index).get('rateDate')?.setValue(response?.updated);
            this.quotes.at(index).get('exchangeInfo')?.setValue(JSON.stringify(response));
          }
          fn();
        },
        error: e => {
          fnEmpty();
          fn();
          this.spinner.hide('spinnerManualQuotesForm').then();
          Swal.fire('Calculate Client Cost', 'Unable to get exchange rate. ' + (e ? e : ''), 'warning');
        }
      });
    } else {
      fnEmpty();
      fn();
    }
  }

  calculateCost(index: any, exchangeRate: number) {
    const markup: any = $('#markup' + index).val();
    const buy = this.quotes.at(index).get('carrierCost')?.value;
    return buy * (1 + markup / 100) * exchangeRate;
  }

  enableCalculateBtn(index: any) {
    let enableBtn = false;
    if (this.disabled() || this.quotes.at(index).get('carrierCost')?.value == null ||
      this.quotes.at(index).get('carrierCost')?.value == '' || $('#markup' + index).val() == '') { enableBtn = true; }
    return enableBtn;
  }

  showExchangeInfoDiv(index: string | number, show= true) {
    $('#exchangeInfoDiv' + index).removeClass((show  ? 'd-none' : 'd-block'));
    $('#exchangeInfoDiv' + index).addClass((show  ? 'd-block' : 'd-none'));
  }

  setCarrierCurrency(index: number) {
    return this.quotes.at(index).get('currencyID')?.value ?
      (this.quotes.at(index).get('currencyID')?.value == 2 ? 'CAD' : 'USD') : this.carCurrencyType();
  }

  getCarrierFn(id: number | null) {
    let val: CarrierDetail | any = null;
    for (const carrier of this.carrierList) {
      if (carrier.carrierID == id) {
        val = carrier;
        break;
      }
    }
    return val;
  }

  resetCarrierSearchFields() {
    this.carrierMonitoringData = null;
    this.carrierInfo = null;
    this.onboardCarrier = false;
    this.newCarrier = false;
    this.modalNetwotkTT = false;
    this.carrierCertified = false;
    this.certificationVerified = null;
    this.mcNumber = null;
    this.dotNumber = null;
  }

  searchCarrierFromMcLeod(carrierNumber: string, index: any, typeNumber = 'DOT') {
    if (carrierNumber === '') {
      Swal.fire('Search Carrier', 'Please type MC or DOT Number to search for a Carrier', 'warning');
      return;
    }
    this.resetCarrierSearchFields();
    this.carrierSource = 'MCLEOD';
    this.carrierIndex = index;
    this.spinner.show('spinnerManualQuotesForm').then();
    this.quotes.at(index).get('mcNumber')?.setValue('');
    this.quotes.at(index).get('dotNumber')?.setValue('');
    this.cps.searchCarrier(carrierNumber, typeNumber).subscribe({
      next: response => {
        this.onboardCarrier = true;
        this.newCarrier = true;
        this.spinner.hide('spinnerManualQuotesForm').then();
        if (response && response.payee) {
          this.carrierMonitoringData = response;
          this.carrierName = Array.isArray(response.payee) ? response.payee[0]['@name'] : response.payee['@name'];
          this.getCarrier(carrierNumber, typeNumber);
        } else {
          this.quotes.at(index).get('dotNumber')?.setValue('');
          Swal.fire('Search Carrier', 'Carrier with ' + typeNumber + ' Number <b>' + carrierNumber + '</b> Not found.', 'warning');
        }
      },
      error: e => {
        this.spinner.hide('spinnerManualQuotesForm').then();
        Swal.fire('Search Carrier', 'Unable to get Carrier info. ' + (e ? e : ''), 'warning');
        return;
      }
    });
  }

  validatingCarrierMcLeod(data: CarrierMcLeodResponse) {
    // Highway_id_number is not null AND Highway_status = 'O' AND
    // Highway_rule_assessment is either 'P' or 'A' AND
    // no_dispatch is 'N' AND
    // drs_payee.perform_rating is null
    let carrierFlag = true;
    const payee: Payee = Array.isArray(data.payee) ? data.payee[0] : data.payee;
    const dotInfo = payee.drs_payee;
    if (dotInfo['@highway_id_number'] && dotInfo['@highway_id_number'] !== '' && dotInfo['@highway_status'] === 'O') {
    } else {
      console.log('highway_status flag', dotInfo['@highway_status']);
      carrierFlag = false;
    }
    if (dotInfo['@highway_rule_assessment'] &&
      (dotInfo['@highway_rule_assessment'] === 'P' || dotInfo['@highway_rule_assessment'] === 'A')) {
    } else {
      console.log('highway_rule_assessment flag', dotInfo['@highway_rule_assessment'] );
      carrierFlag = false;
    }
    if (dotInfo['@no_dispatch'] && dotInfo['@no_dispatch'] === 'N') {
    } else {
      console.log('no_dispatch flag', dotInfo['@no_dispatch']);
      carrierFlag = false;
    }
    if (dotInfo['@perform_rating'] && dotInfo['@perform_rating'] !== '') {
      console.log('perform_rating flag', dotInfo['@perform_rating'] );
      carrierFlag = false;
    }
    return carrierFlag;
  }

  validatingCarrierExceptionMcleod(data: CarrierMcLeodResponse, index: number) {
    const payee: Payee = Array.isArray(data.payee) ? data.payee[0] : data.payee;
    this.carrierNameException = payee['@name'];
    this.mcNumberException = payee.drs_payee['@icc_number'];
    this.flagCerticateInsurance = false;
    this.flagCarrierCerticated = false; // there are no fields to validate is certified
    this.flagSafetyRating = false;
    this.flagMonthsInService = false;
    this.carrierIndexException = -1;

    if (payee.drs_payee['@cargo_ins_on_file'] === 'N' || payee.drs_payee['@cargo_ins_amount'] === '' ||
      parseFloat(payee.drs_payee['@cargo_ins_amount']) === 0) {
      this.flagCerticateInsurance = true;
    }

    if (payee.drs_payee['@safety_rating'].toUpperCase() !== 'N' &&
      payee.drs_payee['@safety_rating'].toUpperCase() !== 'S') { this.flagSafetyRating = true; }

    if (payee.drs_payee['@contract_auth_grant_date']) {
      const authGrantDt = payee.drs_payee['@contract_auth_grant_date'].substring(0, 8);
      const grantDate = moment(authGrantDt, 'YYYYMMDD').add(6, 'months');
      if (grantDate > moment()) { this.flagMonthsInService = true; }
    } else if (payee.drs_payee['@common_auth_grant_date']) {
      const authGrantDt = payee.drs_payee['@common_auth_grant_date'].substring(0, 8);
      const grantDate = moment(authGrantDt, 'YYYYMMDD').add(6, 'months');
      if (grantDate > moment()) { this.flagMonthsInService = true; }
    } else {
      this.flagMonthsInService = true;
    }

    if (this.flagSafetyRating || this.flagMonthsInService || this.flagCerticateInsurance || this.flagCarrierCerticated) {
      this.carrierIndexException = index;
      $('#missingExceptionModal').modal('show');
    }
  }

  getCarrier(carrierNumber: string, typeNumber: string) {
    this.cps.getCarrier(carrierNumber, typeNumber).subscribe({
      next: resp => {
        this.modalNetwotkTT = resp.inNetworkTT;
        this.carrierCertified = resp?.isCertified;
        this.certificationVerified = resp?.certificationVerified;
        $('#carrierMonitoringModal').modal('show');
      },
      error: () => {
        $('#carrierMonitoringModal').modal('show');
      }
    });
  }

  resetCarrierValues(index: number) {
    this.quotes.at(index).get('selected')?.setValue([]);
    this.quotes.at(index).get('carrierID')?.setValue('');
    this.quotes.at(index).get('carrierName')?.setValue('');
    this.quotes.at(index).get('mcNumber')?.setValue('');
    this.quotes.at(index).get('dotNumber')?.setValue('');
  }

  onboardedCarrierList(carriers: any) {
    for (const carrier of carriers) {
      this.carrierList.push(carrier);
      const mcNumber = carrier.mcNumber ? 'MC: #' + carrier.mcNumber + '. ' : '';
      const dotNumber = carrier.dotNumber ? 'DOT: #' + carrier.dotNumber : '';
      const descNumbers = mcNumber + dotNumber;
      this.dropdownList.push(
        {
          item: carrier.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''),
          value: carrier.carrierID.toString()
        });
    }
    this.spinner.hide('spinnerManualQuotesForm').then();
    this.loadComplete.emit(true);
  }
}
