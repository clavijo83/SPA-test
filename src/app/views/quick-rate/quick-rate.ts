import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LineItemComponent} from '../../components/line-item/line-item';
import {RatesGrid} from '../../components/rates-grid/rates-grid';
import {Constants} from '../../constants/constants';
import {ClientDropdown} from '../../components/client-dropdown/client-dropdown';
import {GroupInfo} from '../../interfaces/group-info';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {Product} from '../../interfaces/product';
import {DataTable} from '../../components/data-table/data-table';
import {Customization} from '../../interfaces/customization';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {TrackingService} from '../../services/tracking/tracking.service';
import {CarrierProfilingService} from '../../services/carrier-profiling/carrier-profiling.service';
import {formatDate} from '@angular/common';
import {Global} from '../../common/global';
import Swal from 'sweetalert2';
import {DownloadService} from '../../services/download/download.service';
import {UtilityService} from '../../services/utility/utility.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-quick-rate',
  standalone: false,
  templateUrl: './quick-rate.html',
  styleUrl: './quick-rate.css',
})
export class QuickRate implements OnInit, OnDestroy, AfterViewInit {
  public hideBtns = false;
  @ViewChild(DataTable) dt!: DataTable;
  public ratesForm!: FormGroup;
  public hideRates = true;
  public disableRateBtn = true;
  public pickupDropdown!: any[];
  public deliveryDropdown!: any[];
  public clientPlantID!: number;
  public clientPlantOriginZip!: string | null;
  public clientPlantRequireDimensions = false;
  classesToAdd: WritableSignal<number[]> = signal([]);
  public clientPlantPPA = '';
  public clientPlantPPAAdjustment = -1;
  public activeFees: any[] = [];
  public todayDate = new Date();
  public shipDate = formatDate(this.todayDate, 'yyyy-MM-dd', 'en');
  public customizations: Customization[] = [] as Customization[];
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  @ViewChild(ClientDropdown) clientDropdown!: ClientDropdown;
  @ViewChild(LineItemComponent) lineItem!: LineItemComponent | null;
  @ViewChild(RatesGrid) rateGrid!: RatesGrid;
  lastOriZip: any;
  lastDestZip: any;
  dropdownSettings!: IDropdownSettings;
  showProducts = false;
  productList: WritableSignal<Product[]> = signal([]);
  productButtonLabel = 'Show Product List';
  public productColumns = [
    {
      title: 'Description',
      data: 'description',
      orderable: true,
      className: 'text-left'
    },
    {
      title: 'Class',
      data: 'productClass',
      orderable: true
    },
    {
      title: 'NMFC',
      data: 'nmfc',
      orderable: true
    },
  ];
  // Accessorial Charges
  public clientCode = '';
  public groupInfo!: GroupInfo;
  public client = '';
  public rateLineItems: any[] = [];
  originCity = '';
  originState = '';
  destinationCity = '';
  destinationState = '';
  global = Global;
  quoteReference = '';
  private quickRates$: any;

  constructor(private fb: FormBuilder, private igs: InternalGroupService, private ts: TrackingService, private ds: DownloadService,
              private cps: CarrierProfilingService, private us: UtilityService) {
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === 'Return') && !this.disableRateBtn) {
      this.onRetrieveRatesClick();
    }
  }

  ngOnInit() {
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    const carrierData = availableCarriers ? JSON.parse(availableCarriers) : null;
    this.pickupDropdown = Constants.QUICK_RATE_PICKUP_ACCESSORIALS_LTL;
    this.deliveryDropdown = Constants.QUICK_RATE_DELIVERY_ACCESSORIALS_LTL;

    this.ratesForm = this.fb.group({
      originZip: ['', Validators.required],
      destinationZip: ['', Validators.required],
      deliveryAcc: [''],
      pickupAcc: [''],
      documentKey: ['']
    });

    this.quickRates$ = this.ratesForm.valueChanges.subscribe(value => {
      this.quoteReference = '';
      if (value?.lineItemsForm) {
        this.showRetrieveAndClearBtn();
      }

      if (value.originZip != '' && value.originZip != null && value.destinationZip != '' && value.destinationZip != null &&
        value.originZip.toString().length > 4 && value.destinationZip.toString().length > 4) {
        if (this.lastOriZip != value.originZip || this.lastDestZip != value.destinationZip) {
          this.setCityStateByZip(value.originZip, 'origin');
          this.setCityStateByZip(value.destinationZip, 'destination');
          this.lastOriZip = value.originZip;
          this.lastDestZip = value.destinationZip;
          this.lineItem?.setMileage(value.originZip, value.destinationZip);
        }
      }

      // Make sure we supply values for rate request;
      this.chkFormValues(value.lineItemsForm?.lineItems[0], value.originZip, value.destinationZip);
    });

    // Set the client plant default origin zip
    if (this.clientPlantOriginZip != null) {
      this.ratesForm.get('originZip')?.setValue(this.clientPlantOriginZip);
    }

    this.getCarrierList(carrierData);

    // initiate dropdown settings. Warning: First initialize dropdown data and then dropdown settings
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'chtID',
      textField: 'chtDescription',
      itemsShowLimit: 5,
      allowSearchFilter: true,
      enableCheckAll: false
    };
  }

  ngAfterViewInit() {
    this.ratesForm.addControl('lineItemsForm', this.lineItem?.lineItemForm);
    this.lineItem?.lineItemForm.setParent(this.ratesForm);

    // TODO: Child components accessible here
    this.clientPlantID = this.clientDropdown.groupInfo.groupID;

    this.clientPlantOriginZip = this.clientDropdown.groupInfo.zip;
    this.ratesForm.get('originZip')?.setValue(this.clientPlantOriginZip);
    this.dt.rerender();
  }

  getCarrierList(carriersData: CarrierDetail[], fn: any = null) {
    if (carriersData && carriersData.length > 0) {
      for (const carrier of carriersData) {
        this.carrierList.push(carrier);
      }
      if (typeof fn === 'function') { fn(); }
    } else {
      this.cps.getAvailableCarriers().subscribe({
        next: response => {
          for (const carrier of response) {
            this.carrierList.push(carrier);
          }
        },
        complete: () => {
          if (typeof fn === 'function') {
            fn();
          }
        }
      });
    }
  }

  onClearClick() {
    this.quoteReference = '';
    this.ratesForm.reset();
    this.lineItem?.lineItems.clear();
    this.ratesForm.get('originZip')?.setValue('');
    this.ratesForm.get('destinationZip')?.setValue('');
    this.ratesForm.get('deliveryAcc')?.setValue('');
    this.ratesForm.get('pickupAcc')?.setValue('');
    this.ratesForm.get('documentKey')?.setValue('');
    this.lineItem?.lineItems.push(this.lineItem.getLineItem());
    if (this.lineItem) this.lineItem.mileage = 0;
    this.hideRates = true;
    this.disableRateBtn = true;
    this.activeFees = [];
    this.us.accessorialType = [];
    this.clearClassesToAdd();
  }

  addLineItems() {
    this.lineItem?.lineItems.push(this.lineItem.getLineItem());
  }

  addFee(event: any, type: string) {
    this.us.accessorialType.push({chtID: event.chtID, Type: type});
    this.activeFees.push(event.chtID);
  }

  findIndex(chtID: any, type: any) {
    let ind = 0;
    for (const value in this.us.accessorialType) {
      if (this.us.accessorialType[value].chtID === chtID && this.us.accessorialType[value].Type == type) {
        return ind;
      }
      ind += 1;
    }
    return -1;
  }

  removeFee(event: any, type: any) {
    const index = this.findIndex(event.chtID, type);
    if (index > -1) {
      this.activeFees.splice(index, 1);
      this.us.accessorialType.splice(index, 1);
    }
  }

  onRetrieveRatesClick() {
    this.todayDate = new Date();
    if (!this.ratesForm.valid) {
      this.quoteReference = '';
      document.getElementById('quickRateForm')?.classList.add('was-validated');
      return;
    }
    this.quoteReference = formatDate(this.todayDate, 'yyyyMMddHHmmss', 'en');
    // SEND IT FORM DATA TO RATER GRID TO POPULATE RATE TABLE
    this.hideRates = false;
    this.rateGrid.onfetchRatesClicked();
    // Hide Retrieve Rates and Clear Button on Retrieve Rates Click
    this.hideRetrieveAndClearBtn();
  }

  chkFormValues(lineItem: any, fromZip: string | null, toZip: string | null) {
    let validDimensions = true;
    if (this.clientPlantRequireDimensions) {
      if (
        lineItem?.height == '' || lineItem?.height == null || lineItem?.height <= 0 ||
        lineItem?.length == '' || lineItem?.length == null || lineItem?.length <= 0 ||
        lineItem?.width == '' || lineItem?.width == null || lineItem?.width <= 0) {
        validDimensions = false;
      }
    }

    this.disableRateBtn = !(fromZip != '' && fromZip != null && toZip != '' && toZip != null &&
      lineItem?.classNumber != '' && lineItem?.classNumber != null &&
      lineItem?.unitNumber != '' && lineItem?.unitNumber != null &&
      lineItem?.unitWeight != '' && lineItem?.unitWeight != null &&
      lineItem?.unitWeightTotal != '' && lineItem?.unitWeightTotal != null &&
      (this.lineItem?.mileage ?? 0) > 0 &&
      fromZip.toString().length >= 4
      && toZip.toString().length >= 4 && lineItem?.classNumber >= 50 && lineItem?.classNumber <= 500
      && lineItem?.unitNumber > 0 && lineItem?.unitWeight > 0 && validDimensions);
  }

  ngOnDestroy(): void {
    // Remember to unsubscribe to the event
    this.quickRates$.unsubscribe();
  }

  // When a client plant is selected, use (this.clientDropdown.groupInfo) to collect any information needed
  groupEventHandler($event: GroupInfo) {
    this.ratesForm.get('originZip')?.setValue($event.zip);
    this.clientPlantID = $event.tiberID;
    this.clientCode = $event.clientCode; // this.clientDropdown.groupInfo.clientCode;
    this.client = this.clientDropdown?.currentClient;
    this.groupInfo = $event;
    this.getProductList($event.groupID);
    this.getGroupCustomizations($event.groupID);
  }

  clickEventHandler(event: any) {
    this.classesToAdd.update(items => [...items, event.productClass]);
  }

  clearClassesToAdd() {
    this.classesToAdd.set([]);
    $('table.dataTable tbody tr.selected').removeClass('selected');
  }

  confirmFromProductList() {
    this.lineItem?.setClasses(this.classesToAdd());
    this.classesToAdd.set([]);
  }

  getGroupCustomizations(groupID: number) {
    this.clientPlantRequireDimensions = false;
    this.clientPlantPPA = '';
    this.clientPlantPPAAdjustment = -1;
    this.igs.getGroupCustomizations(groupID).subscribe({
      next: response => {
        this.customizations.length = 0;
        for (const customization of response as Customization[]) {
          this.customizations.push(customization);
          if (customization.customizationID === 48) {
            this.clientPlantRequireDimensions = true;
          }
          if (customization.customizationID === 30) {
            if (customization.intValue === 3) {
              this.clientPlantPPA = 'NET_RATE_MARKUP';
            } else if (customization.intValue === 1) {
              this.clientPlantPPA = 'GROSS_RATE_DISCOUNT';
            }
          }
          if (customization.customizationID === 26) {
            this.clientPlantPPAAdjustment = customization.intValue;
          }
        }
      }
    });
  }

  getProductList(groupID: number) {
    this.productList.set([]);
    this.igs.getProductList(groupID).subscribe({
      next: response => {
        for (const product of response) {
          this.productList.update(items => [...items, product]);
        }
        this.dt.rerender();
      }
    });
  }

  toggleProductList() {
    if (this.showProducts) {
      this.productButtonLabel = 'Show Product List';
    } else {
      this.productButtonLabel = 'Hide Product List';
    }
    this.showProducts = !this.showProducts;
  }

  showRetrieveAndClearBtn() {
    this.hideBtns = false;
  }

  hideRetrieveAndClearBtn() {
    this.hideBtns = true;
  }

  // NEEDED FOR MULTI SELECT FLOATING LABEL
  checkMultiSelectValues(elementName: string, arrayLength: number) {
    if (arrayLength !== 0) {
      $(elementName).removeAttr('hidden');
    } else {
      $(elementName).attr('hidden', 'true');
    }
  }

  getLineItems(lineItem: any[]) {
    this.rateLineItems = [];
    lineItem.forEach(value => {
        this.rateLineItems.push({
          productDescription: '-',
          unitType: '',
          freightClass: value.classNumber,
          handlingUnits: value.unitNumber,
          length: value.length?.toString(),
          width: value.width?.toString(),
          height: value.height?.toString(),
          totalWeight: value.unitWeightTotal,
          stackable: value.stackChk
        });
      }
    );
  }

  setCityStateByZip(zip: string, value: string) {
    this.ts.getCityStateByZip(zip, 'USA').subscribe(
      (response: { city: string; state: string; }) => {
        if (value === 'origin') {
          this.originCity = response.city;
          this.originState = response.state;
        } else if (value === 'destination') {
          this.destinationCity = response.city;
          this.destinationState = response.state;
        }
      },
      () => {
        if (value === 'origin') {
          this.originCity = '';
          this.originState = '';
        } else if (value === 'destination') {
          this.destinationCity = '';
          this.destinationState = '';
        }
      }
    );
  }

  disableSearchButton() {
    if (this.ratesForm.get('documentKey')?.value !== '') { return false; }
    return !this.clientCode || this.ratesForm.get('originZip')?.value == '' || this.ratesForm.get('destinationZip')?.value == '';
  }

  onSearchClick() {
    if (this.ratesForm.get('documentKey')?.value !== '') {
      let splitPath = this.ratesForm.get('documentKey')?.value.split('/');
      if (splitPath.length > 1) {
        let ref = splitPath[splitPath.length - 1];
        ref = ref.toUpperCase();
        splitPath.pop();
        let path = splitPath.join('/') + '/';
        path = path.toUpperCase();
        this.ds.retrieveDocument(ref, 'QR', 'pdf', 'LTL', 'quick-rates', path).subscribe({
          next: (resp) => {
            this.ratesForm.get('documentKey')?.setValue('');
            setTimeout(() => {
              window.open(resp.fileStream.inputStream.httpRequest.uri, '_blank', 'fullscreen=yes');
            }, 100);
          },
          error: () => {
            Swal.fire('', 'Quote not found', 'warning');
          }
        });
      } else {
        Swal.fire('', 'Please type a valid document key', 'warning');
      }
    } else {
      Swal.fire({
        title: 'Enter your Quote Reference Number',
        icon: 'question',
        input: 'text',
        confirmButtonText: 'Search Quote',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        inputLabel: 'Quote reference number',
        showCancelButton: true,
        inputValidator: (value): any => {
          if (!value) {
            return 'You need to type a Quote reference number!';
          } else {
            const path = this.clientCode + '/' + this.ratesForm.get('originZip')?.value + '/' +
              this.ratesForm.get('destinationZip')?.value + '/';
            this.ds.retrieveDocument(value, 'QR', 'pdf', 'LTL', 'quick-rates', path).subscribe({
              next: (resp) => {
                this.ratesForm.get('documentKey')?.setValue('');
                setTimeout(() => {
                  window.open(resp.fileStream.input.httpRequest.uri, '_blank', 'fullscreen=yes');
                }, 100);
              },
              error: () => {
                Swal.fire('', 'Quote not found', 'warning');
              }
            });
          }
        }
      });
    }
  }

  uppercaseZipcode(controlName: string) {
    const zipcode = this.ratesForm.get(controlName)?.value;
    if (zipcode && zipcode !== '') {
      this.ratesForm.get(controlName)?.setValue(zipcode.toString().toUpperCase());
    }
  }
}

