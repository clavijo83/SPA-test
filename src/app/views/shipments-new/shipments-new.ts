import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FreightForm} from '../../components/freight-form/freight-form';
import {Constants} from '../../constants/constants';
import {formatDate} from '@angular/common';
import {ReferenceFieldComponent} from '../../components/reference-field/reference-field';
import {ClientDropdown} from '../../components/client-dropdown/client-dropdown';
import {RatesGrid} from '../../components/rates-grid/rates-grid';
import {GroupInfo} from '../../interfaces/group-info';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {Product} from '../../interfaces/product';
import {DataTable} from '../../components/data-table/data-table';
import {ReportsService} from '../../services/reports/reports.service';
import {ShiConDropdown} from '../../interfaces/shi-con-dropdown';
import {ShippersConsignees} from '../../interfaces/shippers-consignees';
import {FullLocation} from '../../interfaces/full-location';
import {Customization} from '../../interfaces/customization';
import {TrackingService} from '../../services/tracking/tracking.service';
import {BillTo} from '../../interfaces/bill-to';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '../../interfaces/location';
import {ShipmentDetails} from '../../interfaces/shipment-details';
import {LineItem} from '../../interfaces/line-item';
import {TruckFees} from '../../interfaces/truck-fees';
import {ShipmentSave} from '../../interfaces/shipment-save';
import {ShipmentSaveService} from '../../services/shipment-save/shipment-save.service';
import {Email} from '../../interfaces/email';
import {EmailService} from '../../services/email/email.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {Client} from '../../interfaces/client';
import {UserDetail} from '../../interfaces/user-detail';
import {CarrierDetail} from '../../interfaces/carrier-detail';
import {Note} from '../../interfaces/note';
import {TruckloadRate} from '../../interfaces/truckload-rate';
import {ManualQuotes} from '../../components/manual-quotes/manual-quotes';
import {CarrierProfilingService} from '../../services/carrier-profiling/carrier-profiling.service';
import {ManualQuote, TLManualQuote} from '../../interfaces/manual-quote';
import {LoadBoardService} from '../../services/loadboard/loadboard.service';
import Swal from 'sweetalert2';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {Global} from '../../common/global';
import {TruckSave} from '../../interfaces/truck-save';
import {TruckSaveService} from '../../services/truck-save/truck-save.service';
import {RateType} from '../../interfaces/rate-type';
import {ActiveNotesView} from '../../components/active-notes-view/active-notes-view';
import moment from 'moment';
import {ReferenceField} from '../../interfaces/reference-field';
import {FreightTotals} from '../../components/freight-totals/freight-totals';
import {TypeAheadDropDown} from '../../components/type-ahead-drop-down/type-ahead-drop-down';
import {AccessorialsComponent} from '../../components/accessorials/accessorials';
import {MileageService} from '../../services/mileage/mileage.service';
import {UtilityService} from '../../services/utility/utility.service';
import {GroupsService} from '../../services/groups/groups.service';
import {ModeDropdown} from '../../interfaces/dropdown';
import * as momentTimezone from 'moment-timezone';
import {TruckerToolsService} from '../../services/TruckerTools/trucker-tools.service';
import {RateGrid} from '../../interfaces/rate-grid';
import {TrackingContacts} from '../../interfaces/tracking-contacts';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import * as zipToTimezone from 'zipcode-to-timezone';

@Component({
  selector: 'app-shipments-new',
  standalone: false,
  templateUrl: './shipments-new.html',
  styleUrl: './shipments-new.css',
})
export class ShipmentsNew implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild('freightForm') freight!: FreightForm;
  @ViewChild(FreightForm) freightStop!: FreightForm;
  @ViewChild(FreightTotals) freightTotals!: FreightTotals;
  @ViewChild(ReferenceFieldComponent) reference!: ReferenceFieldComponent;
  @ViewChild(ActiveNotesView) notes!: ActiveNotesView;
  @ViewChild(ManualQuotes) quotes!: ManualQuotes;
  @ViewChild(ClientDropdown) clientDropdown!: ClientDropdown;
  @ViewChild(RatesGrid) rateGrid!: RatesGrid;
  @ViewChild(DataTable) dt!: DataTable;
  @ViewChild('shipperPlant') shipperPlantDropDown!: TypeAheadDropDown;
  @ViewChild('consigneePlant') consigneePlantDropDown!: TypeAheadDropDown;
  @ViewChild(AccessorialsComponent) truckCharges!: AccessorialsComponent;
  @Input() disabledEditAsClone = false; // decorate the property with @Input()
  newShipmentForm!: FormGroup;
  clientPlantSelected = false;
  dropdownSettings = {};
  clientPlantID: any;
  clients: any = [];
  shipmentType: 'LTL' | 'Truckload' | 'Truckload Edit' | any = 'LTL';
  rateRequest: any = {};
  shipDate: string | null = null;
  preSelectedRate: any;
  rateSet = false;
  lineItems: LineItem[] = [] as LineItem[];
  truckFees: TruckFees[] = [] as TruckFees[];
  editLineItems: LineItem[] = [];
  editShipperAndConsignee: any;
  oldOpenReferenceFields: any[] = [];
  rates: any;
  groupInfo: GroupInfo = {} as GroupInfo;
  public hideRatesComponent = false;
  public multiStopTimezoneLabel: any[] = [];
  public multiStopTimezone: any[] = [];
  public activeFees: string[] = [] as string[];
  public clientPlantPPA: string | null = null;
  public clientPlantPPAAdjustment: number | null = null;
  public multiStopRequired = false;
  shipmentDetail: ShipmentDetails | null = null;
  client: Client | null = null;
  userDetail: UserDetail | null = null;
  carrierDetail: CarrierDetail | null = null;
  shipper: Location | null = null;
  consignee: Location | null = null;
  selectedBillTo: BillTo | null = null;
  negotiationType: any = null;
  billTo: BillTo[] = [] as BillTo[];
  shipment: ShipmentSave | null = null;
  showNonDirectPoints = false;
  // Accessorial Charges
  public pickupDropdown: any[] = [];
  public deliveryDropdown: any[] = [];
  charges: any[] = [];
  totalShipment = 0;
  // tz = require('zipcode-to-timezone'); // Use timezone.lookup(zip) to get timezone
  specialInstructionText = '';
  // Observable Variables
  shipmentDateValueChange$: any;
  lineItemValueChanges$: any;
  shipperZipValueChange$: any;
  consigneeZipValueChange$: any;
  currentClient = '';
  currentGroupName = '';
  currentGroupID: number | null = null;
  pickupAppointmentStartSet = false;
  pickupAppointmentStopSet = false;
  deliveryAppointmentStartSet = false;
  deliveryAppointmentStopSet = false;
  isValidCreateBOL = false;
  disableEdit = false;
  disableBlanket = false;
  disableBillingTerm = false;
  showMultiStopFields = false;
  public customizations: Customization[] = [] as Customization[];
  public minDate: string | null = null;
  shipmentID: any;
  public rateRequestLineItems: any[] = [];
  public stopsLineItems: any[] = [];
  isFromQuickRates = false;
  // Client
  productList: Product[] = [] as Product[];
  noteList: any[] = [] as any[];
  clientPlantRequireDimensions = false;
  clientPlantAllowMABDInput = false;
  // Shipper, Consignee and Billto
  shipperDropdown: ShiConDropdown[] = [];
  consigneeDropdown: ShiConDropdown[] = [];
  shipperPlantsDropdown: FullLocation[] = [];
  timezonesLoaded = false;
  consigneePlantsDropdown: FullLocation[] = [];
  billToDropdown: string[] = [];
  isInternalManagement = false;
  isInternalUser = false;
  targetRate: TruckloadRate | null = null;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  clientHideSuggestedClass = false;
  tlQuotes: TLManualQuote[] = [] as TLManualQuote[];
  preSelectedCarrierID: string | null = null;
  preSelectedCarrierName: string | null = null;
  global = Global;
  truckID: any;
  truck: TruckSave | null = null;
  customRates: ManualQuote[] = [] as ManualQuote[];
  stateList: any[] = Constants.STATE_DROPDOWN;
  countryList: any[] = Constants.COUNTRY_DROPDOWN;
  isAppointmentRequired = false;
  isAppointmentSet = false;
  showCorrectedBolWarining = false;
  formattedShipDate: any;
  poMoniker = 'PO #';
  shipmentEdited = false;
  shipmentEditedCount = 0;
  showInsuranceField = false;
  bookShipment = false;
  quotesDetails = false;
  accessorialsDetails = false;
  Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  private userName = '';
  private currentDate = new Date();
  private userEmail = '';
  private isTruckloadShipment: any;
  pickupAppointmentStart: string | null = null;
  pickupAppointmentStop: string | null = null;
  deliveryAppointmentStart: string | null = null;
  deliveryAppointmentStop: string | null = null;
  deliveryAssessorialListSection = false;
  whiteglovetier = false;
  whiteGloveFloorTier = false;
  consigneeRecipientFloor: string[] = [];
  consigneeRecipientElevator: string[] = [];
  crtier: string[] = [];
  whiteGlove: any;
  trackingContacts: TrackingContacts[] | any = [];
  consigneeTier: any[] = [];
  consigneeFloor: any[] = [];
  consigneeElevator: any[] = [];
  deliveryWindowEnd: any;
  recipientNamecheck: any = false;
  deliveryInstructions: any = false;
  consigneeTierChick: any = false;
  deliveryWindowEndcheck: any = false;
  deliveryWindowStartcheck: any = false;
  telephoneCheck: any = false;
  emailCheck: any = false;
  floorCheck: any = false;
  requiredForBOL = false;
  carrierOnboarded = false;
  carrierOnboardedNotes: any[] = [];
  clientTimeZone: string | null  = '';
  consigneeTimeZone: string | null  = '';
  clientTimeZoneName: any = '';
  consigneeTimeZoneName: any = '';
  shipperConsigneeData: any;
  groupCustomization: any;
  carrierCharge = 0;
  customerCharge = 0;
  oldTruckFees: TruckFees[] = [];
  quoteAssigned = false;
  carrierQuoteAssigned: string | null = null;
  selectedQuoteID: string | null = null;
  disabledPriority = false;
  oldShipmentType: any;
  newShipmentType: any;
  showCheckInsuranceAmount = false;
  modesDropdown: ModeDropdown[] | null = null;
  quoteSelected: any = null;
  quotesNotUsed: TLManualQuote[] = [];
  flagTruckNotUsed = false;
  truckNotUsedNote = '';
  public isShipmentEdit = false;
  rateSelected: ManualQuote | null = null;
  canadianTimezone: any;
  shoLccExceptionReason = false;
  allRates: any[] = [];
  exceptionCodeLccReq: string | null = null;
  checkForLeasCostCarrier = false;
  hasCustomizationID78 = false;
  hasCustomizationID80 = false;
  selectedQuoteDeselected = false;
  selectedQuoteRemoved = false;
  isSmallParcelRate = false;
  isVolumeRate = false;
  enableTrackingEmails = false;
  oldTruckload: TruckSave | null = null;

  constructor(private gs: GroupsService, private fb: FormBuilder, private tss: TruckSaveService,
              private igs: InternalGroupService, private authenticator: AuthenticatorService,
              private cps: CarrierProfilingService, private rs: ReportsService, private ts: TrackingService, private route: ActivatedRoute,
              private router: Router, private sss: ShipmentSaveService, private readonly changeDetectorRef: ChangeDetectorRef,
              private emailService: EmailService, private spinner: NgxSpinnerService, private ls: LoadBoardService,
              private ms: MileageService, private tts: TruckerToolsService, public utilityservice: UtilityService) {

    this.shipmentID = this.route.snapshot.paramMap.get('shipmentID');
    this.truckID = this.route.snapshot.paramMap.get('truckID');
    this.shipmentType = this.route.snapshot?.routeConfig?.path?.includes('new/truckload/') ? 'Truckload' : 'LTL';
    // GET VALUES FROM QUICK RATES FORM
    this.preSelectedRate = history.state.data?.selectedRate ? history.state.data?.selectedRate : undefined;
    this.rateRequest = history.state.data?.rateRequest ? history.state.data?.rateRequest : {};
    this.rates = history.state.data?.rates ? history.state.data?.rates : undefined;
    this.currentClient = history.state.data?.client ? history.state.data?.client : '';
    this.currentGroupName = history.state.data?.groupInfo.groupName ? history.state.data.groupInfo.groupName + '-' +
      history.state.data.groupInfo.address1 : '';
    this.currentGroupID = history.state.data?.groupInfo.groupID ? history.state.data.groupInfo.groupID : null;
    this.rateRequestLineItems = this.rateRequest?.lineItems ? this.rateRequest?.lineItems : this.rateRequestLineItems;
    this.clientPlantID = this.rateRequest?.clientPlantID ? this.rateRequest?.clientPlantID : this.clientPlantID;
    this.clientPlantPPAAdjustment = this.rateRequest?.clientPlantPPAAdjustment ?
      this.rateRequest?.clientPlantPPAAdjustment : this.clientPlantPPAAdjustment;
    this.clientPlantPPA = this.rateRequest?.clientPlantPPA ? this.rateRequest?.clientPlantPPA : this.clientPlantPPA;
    this.activeFees = this.rateRequest?.fees ? this.rateRequest?.fees : this.activeFees;
    this.isFromQuickRates = history.state.data?.isFromQuickRates ? history.state.data?.isFromQuickRates : false;
    this.gs.isValidPermission().then(data => {
      this.isInternalManagement = data;
    });

    this.gs.isValidPermission().then(data => {
      this.isInternalUser = data;
    });

    const modes = sessionStorage.getItem('modes');
    this.modesDropdown = modes ? JSON.parse(modes) : null;
  }

  get shipperName() {
    const shipperName: any = [];
    this.shipperDropdown.forEach(value => {
      shipperName.push(value.name);
    });
    return shipperName;
  }

  showExceptionRequired(event: any) {
    this.exceptionCodeLccReq = event;
  }

  getRatesData(rates: any) {
    this.allRates = rates;
  }

  retrieveSelectedRates(selectedRates: any) {
    if (this.exceptionCodeLccReq === 'Exception Code' && this.shipmentType === 'LTL') {
      const exception = (document.getElementById('exception') as HTMLInputElement) ?? null;
      const exceptionReason = exception?.value ?? '';
      if (exceptionReason == '') {
        const selectedClientCost = parseFloat(selectedRates?.clientCost);
        let smallestClientCostAllRates: number = 0;

        if (this.allRates[0]?.clientCost !== undefined) {
          smallestClientCostAllRates = parseFloat(this.allRates[0]?.clientCost ?? null);
        }

        if (selectedClientCost > smallestClientCostAllRates) {
          this.shoLccExceptionReason = true;
          Swal.fire({
            html: '<b/><i/>You are not selecting the Least Cost Carrier. Enter an exception code or select the Least Cost ' +
              'Carrier to proceed.',
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed && exceptionReason === '') {
              Swal.close();
              document.getElementById('needs-validation-exception-lcc')?.classList.add('was-validated');
              this.scrollTo(document.querySelector('input#exception'));
            }
          });

        } else {
          this.shoLccExceptionReason = false;
          const lccExceptionElement = document.getElementById('needs-validation-exception-lcc');
          if (lccExceptionElement && lccExceptionElement.classList.contains('was-validated')) {
            document.getElementById('needs-validation-exception-lcc')?.classList.remove('was-validated');
            this.shoLccExceptionReason = false;
          }
        }
      } else {
        this.shoLccExceptionReason = false;
      }
    } else {
      this.shoLccExceptionReason = false;
    }
  }

  onChangeShipmentDate(event: any) {
    // shipment date selected
    const shipDate = new Date(event.target.value);
    shipDate.setDate(shipDate.getDate() + 1);
    // delivery date
    const deliveryDate = new Date(this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value);
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    // if the shipment date is past the delivery date then reset the delivery date.
    if (shipDate > deliveryDate) {
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.setValue('');
      Swal.fire({
        title: 'Delivery appointment reset.<br><br>The delivery appointment cannot be before the ship date',
        icon: 'warning',
        confirmButtonColor: '#007bff!important',
        confirmButtonText: 'Ok'
      });
    }
  }

  validateShipmentDate() {
    // shipment date selected
    const shipDate = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
    // shipDate.setDate(shipDate.getDate() + 1)
    // current date
    const minDate = new Date(this.minDate?.toString() ?? '');
    // minDate.setDate(minDate.getDate() + 1)
    // if the shipment date is past the delivery date, then reset the delivery date.
    if (this.shipmentType === 'LTL' && shipDate < minDate) {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue('');
      Swal.fire({
        title: 'Ship date reset.<br><br>The ship date cannot be in the past',
        icon: 'warning',
        confirmButtonColor: '#007bff!important',
        confirmButtonText: 'Ok'
      });
    }

    if (this.shipmentType === 'Truckload' && this.multiStop.length > 0) {
      for (let i = 0; i < this.multiStop.length; i++) {
        const validDates = this.onChangeStopDates(null, i);
        if (!validDates) {
          this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue('');
          Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Shipment Date cannot be Greater than Stop Appointment Dates'});
        }
      }
    }
  }

  onChangeShipmentDeliveryDate(event: any) {
    // shipment date selected
    const shipDate = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
    shipDate.setDate(shipDate.getDate() + 1);
    // delivery date
    const deliveryDate = new Date(event.target.value);
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    // if the shipment date is past the delivery date then reset the delivery date.
    if (deliveryDate < shipDate) {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue('');
      Swal.fire({
        title: 'Ship Date Reset.<br><br>The ship date cannot be after the delivery appointment',
        icon: 'warning',
        confirmButtonColor: '#007bff!important',
        confirmButtonText: 'Ok'
      });
    }
  }

  utcDateValidation() {
    let pickupStart = this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value;
    let pickupStop = this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value;
    let deliveryStart = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value;
    let deliveryStop = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value;

    if (this.clientTimeZone && this.consigneeTimeZone) {
      if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value) {
        pickupStart = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value + 'T' +
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value;
      }

      if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value) {
        pickupStop = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value + 'T' +
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value;
      }

      if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value &&
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value) {
        deliveryStart = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value + 'T' +
          this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value;
      }

      if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value &&
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value) {
        deliveryStop = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value + 'T' +
          this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value;
      }

      pickupStart = (pickupStart != '') ? this.convertDatetimeToUtc(pickupStart, this.clientTimeZoneName) : '';
      pickupStop = (pickupStop != '') ? this.convertDatetimeToUtc(pickupStop, this.clientTimeZoneName) : '';
      deliveryStart = (deliveryStart != '') ? this.convertDatetimeToUtc(deliveryStart, this.consigneeTimeZoneName) : '';
      deliveryStop = (deliveryStop != '') ? this.convertDatetimeToUtc(deliveryStop, this.consigneeTimeZoneName) : '';

      const pickupStartDate = new Date(pickupStart);
      const pickupStopDate = new Date(pickupStop);
      const deliveryStartDate = new Date(deliveryStart);
      const deliveryStopDate = new Date(deliveryStop);

      if (pickupStart !== '' && deliveryStart !== '') {
        if (pickupStartDate <= deliveryStartDate) {
        } else {
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue('');
          Swal.fire({
            title: 'Pickup appointment stop time reset<br><br>The delivery start time cannot be before the pickup Start time',
            icon: 'warning',
            confirmButtonColor: '#007bff!important',
            confirmButtonText: 'Ok'
          });
        }
      }

      if (pickupStop !== '' && deliveryStop !== '') {
        if (pickupStopDate <= deliveryStopDate) {
        } else {
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
          Swal.fire({
            title: 'Pickup appointment stop time reset<br><br>The pickup appointment stop time can not be before the delivery stop time',
            icon: 'warning',
            confirmButtonColor: '#007bff!important',
            confirmButtonText: 'Ok'
          });
        }
      }

      if (pickupStart !== '' && pickupStop !== '') {
        // check if pickup start is before delivery start
        if (pickupStartDate <= pickupStopDate) {
        } else {
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
          Swal.fire({
            title: 'Pickup appointment stop time reset<br><br>The pickup appointment stop time can not be before the start time',
            icon: 'warning',
            confirmButtonColor: '#007bff!important',
            confirmButtonText: 'Ok'
          });
        }
      }

      // make sure delivery appointment start time is not past stop time
      if (deliveryStart !== '' && deliveryStop !== '') {

        // check if pickup start is before delivery start
        if (deliveryStartDate <= deliveryStopDate) {
        } else {
          this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValue('');
          Swal.fire({
            title: 'Delivery appointment stop time reset<br><br>The delivery appointment stop time can not be before the start time',
            icon: 'warning',
            confirmButtonColor: '#007bff!important',
            confirmButtonText: 'Ok'
          });
        }
      }

      // if the shipment pickup start time stamp is past the delivery start time stamp date then reset the pickup appointment time
      if (this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value ===
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value) {

        // check all dates are input
        if (pickupStart !== '' && pickupStop !== '' && deliveryStart !== '' && deliveryStop !== '') {
          // check if pickup start is before delivery start
          if (pickupStartDate <= deliveryStartDate) {
          } else {
            this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue('');
            this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
            Swal.fire({
              title: 'Pickup appointment time reset<br><br>The pickup appointment time can not be after the delivery appointment time',
              icon: 'warning',
              confirmButtonColor: '#007bff!important',
              confirmButtonText: 'Ok'
            });

          }
        }
      }
    }
  }

  onChangeShipmentTimes() {
    // make sure pickup appointment start time is not past stop time
    const pickupStart = this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value;
    const pickupStop = this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value;
    const deliveryStart = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value;
    const deliveryStop = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value;
    const receivingStart = this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.value;
    const receivingStop = this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.value;

    const date = new Date().toJSON().slice(0, 10).replace(/-/g, '-');

    if (pickupStart !== '' && pickupStop !== '') {
      // format dates to compare them
      const pickupStartFormat = new Date(date + ' ' + pickupStart);
      const pickupStopFormat = new Date(date + ' ' + pickupStop);

      // check if pickup start is before delivery start
      if (pickupStartFormat <= pickupStopFormat) {
      } else {
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
        Swal.fire({
          title: 'Pickup appointment stop time reset<br><br>The pickup appointment stop time can not be before the start time',
          icon: 'warning',
          confirmButtonColor: '#007bff!important',
          confirmButtonText: 'Ok'
        });
      }
    }

    // make sure delivery appointment start time is not past stop time
    if (deliveryStart !== '' && deliveryStop !== '') {
      // format dates to compare them
      const deliveryStartFormat = new Date(date + ' ' + deliveryStart);
      const deliveryStopFormat = new Date(date + ' ' + deliveryStop);

      // check if pickup start is before delivery start
      if (deliveryStartFormat <= deliveryStopFormat) {
      } else {
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValue('');
        Swal.fire({
          title: 'Delivery appointment stop time reset<br><br>The delivery appointment stop time can not be before the start time',
          icon: 'warning',
          confirmButtonColor: '#007bff!important',
          confirmButtonText: 'Ok'
        });
      }
    }

    // make sure receiving start time is not past stop time
    if (receivingStart && receivingStop && receivingStart !== '' && receivingStop !== '') {
      // format dates to compare them
      const receivingStartFormat = new Date(date + ' ' + receivingStart);
      const receivingStopFormat = new Date(date + ' ' + receivingStop);

      // check if pickup start is before delivery start
      if (receivingStartFormat <= receivingStopFormat) {
      } else {
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue('');
        Swal.fire({
          title: 'Receiving stop time reset<br><br>The receiving stop time can not be before the start time',
          icon: 'warning',
          confirmButtonColor: '#007bff!important',
          confirmButtonText: 'Ok'
        });
      }
    }

    // if the shipment pickup start time stamp is past the delivery start time stamp date then reset the pickup appointment time
    if (this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value ===
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value) {

      const shipDate = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value;

      // check all dates are input
      if (pickupStart !== '' && pickupStop !== '' && deliveryStart !== '' && deliveryStop !== '') {
        // format dates to compare them
        const pickupStartFormat = new Date(shipDate + ' ' + pickupStart);
        const deliveryStartFormat = new Date(shipDate + ' ' + deliveryStart);

        // check if pickup start is before delivery start
        if (pickupStartFormat <= deliveryStartFormat) {
        } else {
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue('');
          this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
          Swal.fire({
            title: 'Pickup appointment time reset<br><br>The pickup appointment time can not be after the delivery appointment time',
            icon: 'warning',
            confirmButtonColor: '#007bff!important',
            confirmButtonText: 'Ok'
          });

        }
      }
    }
  }

  get shipperPlantLocation() {
    const shipperPlantName: any = [];
    this.shipperPlantsDropdown.forEach(value => {
      shipperPlantName.push(value.location.name);
    });
    return shipperPlantName;
  }

  get consigneeName() {
    const consigneeName: any = [];
    this.consigneeDropdown.filter(c => c.name != '').forEach(value => {
      consigneeName.push(value.name);
    });
    return consigneeName;
  }

  get consigneePlantName() {
    const consigneePlantName: any = [];
    this.consigneePlantsDropdown.filter(c => c.location.name != '').forEach(value => {
      consigneePlantName.push(value.location.name);
    });
    return consigneePlantName;
  }

  get billToName() {
    const billToName: any = [];
    this.billTo.forEach(value => {
      billToName.push(value.name);
    });
    return billToName;
  }

  get type() {
    const type: string[] = [];
    if (this.shipmentType === 'LTL' && this.isInternalManagement) {
      Constants.INTERNAL_LTL_TYPE_DROPDOWN.forEach(value => {
        type.push(value.item);
      });
    } else if (this.shipmentType === 'LTL' && !this.isInternalManagement) {
      Constants.EXTERNAL_LTL_TYPE_DROPDOWN.forEach(value => {
        type.push(value.item);
      });
    } else if (this.shipmentType === 'Truckload') {
      Constants.TYPE_DROPDOWN.forEach(value => {
        type.push(value.item);
      });
    }
    return type;
  }

  get modes() {
    const mode: string[] = [];
    this.modesDropdown?.forEach(value => {
      if (this.shipmentType === 'LTL' && value.modeType === 'LTL') {
        mode.push(value.modDescription);
      }
      if (this.shipmentType === 'Truckload' && value.modeType === 'TL') {
        mode.push(value.modDescription);
      }
    });
    return mode;
  }

  get pickupAccessorials() {
    const modeSelected = this.newShipmentForm.controls["shipmentForm"].get('modes')?.value;
    if (this.shipmentType === 'LTL' && (modeSelected !== 'Truckload' || modeSelected !== 'Refregirated Truckload' ||
      modeSelected !== 'FTL Rail')) {
      this.pickupDropdown = Constants.QUICK_RATE_PICKUP_ACCESSORIALS_LTL;
      return this.pickupDropdown;
    } else {
      this.pickupDropdown = Constants.QUICK_RATE_PICKUP_ACCESSORIALS;
      return this.pickupDropdown;
    }
  }

  get deliveryAccessorials() {
    const modeSelected = this.newShipmentForm.controls["shipmentForm"].get('modes')?.value;
    if (this.shipmentType === 'LTL' && (modeSelected !== 'Truckload' || modeSelected !== 'Refregirated Truckload' ||
      modeSelected !== 'FTL Rail')) {
      this.deliveryDropdown = Constants.QUICK_RATE_DELIVERY_ACCESSORIALS_LTL;
      return this.deliveryDropdown;
    } else {
      this.deliveryDropdown = Constants.QUICK_RATE_DELIVERY_ACCESSORIALS;
      return this.deliveryDropdown;
    }
  }

  get priority() {
    const priority: string[] = [];
    Constants.PRIORITY_DROPDOWN.forEach(value => {
      priority.push(value.item);
    });
    return priority;
  }

  get multiStopType() {
    return ['Pick Up', 'Drop Off'];
  }

  get multiStop() {
    return this.newShipmentForm.controls["shipperConsigneeForm"].get('multiStop') as FormArray;
  }

  get equipment() {
    const equipment: string[] = [];
    Constants.EQUIPMENT_DROPDOWN.forEach(value => {
      equipment.push(value.item);
    });
    return equipment;
  }

  // drag drop feature for multileg
  drop(event: any) {
    moveItemInArray(this.multiStop.controls, event.previousIndex, event.currentIndex);
  }

  setCanadianTimezone(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.rs.getCanadianTimezone().subscribe({
        next: (response) => {
          resolve(response);
        }, error: (e) => {
          reject(e);
        }
      });
    });
  }

  // Event handlers
  ngOnInit() {
    if (this.shipmentID != null || this.truckID) {
      setTimeout(() => this.spinner.show('spinnerShipmentForm').then(), 100);
    }
    const availableCarriers = sessionStorage.getItem('availableCarriers');
    const carrierData = availableCarriers ? JSON.parse(availableCarriers) : null;
    this.setCanadianTimezone().then((response) => {
      this.canadianTimezone = response;
      if (this.shipment) {
        if (this.shipment?.shipper?.zip && this.shipment?.consignee?.zip) {
          this.getTimeZone(this.shipment?.shipper?.zip, this.shipment?.consignee?.zip);
        }
      }
    });

    this.utilityservice.quotescheck = false;
    this.showCorrectedBolWarining = false;
    this.minDate = formatDate(this.currentDate, 'yyyy-MM-dd', 'en', '');
    this.lineItems = this.rateRequest?.lineItems ? this.rateRequest?.lineItems : [];
    this.editLineItems = this.rateRequest?.lineItems ? this.rateRequest?.lineItems : [];

    // initiate form groups
    this.newShipmentForm = this.fb.group({
      shipmentForm: this.getShipment(),
      shipperConsigneeForm: this.getShipperConsignee(),
      specialInstruction: this.fb.control(''),
      specialInstructionsText: this.fb.control(''),
      internalNotesText: this.fb.control(''),
      externalNotesText: this.fb.control(''),
      spotRateMessage: this.fb.control(''),
      truckNickName: this.fb.control(''),
      driverPhone: this.fb.control(''),
      proLoadNumber: this.fb.control(''),
      licensePlateNumber: this.fb.control(''),
      poNumber: this.fb.control(''),
      isReturn: this.fb.control(''),
      additionalInsurance: this.fb.control('', Validators.max(250000))
    });

    // SET VALUES FROM Quick Rates
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue(this.rateRequest?.fromZip, {
      onlySelf: true,
      emitEvent: false
    });

    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.setValue(this.rateRequest?.toZip, {
      onlySelf: true,
      emitEvent: false
    });

    if (this.rateRequest.shipDate) {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue(
        formatDate(this.rateRequest.shipDate, 'yyyy-MM-dd', 'en', ''), {
          onlySelf: true,
          emitEvent: false
        });
    }

    this.pickupDropdown = Constants.QUICK_RATE_PICKUP_ACCESSORIALS_LTL;
    this.deliveryDropdown = Constants.QUICK_RATE_DELIVERY_ACCESSORIALS_LTL;

    Constants.BILL_TO_DROPDOWN.forEach(value => {
      this.billToDropdown.push(value.item);
    });

    Constants.TIER.forEach(value => {
      this.crtier.push(value.item);
    });

    Constants.RECIPIENTFLOOR.forEach(value => {
      this.consigneeRecipientFloor.push(value.item);
    });

    Constants.ELEVATOR.forEach(value => {
      this.consigneeRecipientElevator.push(value.item);
    });

    // initiate drop down settings
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'chtID',
      textField: 'chtDescription',
      itemsShowLimit: 5,
      allowSearchFilter: true,
      enableCheckAll: false
    };

    this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValidators(Validators.required);
    if (this.shipmentType === 'LTL') {
      this.requiredForBOL = true;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('LTL');
    }

    if (this.shipmentType === 'Truckload') {
      this.requiredForBOL = true;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Truckload');
    }

    this.newShipmentForm.controls["shipmentForm"].get('equipment')?.setValidators(
      (this.shipmentType === 'Truckload' ? Validators.required : null));
    this.newShipmentForm.controls["shipmentForm"].get('equipment')?.updateValueAndValidity();

    this.setShipDate();
    this.setUser();
    if (this.activeFees.length !== 0) {
      this.setInitialAccessorials();
    }

    // Force appointment to ship date on edit
    if (this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value != '' &&
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value != null) {
      const date = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
      const formatedDate = moment(date, 'MM/DD/YYYY').format('MM/DD/YYYY');
      this.formattedShipDate = moment(formatedDate + ' ' + '00:00').local().format('YYYY-MM-DDThh:mm');
    }

    this.resetShipmentEdited();
    if (this.truckID != null && this.route.snapshot?.routeConfig?.path?.includes('new/truckload/')) {
      this.setTruckEdit(carrierData);
    } else {
      // Editing existing shipment
      if (this.shipmentID != null) {
        this.setShipmentEdit();
      }
      this.getCarrierList(carrierData);
    }
    this.dtPickerEventListener();

    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.value) {
      this.whiteglovetier = true;
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue('N/A');
    }
    this.deliveryWindowEnd = this.formattedShipDate;
  }

  customRatesMethod(ev: any) {
    this.customRates = ev;
  }

  setAppointmentRequired(name: string) {
    if (name === 'appointmentRequired') {
      this.isAppointmentRequired = this.newShipmentForm.controls["shipmentForm"].get('appointmentRequired')?.value;
      if (this.newShipmentForm.controls["shipmentForm"].get('appointmentRequired')?.value == true) {
        $('#labelforpickup').text('Pickup Appointment ' + this.clientTimeZone);
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValidators(Validators.required);
      } else {
        $('#labelforpickup').text('Pickup Window ' + this.clientTimeZone);
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValidators(null);
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValidators(null);
      }
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.updateValueAndValidity();
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.updateValueAndValidity();
    } else {
      if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentRequired')?.value == true) {
        $('#labelfordelivery').text('Delivery Appointment ' + this.consigneeTimeZone);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.setValidators(Validators.required);
      } else {
        $('#labelfordelivery').text('Delivery Window ' + this.consigneeTimeZone);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.setValidators(null);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.setValidators(null);
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValidators(null);
      }
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.updateValueAndValidity();
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.updateValueAndValidity();
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.updateValueAndValidity();
    }

    if (this.newShipmentForm.controls["shipmentForm"].get('appointmentRequired')?.value == true ||
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentRequired')?.value == true) {
      const date = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
      // date.setDate(date.getDate() + 1)
      const formatedDate = moment(date, 'MM/DD/YYYY').format('MM/DD/YYYY');
      this.formattedShipDate = moment(formatedDate + ' ' + '00:00').local().format('YYYY-MM-DDThh:mm');
    } else {
      this.formattedShipDate = this.minDate;
    }
  }

  setAppointmentSet(index: number) {
    if (index == -1) {
      this.isAppointmentSet = this.newShipmentForm.controls["shipmentForm"].get('appointmentSet')?.value;
    }
  }

  updateAppointmentRequired() {
    const date = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
    const frmtDate = moment(date, 'MM/DD/YYYY').format('MM/DD/YYYY');
    this.formattedShipDate = moment(frmtDate + ' ' + '00:00').local().format('YYYY-MM-DDThh:mm');
  }

  setShipmentEdit() {
    this.sss.getShipment(this.shipmentID).subscribe({
      next: response => {
        this.isShipmentEdit = true;
        this.shipment = this.timezoneProcessor(response, 'LTL');
        this.oldOpenReferenceFields = response.openReferenceFields.map((arrayElement: any) => Object.assign({}, arrayElement));
        this.clientPlantID = this.shipment?.client?.tiberID;
        this.currentGroupID = this.shipment?.client?.groupID ?? null;
        this.currentClient = this.shipment?.client?.clientCode + '-' + this.shipment?.client?.companyName;
        this.currentGroupName = this.shipment?.client?.groupName + '-' + this.shipment?.client?.address;
        this.clientDropdown.currentClient = this.shipment?.client?.clientCode + '-' + this.shipment?.client?.companyName;
        this.clientDropdown.currentGroupName = this.shipment?.client?.groupName + '-' + this.shipment?.client?.address;
        this.clientDropdown.currentGroup = this.shipment?.client?.groupID;
        this.clientDropdown.setClient(true);
        this.clientPlantSelected = true;
        this.shipmentType = this.shipment?.shipmentDetail?.mode === 'Truckload' ? 'Truckload Edit' : 'LTL';
        this.preSelectedCarrierID = this.shipment?.carrierDetail?.tiberID ?? null;
        this.preSelectedCarrierName = this.shipment?.carrierDetail?.carrierName ?? null;
        this.getSelectedRate();
        this.setEditGroupCustomizations(this.currentGroupID);
        this.editSetDetails();
        this.editSetShipperConsignee();
        this.editSetFreight();
        if (this.shipment?.shipmentDetail?.shipmentStatus !== 'PENDING' &&
          this.shipment?.shipmentDetail?.shipmentStatus !== 'PREBOOKED' &&
          this.shipment?.shipmentDetail?.shipmentStatus !== 'QUOTE_SENT_TO_CLIENT' &&
          this.shipment?.shipmentDetail?.shipmentStatus !== 'DELETED' && !this.disabledEditAsClone) {
          this.showCorrectedBolWarining = true;
        }
        // if loading as clone enable edit and set shipment date to current date
        if (this.disabledEditAsClone) {
          this.disableEdit = false;
          this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue(
            formatDate(this.currentDate, 'yyyy-MM-dd', 'en', ''), {
              onlySelf: true,
              emitEvent: false
            });
        }
        if (this.shipment?.shipmentDetail?.shipmentStatus === 'DELETED') { this.disableEdit = true; }
      },
      error: () => {
        // Invalid ID or not authorized
        this.spinner.hide('spinnerShipmentForm').then();
        Swal.fire('Something went wrong trying to load LTL Shipment', '', 'warning').then(() => {
          this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
            this.router.navigate(['SPAs/new']);
          });
        });
      },
      complete: () => {
        this.spinner.hide('spinnerShipmentForm').then();
        if (this.showCorrectedBolWarining) {
          Swal.fire('Corrected BOL', '<span class="red">This shipment is ' + this.shipment?.shipmentDetail?.shipmentStatus +
            '.  Any edits will be reflected as a Corrected BOL.</span>', 'warning');
        }
        setTimeout(() => this.resetShipmentEdited(), 1000);
        this.setEditRateData();
        this.minDate = this.shipment?.shipmentDetail?.enteredShipDate && this.isDate(this.shipment?.shipmentDetail?.enteredShipDate) ?
          formatDate(this.shipment.shipmentDetail.enteredShipDate, 'yyyy-MM-dd', 'en', '') :
          formatDate(this.currentDate, 'yyyy-MM-dd', 'en', '');
        this.clientDropdown.groupForm.get('client')?.setValue(this.currentClient);
        $('#client').removeClass('ng-invalid');
        if (this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value) {
          $('#shipmentBillTo').removeClass('ng-invalid');
        }
        if (this.newShipmentForm.controls["shipmentForm"].get('modes')?.value) {
          $('#modes').removeClass('ng-invalid');
        }

        setTimeout(() => {
          if (document.querySelectorAll('input.ng-invalid').length > 0) {
            $('input.ng-invalid').removeClass('ng-invalid');
          }
        }, 500);
      }
    });
  }

  deleteShipment() {
    this.spinner.show('spinnerShipmentForm').then();
    if (this.truck && this.truck?.loadPosted) {
      this.ls.deleteLoadBoard(this.truck.truckID).subscribe();
    }

    this.sss.deleteShipment(this.shipmentID).subscribe({
      next: () => {
        const note: Note = {
          notText: 'User ' + this.userName + ' has deleted this shipment.',
          notCognitoUsername: this.userName,
          notID: null,
          notTimeStamp: new Date(),
          clientNote: false,
          isNeedsManagement: false
        } as Note;
        this.rs.addNote(this.shipmentID, false, note).subscribe();
        this.spinner.hide('spinnerShipmentForm').then();
        this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
          this.router.navigate(['SPAs/new']);
        });
      },
      error: e => {
        this.spinner.hide('spinnerShipmentForm').then();
        Swal.fire('Delete shipment', 'Delete shipment could not be completed. ' + e, 'error');
      }
    });
  }

  setPickupAccessorials(accessorialId: any) {
    for (const accessorial of this.pickupDropdown) {
      if (accessorialId == accessorial.chtID) {
        return accessorial;
      }
    }
  }

  setDeliveryAccessorials(accessorialId: any) {
    for (const accessorial of this.deliveryDropdown) {
      if (accessorialId == accessorial.chtID) {
        return accessorial;
      }
    }
  }

  editSetDetails() {
    this.newShipmentForm.get('poNumber')?.setValue(this.shipment?.shipmentDetail?.poNumber);
    // Set client dropdowns
    this.getProductList(this.shipment?.client?.groupID);
    this.getShippersAndConsignees(this.shipment?.client?.groupID);
    this.getNoteList(this.shipment?.client?.groupID);
    this.getBillTos(this.shipment?.client?.groupID);

    this.trackingContacts = this.shipmentType === 'LTL' ? this.shipment?.trackingContacts :
      (this.truck?.shipments ? this.truck?.shipments[this.truck?.shipments?.length - 1].trackingContacts : []);

    if (this.shipment?.shipmentDetail?.appointmentRequired) {
      $('#labelforpickup').text('Pickup Appointment ' + this.clientTimeZone);
    } else {
      $('#labelforpickup').text('Pickup Window ' + this.clientTimeZone);
    }
    if (this.shipment?.shipmentDetail?.deliveryAppointmentRequired) {
      $('#labelfordelivery').text('Delivery Appointment ' + this.consigneeTimeZone);
    } else {
      $('#labelfordelivery').text('Delivery Window ' + this.consigneeTimeZone);
    }
    // Ship date
    if (this.shipment?.shipmentDetail?.enteredShipDate && this.isDate(this.shipment?.shipmentDetail?.enteredShipDate)) {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.
      setValue(formatDate(this.shipment.shipmentDetail.enteredShipDate, 'yyyy-MM-dd', 'en', 'America/New_York'));
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue(null);
    }
    if (this.shipment?.shipmentDetail?.mabdDate) {
      this.newShipmentForm.controls["shipmentForm"].get('MABDDate')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.mabdDate, 'yyyy-MM-dd', 'en', 'America/New_York'));
    }
    // Set shipper consignee ID in background
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperID')?.setValue(this.shipment?.shipper?.id);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeID')?.setValue(this.shipment?.consignee?.id);
    const serviceLevel = this.shipment?.shipmentDetail?.serviceLevel ?
      (this.shipment?.shipmentDetail?.serviceLevel.toUpperCase() == 'STANDARD' ? 'Direct' : this.shipment?.shipmentDetail?.serviceLevel) :
      'Direct';
    this.newShipmentForm.controls["shipmentForm"].get('type')?.setValue(serviceLevel);

    this.modesDropdown?.forEach((value) => {
      if (this.shipment?.shipmentDetail?.mode) {
        if (this.shipment?.shipmentDetail?.mode == value.modeId) {
          this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue(value.modDescription);
          this.disabledPriority = value.modDescription == 'Guaranteed LTL';
        }
      }
    });

    this.newShipmentForm.controls["proLoadNumber"].setValue(this.truck?.proLoadNumber);
    this.newShipmentForm.controls["truckNickName"].setValue(this.truck?.nickName);
    this.newShipmentForm.controls["driverPhone"].setValue(this.truck?.driverPhone);
    this.newShipmentForm.controls["licensePlateNumber"].setValue(this.truck?.licensePlateNo);

    this.newShipmentForm.controls["shipmentForm"].get('equipment')?.setValue(this.truck?.equipmentType);
    this.newShipmentForm.controls["shipmentForm"].get('appointmentRequired')?.setValue(this.shipment?.shipmentDetail?.appointmentRequired);
    if (this.shipment?.shipmentDetail?.appointmentRequired) {
      this.isAppointmentRequired = true;
    }

    this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentRequired')?.setValue(
      this.shipment?.shipmentDetail?.deliveryAppointmentRequired);
    this.newShipmentForm.controls["shipmentForm"].get('appointmentSet')?.setValue(this.shipment?.shipmentDetail?.appointmentSet);
    if (this.shipment?.shipmentDetail?.appointmentSet) {
      this.isAppointmentSet = true;
    }

    this.newShipmentForm.controls["shipmentForm"].get('contact')?.setValue(this.shipment?.shipmentDetail?.contact);
    if (this.isDate(this.shipment?.shipmentDetail?.pickupAppointmentStart)) {
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.pickupAppointmentStart, 'HH:mm', 'en', 'America/New_York'));
    }

    if (this.isDate(this.shipment?.shipmentDetail?.pickupAppointmentStop)) {
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.pickupAppointmentStop, 'HH:mm', 'en', 'America/New_York'));
    }

    if (this.isDate(this.shipment?.shipmentDetail?.deliveryAppointmentStart)) {
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.deliveryAppointmentStart, 'yyyy-MM-dd', 'en', 'America/New_York'));

      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.deliveryAppointmentStart, 'HH:mm', 'en', 'America/New_York'));
    }

    if (this.isDate(this.shipment?.shipmentDetail?.deliveryAppointmentStop)) {
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValue(
        formatDate(this.shipment?.shipmentDetail?.deliveryAppointmentStop, 'HH:mm', 'en', 'America/New_York'));
    }

    if (this.shipment?.consignee?.receivingHourStart &&
      this.shipment?.consignee?.receivingHourStart.toString().length > 0 && this.shipmentType !== 'LTL') {
      if (this.shipment?.consignee?.receivingHourStart?.toString().length === 3) {
        const numberString = this.shipment?.consignee?.receivingHourStart.toString(); // Convert to string
        const receivingHourStart = '0' + numberString .slice(0, 1) + ':' + numberString.slice(1);
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.setValue(receivingHourStart);
      } else if (this.shipment?.consignee?.receivingHourStart?.toString().length === 2) {
        const numberString = this.shipment?.consignee?.receivingHourStart.toString(); // Convert to string
        const receivingHourStart = '00:' + numberString[0] + numberString[1];
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.setValue(receivingHourStart);
      } else if (this.shipment?.consignee?.receivingHourStart &&
        this.shipment?.consignee?.receivingHourStart.toString().length === 1) {
        const numberString = this.truck?.shipments ? this.truck?.shipments[0]?.consignee?.receivingHourStart?.toString() : '0'; // Convert to string
        const receivingHourStart = '00:0' + (numberString ? numberString[0] : '0');
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.setValue(receivingHourStart);
      } else {
        const receivingHourStart = this.shipment?.consignee?.receivingHourStart?.toString();
        const formattedString = receivingHourStart.slice(0, 2) + ':' + receivingHourStart.slice(2);
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.setValue(formattedString);
      }
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.setValue(null);
    }

    if (this.shipment?.consignee?.receivingHourStop &&
      this.shipment?.consignee?.receivingHourStop.toString().length > 0 && this.shipmentType !== 'LTL') {
      if (this.shipment?.consignee?.receivingHourStop.toString().length === 3) {
        const numberString = this.shipment?.consignee?.receivingHourStop.toString(); // Convert to string
        const receivingHourStop = '0' + numberString .slice(0, 1) + ':' + numberString.slice(1);
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue(receivingHourStop);
      } else if (this.shipment?.consignee?.receivingHourStop.toString().length === 2) {
        const numberString = this.shipment?.consignee?.receivingHourStop.toString(); // Convert to string
        const receivingHourStop = '00:' + numberString[0] + numberString[1];
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue(receivingHourStop);
      } else if (this.shipment?.consignee?.receivingHourStop &&
        this.shipment?.consignee?.receivingHourStop.toString().length === 1) {
        const numberString = this.truck?.shipments ? this.truck?.shipments[0]?.consignee?.receivingHourStop?.toString() : '0'; // Convert to string
        const receivingHourStop = '00:0' + (numberString ? numberString[0] : '0');
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue(receivingHourStop);
      } else {
        const receivingHourStop = this.shipment?.consignee?.receivingHourStop?.toString();
        const formattedString = receivingHourStop.slice(0, 2) + ':' + receivingHourStop.slice(2);
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue(formattedString);
      }
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.setValue(null);
    }

    // Type: TODO - Multileg
    let totalWeight = 0;
    let totalPallets = 0;
    if (this.shipment?.lineItems) {
      for (const lineItem of this.shipment.lineItems) {
        totalWeight += (lineItem?.totalWeight ?? 0);
        if (lineItem.unitType === 'PALLETS') {
          totalPallets += (lineItem?.handlingUnits ?? 0);
        }
        // if (((lineItem?.width / 12) * (lineItem?.length / 12) * (lineItem?.height / 12)) > 500) {
        // this.newShipmentForm.controls['shipmentForm'].get('type')?.setValue('Volume');
        // }
      }
    }

    if (totalWeight > 5000 || totalPallets > 6) {
      // this.newShipmentForm.controls['shipmentForm'].get('type')?.setValue('Volume');
    }

    // Priority
    const priority = this.shipment?.shipmentDetail?.priority.toUpperCase();
    if (priority === 'STANDARD') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Standard');
    } else if (priority === 'ELEVATED') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Elevated');
    } else if (priority === 'EXPEDITED') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Expedited');
    } else if (priority === 'GUARANTEED') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Guaranteed');
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Standard');
    }

    // Billing terms
    const billingName = this.shipment?.billTo?.name;
    const carrierName = this.shipment?.carrierDetail?.carrierName;
    const tiberID = this.shipment?.carrierDetail?.tiberID;
    this.disableBlanket = false;
    this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue(this.shipment?.shipmentDetail?.terms);
    if (this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == '3rd Party' ||
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == 'Collect' ||
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == 'Prepaid') {
      if (this.shipmentType === 'LTL' && tiberID != null && carrierName != 'none') {
        this.disableBlanket = this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value != 'Prepaid';
      } else {
        this.disableBlanket = false;
      }
      this.disableBillingTerm = this.shipmentType === 'LTL' && this.shipment?.shipmentDetail?.terms == '3rd Party';
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValue(billingName);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue(this.shipment?.billTo?.careof);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValue(this.shipment?.billTo?.address);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.setValue(this.shipment?.billTo?.zip);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue(this.shipment?.billTo?.city);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue(this.shipment?.billTo?.state);
    }
    this.disableBlanket = this.shipment?.shipmentDetail?.isSpotRate === 2;

    // Set a negotiation type
    this.newShipmentForm.controls["shipmentForm"].get('negotiationType')?.setValue(this.shipment?.shipmentDetail?.negotiationType);
    this.negotiationType = this.shipment?.shipmentDetail?.negotiationType;

    // Special instructions
    this.newShipmentForm.get('specialInstructionsText')?.setValue(this.shipment?.shipmentDetail?.specialInstructions);
    // Additional Insurance
    if (this.shipment?.shipmentDetail?.additionalValue && parseInt(this.shipment?.shipmentDetail?.additionalValue) > 0) {
      $('#chkAdditionalInsurance').prop('checked', true);
      this.showInsuranceField = true;
    }
    this.newShipmentForm.get('additionalInsurance')?.setValue(this.shipment?.shipmentDetail?.additionalValue);

    // Set accessorials
    const pickupValues = [];
    const deliveryValues = [];
    if (this.shipment?.shipmentDetail?.mode === '0' || this.shipment?.shipmentDetail?.mode === '4' ||
      this.shipment?.shipmentDetail?.mode === '5' || this.shipment?.shipmentDetail?.mode === '6' ||
      this.shipment?.shipmentDetail?.mode === '7' || this.shipment?.shipmentDetail?.mode === '8') {
      for (const accessorial of this.shipment.accessorials) {
        // Pickups
        if (accessorial.accessorialID === 21 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 23 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 912 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 22 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 26 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 7 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 180 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 24  && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 4 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 169 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 25 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 916 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
          pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
        }

        // Deliveries
        if (accessorial.accessorialID === 21 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 23 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 912 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 22 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 26 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 7 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 180 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 24 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 4 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }
        if (accessorial.accessorialID === 25 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
          deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
        }

        if (accessorial.accessorialID === 23 || accessorial.accessorialID === 22 || accessorial.accessorialID === 169 ||
          accessorial.accessorialID === 21 || accessorial.accessorialID === 7  || accessorial.accessorialID === 916
          || accessorial.accessorialID === 26 || accessorial.accessorialID === 180 || accessorial.accessorialID === 24 ||
          accessorial.accessorialID === 4 || accessorial.accessorialID === 25 || accessorial.accessorialID === 912) {
          const index = this.activeFees.indexOf(accessorial.accessorialID.toString(), 0);
          if (index == -1) { this.activeFees.push(accessorial.accessorialID.toString()); }
        }
      }
    } else {
      if (this.shipment?.accessorials) {
        for (const accessorial of this.shipment.accessorials) {
          // Pickups
          if (accessorial.accessorialID === 23 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
            pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 22 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
            pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 169 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
            pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 21 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
            pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 7 && (accessorial.Type === 'Shipper' || accessorial.Type === 'Both')) {
            pickupValues.push(this.setPickupAccessorials(accessorial.accessorialID));
          }

          // Deliveries
          if (accessorial.accessorialID === 26 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 180 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 24 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 4 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 25 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }
          if (accessorial.accessorialID === 7 && (accessorial.Type === 'Consignee' || accessorial.Type === 'Both')) {
            deliveryValues.push(this.setDeliveryAccessorials(accessorial.accessorialID));
          }

          if (accessorial.accessorialID === 23 || accessorial.accessorialID === 22 || accessorial.accessorialID === 169 ||
            accessorial.accessorialID === 21 || accessorial.accessorialID === 7 || accessorial.accessorialID === 26 ||
            accessorial.accessorialID === 180 || accessorial.accessorialID === 24 || accessorial.accessorialID === 4 ||
            accessorial.accessorialID === 25) {
            const index = this.activeFees.indexOf(accessorial.accessorialID.toString(), 0);
            if (index == -1) { this.activeFees.push(accessorial.accessorialID.toString()); }
          }
        }
      }
    }

    try {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPickupAcc')?.setValue(pickupValues);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeDeliveryAcc')?.setValue(deliveryValues);
    } catch (Exception) {
      console.log(Exception);
    }

    this.newShipmentForm.get('isReturn')?.setValue(this.shipment?.shipmentDetail?.isReturn);
    document.getElementById('newShipmentForm')?.click();
  }

  editSetShipperConsignee() {
    // for notes on edit of shipment
    this.editShipperAndConsignee = this.shipment;
    // Shipper
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.setValue(this.shipment?.shipper?.name);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValue(this.shipment?.shipper?.plant);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress1')?.setValue(this.shipment?.shipper?.streetAddress);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress2')?.setValue(this.shipment?.shipper?.address2);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.setValue(this.shipment?.shipper?.countryCode);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue(this.shipment?.shipper?.zip);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue(this.shipment?.shipper?.city);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue(this.shipment?.shipper?.state);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.setValue(this.shipment?.shipper?.contact);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.setValue(this.shipment?.shipper?.email);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.setValue(this.shipment?.shipper?.phone);

    // Consignee
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.setValue(this.shipment?.consignee?.name);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue(this.shipment?.consignee?.plant);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress1')?.setValue(this.shipment?.consignee?.streetAddress);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress2')?.setValue(this.shipment?.consignee?.address2);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.setValue(this.shipment?.consignee?.countryCode);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.setValue(this.shipment?.consignee?.zip);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue(this.shipment?.consignee?.city);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue(this.shipment?.consignee?.state);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeContact')?.setValue(this.shipment?.consignee?.contact);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeEmail')?.setValue(this.shipment?.consignee?.email);
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePhone')?.setValue(this.shipment?.consignee?.phone);

    if (this.shipment?.shipmentDetail?.whiteGlove == '1') {
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('White Glove');
      this.deliveryAssessorialListSection = true;
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.setValue(this.shipment.whiteGlove?.recipientname);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.setValue(this.shipment.whiteGlove?.telephone);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.setValue(this.shipment.whiteGlove?.email);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.setValue(this.shipment.whiteGlove?.deliveryFrom);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.setValue(this.shipment.whiteGlove?.deliveryUpto);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.setValue(this.shipment.whiteGlove?.tier);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.setValue(this.shipment.whiteGlove?.floor);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue(this.shipment.whiteGlove?.elevator);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientDeliveryInstructions')?.setValue(
        this.shipment.whiteGlove?.deliveryinstructions);
      this.deliveryAssessorialListSection = true;
    } else {
      const SetMode = this.newShipmentForm.controls["shipmentForm"].get('modes')?.value;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue(SetMode);
      this.deliveryAssessorialListSection = false;
    }
  }

  editSetFreight() {
    const items: LineItem[] = [] as LineItem[];
    if (this.shipment?.lineItems) {
      for (let i = 0; i < this.shipment.lineItems.length; i++) {
        // Push to lineitems
        items.push(
          {
            productID: this.shipment.lineItems[i].productID,
            productCode: this.shipment.lineItems[i].productCode,
            productDescription: this.shipment.lineItems[i].productDescription,
            nmfc: this.shipment.lineItems[i].nmfc,
            freightClass: this.shipment.lineItems[i].freightClass,
            handlingUnits: this.shipment.lineItems[i].handlingUnits,
            unitType: this.shipment.lineItems[i].unitType,
            hazmat: this.shipment.lineItems[i].hazmat,
            pieces: this.shipment.lineItems[i].pieces,
            length: this.shipment.lineItems[i].length,
            width: this.shipment.lineItems[i].width,
            height: this.shipment.lineItems[i].height,
            unitWeight: this.shipment.lineItems[i].unitWeight,
            totalWeight: this.shipment.lineItems[i].totalWeight,
            stackable: this.shipment.lineItems[i].stackable,
            sameSkid: this.shipment.lineItems[i].sameSkid,
            location: 'Final Destination'
          });
        // Set control
      }
    }
    this.lineItems = items;
    this.editLineItems = this.lineItems;
    this.freight.setLineItemsForEdit(this.lineItems);
  }

  setInitialAccessorials() {
    const setPickupFee: any[] = [];
    const setDeliveryFee: any[] = [];
    this.pickupDropdown.forEach(value => {
      this.utilityservice.accessorialType.forEach((fee: any) => {
        if (fee.chtID === value.chtID && fee.Type === 'Shipper') {
          setPickupFee.push({chtID: value.chtID, chtDescription: value.chtDescription});
        }
      });
    });

    this.deliveryDropdown.forEach(value => {
      this.utilityservice.accessorialType.forEach((fee: any) => {
        if (fee.chtID === value.chtID && fee.Type === 'Consignee') {
          setDeliveryFee.push({chtID: value.chtID, chtDescription: value.chtDescription});
        }
      });
    });
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPickupAcc')?.setValue(setPickupFee, {
      onlySelf: true,
      emmitEvent: false
    });
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeDeliveryAcc')?.setValue(setDeliveryFee, {
      onlySelf: true,
      emmitEvent: false
    });
    this.utilityservice.accessorialType = [];
  }

  onRatesSelected() {
    const data = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    this.validateSmallParcelRate();
    this.isValidCreateBOL = this.newShipmentForm.valid && this.rateSet;
    this.notes.getNotes('carrierID', this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID);

    if (this.rateGrid.terms == '3rd Party' || this.rateGrid.terms == 'Collect' && data.negotiationType == '2') {
      if (!this.rateGrid.hadSelectedNegotiationType2) {
        this.rateGrid.previousBillToName = this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.value;
        this.rateGrid.previousBillToCareOf = this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.value;
      }
      this.rateGrid.hadSelectedNegotiationType2 = true;
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValue('IL2000');
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue('');

      if ((this.rateGrid.terms == '3rd Party' || this.rateGrid.terms == 'Collect') && data.assigned == true) {
        if (this.shipmentType === 'LTL') {
          this.Toast.fire({
            icon: 'warning',
            title: 'IL2000 blanket rate selected'
          });
          this.disableBlanket = true;
          if (this.rateGrid.terms == 'Collect') {
            this.disableBillingTerm = true;
            this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('3rd Party');
          }
        } else {
          this.disableBlanket = false;
        }
      }

      if ((this.rateGrid.terms == '3rd Party' || this.rateGrid.terms == 'Collect') && data.assigned == null) {
        this.disableBillingTerm = false;
        if (this.shipmentType === 'LTL' && this.rateGrid.terms == '3rd Party' && data.assigned == null) {
          this.disableBillingTerm = true;
          this.disableBlanket = false;
          this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue(this.rateGrid.terms);
        } else {
          this.disableBlanket = false;
          this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('Prepaid');
        }
      }
    }

    if (this.rateGrid.terms == '3rd Party' || this.rateGrid.terms == 'Collect' && data.negotiationType !== '2') {
      if (this.rateGrid.hadSelectedNegotiationType2) {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValue(this.rateGrid.previousBillToName);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue(this.rateGrid.previousBillToCareOf);
        this.rateGrid.hadSelectedNegotiationType2 = false;
      }
    }

    // Per GLOB-2747 set to 3rd party if IL2000 Blanket
    if ((this.rateGrid.terms == 'Collect' || this.rateGrid.terms == 'Prepaid') && data.negotiationType == 2) {
      (document.getElementById('shipmentBillTo') as HTMLSelectElement).value = '3rd Party';
    }

    this.negotiationType = data.negotiationType;
  }

  getLineItems(event: any, edit = false): any {
    // MAINLY TO FORMAT LINE ITEMS FOR THE RATE REQUEST
    this.rateRequestLineItems = [];
    const lineItems: any = event;
    let isHazmat = false;
    for (let i = this.activeFees.length - 1; i >= 0; i--) {
      if (this.activeFees[i].toString() === "22") this.activeFees.splice(i, 1);
    }
    this.rateGrid.setActiveFees(this.activeFees);
    lineItems.forEach((value: any) => {
      this.rateRequestLineItems.push({
        productDescription: value.description,
        unitType: value.unitType,
        freightClass: value.classNumber,
        handlingUnits: value.unitNumber,
        length: value.length,
        width: value.width,
        height: value.height,
        totalWeight: value.piecesInputTwo,
        stackable: value.stackChk != '' ? value.stackChk : false,
        sameSkid: value.sameSkid,
        productID: value.productID,
        productCode: value.item,
        nmfc: value.nmfcNumber,
        hazmat: value.hm == true ? 1 : 0,
        pieces: value.piecesNumber,
        unitWeight: value.piecesInputOne,
        location: value.location
      });
      if (value.hm == true || value.hm == 1) isHazmat = true;
    });
    if (isHazmat) this.addFee({chtID: 22}, 'pickup');
    if (this.shipmentType !== 'LTL') { this.getTotalsLineItems(this.rateRequestLineItems, this.stopsLineItems); }
    if (edit) { this.rateGrid.lineItems = this.rateRequestLineItems; }
  }

  addFee(event: any, type: string, stop: string = '') {
    this.activeFees.push(event.chtID);
    this.rateGrid.setActiveFees(this.activeFees);
    // Update special instruction if lift gate
    if (event.chtID == 7) { // if (event.chtID == 7 && type != 'none') {
      if (stop !== '') {
        this.getSpecialInstructionStop(Number(stop), '** Lift gate required **', false);
      } else {
        this.getSpecialInstruction('** Lift gate required for ' + type + ' **', false);
      }
    }
  }

  getTruckFees(truckFees: TruckFees[]): any {
    this.truckFees = truckFees;
    this.validateReasonCode();
  }

  getTruckNotUsedEvent(event: any) {
    if (event && event != '') {
      this.flagTruckNotUsed = true;
      this.truckNotUsedNote = event;
    } else {
      this.flagTruckNotUsed = false;
      this.truckNotUsedNote = '';
    }
  }

  removeFee(event: any, type: string, stop: string = '') {
    let index = this.activeFees.indexOf(event.chtID);
    if (index === -1) { index = this.activeFees.indexOf(event.chtID.toString()); }
    if (index > -1) { this.activeFees.splice(index, 1); }

    if (event.chtID == 7) { // if (event.chtID == 7 && type != 'none') {
      if (stop !== '') {
        this.getSpecialInstructionStop(Number(stop), '** Lift gate required **', true);
      } else {
        this.getSpecialInstruction('** Lift gate required for ' + type + ' **', true);
      }
    }
    this.rateGrid.setActiveFees(this.activeFees);
  }

  getTotalShipment(): number {
    const costs = this.charges;
    this.totalShipment = 0;
    // Add Charges
    for (const i in costs) {
      this.totalShipment += costs[i].cost;
    }
    return this.totalShipment;
  }

  getSpecialInstruction(item: any, remove: boolean) {
    // appends selected special instruction from dropdown to the special instruction text area
    if (item !== undefined) {
      const textAreaValue = this.newShipmentForm.controls["specialInstructionsText"].value;
      let newTextValue = '';
      if (remove) {
        if (textAreaValue) { newTextValue = textAreaValue.replace(' ' + item + '.', ''); }
      } else {
        newTextValue = textAreaValue + ' ' + item + '.';
      }
      this.specialInstructionText = newTextValue;
      this.newShipmentForm.controls["specialInstructionsText"].setValue(this.specialInstructionText, {
        onlySelf: false,
        emmitEvent: true
      });
    }
  }

  ngAfterViewInit() {
    // ADDS CHILD FORMS TO MAIN NEW SHIPMENT FORM
    this.newShipmentForm.addControl('lineItems', this.freight.freightForm);
    this.freight.freightForm.setParent(this.newShipmentForm);

    this.newShipmentForm.addControl('ratesGridForm', this.rateGrid.ratesGridForm);
    this.rateGrid.ratesGridForm.setParent(this.newShipmentForm);

    this.newShipmentForm.addControl('tlQuotes', this.quotes.manualQuotesForm);
    this.quotes.manualQuotesForm.setParent(this.newShipmentForm);

    // NEW SHIPMENT FORM VALUE CHANGES
    this.formValueChanges();
    if (this.preSelectedRate) {
      this.rateGrid.setSelectedValue(this.preSelectedRate);
    }

    this.shipmentID = this.route.snapshot.paramMap.get('shipmentID');
    this.truckID = this.route.snapshot.paramMap.get('truckID');

    this.newShipmentForm.valueChanges.subscribe(() => {
      if (this.newShipmentForm.dirty) {
        this.shipmentEditedCount += 1;
        if (this.shipmentEditedCount >= 1) {
          this.shipmentEdited = true;
          this.global.shipmentEdited.set(true);
        }
      }
    });
  }

  formValueChanges() {
    this.consigneeZipValueChange$ = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.valueChanges.subscribe(() => {
      this.isValidCreateBOL = false;
      this.rateGrid.showFetchRatesButton();
      this.freight.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
      if (this.shipmentType !== 'LTL') {
        this.freightTotals?.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
      }
    });

    this.shipperZipValueChange$ = this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.valueChanges
      .subscribe(() => {
        this.isValidCreateBOL = false;
        this.rateGrid.showFetchRatesButton();
        this.freight.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
        if (this.shipmentType !== 'LTL') {
          this.freightTotals?.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
            this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
        }
      });

    this.shipmentDateValueChange$ = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.valueChanges
      .subscribe(() => {
        this.isValidCreateBOL = false;
        this.rateGrid.showFetchRatesButton();
      });

    this.lineItemValueChanges$ = this.newShipmentForm.get('lineItems')?.valueChanges.subscribe(() => {
      this.isValidCreateBOL = false;
      this.rateGrid.showFetchRatesButton();
    });
  }

  ngOnDestroy(): void {
    if (this.consigneeZipValueChange$) this.consigneeZipValueChange$.unsubscribe();
    if (this.shipperZipValueChange$) this.shipperZipValueChange$.unsubscribe();
    if (this.lineItemValueChanges$) this.lineItemValueChanges$.unsubscribe();
    if (this.shipmentDateValueChange$) this.shipmentDateValueChange$.unsubscribe();
  }

  groupEventHandler($event: GroupInfo) {
    this.shipmentEditedCount += 1;
    this.global.shipmentEdited.set(true);
    this.poMoniker = 'PO #';
    this.showInsuranceField = false;
    this.notes.getNotes('clientCode', $event.clientCode, $event.groupID.toString());
    this.groupInfo = $event;
    this.currentGroupID = this.isFromQuickRates ? this.currentGroupID : this.groupInfo.groupID;
    this.clientPlantID = this.isFromQuickRates ? this.clientPlantID : $event.tiberID;
    if (this.shipmentID == null) { this.newShipmentForm.controls["shipmentForm"].get('MABDDate')?.setValue(''); }
    this.getProductList($event.groupID);
    this.getShippersAndConsignees($event.groupID);
    this.getNoteList($event.groupID);
    this.getGroupCustomizations($event.groupID);
    this.getBillTos($event.groupID);
    if (this.groupInfo && this.clientDropdown.groupForm.get('plant')?.value !== '') {
      $('#plant').removeClass('ng-invalid');
    }
  }

  getBillTos(GroupID: any) {
    this.igs.getGroupBillTos(GroupID).subscribe({
      next: response => {
        this.billTo.length = 0; // Reset array
        for (const billTo of response) {
          billTo.careof = billTo.careof !== 'IL2000' ? 'IL2000' : billTo.careof;
          billTo.address = billTo.address !== 'PO BOX 14126' ? 'PO BOX 14126' : billTo.address;
          billTo.zip = billTo.zip !== '64152' ? '64152' : billTo.zip;
          billTo.city = billTo.city !== 'PARKVILLE' ? 'PARKVILLE' : billTo.city;
          billTo.state = billTo.state !== 'MO' ? 'MO' : billTo.state;
          this.billTo.push(billTo);
        }
        this.setShipmentBillTo();
      }
    });
  }

  getGroupCustomizations(groupID: number) {
    this.checkForLeasCostCarrier = false;
    this.hasCustomizationID78 = false;
    this.hasCustomizationID80 = false;
    this.showCheckInsuranceAmount = false;
    this.clientPlantAllowMABDInput = false;
    this.clientPlantRequireDimensions = false;
    this.clientPlantPPA = '';
    this.clientPlantPPAAdjustment = -1;
    const billingTermValue = this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value;

    if (billingTermValue == 'PPD/Add') {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('Prepaid');
    }
    if (this.shipmentID == null && this.truckID == null) { this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue(''); }

    if (this.shipmentID == null && this.truckID == null && this.shipmentType === 'Truckload') {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('3rd Party');
    }

    this.igs.getGroupCustomizations(groupID).subscribe({
      next: response => {
        this.groupCustomization = response;
        this.setGroupCustomization();
        this.customizations.length = 0;

        for (const customization of response as Customization[]) {
          this.customizations.push(customization);
          if (customization.customizationID === 76) { this.enableTrackingEmails = true; }
          this.clientHideSuggestedClass = customization.description === 'Hide Suggested Class';
          if (customization.customizationID === 48) { this.clientPlantRequireDimensions = true; }
          if (customization.customizationID === 72) { this.clientPlantAllowMABDInput = true; }

          // Default terms prepaid
          if (customization.customizationID === 13) {
            if (this.shipmentID == null) { this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('Prepaid'); }
          }

          // Default terms third party
          if (customization.customizationID === 14) {
            if (this.shipmentID == null) { this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('3rd Party'); }
          }

          // Default terms PP/Add
          if (customization.customizationID === 34 && !this.isInternalManagement) {
            if (this.shipmentID == null) { this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('PPD/Add'); }
          }

          if (customization.customizationID === 30) {
            if (customization.intValue === 3) {
              this.clientPlantPPA = 'NET_RATE_MARKUP';
            } else if (customization.intValue === 1) {
              this.clientPlantPPA = 'GROSS_RATE_DISCOUNT';
            }
          }

          if (customization.customizationID === 26) { this.clientPlantPPAAdjustment = customization.intValue; }
          if (customization.customizationID === 33) { this.showNonDirectPoints = true; }
          if (customization.customizationID === 10) { this.poMoniker = customization.stringValue; }
          if (customization.customizationID === 87) { this.showCheckInsuranceAmount = true; }
          if (customization.customizationID === 78) { this.hasCustomizationID78 = true; }
          if (customization.customizationID === 80) { this.hasCustomizationID80 = true; }
          if (this.hasCustomizationID78 && this.hasCustomizationID80) { this.checkForLeasCostCarrier = true; }
        }
        this.setShipmentBillTo();
      }
    });
  }

  setGroupCustomization() {
    // Checking GroupCustomisation is on or not for rater API
    // Assigning default value
    this.rateGrid.isGroupCustomization = 0;
    this.rateGrid.apiRateType = 0;

    if (this.groupCustomization) {
      for (const customization of this.groupCustomization as Customization[]) {
        if (customization.customizationID === 100) {
          this.rateGrid.isGroupCustomization = 1;
          continue;
        }
        if (customization.customizationID === 101) {
          this.rateGrid.bundleFedexRates = 1;
        }
      }
    }
  }

  getNoteList(groupID: any) {
    this.igs.getGroupNotes(groupID).subscribe({
      next: response => {
        this.noteList.length = 0; // Reset array
        for (const note of response) {
          this.noteList.push(note);
        }
      }
    });
  }

  getProductList(groupID: any) {
    this.igs.getProductList(groupID).subscribe({
      next: response => {
        this.productList.length = 0; // Reset array
        for (const product of response) {
          this.productList.push(product);
        }
        this.dt?.rerender();
      }
    });
  }

  getCarrierList(carriersData: CarrierDetail[] | null = null, fn: any = null) {
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

  getShippersAndConsignees(groupID: any) {
    this.rs.getShippersAndConsignees(groupID).subscribe({
      next: response => {
        this.shipperConsigneeData = response;
        this.setShipperConsigneeDropdowns(response);
        if (this.shipment?.shipper?.zip && this.shipment?.consignee?.zip) {
          this.getTimeZone(this.shipment?.shipper?.zip, this.shipment?.consignee?.zip);
        }
      }
    });
  }

  editSetTimezones() {
    if (this.truck?.shipments) {
      for (let i = 0; i < this.truck?.shipments?.length; i++) {
        if (this.truck?.shipments[i].consignee?.timezone != null && this.truck?.shipments[i].consignee?.timezone != '') {
          const longTimezone = this.truck?.shipments[i].consignee?.timezone;
          if (longTimezone) {
            this.multiStopTimezone[i] = longTimezone;
            this.multiStopTimezoneLabel[i] = this.getShortTimeZone(longTimezone);
          } else {
            this.multiStopTimezone[i] = 'UTC';
            this.multiStopTimezoneLabel[i] = 'UTC';
          }
        }
      }
    }
  }

  setMultiStopTimezoneInfo(index: any) {
    const zip = this.multiStop.at(index).get('multiStopZip')?.value;
    const longTimezone = zipToTimezone.lookup(zip);
    if (longTimezone) {
      this.multiStopTimezone[index] = longTimezone;
      this.multiStopTimezoneLabel[index] = this.getShortTimeZone(longTimezone);
    } else {
      const canadianTimezone = this.getCanadianTimezone(zip);
      if (canadianTimezone) {
        this.multiStopTimezone[index] = canadianTimezone;
        this.multiStopTimezoneLabel[index] = this.getShortTimeZone(canadianTimezone);
      } else {
        this.multiStopTimezone[index] = 'UTC';
        this.multiStopTimezoneLabel[index] = 'UTC';
      }
    }
  }

  setShipDate() {
    const todaysDate = formatDate(new Date(), 'yyyy-MM-dd', 'en', '');
    if (!this.isAfterThree(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value) &&
      !this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.dirty) {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue(todaysDate);
    } else if (this.isAfterThree(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value) &&
      !this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.dirty) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormat = formatDate(tomorrow, 'yyyy-MM-dd', 'en', '');
      this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.setValue(tomorrowFormat);
    }
  }

  isAfterThree(zip: number) {
    // Get today's date with no time
    const timezone = zipToTimezone.lookup(zip); // Ex: America/New_York
    // Make sure timezone is returned, if not just return false
    if (timezone != null) {
      const today = this.currentDate;
      today.setHours(0, 0, 0, 0);

      // Get currently set ship date with no time
      const shipDate = new Date(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value);
      shipDate.setHours(0, 0, 0, 0);
      shipDate.setDate(shipDate.getDate() + 1);

      // Get the local hour of the carrier
      const time = new Date();
      const timeString = time.toLocaleTimeString('it-IT', {timeZone: timezone});
      const localHour = +timeString.split(':')[0];

      // Check if today's date is the same as ship date and local shipper time is past 3pm
      return localHour >= 15;
    } else {
      return false;
    }
  }

  setShipperConsigneeDropdowns(response: ShippersConsignees) {
    // Set values to be used in dropdown based on selected shipper or consignee
    this.shipperDropdown.length = 0;
    this.consigneeDropdown.length = 0;
    let prevShipper = response.shippers[0].moniker;
    let locationsArray: FullLocation[] = [];
    let finalPush: any;
    for (const shipper of response.shippers) {
      if (shipper.moniker == prevShipper) {
        locationsArray.push({
          location: {
            id: shipper.id,
            name: shipper.address.name,
            streetAddress: shipper.address.streetAddress,
            address2: shipper.address.address2,
            city: shipper.address.city,
            state: shipper.address.state,
            country: shipper.address.country,
            zip: shipper.address.zip
          },
          contact: {
            name: shipper.contact.name,
            email: shipper.contact.email,
            phone: shipper.contact.phone
          }
        } as FullLocation);
      } else {
        this.shipperDropdown.push({name: prevShipper, locations: locationsArray});
        finalPush = {name: prevShipper, locations: locationsArray};
        prevShipper = shipper.moniker;
        locationsArray = [];
        locationsArray.push({
          location: {
            id: shipper.id,
            name: shipper.address.name,
            streetAddress: shipper.address.streetAddress,
            address2: shipper.address.address2,
            city: shipper.address.city,
            state: shipper.address.state,
            country: shipper.address.country,
            zip: shipper.address.zip
          },
          contact: {
            name: shipper.contact.name,
            email: shipper.contact.email,
            phone: shipper.contact.phone
          }
        } as FullLocation);
      }
    }

    let prevConsignee = response.shippers[0].moniker;
    for (const consignee of response.consignees) {
      if (consignee.moniker == prevConsignee) {
        locationsArray.push({
          location: {
            id: consignee.id,
            name: consignee.address.name,
            streetAddress: consignee.address.streetAddress,
            address2: consignee.address.address2,
            city: consignee.address.city,
            state: consignee.address.state,
            country: consignee.address.country,
            zip: consignee.address.zip
          },
          contact: {
            name: consignee.contact.name,
            email: consignee.contact.email,
            phone: consignee.contact.phone
          }
        } as FullLocation);
      } else {
        this.consigneeDropdown.push({name: prevConsignee, locations: locationsArray});
        prevConsignee = consignee.moniker;
        locationsArray = [];
        locationsArray.push({
          location: {
            id: consignee.id,
            name: consignee.address.name,
            streetAddress: consignee.address.streetAddress,
            address2: consignee.address.address2,
            city: consignee.address.city,
            state: consignee.address.state,
            country: consignee.address.country,
            zip: consignee.address.zip
          },
          contact: {
            name: consignee.contact.name,
            email: consignee.contact.email,
            phone: consignee.contact.phone
          }
        } as FullLocation);
      }
    }
  }

  setShipperPlants() {
    this.shipperPlantsDropdown.length = 0;
    const curShip = this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.value;
    if (!curShip) {
      this.resetShipperInformation();
      return;
    }
    let foundShipperName = false;
    for (const shipper of this.shipperDropdown) {
      if (shipper.name == curShip) {
        if (shipper.locations.length === 1) {
          this.shipperPlantsDropdown.push({
            location: shipper.locations[0].location,
            contact: shipper.locations[0].contact
          });
          this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValue(shipper.locations[0].location.name);
          this.setShipperInformation();
        } else {
          for (const plant of shipper.locations) {
            this.shipperPlantsDropdown.push({location: plant.location, contact: plant.contact});
          }
        }
        foundShipperName = true;
      }
    }
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue(
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value);
    this.setShipDate();

    if (!foundShipperName) {
      this.resetShipperInformation();
    } else {
      if (this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.value !== '') {
        this.shipperPlantDropDown.isRequired = true;
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValidators(Validators.required);
        if (this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.value == '') {
          this.shipperPlantDropDown.isRequired = false;
          this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValidators(null);
        }
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.updateValueAndValidity();
      }
    }
  }

  setConsigneePlants() {
    this.consigneePlantsDropdown.length = 0;
    const curCon = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.value;
    if (!curCon) {
      this.resetConsigneeInformation();
      return;
    }
    let foundConsigneeName = false;
    for (const consignee of this.consigneeDropdown) {
      if (consignee.name == curCon) {
        if (consignee.locations.length === 1) {
          this.consigneePlantsDropdown.length = 0;
          this.consigneePlantsDropdown.push({
            location: consignee.locations[0].location,
            contact: consignee.locations[0].contact
          });
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue(consignee.locations[0].location.name);
          if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value) {
            setTimeout(() => { $('#consigneePlant').removeClass('ng-invalid'); }, 100);
          }
          this.setConsigneeInformation();
        } else {
          this.consigneePlantsDropdown.length = 0;
          for (const plant of consignee.locations) {
            if (plant.location.name != '') {
              this.consigneePlantsDropdown.push({location: plant.location, contact: plant.contact});
            }
          }
          const plantName = consignee.locations.find(l => l.location.name != '')?.location.name;
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue(plantName);
          if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value) {
            setTimeout(() => { $('#consigneePlant').removeClass('ng-invalid'); }, 100);
          }
          this.setConsigneeInformation();
        }
        foundConsigneeName = true;
      }
    }

    if (!foundConsigneeName) {
      this.resetConsigneeInformation();
    } else {
      if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.value !== '') {
        this.consigneePlantDropDown.isRequired = true;
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValidators(Validators.required);
        if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value == '') {
          this.consigneePlantDropDown.isRequired = false;
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValidators(null);
        }
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.updateValueAndValidity();
      }
    }
  }

  setShipperInformation() {
    const curPlant = this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.value;
    if (!curPlant) {
      this.resetShipperInformation();
      return;
    }
    for (const plant of this.shipperPlantsDropdown) {
      if (plant.location.name == curPlant) {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperID')?.setValue(plant.location.id);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress1')?.setValue(plant.location.streetAddress);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress2')?.setValue(plant.location.address2);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue(plant.location.zip);
        this.getTimeZone(plant.location.zip, null);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.setValue(
          (plant.location.country ? plant.location.country : 'USA'));
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue(plant.location.city);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue(plant.location.state);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.setValue(plant.contact.email);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.setValue(plant.contact.phone);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.setValue(plant.contact.name);
        this.notes.getNotes('shipperState', this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.value);
        break;
      }
    }
  }

  setConsigneeInformation() {
    const curPlant = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value;
    if (!curPlant) {
      this.resetConsigneeInformation();
      return;
    }
    for (const plant of this.consigneePlantsDropdown) {
      if (plant.location.name == curPlant) {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeID')?.setValue(plant.location.id);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress1')?.setValue(plant.location.streetAddress);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress2')?.setValue(plant.location.address2);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.setValue(plant.location.zip);
        this.getTimeZone(null, plant.location.zip);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.setValue(
          (plant.location.country ? plant.location.country : 'USA'));
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue(plant.location.city);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue(plant.location.state);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeEmail')?.setValue(plant.contact.email);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePhone')?.setValue(plant.contact.phone);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeContact')?.setValue(plant.contact.name);
        this.notes.getNotes('consigneeState', this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.value);
        break;
      }
    }
  }

  setBillToInformation() {
    const curBillTo = this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.value;
    if (!curBillTo) {
      this.resetBillingInformation();
      return;
    }
    if (curBillTo && curBillTo !== '') {
      for (const billTo of this.billTo) {
        if (billTo.name.toUpperCase() === curBillTo) {
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billtoID')?.setValue(billTo.billtoID);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue(
            billTo.careof !== 'IL2000' ? 'IL2000' : billTo.careof);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValue(
            billTo.address !== 'PO BOX 14126' ? 'PO BOX 14126' : billTo.address);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.setValue(billTo.zip !== '64152' ? '64152' : billTo.zip);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue(
            billTo.city !== 'PARKVILLE' ? 'PARKVILLE' : billTo.city);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue(billTo.state !== 'MO' ? 'MO' : billTo.state);
          break;
        }
      }
    }
  }

  ratesFieldsRequired(data: any) {
    console.log('data', data);
  }

  setShipmentBillTo() {
    if (this.shipmentID == null) {
      const type = this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value;

      if (type === 'Prepaid') {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.setValue(this.groupInfo?.companyName);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValue(this.groupInfo?.groupName);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress1')?.setValue(this.groupInfo?.address1);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress2')?.setValue('');
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue(this.groupInfo?.zip);
        this.getTimeZone(this.groupInfo?.zip, null);
        let countryCode = 'USA';
        if (this.groupInfo?.country) {
          countryCode = this.groupInfo.country == 'US' ? 'USA' : this.groupInfo.country == 'CA' ? 'CAN' :
            this.groupInfo.country == 'MX' ? 'MEX' : this.groupInfo.country;
        }
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.setValue(countryCode);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue(this.groupInfo?.city);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue(this.groupInfo?.state);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValidators(Validators.required);

        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.updateValueAndValidity();

      } else if (type === 'Collect') {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.setValue(this.groupInfo?.companyName);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue(this.groupInfo?.groupName);
        if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value) {
          setTimeout(() => { $('#consigneePlant').removeClass('ng-invalid'); }, 100);
        }
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress1')?.setValue(this.groupInfo?.address1);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress2')?.setValue('');
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.setValue(this.groupInfo?.zip);
        this.getTimeZone(null, this.groupInfo?.zip);
        let countryCode = 'USA';
        if (this.groupInfo?.country) {
          countryCode = this.groupInfo.country == 'US' ? 'USA' : this.groupInfo.country == 'CA' ? 'CAN' :
            this.groupInfo.country == 'MX' ? 'MEX' : this.groupInfo.country;
        }
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.setValue(countryCode);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue(this.groupInfo?.city);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue(this.groupInfo?.state);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeEmail')?.setValue(this.groupInfo?.contactEmail);

        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.updateValueAndValidity();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.clearValidators();
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.updateValueAndValidity();
      }
      this.thirdPartyBillingTerm(type);
    }
    this.resetIsFromQuickRates();
  }

  thirdPartyBillingTerm(billingTerm: string) {
    if (billingTerm === '3rd Party' || billingTerm === 'Collect' || billingTerm === 'Prepaid' && this.isInternalUser) {
      const billTo = this.billTo.find(x => x.name.toUpperCase().trim() === this.groupInfo.companyName.toUpperCase().trim());
      if (billTo) {
        this.disableBillingTerm = billingTerm === '3rd Party' && this.shipmentType === 'LTL';
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValue(billTo.name);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billtoID')?.setValue(billTo.billtoID);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue(billTo.careof);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValue(billTo.address);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.setValue(billTo.zip);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue(billTo.city);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue(billTo.state);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValidators(Validators.required);
        this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValidators(Validators.required);
      }
    }
  }

  getShortTimeZone(longTimeZone: any) {
    if (longTimeZone != null) {
      return Intl.DateTimeFormat('en', { timeZone: longTimeZone, timeZoneName: 'short' }).format(new Date()).split(' ')[1];
    } else {
      return null;
    }
  }

  getCanadianTimezone(zip: any) {
    let zone;
    const regex = /^[A-Za-z]/;

    if (regex.test(zip) && zip) {

      zip = zip.slice(0, 3);
      for (const j in this.canadianTimezone) {
        if (this.canadianTimezone[j].zip == zip) {
          zone = this.canadianTimezone[j].timezone;
          break;
        }
      }
    }
    return zone;
  }

  getTimeZone(shipperZip: any, consigneeZip: any) {
    let shippersZoneFound = false;
    let consigneeZoneFound = false;
    const regex = /^[A-Za-z]/;

    if (regex.test(shipperZip) && shipperZip) {
      const canadianTimezone = this.getCanadianTimezone(shipperZip);
      if (canadianTimezone) {
        shippersZoneFound = true;
        this.clientTimeZone = this.getShortTimeZone(canadianTimezone);
        this.clientTimeZoneName = canadianTimezone;
      }
    }

    if (regex.test(consigneeZip) && consigneeZip) {
      const canadianTimezone = this.getCanadianTimezone(consigneeZip);
      if (canadianTimezone) {
        consigneeZoneFound = true;
        this.consigneeTimeZone = this.getShortTimeZone(canadianTimezone);
        this.consigneeTimeZoneName = canadianTimezone;
      }
    }

    if (!shippersZoneFound && shipperZip) {
      if (this.shipperConsigneeData) {
        for (const ind in this.shipperConsigneeData.shippers) {
          if ( this.shipperConsigneeData.shippers[ind].address.zip == shipperZip) {
            const zone = (this.shipperConsigneeData.shippers[ind].address.timeZone) ?
              this.shipperConsigneeData.shippers[ind].address.timeZone : 'UTC';
            const ctz = this.getShortTimeZone(zone);
            shippersZoneFound = true;
            if (ctz != null) {
              this.clientTimeZone = ctz;
              this.clientTimeZoneName = zone;
            }
          }
        }
      }
    }

    if (!shippersZoneFound && shipperZip) {
      const newzone = zipToTimezone.lookup(shipperZip);
      const newctz = this.getShortTimeZone(newzone);
      if (newctz != null) {
        shippersZoneFound = true;
        this.clientTimeZone = newctz;
        this.clientTimeZoneName = newzone;
      }
    }

    if (!shippersZoneFound && shipperZip) { this.clientTimeZone = 'UTC'; }

    if (!consigneeZoneFound && consigneeZip) {
      if (this.shipperConsigneeData) {
        for (const ind in this.shipperConsigneeData.consignees) {
          if ( this.shipperConsigneeData.consignees[ind].address.zip == consigneeZip) {
            const zone = (this.shipperConsigneeData.consignees[ind].address.timeZone) ?
              this.shipperConsigneeData.consignees[ind].address.timeZone : 'UTC';
            const stz = this.getShortTimeZone(zone);
            consigneeZoneFound = true;
            if (stz != null) {
              this.consigneeTimeZone = stz;
              this.consigneeTimeZoneName = zone;
            }
          }
        }
      }
    }

    if (!consigneeZoneFound && consigneeZip) {
      const newzone = zipToTimezone.lookup(consigneeZip);
      const newstz = this.getShortTimeZone(newzone);
      if (newstz != null) {
        consigneeZoneFound = true;
        this.consigneeTimeZone = newstz;
        this.consigneeTimeZoneName = newzone;
      }
    }

    if (!consigneeZoneFound && consigneeZip) { this.consigneeTimeZone = 'UTC'; }

    if (this.shipment?.shipmentDetail?.appointmentRequired) {
      $('#labelforpickup').text('Pickup Appointment ' + this.clientTimeZone);
    } else {
      $('#labelforpickup').text('Pickup Window ' + this.clientTimeZone);
    }
    if (this.shipment?.shipmentDetail?.deliveryAppointmentRequired) {
      $('#labelfordelivery').text('Delivery Appointment ' + this.consigneeTimeZone);
    } else {
      $('#labelfordelivery').text('Delivery Window ' + this.consigneeTimeZone);
    }
    this.timezonesLoaded = true;
  }

  getZip(shipperZip: any, consigneeZip: any) {
    this.getTimeZone(shipperZip, consigneeZip);
  }

  setControlValue(value: any, controlName = '', index: any = null) {
    if (controlName === 'shipperName') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }

    if (controlName === 'shipperPlant') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }

    if (controlName === 'consigneeName') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }

    if (controlName === 'consigneePlant') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
      if (this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value) {
        setTimeout(() => { $('#consigneePlant').removeClass('ng-invalid'); }, 100);
      }
    }

    if (controlName === 'billToName') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.setValue(value);
    }

    if (controlName === 'shipmentBillTo') {
      this.disableBillingTerm = this.shipmentType === 'LTL' && value === '3rd Party';
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }

    if (controlName === 'type') {
      this.newShipmentForm.controls["shipmentForm"].get('type')?.setValue(value);
    }

    if (controlName === 'modes') {
      if (this.shipmentType === 'LTL' && value === 'Dedicated') {
        this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Expedited');
      }
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }

    if (controlName === 'priority') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue(value);
      // priority is 'Dedicated', set mode to 'Expedited' reverse
      if (value === 'Expedited') {
        this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Dedicated');
        this.getSpecialInstruction('** DEDICATED SHIPMENT **', false);
      } else {
        this.getSpecialInstruction('** DEDICATED SHIPMENT **', true);
      }
    }

    if (controlName === 'multiStopType') {
      for (let i = 0; i < this.multiStop.controls.length; i++) {
        if (this.shipmentType === 'Truckload' && value === 'Pick Up') {
          this.utilityservice.pickupDateRequired[index] = true;
          this.utilityservice.deliveryDateRequired[index] = false;
        }
        if (this.shipmentType === 'Truckload' && value === 'Drop Off') {
          this.utilityservice.deliveryDateRequired[index] = true;
          this.utilityservice.pickupDateRequired[index] = false;
        }
      }
      this.multiStop.at(index).get('multiStopType')?.setValue(value, {onlySelf: false, emitEvent: true});
    }

    if (controlName === 'multiStopName') {
      this.multiStop.at(index).get('multiStopName')?.setValue(value, {onlySelf: false, emitEvent: true});
    }

    if (controlName === 'multiStopPlant') {
      this.multiStop.at(index).get('multiStopPlant')?.setValue(value, {onlySelf: false, emitEvent: true});
    }

    if (controlName === 'equipment') {
      this.newShipmentForm.controls["shipmentForm"].get('equipment')?.setValue(value);
      if (value) { setTimeout(() => { $('#equipment').removeClass('is-invalid'); }, 100); }
    }

    if (controlName === 'consigneeTier') {
      if (value == 'Tier 3' || value == 'Tier 4') {
        this.whiteglovetier = false;
      } else {
        this.whiteglovetier = true;
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.setValue('');
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue('N/A');
      }

      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
      this.consigneeTierChick = !this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.value;
    }

    if (controlName === 'consigneeFloor') {
      if (value == 'Ground floor') {
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue('N/A');
        this.whiteGloveFloorTier = true;
      } else {
        this.whiteGloveFloorTier = false;
      }
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
      this.floorCheck = !this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.value;
    }
    if (controlName === 'consigneeElevator') {

      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue(value, {
        onlySelf: false,
        emmitEvent: true
      });
    }
  }

  formatPhone(phoneNumber: string) {
    return phoneNumber?.replace('-', '').replace('/', '').replace('(', '').replace(')', '').replace('+', '');
  }

  setCityStateByZip(zip: string, origin: string, country: string, stop: any = null) {
    if (zip == null || zip === '') { return; }
    if (country == null || country === '') { return; }
    if ((country === 'USA' || country === 'MEX') && zip.length < 5) { return; }
    if (country === 'CAN' && zip.length < 3) { return; }
    this.ts.getCityStateByZip(zip, country).subscribe(
      (response: any) => {
        if (origin === 'shipper') {
          this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue(response.city);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue(response.state);
        } else if (origin === 'consignee') {
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue(response.city);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue(response.state);
        } else if (origin === 'billto') {
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue(response.city);
          this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue(response.state);
        } else if (origin === 'stop') {
          this.multiStop.at(stop).get('multiStopCity')?.setValue(response.city, {onlySelf: false, emitEvent: true});
          this.multiStop.at(stop).get('multiStopState')?.setValue(response.state, {onlySelf: false, emitEvent: true});
        }
      },
      () => {
        this.ts.getCityStateByZipGeocoder(zip, country).subscribe(
          (response: any) => {
            if (origin === 'shipper') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue(response.city);
              this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue(response.state);
              this.clientTimeZone = this.getShortTimeZone(response.timezone);
            } else if (origin === 'consignee') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue(response.city);
              this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue(response.state);
              this.consigneeTimeZone = this.getShortTimeZone(response.timezone);
            } else if (origin === 'billto') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue(response.city);
              this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue(response.state);
            } else if (origin === 'stop') {
              this.multiStop.at(stop).get('multiStopCity')?.setValue(response.city, {onlySelf: false, emitEvent: true});
              this.multiStop.at(stop).get('multiStopState')?.setValue(response.state, {onlySelf: false, emitEvent: true});
              this.multiStopTimezone[stop] = response.timezone;
              this.multiStopTimezoneLabel[stop] = this.getShortTimeZone(response.timezone);
            }
          },
          () => {
            if (origin === 'shipper') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue('');
              this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue('');
            } else if (origin === 'consignee') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue('');
              this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue('');
            } else if (origin === 'billto') {
              this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue('');
              this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue('');
            } else if (origin === 'stop') {
              this.multiStop.at(stop).get('multiStopCity')?.setValue('', {onlySelf: false, emitEvent: true});
              this.multiStop.at(stop).get('multiStopState')?.setValue('', {onlySelf: false, emitEvent: true});
            }

            Swal.fire({
              html: '<b>No city and state information found for the zip code ' + zip + ' - ' + country + '</b>',
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            }).then((result) => {
              if (result.isConfirmed) { Swal.close(); }
            });
          });
      });
  }

  resetShipperConsigneeControls() {
    this.showCheckInsuranceAmount = false;
    this.disableBlanket = false;
    this.shipperPlantsDropdown.length = 0;
    this.consigneePlantsDropdown.length = 0;
    this.newShipmentForm.controls["shipperConsigneeForm"].reset(this.getShipperConsignee(), {
      onlySelf: true,
      emmitEvent: true
    });
    if (this.shipmentType === 'LTL') {
      this.disabledPriority = false;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.reset('LTL', {onlySelf: true, emmitEvent: true});
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('3rd Party');
    }
    this.newShipmentForm.controls["shipmentForm"].get('type')?.reset('Direct', {onlySelf: true, emmitEvent: true});
    this.newShipmentForm.controls["shipmentForm"].get('priority')?.reset('STANDARD', {onlySelf: true, emmitEvent: true});

    // Default special instructions to Do not stack line item 1 if a client is changed aka new shipment or a shipment being essentially reset
    if (!this.newShipmentForm.controls["specialInstructionsText"].value.includes('Do NOT stack line item 1')) {
      const val = {item: 'Do NOT stack line item 1', remove: false};
      this.addSpecialInstruction(val);
    }
  }

  validateShipmentIsVolume(isCreateBOL = false, statusShipment = 'PREBOOKED') {
    if (this.shipmentType === 'LTL' && this.rateGrid.volumeRateCheck() &&
      this.rateGrid.ratesGridForm.get('selectedRate')?.value.serviceLevel?.toString().toUpperCase() !== 'VOLUME') {
      this.spinner.hide('spinnerShipmentForm').then();
      Swal.fire({
        title: 'Are you sure you wish to continue booking this as an LTL shipment?',
        html: '<div style="text-align:justify">This shipment exceeds 500 cubic feet, 6 pallet spaces, 12 lineal feet ' +
          'or 5,000 lbs.  This is generally the cut-off point for LTL rating.' +
          '  Your options are to either continue with standard LTL, select one of the VOLUME rates listed herein, ' +
          'or request IL2000 set up a Truckload shipment.</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Continue'
      }).then((result) => {
        if (result.isConfirmed) {
          this.saveShipment(isCreateBOL, false, false, statusShipment);
        } else {
          this.cancelShipment();
        }
      });
    } else {
      this.saveShipment(isCreateBOL, false, false, statusShipment);
    }
  }

  isClientPlantSelected() {
    if (this.shipmentType === 'LTL') {
      this.disabledPriority = false;
      this.disableBillingTerm = false;
      this.disableBlanket = false;
      this.disableBillingTerm = this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == '3rd Party';
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.reset('LTL', {onlySelf: true, emmitEvent: true});
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.reset('STANDARD', {onlySelf: true, emmitEvent: true});
      this.getSpecialInstruction('** DEDICATED SHIPMENT **', true); // REMOVE LINE FROM SPECIAL INSTRUCTIONS
    }

    this.clientPlantSelected = true;
    this.resetWhiteGlove();
    this.whiteglovetier = true;
    this.deliveryAssessorialListSection = false;

    if (!this.isShipmentEdit) {
      this.clientTimeZone = '';
      this.consigneeTimeZone = '';
      this.clientTimeZoneName  = '';
      this.consigneeTimeZoneName = '';

      if (this.shipment?.shipmentDetail?.appointmentRequired) {
        $('#labelforpickup').text('Pickup Appointment ' + this.clientTimeZone);
      } else {
        $('#labelforpickup').text('Pickup Window ' + this.clientTimeZone);
      }
      if (this.shipment?.shipmentDetail?.deliveryAppointmentRequired) {
        $('#labelfordelivery').text('Delivery Appointment ' + this.consigneeTimeZone);
      } else {
        $('#labelfordelivery').text('Delivery Window ' + this.consigneeTimeZone);
      }
    }
  }

  checkstatus(modeCheck: any, priorityCheck: any, statusShipment: any) {
    if (modeCheck === 'Guaranteed LTL' || modeCheck === 'Domestic Ocean' || priorityCheck === 'Guaranteed' ||
      priorityCheck === 'Expedited') {
      if (this.utilityservice.quotescheck) {
        try {
          if (this.shipment?.shipmentDetail) this.shipment.shipmentDetail.shipmentStatus = 'BOOKED';
          return 'BOOKED';
        } catch {
          return 'BOOKED';
        }
      }
      try {
        if (this.shipment?.shipmentDetail) this.shipment.shipmentDetail.shipmentStatus = 'FINDING_QUOTES';
        return 'FINDING_QUOTES';
      } catch {
        return 'FINDING_QUOTES';
      }
    } else {
      try {
        if (this.shipment != null && this.shipment?.shipmentDetail != null) {
          if (this.shipment?.shipmentDetail) this.shipment.shipmentDetail.shipmentStatus = statusShipment;
        }
        return statusShipment;
      } catch (err) {
        return 'PREBOOKED';
      }
    }
  }

  clickCreateBOL() {
    this.bookShipment = true;
    this.createBOL(true);
  }

  createBolWithRates(isCreateBOL = false, statusShipment = 'PREBOOKED') {
    if (this.clientTimeZone == 'UTC' || this.consigneeTimeZone == 'UTC') {
      Swal.fire({
        title: 'The date has not been properly converted and may result in hours not being accurate if you want to continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Continue',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.createBOL(isCreateBOL, statusShipment);
        } else {
          Swal.close();
        }
      });
    } else {
      this.createBOL(isCreateBOL, statusShipment);
    }
  }

  createBOL(isCreateBOL = false, statusShipment = 'PREBOOKED') {
    this.spinner.show('spinnerShipmentForm').then(() => console.log('Save Shipment Spinner'));

    const fncSaveShipment = (): any => {
      try {
        const modeCheck = (document.getElementById('modes') as HTMLInputElement)?.value;
        let priorityCheck: any;
        if (this.shipmentType === 'LTL') {
          priorityCheck = (document.getElementById('priority') as HTMLInputElement)?.value;
        }
        statusShipment = this.checkstatus(modeCheck, priorityCheck, statusShipment);
      } catch {
        statusShipment = 'PREBOOKED';
      }

      const client = (document.getElementById('client') as HTMLInputElement)?.value;
      const plant = (document.getElementById('plant') as HTMLInputElement)?.value;
      const modes = (document.getElementById('modes') as HTMLInputElement)?.value;
      const exception = (document.getElementById('exception') as HTMLInputElement) ?? null;
      const exceptionReason = exception?.value ?? '';

      if (this.clientPlantSelected && client.length > 1 && plant.length > 1) {
      } else {
        document.getElementById('needs-validation')?.classList.add('was-validated');
        this.scrollTo(document.querySelector('input#client'));
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (exceptionReason == '' && this.shoLccExceptionReason) {
        document.getElementById('needs-validation-exception-lcc')?.classList.add('was-validated');
        this.scrollTo(document.querySelector('input#exception'));
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (modes == '' && modes.length === 0) {
        document.getElementById('modesContainer')?.classList.add('was-validated');
        this.scrollTo(document.querySelector('input#client'));
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (this.whiteGlovevalidate()) {
        this.scrollTo(document.querySelector('input#client'));
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (this.validateBillTo(isCreateBOL)) {
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (!isCreateBOL && (statusShipment === 'PREBOOKED' || statusShipment === 'PENDING') &&
        this.shipmentType !== 'Truckload Edit') {
        if (this.groupInfo?.clientCode === '' || this.groupInfo?.clientCode == null) {
          this.scrollTo(document.querySelector('input#client'));
          this.spinner.hide('spinnerShipmentForm');
          return false;
        }
      } else if (isCreateBOL) {
        if (!this.newShipmentForm.valid) {
          this.scrollToError();
          this.spinner.hide('spinnerShipmentForm');
          return false;
        } else if (this.shipmentType === 'LTL') {
          if ((document.getElementById('type') as HTMLInputElement)?.value == '' ||
            (document.getElementById('priority') as HTMLInputElement)?.value == '' ||
            (document.getElementById('shipmentBillTo') as HTMLInputElement)?.value == '' ||
            (document.getElementById('modes') as HTMLInputElement)?.value == '') {
            this.requiredForBOL = true;
            document.getElementById('typeContainer')?.classList.add('was-validated');
            document.getElementById('priorityContainer')?.classList.add('was-validated');
            document.getElementById('billingContainer')?.classList.add('was-validated');
            document.getElementById('modesContainer')?.classList.add('was-validated');
            this.scrollTo(document.querySelector('input#type'));
            this.spinner.hide('spinnerShipmentForm');
            return false;
          }
        }
      } else {
        if (this.newShipmentForm.invalid && this.newShipmentForm.errors) {
          if (this.truckID) {
            const items = this.createLineItemMapping();
            const truckloadWeight = this.getWeightItems(items);
            if (truckloadWeight > 0) {
              this.scrollToError();
              this.spinner.hide('spinnerShipmentForm');
              return false;
            }
          } else {
            this.scrollToError();
            this.spinner.hide('spinnerShipmentForm');
            return false;
          }
        }
      }

      if (this.validateEquipment() || !this.validateInsuranceAmount() || !this.validatingTrackingContacts()) {
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (this.shipmentType !== 'LTL') {
        let failedValidation = false;
        if (!this.validatingTruckFees()) { failedValidation = true; }
        if (this.validateQuotesMissingReasonCode()) { failedValidation = true; }
        if (!this.validateQuotesMissingEquipment()) { failedValidation = true; }
        if (failedValidation) {
          this.spinner.hide('spinnerShipmentForm');
          return false;
        }
      }

      if (this.shipmentType !== 'LTL' && !this.quotes.checkSelectedQuoteandInsuranceAmount()) {
        $('#checkInsuranceAmount').addClass('is-invalid');
        this.spinner.hide('spinnerShipmentForm');
        return false;
      }

      if (this.shipmentID != null && this.groupInfo.clientCode !== this.shipment?.client?.clientCode) {
        // validate if the customer has changed
        Swal.fire({
          title: '',
          html: '<b style="text-align:justify">Are you sure you want to change the client from <b>'
            + this.shipment?.client?.clientCode + '-' + this.shipment?.client?.companyName
            + '</b> to <b>' + this.groupInfo.clientCode + '-' + this.groupInfo.companyName + '</b>?</div>',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Continue'
        }).then((result) => {
          if (result.isConfirmed) {
            this.validateShipmentIsVolume(isCreateBOL, statusShipment);
          } else {
            this.spinner.hide('spinnerShipmentForm');
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/new/' + this.shipmentID + '/' + this.shipment?.client?.groupID]).then();
            });
          }
        });
      } else {
        this.validateShipmentIsVolume(isCreateBOL, statusShipment);
      }
    };
    setTimeout(() => fncSaveShipment(), 300);
  }

  saveShipment(isCreateBOL = false, postLoadBoard = false, updateLoadBoard = false, statusShipment = 'PREBOOKED') {
    // set shipmentID to null when editing as clone
    if (this.disabledEditAsClone) { this.shipmentID = null; }
    let shipmentDetails: any;
    this.createShipmentDetail(statusShipment);
    this.createClient();
    this.createUserDetail();
    this.createCarrierDetail();
    this.createShipperConsignee();
    this.createBillTo();
    this.createTargetRate();
    this.lineItems = this.createLineItemMapping();
    this.truckFees = this.createTruckFees();
    const accessories: any[] = this.createAccessorialMapping();
    if (isCreateBOL) {
      if (this.shipmentID) {
        if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = (this.bookShipment ? 'BOOKED' :
          (this.shipment?.shipmentDetail?.shipmentStatus ?? ''));
        if (this.shipmentDetail) this.shipmentDetail.shipmentID = this.shipmentID;
      } else {
        if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = 'PREBOOKED';
        if (this.bookShipment && this.utilityservice.quotescheck) {
          if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = 'BOOKED';
        }
      }
    } else {
      if (this.shipmentID) {
        if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = this.shipment?.shipmentDetail?.shipmentStatus ?? '';
      } else {
        if (this.shipmentType === 'LTL' && this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID) {
          if (statusShipment === 'BOOKED') {
            if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = 'BOOKED';
          } else {
            if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = 'PREBOOKED';
          }
        } else {
          if (this.shipmentDetail) this.shipmentDetail.shipmentStatus = statusShipment;
        }
      }
    }

    this.saveRates();

    this.whiteGlove = {
      recipientname: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.value,
      telephone: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.value,
      email: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.value,
      deliveryWindowStart: this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.value,
      deliveryWindowEnd: this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.value,
      tier: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.value,
      floor: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.value,
      elevator: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.value,
      deliveryinstructions: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientDeliveryInstructions')?.value
    };

    this.shipment = {
      shipmentDetail: this.shipmentDetail,
      client: this.client,
      user: this.userDetail,
      carrierDetail: this.carrierDetail,
      shipper: this.shipper,
      consignee: this.consignee,
      billTo: this.selectedBillTo,
      lineItems: this.lineItems,
      referenceFields: this.reference.saveReferences(),
      openReferenceFields: this.reference.saveOpenReferences(),
      manualQuotes: this.customRates,
      accessorials: accessories,
      historicalEvents: this.shipmentID != null ? (this.shipment?.historicalEvents ?? []) : [],
      targetRates: this.targetRate,
      notificationMails: this.shipmentID != null ? (this.shipment?.notificationMails ?? []) : [],
      whiteGlove: this.whiteGlove,
      trackingContacts: this.trackingContacts
    };
    this.addCheapestRate();
    if (this.shipmentDetail) this.shipmentDetail.priority = this.shipmentDetail.priority.toUpperCase();

    if ((this.truckID && this.shipmentDetail?.shipmentID) || this.shipmentDetail?.shipmentID) {
      // UPDATE EXISTING SHIPMENT
      if (this.truckID && this.shipmentType === 'Truckload') {
        let truckResponse: any;
        this.truck = this.setTruckloadShipment(statusShipment);
        this.truck.truckID = this.truckID;

        if (this.truck?.shipments){
          for (let i = 0; i < this.truck?.shipments?.length; i++) {
            // Only for intermediate stops
            if (i !== this.truck?.shipments?.length - 1) {
              const timezoneStop = this.multiStopTimezone[i];
              const timezoneConsignee = this.consigneeTimeZoneName;

              // Get the original delivery times before conversion
              let stopDeliveryStart = this.truck?.shipments[i].shipmentDetail?.deliveryAppointmentStart; // 2023-06-25T13:00
              let stopDeliveryStop = this.truck?.shipments[i].shipmentDetail?.deliveryAppointmentStop; // 2023-06-25T13:00

              // Calculate the hour difference from consignee and stop consignee
              const hourDifference = (moment.tz(timezoneConsignee).utcOffset() - moment.tz(timezoneStop).utcOffset()) / 60;

              // Add or subtract the hour difference
              stopDeliveryStart = moment(stopDeliveryStart).add(hourDifference, 'hours').format('YYYY-MM-DDTHH:mm');
              stopDeliveryStop = moment(stopDeliveryStop).add(hourDifference, 'hours').format('YYYY-MM-DDTHH:mm');

              if (this.truck?.shipments && this.truck.shipments[i]?.shipmentDetail) {
                this.truck.shipments[i].shipmentDetail.deliveryAppointmentStart = stopDeliveryStart;
                this.truck.shipments[i].shipmentDetail.deliveryAppointmentStop = stopDeliveryStop;
              }
            }
          }
        }

        this.tss.updateTruck(this.truck).subscribe({
          next: response => {
            truckResponse = response;
            shipmentDetails = response.shipments.length === 1 ? response.shipments[0] : response.shipments[response.shipments.length - 1];
            if (shipmentDetails.targetRates == null) { this.getSaveTargetRates(truckResponse.truckID); }
          },
          error: () => {
            this.spinner.hide('spinnerShipmentForm').then();
          },
          complete: async () => {
            this.spinner.hide('spinnerShipmentForm').then();

            if ((truckResponse.state == 'FINDING_QUOTES' || truckResponse.state == 'PREBOOKED' ||
              truckResponse.state == 'QUOTE_SENT_TO_CLIENT' || truckResponse.state == 'PENDING') && truckResponse.loadPostedTT) {
              console.log('sync-update load in trucker tools');
              await this.postToTruckerTools(truckResponse);
            }

            if (postLoadBoard) {
              if (this.truck){
                this.truck.shipments = [];
                this.truck.shipments.length = 0;
                this.truck.shipments = truckResponse.shipments;
                this.truck.tlQuotes = [];
                this.truck.tlQuotes.length = 0;
                this.truck.tlQuotes = truckResponse.tlQuotes;
              }
              await this.postToLoadBoard(truckResponse, truckResponse.loadPosted);
            }
            this.newShipmentType = shipmentDetails.shipmentDetail.mode;
            await this.createAuditingNotes(shipmentDetails);

            this.createAccesorialFeeNotes(this.truck);

            if (this.carrierOnboarded) {
              for (let i = 0; i < this.carrierOnboardedNotes.length; i++) {
                const note: Note = {
                  notText: this.carrierOnboardedNotes[i].note,
                  notCognitoUsername: this.userName,
                  notID: null,
                  notTimeStamp: new Date(),
                  clientNote: false,
                  isNeedsManagement: false
                } as Note;
                this.rs.addNote(truckResponse.shipments[truckResponse.shipments.length - 1].shipmentDetail.shipmentID,
                  false, note).subscribe();
              }
            }

            if (this.quoteAssigned) {
              let carrierQuoteSelected: any = '';
              let isQuoteAssigned = false;

              if (this.truck?.tlQuotes){
                for (let i = 0; i < this.truck.tlQuotes.length; i++) {
                  if (this.truck.tlQuotes[i].assigned) {
                    isQuoteAssigned = true;
                    this.selectedQuoteID = this.truck.tlQuotes[i].carrierID;
                    carrierQuoteSelected = this.truck.tlQuotes[i].carrierName;
                  }
                }
              }

              if (isQuoteAssigned) {
                // validate if selected quote changed
                if (this.selectedQuoteID && this.carrierQuoteAssigned && this.selectedQuoteID !== this.carrierQuoteAssigned) {
                  const noteText = 'Quote of the carrier \'' + carrierQuoteSelected + '\' has been selected by ' + this.userName;
                  const note: Note = {
                    notText: noteText,
                    notCognitoUsername: this.userName,
                    notID: null,
                    notTimeStamp: new Date(),
                    clientNote: false,
                    isNeedsManagement: false
                  } as Note;
                  this.rs.addNote(Number(shipmentDetails.shipmentDetail.shipmentID), false, note).subscribe();
                }
              } else {
                if (this.selectedQuoteRemoved || this.selectedQuoteDeselected) {
                  const noteText = 'Quote has been ' + (this.selectedQuoteRemoved ? 'Removed' : 'Deselected') + ' by ' +
                    this.userName + ' on edit shipment page.';
                  // add note to every shipment
                  const note: Note = {
                    notText: noteText,
                    notCognitoUsername: this.userName,
                    notID: null,
                    notTimeStamp: new Date(),
                    clientNote: false,
                    isNeedsManagement: false
                  } as Note;
                  this.rs.addNote(Number(shipmentDetails.shipmentDetail.shipmentID), false, note).subscribe();

                  const statusUpdate: any = {
                    shipmentID: shipmentDetails.shipmentDetail.shipmentID,
                    actualDate: null,
                    trackingDate: new Date((new Date().setHours(new Date().getHours() - (new Date().getTimezoneOffset() / 60))))
                      .toISOString().slice(0, 16),
                    trackingMessage: '',
                    trackingState: 'Prebooked',
                    currentCity: '',
                    currentState: '',
                    enteredBy: this.userName
                  };

                  const trackDate = new Date(statusUpdate.trackingDate);
                  statusUpdate.trackingDate = new Date(Date.UTC(trackDate.getFullYear(), trackDate.getMonth(), trackDate.getDate(),
                    trackDate.getHours(), trackDate.getMinutes(), trackDate.getSeconds()));
                  this.tss.updateTruckTracking(this.truck?.truckID, statusUpdate).subscribe();
                }
              }
            } else {
              let carrierQuoteSelected: any = '';
              if (this.truck?.tlQuotes){
                for (let i = 0; i < this.truck.tlQuotes.length; i++) {
                  if (this.truck.tlQuotes[i].assigned) {
                    this.quoteAssigned = true;
                    this.selectedQuoteID = this.truck.tlQuotes[i].carrierID;
                    carrierQuoteSelected = this.truck.tlQuotes[i].carrierName;
                  }
                }
              }

              if (this.quoteAssigned) {
                const noteText = 'Quote of the carrier \'' + carrierQuoteSelected + '\' has been selected by ' + this.userName;
                const note: Note = {
                  notText: noteText,
                  notCognitoUsername: this.userName,
                  notID: null,
                  notTimeStamp: new Date(),
                  clientNote: false,
                  isNeedsManagement: false
                } as Note;
                this.rs.addNote(Number(shipmentDetails.shipmentDetail.shipmentID), false, note).subscribe();

                const statusUpdate: any = {
                  shipmentID: shipmentDetails.shipmentDetail.shipmentID,
                  actualDate: null,
                  trackingDate: new Date((new Date().setHours(new Date().getHours() - (new Date().getTimezoneOffset() / 60))))
                    .toISOString().slice(0, 16),
                  trackingMessage: '',
                  trackingState: 'Booked',
                  currentCity: '',
                  currentState: '',
                  enteredBy: this.userName
                };
                const statusDate = statusUpdate.trackingDate;
                const trackDate = new Date(statusUpdate.trackingDate ?? '');
                statusUpdate.trackingDate = new Date(Date.UTC(trackDate.getFullYear(), trackDate.getMonth(), trackDate.getDate(),
                  trackDate.getHours(), trackDate.getMinutes(), trackDate.getSeconds()));

                this.tss.updateTruckTracking(this.truck?.truckID, statusUpdate).subscribe({
                  next: () => {
                    if (this.enableTrackingEmails) { this.sendStatusNotificationMail(statusUpdate, statusDate, truckResponse); }
                  }
                });
              }
            }

            if (this.flagTruckNotUsed) {
              const note: Note = {
                notText: this.truckNotUsedNote,
                notCognitoUsername: this.userName,
                notID: null,
                notTimeStamp: null,
                clientNote: false,
                isNeedsManagement: false
              } as Note;
              if (this.truck?.shipments)
                this.rs.addNote(Number(this.truck?.shipments[this.truck?.shipments?.length - 1]?.shipmentDetail?.shipmentID),
                  false, note).subscribe();
            }

            if (this.newShipmentForm.controls["internalNotesText"].value.length > 0) {
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, false,
                this.newShipmentForm.controls["internalNotesText"].value).subscribe();
            }

            if (this.newShipmentForm.controls["externalNotesText"].value.length > 0) {
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, true,
                this.newShipmentForm.controls["externalNotesText"].value).subscribe();
            }

            this.resetShipmentEdited();
            Swal.fire('Truckload Shipment updated' + (postLoadBoard ? ' and posted to DAT board!' : '!'),
              'Truckload Shipment updated with Truck ID <b>' + truckResponse.truckID + '</b>', 'success').then(() => {
              this.router.navigate(['SPAs/tracking/truckload-details/' + truckResponse.truckID + '/' +
              truckResponse.shipments[0].client.groupID]).then();
            });
          }
        });
      } else {
        if (this.isSmallParcelRate) { if (this.shipment?.shipmentDetail) this.shipment.shipmentDetail.shipmentStatus = 'PARCEL_SHIPPED'; }
        if (this.isSmallParcelRate) { isCreateBOL = false; }
        this.sss.updateShipment(this.shipment).subscribe({
          next: response => {
            shipmentDetails = response;
            const statusFK = shipmentDetails.shipmentDetail?.shipmentStatus;
            if (isCreateBOL && (statusFK === 'PENDING' || statusFK === 'PREBOOKED' || statusFK === 'FINDING_QUOTES' ||
              statusFK === 'QUOTE_SENT_TO_CLIENT' || statusFK === 'COMPLETE' || statusFK === 'REQUEST_FOR_QUOTE')) {
              this.rs.updateTrackingShipmentDetails(this.shipmentID, { shipmentStatus: 'BOOKED' }).subscribe();
            }
          },
          error: () => {
            this.spinner.hide('spinnerShipmentForm').then();
          },
          complete: async () => {
            // submit notes if present
            await this.createAuditingNotes(shipmentDetails);

            if (this.newShipmentForm.controls["internalNotesText"].value.length > 0) {
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, false,
                this.newShipmentForm.controls["internalNotesText"].value).subscribe();
            }
            if (this.newShipmentForm.controls["externalNotesText"].value.length > 0) {
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, true,
                this.newShipmentForm.controls["externalNotesText"].value).subscribe();
            }

            this.spinner.hide('spinnerShipmentForm').then();
            this.resetShipmentEdited();
            if (isCreateBOL) {
              // send it to dispatch after shipment creation
              if (shipmentDetails) {

                // SEND TRACKING EMAIL ON BOOKED STATUS
                if (this.enableTrackingEmails) {
                  const statusUpdateMail = {
                    shipmentID: shipmentDetails.shipmentDetail.shipmentID,
                    actualDate: null,
                    trackingDate: new Date().toISOString().slice(0, 16),
                    trackingMessage: 'Shipment created with Shipment ID ' + shipmentDetails.shipmentDetail.shipmentID,
                    trackingState: 'BOOKED',
                    currentCity: '',
                    currentState: '',
                    enteredBy: this.userName
                  };
                  this.getTrackingContactsAndSendMail(shipmentDetails, statusUpdateMail, new Date().toISOString().slice(0, 16));
                }

                this.router.navigate(['SPAs/pickup/' + shipmentDetails.shipmentDetail.shipmentID],
                  {
                    state: {
                      data: shipmentDetails,
                      email: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.value,
                      contact: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.value,
                      phone: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.value
                    }
                  }).then();
              }
            } else {
              Swal.fire('Shipment updated' + (postLoadBoard ? ' and posted to DAT board!' : '!'),
                'Shipment updated with Shipment ID <b>' + shipmentDetails.shipmentDetail.shipmentID + '</b>', 'success').then(() => {
                this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
                  this.router.navigate(['SPAs/tracking/tracking-details/' + shipmentDetails.shipmentDetail.shipmentID + '/' +
                  this.client?.groupID]).then();
                });
              });
            }
          }
        });
      }
    } else {
      // Create Truckload
      if (this.shipmentType === 'Truckload') {
        let truckResponse: any;
        const truck = this.setTruckloadShipment(statusShipment);

        if (truck.shipments){
          for (let i = 0; i < truck.shipments.length; i++) {
            // Only for intermediate stops
            if (i !== truck.shipments.length - 1) {
              const timezoneStop = this.multiStopTimezone[i];
              const timezoneConsignee = this.consigneeTimeZoneName;

              // Get the original delivery times before conversion
              let stopDeliveryStart = truck.shipments[i].shipmentDetail?.deliveryAppointmentStart; // 2023-06-25T13:00
              let stopDeliveryStop = truck.shipments[i].shipmentDetail?.deliveryAppointmentStop; // 2023-06-25T13:00

              // Calculate the hour difference from consignee and stop consignee
              const hourDifference = (moment.tz(timezoneConsignee).utcOffset() - moment.tz(timezoneStop).utcOffset()) / 60;

              // Add or subtract the hour difference
              stopDeliveryStart = moment(stopDeliveryStart).add(hourDifference, 'hours').format('YYYY-MM-DDTHH:mm');
              stopDeliveryStop = moment(stopDeliveryStop).add(hourDifference, 'hours').format('YYYY-MM-DDTHH:mm');

              if (truck?.shipments && truck.shipments[i].shipmentDetail){
                truck.shipments[i].shipmentDetail.deliveryAppointmentStart = stopDeliveryStart;
                truck.shipments[i].shipmentDetail.deliveryAppointmentStop = stopDeliveryStop;
              }
            }
          }

          this.tss.saveTruck(truck).subscribe({
            next: response => {
              truckResponse = response;
              if (this.targetRate == null) { this.getSaveTargetRates(truckResponse.truckID); }
            },
            error: () => {
              this.spinner.hide('spinnerShipmentForm').then();
            },
            complete: async () => {
              this.spinner.hide('spinnerShipmentForm').then();
              truck.shipments = [];
              truck.shipments.length = 0;
              truck.shipments = truckResponse.shipments;
              if (postLoadBoard) {
                truck.truckID = truckResponse.truckID;
                truck.tlQuotes = [];
                truck.tlQuotes.length = 0;
                truck.tlQuotes = truckResponse.tlQuotes;
                await this.postToLoadBoard(truck);
              }

              this.createAccesorialFeeNotes(truck);

              if (this.carrierOnboarded) {
                for (let i = 0; i < this.carrierOnboardedNotes.length; i++) {
                  const note: Note = {
                    notText: this.carrierOnboardedNotes[i].note,
                    notCognitoUsername: this.userName,
                    notID: null,
                    notTimeStamp: new Date(),
                    clientNote: false,
                    isNeedsManagement: false
                  } as Note;
                  this.rs.addNote(truckResponse.shipments[truckResponse.shipments.length - 1].shipmentDetail.shipmentID,
                    false, note).subscribe();
                }
              }

              this.resetShipmentEdited();

              Swal.fire('Truckload Shipment created' + (postLoadBoard ? ' and posted to DAT board!' : '!'),
                'Truckload Shipment created with Truck ID <b>' + truckResponse.truckID + '</b>', 'success').then(() => {
                setTimeout(() => {
                  this.router.navigate(['SPAs/tracking/truckload-details/' + truckResponse.truckID + '/' +
                  truckResponse.shipments[0].client.groupID]).then();
                }, 1000);
              });
            }
          });
        }

      } else {
        if (this.isSmallParcelRate) { if (this.shipment?.shipmentDetail) this.shipment.shipmentDetail.shipmentStatus = 'PARCEL_SHIPPED'; }
        if (this.isSmallParcelRate) { isCreateBOL = false; }
        this.sss.saveShipment(this.shipment).subscribe({
          next: response => {
            shipmentDetails = response;
          },
          error: () => {
            this.spinner.hide('spinnerShipmentForm').then();
          },
          complete: async () => {
            if (this.newShipmentForm.controls["internalNotesText"].value.length > 0) {
              const note: Note = {
                notText: this.newShipmentForm.controls["internalNotesText"].value,
                notCognitoUsername: this.userName,
                notID: null,
                notTimeStamp: new Date(),
                clientNote: false,
                isNeedsManagement: false
              } as Note;
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, false, note).subscribe();
            }
            if (this.newShipmentForm.controls["externalNotesText"].value.length > 0) {
              const note: Note = {
                notText: this.newShipmentForm.controls["externalNotesText"].value,
                notCognitoUsername: this.userName,
                notID: null,
                notTimeStamp: new Date(),
                clientNote: false,
                isNeedsManagement: false
              } as Note;
              this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, true, note).subscribe();
            }

            this.spinner.hide('spinnerShipmentForm').then();
            this.resetShipmentEdited();
            if (isCreateBOL) {
              // dispatch after shipment creation
              if (shipmentDetails) {

                // SEND TRACKING EMAIL ON BOOKED STATUS
                if (this.enableTrackingEmails) {
                  const statusUpdateMail = {
                    shipmentID: shipmentDetails.shipmentDetail.shipmentID,
                    actualDate: null,
                    trackingDate: new Date().toISOString().slice(0, 16),
                    trackingMessage: 'Shipment created with Shipment ID ' + shipmentDetails.shipmentDetail.shipmentID,
                    trackingState: 'BOOKED',
                    currentCity: '',
                    currentState: '',
                    enteredBy: this.userName
                  };
                  this.getTrackingContactsAndSendMail(shipmentDetails, statusUpdateMail, new Date().toISOString().slice(0, 16));
                }

                this.router.navigate(['SPAs/pickup/' + shipmentDetails.shipmentDetail.shipmentID],
                  {
                    state: {
                      data: shipmentDetails,
                      email: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.value,
                      contact: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.value,
                      phone: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.value
                    }
                  }).then();
              }
            } else {
              Swal.fire('Shipment created' + (postLoadBoard ? ' and posted to DAT board!' : '!'),
                'Shipment created as ' + shipmentDetails.shipmentDetail?.shipmentStatus + ' with Shipment ID <b>' +
                shipmentDetails.shipmentDetail.shipmentID + '</b>', 'success').then(() => {
                this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
                  // add CSS back for new shipments page column
                  $('#newShipmentFormContainer').addClass('revertToNormal');
                  this.router.navigate(['SPAs/tracking/tracking-details/' + shipmentDetails.shipmentDetail.shipmentID + '/' +
                  this.client?.groupID]).then();
                });
              });
            }
          }
        });
      }
    }
  }

  createLineItemMapping(): LineItem[] {
    const lineItems = [] as LineItem[];
    const lineItemValues = this.newShipmentForm.get('lineItems')?.value?.freights;
    for (const i in lineItemValues) {
      if (this.shipmentType === 'LTL' || this.shipmentType === 'Truckload Edit' ||
        (this.shipmentType === 'Truckload' && lineItemValues[i]?.location?.toLowerCase() == 'final destination')) {
        lineItems.push(
          {
            productID: lineItemValues[i].productID,
            productCode: lineItemValues[i].item,
            productDescription: lineItemValues[i].description,
            nmfc: lineItemValues[i].nmfcNumber,
            freightClass: lineItemValues[i].classNumber,
            handlingUnits: lineItemValues[i].unitNumber,
            unitType: lineItemValues[i].unitType,
            hazmat: lineItemValues[i].hm == true ? 1 : 0,
            pieces: lineItemValues[i].piecesNumber,
            length: lineItemValues[i].length,
            width: lineItemValues[i].width,
            height: lineItemValues[i].height,
            unitWeight: lineItemValues[i].piecesInputOne,
            totalWeight: lineItemValues[i].piecesInputTwo,
            stackable: lineItemValues[i].stackChk,
            sameSkid: lineItemValues[i].sameSkid,
            location: lineItemValues[i].location
          });
      }
    }
    return lineItems;
  }

  createTruckFees(): TruckFees[] {
    const tfs = [] as TruckFees[];
    this.truckFees.forEach((item) => {
      if (item.accessorialTypeId && ((item.amount && item.amount != 0) || (item.sellAmount && item.sellAmount != 0))) {
        tfs.push(
          {
            truckFeesId: item.truckFeesId,
            truckId: item.truckId,
            carrierCharge: (item.amount && item.amount != 0 ? true : false),
            customerCharge: (item.sellAmount && item.sellAmount != 0 ? true : false),
            accessorialTypeId: item.accessorialTypeId,
            amount: item.amount ? item.amount : 0,
            sellAmount: item.sellAmount ? item.sellAmount : 0,
            truckQuoteId: item.truckQuoteId,
            carrierId: item.carrierId,
            feeIncurredAt: item.feeIncurredAt,
            feeStartTime: item.feeStartTime,
            feeEndTime: item.feeEndTime,
            stopNum: item.stopNum
          }
        );
      }
    });
    return tfs;
  }

  isInArray(value: any, array: any) {
    for (const accessorial of array) {
      if (JSON.stringify(accessorial) === JSON.stringify(value)) {
        return true;
      }
    }
    return false;
  }

  createAccessorialMapping() {
    const accesorialsArray: any[] = [];
    let adjustedArray: any[];
    const pickupAccessorials = this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPickupAcc')?.value;
    const deliveryAccessorials = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeDeliveryAcc')?.value;

    if (pickupAccessorials != null) {
      for (const accessorial of pickupAccessorials) {
        if (deliveryAccessorials != null && this.isInArray(accessorial, deliveryAccessorials)) {
          accesorialsArray.push(
            {accessorialID: accessorial.chtID, accessorialName:  accessorial.chtDescription, Buy: 0, Sell: 0, Type: 'Both'});
        } else {
          accesorialsArray.push({
            accessorialID: accessorial.chtID,
            accessorialName: accessorial.chtDescription,
            Buy: 0,
            Sell: 0,
            Type: 'Shipper'
          });
        }
      }
    }

    if (deliveryAccessorials != null) {
      for (const accessorial of deliveryAccessorials) {
        accesorialsArray.push({
          accessorialID: accessorial.chtID,
          accessorialName: accessorial.chtDescription,
          Buy: 0,
          Sell: 0,
          Type: 'Consignee'
        });
      }
    }

    adjustedArray = accesorialsArray.filter((v, i, a) => a.findIndex(v2 => (v2.accessorialID === v.accessorialID)) === i);

    if (this.shipmentType === 'LTL' && this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID &&
      this.rateGrid.selectedRateFormat) {
      const feeMapping = this.rateGrid.selectedRateFormat;

      for (const fee of feeMapping) {
        if (fee.name === 'Gross') {
          adjustedArray.push({
            accessorialID: 1, accessorialName: 'Gross Price',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Discount') {
          adjustedArray.push({
            accessorialID: 559, accessorialName: 'Discount',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Fuel' || fee.name === 'Fuel Surcharge') {
          adjustedArray.push({
            accessorialID: 3, accessorialName: 'Fuel Surcharge',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name?.toLowerCase()?.includes('gstamount')) {
          adjustedArray.push({
            accessorialID: 11000, accessorialName: 'Canadian GST Tax',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name?.toLowerCase()?.includes('hstamount')) {
          adjustedArray.push({
            accessorialID: 11001, accessorialName: 'Canadian HST Tax',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name?.toLowerCase()?.includes('pstamount')) {
          adjustedArray.push({
            accessorialID: 11002, accessorialName: 'Canadian PST Tax',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name?.toLowerCase().includes('qstamount')) {
          adjustedArray.push({
            accessorialID: 11003, accessorialName: 'Canadian QST Tax',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Additional Insurance') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 916);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 916, accessorialName: 'Additional Insurance',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'CA Compliance Fee') {
          adjustedArray.push({
            accessorialID: 917, accessorialName: 'CA Compliance Fee',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Overlength Charge') {
          adjustedArray.push({
            accessorialID: 42, accessorialName: 'Overlength',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'High Cost Area Fee') {
          adjustedArray.push({
            accessorialID: 7836, accessorialName: 'High Cost Area Fee',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Construction Site Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 23);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 23, accessorialName: 'Construction Site',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Grocery Warehouse Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 912);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 912, accessorialName: 'Grocery Warehouse',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'HazMat Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 22);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 22, accessorialName: 'Hazmat',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Processing Fee') {
          adjustedArray.push({
            accessorialID: 5, accessorialName: 'Processing Fee',
            Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
          });
        }

        if (fee.name === 'Lift Gate Surcharge') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 7);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 7, accessorialName: 'Lift Gate Req\'d',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Notify Charge') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 4);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 4, accessorialName: 'Notify Before Del.',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Appointment Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 21);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 21, accessorialName: 'Set Appointment',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Military Delivery Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 24);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 24, accessorialName: 'Military Delivery',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Inside Delivery Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 26);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 26, accessorialName: 'Inside Delivery',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Protect From Freezing') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 169);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 169, accessorialName: 'Keep From Freezing',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Limited Access Delivery') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 180);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 180, accessorialName: 'Limited Access Del.',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Canadian GST Tax') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 11000);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 11000, accessorialName: 'Canadian GST Tax',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Canadian HST Tax') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 11001);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 11001, accessorialName: 'Canadian HST Tax',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Canadian PST Tax') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 11002);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 11002, accessorialName: 'Canadian PST Tax',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Canadian QST Tax') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 11003);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 11003, accessorialName: 'Canadian QST Tax',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Canadian Border Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 27);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 27, accessorialName: 'Canadian Border Fee',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }

        if (fee.name === 'Residential Delivery Fee') {
          const index = adjustedArray.findIndex(f => f.accessorialID == 25);
          if (index > -1) {
            adjustedArray[index].Buy = this.removeFormattingForCharge(fee.ilCost);
            adjustedArray[index].Sell = this.removeFormattingForCharge(fee.clientCost);
          } else {
            adjustedArray.push({
              accessorialID: 25, accessorialName: 'Residential Delivery',
              Buy: this.removeFormattingForCharge(fee.ilCost), Sell: this.removeFormattingForCharge(fee.clientCost)
            });
          }
        }
      }
    }
    return adjustedArray;
  }

  removeFormattingForCharge(charge: any) {
    if (charge != null) {
      const htmlCharge = charge.replace('<span class="text-center">', '').replace('</span>', '').replace('$', '');
      charge = htmlCharge.replace(/-/g, '').replace(/,/g, '');
    }
    return charge;
  }

  createManualQuoteMapping(): any {
    const tlQuotesArray = [] as TLManualQuote[];
    const tlQuote = this.newShipmentForm.get('tlQuotes')?.value?.quotes;
    for (const i in tlQuote) {
      if ((tlQuote[i].carrierID && tlQuote[i].carrierID !== '') || tlQuote[i].clientCost || tlQuote[i].carrierCost) {
        let quoteNote = tlQuote[i].notes;
        if (tlQuote[i].currencyID != tlQuote[i].defaultCurrencyID) { quoteNote = quoteNote + (quoteNote != '' ? '. ' : '') + 'User ' +
          this.userName + ' has enabled currency override.'; }
        tlQuotesArray.push(
          {
            quoteID: tlQuote[i].quoteID,
            carrierName: tlQuote[i].carrierName,
            carrierID: tlQuote[i].carrierID,
            clientCost: tlQuote[i].clientCost,
            carrierCost: tlQuote[i].carrierCost,
            quoteNumber: tlQuote[i].quoteNumber,
            transitTime: tlQuote[i].transitTime,
            notes: quoteNote,
            assigned: tlQuote[i].assigned,
            truckNotUsed: tlQuote[i].truckNotUsed,
            equipment: tlQuote[i].equipment,
            reasonCode: tlQuote[i].reasonCode,
            lostReasonNotes: tlQuote[i].lostReasonNotes,
            currencyID: tlQuote[i].currencyID,
            exchangeRate: tlQuote[i].exchangeRate,
            rateDate: tlQuote[i].rateDate,
            exchangeInfo: tlQuote[i].exchangeInfo,
            clientQuote: tlQuote[i].clientQuote
          }
        );
      }
    }
    return tlQuotesArray;
  }

  createClient() {
    this.client = {
      address: null,
      city: null,
      companyName: null,
      contactName: null,
      email: null,
      groupName: null,
      lpTeamEmail: null,
      phone: null,
      state: null,
      zip: null,
      tiberID: null,
      groupID: this.groupInfo.groupID ? this.groupInfo.groupID : (this.shipment?.client?.groupID ?? null),
      clientCode: this.groupInfo.clientCode,
      onHold: false,
      cutAbbreviation: null
    };
  }

  createUserDetail() {
    this.userDetail = {
      userID: null,
      userName: this.userName
    };
  }

  createCarrierDetail() {
    this.carrierDetail = {
      address1: null,
      carrierID: null,
      carrierName: this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID ?
        this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierName : null,
      city: null,
      phone: null,
      postalCode: null,
      scac: null,
      state: null,
      tiberID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID ?
        this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID : null,
      mcNumber: null,
      dotNumber: null,
      onboarded: null,
      inNetworkTT: null
    };
  }

  createShipmentDetail(statusShipment: string) {
    let customerQuote = null;
    if (this.rateGrid.ratesGridForm.get('selectedRate')?.value.customerQuote != null) {
      customerQuote = this.rateGrid.ratesGridForm.get('selectedRate')?.value.customerQuote.quote;
    } else {
      if (this.shipmentID != null) {
        customerQuote = this.shipment?.shipmentDetail?.customerCost;
      }
    }

    const selectedRate = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    this.isTruckloadShipment = this.shipmentType === 'LTL' && selectedRate && selectedRate.isTLRate;

    if (this.shipmentType === 'LTL' && (selectedRate && (selectedRate.isVolumeRate || selectedRate.rateType == RateType.RATER_VOLUME))) {
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Volume LTL');
      this.isVolumeRate = true;
    }

    let shipmentMode: string = '';
    if (this.isSmallParcelRate) { this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Small package'); }
    if (this.showInsuranceField) {
      const insuranceValue = this.newShipmentForm.controls["additionalInsurance"].value;
      if (insuranceValue && parseInt(insuranceValue) > 0) {
        this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Guaranteed LTL');
      }
    }
    this.modesDropdown?.forEach((value) => {
      if (this.newShipmentForm.controls["shipmentForm"].get('modes')?.value) {
        if (this.newShipmentForm.controls["shipmentForm"].get('modes')?.value == value.modDescription) {
          shipmentMode = value.modeId;
        }
      }
    });

    if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value) {
      this.pickupAppointmentStart = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value + 'T' +
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value;
    }
    if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value) {
      this.pickupAppointmentStop = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value + 'T' +
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value;
    }
    if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value &&
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value) {
      this.deliveryAppointmentStart = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value + 'T' +
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value;
    }
    if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value &&
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value) {
      this.deliveryAppointmentStop = this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value + 'T' +
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value;
    }

    this.shipmentDetail = {
      shipmentID: this.shipmentID == null ? null : this.shipmentID,
      shipmentStatus: this.shipmentID != null ? (this.shipment?.shipmentDetail?.shipmentStatus ?? '') : statusShipment,
      enteredShipDate: this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value,
      mabdDate: this.newShipmentForm.controls["shipmentForm"].get('MABDDate')?.value,
      mode: shipmentMode,
      terms: this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value,
      priority: this.newShipmentForm.controls["shipmentForm"].get('priority')?.value,
      specialInstructions: this.newShipmentForm.controls["specialInstructionsText"].value,
      carrier: this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierName,
      carrierID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID,
      proNumber: this.shipmentID != null ? (this.shipment?.shipmentDetail?.proNumber ?? '') : '',
      bolNumber: this.shipmentID != null ? (this.shipment?.shipmentDetail?.bolNumber ?? '') : '',
      poNumber: this.newShipmentForm.controls["poNumber"].value,
      pickupNumber: this.shipmentID != null ? (this.shipment?.shipmentDetail?.pickupNumber ?? '') : '',
      publishedTransitTime: this.rateGrid.ratesGridForm.get('selectedRate')?.value.transitTime ?
        this.rateGrid.ratesGridForm.get('selectedRate')?.value.transitTime : this.shipmentID != null ?
          this.shipment?.shipmentDetail?.publishedTransitTime : null,
      estimatedTransitTime: this.shipmentID != null ? this.shipment?.shipmentDetail?.estimatedTransitTime ?? '' : '',
      calculatedTransitTime: this.shipmentID != null ? this.shipment?.shipmentDetail?.calculatedTransitTime ?? '' : '',
      actualShipDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.actualShipDate ?? null : null,
      scheduledDeliveryDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.scheduledDeliveryDate ?? null : null,
      carrierEstimatedDeliveryDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.carrierEstimatedDeliveryDate ?? null : null,
      deliveryAppointmentDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.deliveryAppointmentDate ?? null : null,
      actualDeliveryDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.actualDeliveryDate ?? null : null,
      quoteID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.quoteID ?
        this.rateGrid.ratesGridForm.get('selectedRate')?.value.quoteID : this.shipmentID != null ?
          this.shipment?.shipmentDetail?.quoteID : null,
      quotedCost: this.shipmentID != null ? this.shipment?.shipmentDetail?.quotedCost ?? '' : '',
      ilCost: this.isTruckloadShipment ? null : this.rateGrid.ratesGridForm.get('selectedRate')?.value.ilCost,
      clientCost: this.isTruckloadShipment ? null : this.rateGrid.ratesGridForm.get('selectedRate')?.value.clientCost,
      customerCost: customerQuote,
      exception: this.shipmentID != null ? this.shipment?.shipmentDetail?.exception ?? '' : '',
      note: this.shipmentID != null ? this.shipment?.shipmentDetail?.note ?? '' : '',
      serviceLevel: this.shipmentType === 'LTL' ? (this.isVolumeRate ? 'Volume' :
        (this.rateGrid.ratesGridForm.get('selectedRate')?.value.serviceLevel ?
          this.rateGrid.ratesGridForm.get('selectedRate')?.value.serviceLevel :
          this.newShipmentForm.controls["shipmentForm"].get('type')?.value)) : this.newShipmentForm.controls["shipmentForm"].get('type')?.value,
      truckNickName: this.newShipmentForm.controls["truckNickName"].value ? null : this.newShipmentForm.controls["truckNickName"].value,
      driverPhone: this.newShipmentForm.controls["driverPhone"].value ? null : this.newShipmentForm.controls["driverPhone"].value,
      proLoadNumber: this.newShipmentForm.controls["proLoadNumber"].value ? null : this.newShipmentForm.controls["proLoadNumber"].value,
      licensePlateNumber: this.newShipmentForm.controls["licensePlateNumber"].value ?
        null : this.newShipmentForm.controls["licensePlateNumber"].value,
      stopOrder: this.truckID != null ? this.shipment?.shipmentDetail?.stopOrder ?? '' : '',
      stopType: this.truckID != null ? this.shipment?.shipmentDetail?.stopType ?? '' : '',
      isCorrectedBOL: !(this.shipmentID != null && (this.shipment?.shipmentDetail?.shipmentStatus === 'PENDING' ||
        this.shipment?.shipmentDetail?.shipmentStatus === 'PREBOOKED' ||
        this.shipment?.shipmentDetail?.shipmentStatus === 'QUOTE_SENT_TO_CLIENT')),
      pickupAppointmentStart: this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value != '' ?
        this.convertDatetimeToUtc(this.pickupAppointmentStart, this.clientTimeZoneName) : null,
      pickupAppointmentStop: this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value != '' ?
        this.convertDatetimeToUtc(this.pickupAppointmentStop, this.clientTimeZoneName) : null,
      deliveryAppointmentStart: this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStart')?.value != '' ?
        this.convertDatetimeToUtc(this.deliveryAppointmentStart, this.consigneeTimeZoneName) : null,
      deliveryAppointmentStop: this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value != '' ?
        this.convertDatetimeToUtc(this.deliveryAppointmentStop, this.consigneeTimeZoneName)  : null,
      appointmentRequired: this.isAppointmentRequired,
      deliveryAppointmentRequired: this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentRequired')?.value &&
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentRequired')?.value != '',
      appointmentSet: this.isAppointmentSet,
      contact: this.newShipmentForm.controls["shipmentForm"].get('contact')?.value,
      additionalValue: this.newShipmentForm.controls["additionalInsurance"].value != '' ?
        this.newShipmentForm.controls["additionalInsurance"].value : null,
      originalShipDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.originalShipDate ?? null : null,
      originalDeliveryDate: this.shipmentID != null ? this.shipment?.shipmentDetail?.originalDeliveryDate ?? null : null,
      pickupException: this.shipmentID != null ? this.shipment?.shipmentDetail?.pickupException ?? null : null,
      deliveryException: this.shipmentID != null ? this.shipment?.shipmentDetail?.deliveryException ?? null : null,
      isReturn: this.newShipmentForm.controls["isReturn"].value,
      whiteGlove: this.newShipmentForm.controls["shipmentForm"].get('modes')?.value == 'White Glove' ? '1' : '0',
      problem: this.shipmentID != null ? this.shipment?.shipmentDetail?.problem ?? false : false,
      truckID: this.truckID != null ? this.truckID : null,
      selectedCarrierRateUUID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.rateUUID ?? '',
      isSpotRate: this.negotiationType?.toString() === '2' ? 2 : 0,
      negotiationType: this.negotiationType ? this.negotiationType : null
    };
  }

  createShipperConsignee() {
    this.shipper = {
      id: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperID')?.value,
      name: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.value,
      plant: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.value,
      streetAddress: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress1')?.value,
      address2: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress2')?.value,
      address3: '',
      city: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.value,
      state: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.value,
      zip: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
      phone: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.value,
      contact: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.value,
      country: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.value,
      countryCode: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.value,
      email: this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.value
    };
    this.consignee = {
      id: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeID')?.value,
      name: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.value,
      plant: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.value,
      streetAddress: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress1')?.value,
      address2: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress2')?.value,
      address3: '',
      city: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.value,
      state: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.value,
      zip: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value,
      phone: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePhone')?.value,
      contact: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeContact')?.value,
      country: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.value,
      countryCode: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.value,
      email: this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeEmail')?.value,
      receivingHourStart: this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.value ?
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStart')?.value.replace(':', '') : null,
      receivingHourStop: this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.value ?
        this.newShipmentForm.controls["shipmentForm"].get('receivingHourStop')?.value.replace(':', '') : null
    };
  }

  createBillTo() {
    const terms = this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value;

    if (terms === 'Prepaid') {
      let bt = null;
      for (const item of this.billTo) {
        if (item.careof !== null && item.careof.includes('IL2000')) {
          bt = item;
          break;
        }
      }
      this.selectedBillTo = bt;
      if (this.selectedBillTo) this.selectedBillTo.name = this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.value;
    }

    if (terms === '3rd Party' || terms === 'Collect' || this.selectedBillTo == null) {
      this.selectedBillTo = {
        billtoID: null,
        name: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToName')?.value,
        careof: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.value,
        address: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.value,
        zip: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.value,
        city: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.value,
        state: this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.value,
        country: 'USA'
      };
    }
  }

  onClientChange() {
    if (this.shipmentID == null) {
      this.resetShipperConsigneeControls();
    }
  }

  addMultiStop() {
    this.multiStopRequired = true;
    this.utilityservice.pickupDateRequired.push(true);
    this.utilityservice.deliveryDateRequired.push(true);
    this.stopsLineItems.push({lineItems: []});
    if (!this.showMultiStopFields) {
      this.showMultiStopFields = true;
      if (this.multiStop.length >= 1) {
        this.multiStopAddValidators();
      }
    } else {
      this.multiStop.push(this.getMultiStop());
      this.multiStopAddValidators();
    }
  }

  removeMultiStop(index: number) {
    if (this.multiStop.length > 0) {
      this.multiStop.removeAt(index);
    } else {
      this.clearMultiStop(index);
      this.showMultiStopFields = false;
      this.multiStopRequired = false;
      this.utilityservice.pickupDateRequired[index] = false;
      this.utilityservice.deliveryDateRequired[index] = false;
    }
    this.stopsLineItems.splice(index, 1);
  }

  setMultiStopInformation(index: number, data: any) {
    const curPlant = this.multiStop.at(index).get('multiStopPlant')?.value;

    for (const plant of data) {
      if (plant.location.name == curPlant) {
        this.multiStop.at(index).get('multiStopId')?.setValue(plant.location.id, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopAddress1')?.setValue(plant.location.streetAddress, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopAddress2')?.setValue(plant.location.address2 != '' ? plant.location.address2 : null, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopZip')?.setValue(plant.location.zip, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopCity')?.setValue(plant.location.city, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopCountry')?.setValue(plant.location.country, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopState')?.setValue(plant.location.state, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopEmail')?.setValue(plant.contact.email, {
          onlySelf: false,
          emitEvent: true
        });
        this.multiStop.at(index).get('multiStopPhone')?.setValue(this.formatPhone(plant.contact.phone), {
          onlySelf: false,
          emitEvent: true
        });
      }
    }
  }

  setMultiStopPlant(index: any, data: any) {
    // SHIPPER OR CONSIGNEE VALUES
    const curName = this.multiStop.at(index).get('multiStopName')?.value;
    for (const group of data) {
      if (group.name == curName) {
        if (group.locations.length === 1) {
          this.multiStop.at(index).get('multiStopPlant')?.setValue(group.locations[0].location.name);
          this.setMultiStopInformation(index, group.locations);
        } else {
          this.setMultiStopInformation(index, group.locations);
        }
        break;
      }
    }
  }

  getMultiStopPlantDropDownValues(index: any, data: any) {
    // PLANT VALUES
    const curName = this.multiStop.at(index).get('multiStopName')?.value;
    const multiStopPlantName: any[] = [];

    data.forEach((value: any) => {
      if (value.name === curName) {
        const locationsArray = value.locations;
        locationsArray.forEach((plant: any) => {
          multiStopPlantName.push(plant.location.name);
        });
      }
    });

    return multiStopPlantName;
  }

  clearMultiStop(index: any = null) {
    const shipmentType = this.newShipmentForm.controls["shipmentForm"].get('type')?.value;

    if (shipmentType === 'Multileg') {
      this.multiStopRequired = true;
      this.utilityservice.pickupDateRequired[index] = true;
      this.utilityservice.deliveryDateRequired[index] = true;
      if (index === null && this.multiStop.length >= 1) {
        // Loop through array remove all except index 0 and reset on Type change
        for (const stopKey in this.multiStop.controls) {
          if (parseInt(stopKey) !== 0) {
            this.multiStop.removeAt(parseInt(stopKey));
          }
          this.multiStop.at(0).reset(this.getMultiStop());
        }
      } else if (index != null) {
        this.multiStop.at(index).reset(this.getMultiStop());
      }
    } else {
      this.multiStopClearValidators(0);
      this.multiStopRequired = false;
      this.utilityservice.pickupDateRequired[index] = false;
      this.utilityservice.deliveryDateRequired[index] = false;
    }
  }

  multiStopClearValidators(index: number) {
    this.multiStop.at(index).get('multiStopId')?.clearValidators();
    this.multiStop.at(index).get('multiStopName')?.clearValidators();
    this.multiStop.at(index).get('multiStopPlant')?.clearValidators();
    this.multiStop.at(index).get('multiStopAddress1')?.clearValidators();
    this.multiStop.at(index).get('multiStopZip')?.clearValidators();
    this.multiStop.at(index).get('multiStopCity')?.clearValidators();
    this.multiStop.at(index).get('multiStopState')?.clearValidators();

    this.multiStop.at(index).get('multiStopId')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopName')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopPlant')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopAddress1')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopZip')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopCity')?.updateValueAndValidity();
    this.multiStop.at(index).get('multiStopState')?.updateValueAndValidity();
  }

  multiStopAddValidators() {
    this.multiStopRequired = true;
    // Dynamically add validators when we add a new multistop
    const index = this.multiStop.length === 0 ? 0 : this.multiStop.length - 1;
    this.utilityservice.pickupDateRequired[index] = true;
    this.utilityservice.deliveryDateRequired[index] = true;
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  // NEEDED FOR MULTI SELECT FLOATING LABEL
  checkMultiSelectValues(elementName: string, arrayLength: number) {
    if (arrayLength !== 0) {
      $(elementName).removeAttr('hidden');
    } else {
      $(elementName).attr('hidden', 'true');
    }
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
      this.userEmail = this.authenticator?.user?.userId ?? '';
    });
  }

  buildSpotRateEmailMessage(shipmentID: string = '', selectedRate: any) {
    const shipment = this.newShipmentForm.controls["shipmentForm"] as FormGroup;
    const details = this.newShipmentForm.controls["shipperConsigneeForm"] as FormGroup;
    const lineItemArray: any = this.newShipmentForm.controls["lineItems"].get('freights')?.value as FormArray;
    const referencesArray: any = this.newShipmentForm.controls["referenceForm"].get('references')?.value as FormArray;
    const shipper = {
      name: details.get('shipperName')?.value ? details.get('shipperName')?.value : '',
      address: details.get('shipperAddress1')?.value ? details.get('shipperAddress1')?.value : '',
      city: details.get('shipperCity')?.value ? details.get('shipperCity')?.value : '',
      state: details.get('shipperState')?.value ? details.get('shipperState')?.value : '',
      zip: details.get('shipperZip')?.value ? details.get('shipperZip')?.value : '',
      email: details.get('shipperEmail')?.value ? details.get('shipperEmail')?.value : '',
      phone: details.get('shipperPhone')?.value ? details.get('shipperPhone')?.value : '',
      accessorials: details.get('shipperPickupAcc')?.value
    };
    const consignee = {
      name: details.get('consigneeName')?.value ? details.get('consigneeName')?.value : '',
      address: details.get('consigneeAddress1')?.value ? details.get('consigneeAddress1')?.value : '',
      city: details.get('consigneeCity')?.value ? details.get('consigneeCity')?.value : '',
      state: details.get('consigneeState')?.value ? details.get('consigneeState')?.value : '',
      zip: details.get('consigneeZip')?.value ? details.get('consigneeZip')?.value : '',
      email: details.get('consigneeEmail')?.value ? details.get('consigneeEmail')?.value : '',
      phone: details.get('consigneePhone')?.value ? details.get('consigneePhone')?.value : '',
      accessorials: details.get('consigneeDeliveryAcc')?.value
    };
    const billTo = {
      name: details.get('billToName')?.value ? details.get('billToName')?.value : '',
      address: details.get('billToAddress1')?.value ? details.get('billToAddress1')?.value : '',
      city: details.get('billToCity')?.value ? details.get('billToCity')?.value : '',
      state: details.get('billToState')?.value ? details.get('billToState')?.value : '',
      zip: details.get('billToZip')?.value ? details.get('billToZip')?.value : '',
      email: details.get('billToEmail')?.value ? details.get('billToEmail')?.value : '',
      phone: details.get('billToPhone')?.value ? details.get('billToPhone')?.value : ''
    };

    let references = '';
    let lineItems = '';
    let fees: string;
    let emailMessage: string;
    let introMessage: string;
    const spotRateMessage = this.newShipmentForm.get('spotRateMessage')?.value;
    let shipmentData: string;
    let billToText = '';

    // SET REFERENCES
    if (referencesArray.length !== 0) {
      for (const i in referencesArray) {
        if (referencesArray[i].name != '' && referencesArray[i].value != '') {
          references += referencesArray[i].name + ': ' + referencesArray[i].value + '\n';
        }
      }
    }

    // SET LINE ITEMS
    if (lineItemArray.length !== 0) {
      for (const li in lineItemArray) {
        lineItems += lineItemArray[li].description + '\n' +
          'NMFC:' + lineItemArray[li].nmfcNumber + '\n' +
          'Class ' + lineItemArray[li].classNumber + '\n';
        if (lineItemArray[li].hm === true) {
          lineItems = lineItems + 'hazmat';
        }
        lineItems += '\n' + lineItemArray[li].unitNumber + ' ' + lineItemArray[li].unitType + ' ' +
          '(' + lineItemArray[li].piecesNumber + ' pieces) ' +
          lineItemArray[li].piecesInputTwo + ' lbs.\n' +
          'dims: ' + lineItemArray[li].length + '\" x ' + lineItemArray[li].width + '\" x ' + lineItemArray[li].height + '" \n' + '\n';
      }
    }

    // SET PICKUP FEES
    fees = '\nAdd Fee:' + '\n';
    for (const fee in shipper.accessorials) {
      fees += shipper.accessorials[fee].chtDescription + '\n';
    }

    // SET DELIVERY FEES
    for (const fee in consignee.accessorials) {
      fees += consignee.accessorials[fee].chtDescription + '\n';
    }

    // SET BILL TO
    if (shipment.get('shipmentBillTo')?.value === '3rd Party') {
      billToText = 'Bill-to:\n' +
        billTo.name + '\n' +
        billTo.address + '\n' +
        billTo.city + ' ' + consignee.state + ' ' + consignee.zip + '\n' +
        billTo.email + '\n' +
        billTo.phone + '\n';
    }

    // BEGIN BUILDING OUT EMAIL MESSAGE
    introMessage = 'Mode: *****' + this.shipmentType + '*****' + '\n\n' + 'IL2000 Note:\n';

    shipmentData =
      'Username: ' + this.userName + '\n' +
      'Company Name: ' + this.groupInfo.groupName + '\n' +
      'Email address: ' + this.userEmail + ' ***USE THIS ADDRESS WHEN REPLYING***\n\n' +
      'Carrier: ' + selectedRate?.carrierName + '\n' +
      'PRO: ' + selectedRate?.proNumber + '\n' +
      'PO: ' + +'\n' +
      'Client BOL: ' + +'\n' +
      'IL2000 ID Number: ' + shipmentID + '\n' +
      'Ship Date: ' + shipment.get('shipmentDate')?.value + '\n' +
      'Terms: ' + shipment.get('shipmentBillTo')?.value + '\n\n' +
      'Carrier Quote ID: ' + selectedRate.quoteID + '\n' + references + '\n' +
      '\nShipper:\n' +
      shipper.name + '\n' +
      shipper.address + '\n' +
      shipper.city + ' ' + shipper.state + ' ' + shipper.zip + '\n' +
      shipper.email + '\n' +
      shipper.phone + '\n' +
      'Consignee:\n' +
      consignee.name + '\n' +
      consignee.address + '\n' +
      consignee.city + ' ' + consignee.state + ' ' + consignee.zip + '\n' +
      consignee.email + '\n' +
      consignee.phone + '\n' +
      billToText + lineItems +
      '\nSpecial Instructions:' + '\n' + this.newShipmentForm.get('specialInstructionsText')?.value + fees;

    emailMessage = introMessage + '\n' + spotRateMessage + '\n' + shipmentData + '\n';
    return emailMessage;
  }

  sendSpotRateMessage() {
    const shipmentID = '';
    const selectedRate = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    const emailData =
      {
        from: 'freightmanager@il2000.com',
        toAddress: 'alerts@il2000.com',
        ccSender: false,
        ccEmail: null,
        subject: '*Rate*Shop*Alert*' + this.shipmentType + '*: ' + selectedRate.carrierName + '-' +
          this.groupInfo.groupName + '-' + shipmentID,
        message: this.buildSpotRateEmailMessage(shipmentID, selectedRate),
        attachment: [],
        isHtml: false
      } as Email;
    const emailValues = emailData as Email;
    this.spinner.show('spotRateModal').then();

    this.emailService.sendEmail(emailValues).subscribe({
      error: () => {
        this.spinner.hide('spotRateModal');
      },
      complete: () => {
        this.spinner.hide('spotRateModal');

        setTimeout(() => {
          document.getElementById('spotRateClose')?.click();
        }, 1000);

        setTimeout(() => {
          document.getElementById('spotRateMessageSent')?.click();
        }, 1000);

        setTimeout(() => {
          document.getElementById('spotRateCloseSuccess')?.click();
        }, 3000);

        // Save Shipment
        this.spinner.show('spinnerShipmentForm').then();
        this.saveShipment();
      }
    });
  }

  resetConsigneeInformation() {
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeID')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress1')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeAddress2')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCountry')?.setValue('USA');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeEmail')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePhone')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeContact')?.setValue('');
  }

  resetShipperInformation() {
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperID')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress1')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperAddress2')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCountry')?.setValue('USA');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperEmail')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPhone')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperContact')?.setValue('');
  }

  resetBillingInformation() {
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billtoID')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCareOf')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billToAddress1')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billToZip')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billToCity')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('billToState')?.setValue('');
  }

  resetIsFromQuickRates() {
    this.isFromQuickRates = false;
  }

  clickShipmentType(shipmentType: 'LTL' | 'Truckload'): any {
    if (this.shipmentID || this.truckID) { return true; } // FIRST CODE LINE - DON'T MOVE - TO AVOID CLICKING WHEN EDITING
    this.disableBlanket = false;
    this.disableBillingTerm = false;
    this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('');
    this.shipmentType = shipmentType;
    this.requiredForBOL = true;
    this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('');
    this.newShipmentForm.controls["shipmentForm"].get('equipment')?.setValidators((this.shipmentType === 'Truckload' ?
      Validators.required : null));
    this.newShipmentForm.controls["shipmentForm"].get('equipment')?.updateValueAndValidity();
    this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValidators(Validators.required);
    if (this.shipmentType === 'LTL') {
      this.requiredForBOL = true;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('LTL');
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Standard');
    }

    if (this.shipmentType === 'Truckload') {
      this.requiredForBOL = true;
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Truckload');
      this.getSpecialInstruction('** DEDICATED SHIPMENT **', true); // REMOVE LINE FROM SPECIAL INSTRUCTIONS
      // Default 3rd Party when TL tab selcted
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.setValue('3rd Party');
      if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value == '') {
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue('07:00');
      }
      if (this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.value == '') {
        this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('07:00');
      }
      if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.value == '') {
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.setValue('07:00');
      }
      if (this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.value == '') {
        this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValue('07:00');
      }
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.setValue('');
      this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStop')?.setValue('');
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentTimeStart')?.setValue('');
      this.newShipmentForm.controls["shipmentForm"].get('deliveryAppointmentStop')?.setValue('');
    }

    const lines = this.newShipmentForm.controls['lineItems'] as FormGroup;
    const freights = lines.controls['freights'] as FormGroup;
    const x: number = parseInt(freights.controls[length].toString());

    if (this.shipmentType === 'Truckload') {
      for (let y = 0; y < x; y++) {
        freights.controls[y].get('classNumber')?.setValidators(null);
        freights.controls[y].get('piecesNumber')?.setValue(freights.controls[y].get('unitNumber')?.value);
      }
      // show multistop
      this.newShipmentForm.controls["shipmentForm"].get('type')?.setValue('Multileg');
      setTimeout(() => {
        this.freightTotals.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
          this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
      }, 100);
    } else {
      this.newShipmentForm.controls["shipmentForm"].get('type')?.setValue(null);
      for (let y = 0; y < x; y++) {
        freights.controls[y].get('classNumber')?.setValidators(Validators.required);
        freights.controls[y].get('piecesNumber')?.setValue('');
        freights.controls[y].get('unitType')?.setValue('');
        freights.controls[y].get('unitNumber')?.setValue('');
      }
      this.freight.setMileage(this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value,
        this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value, this.shipmentType);
    }
    for (let y = 0; y < x; y++) {
      freights.controls[y].get('classNumber')?.updateValueAndValidity();
    }
  }

  createTargetRate() {
    this.targetRate = null;
    if (this.shipmentType === 'Truckload' || this.isTruckloadShipment) {
      if (this.rateGrid.ratesGridForm.get('selectedRate')?.value.creationDate != null) {
        this.targetRate = {
          targetRateID: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetRateID,
          creationDate: this.rateGrid.ratesGridForm.get('selectedRate')?.value.creationDate,
          fuelSurchargeBuy: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeBuy,
          fuelSurchargeSell: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeSell,
          targetBuy: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetBuy,
          targetSell: this.rateGrid.ratesGridForm.get('selectedRate')?.value.targetSell,
          fuelSurchargeAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.fuelSurchargeAvg,
          ratePerMileAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.ratePerMileAvg,
          marketAvg: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketAvg,
          marketLow: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketLow,
          marketHigh: this.rateGrid.ratesGridForm.get('selectedRate')?.value.marketHigh,
          originName: this.rateGrid.ratesGridForm.get('selectedRate')?.value.originName,
          originType: this.rateGrid.ratesGridForm.get('selectedRate')?.value.originType,
          destinationName: this.rateGrid.ratesGridForm.get('selectedRate')?.value.destinationName,
          destinationType: this.rateGrid.ratesGridForm.get('selectedRate')?.value.destinationType,
          timeFrame: this.rateGrid.ratesGridForm.get('selectedRate')?.value.timeFrame,
          equipment: this.rateGrid.ratesGridForm.get('selectedRate')?.value.equipment,
          mileage: this.rateGrid.ratesGridForm.get('selectedRate')?.value.mileage
        };
      }
    }
  }

  setEditTargetRate(data: TruckloadRate | any) {
    this.targetRate = null;
    if (data) {
      this.targetRate = {
        targetRateID: data.targetRateID,
        creationDate: data.creationDate,
        fuelSurchargeBuy: data.fuelSurchargeBuy,
        fuelSurchargeSell: data.fuelSurchargeSell,
        targetBuy: data.targetBuy,
        targetSell: data.targetSell,
        fuelSurchargeAvg: data.fuelSurchargeAvg,
        ratePerMileAvg: data.ratePerMileAvg,
        marketAvg: data.marketAvg,
        marketLow: data.marketLow,
        marketHigh: data.marketHigh,
        originName: data.originName,
        originType: data.originType,
        destinationName: data.destinationName,
        destinationType: data.destinationType,
        timeFrame: data.timeFrame,
        equipment: data.equipment,
        mileage: data.mileage
      };

      const fn = () => {
        const rate: any = {
          targetRateID: data.targetRateID,
          rateType: RateType.TARGET_TL,
          creationDate: data.creationDate?.toString(),
          fuelSurchargeBuy: data.fuelSurchargeBuy,
          fuelSurchargeSell: data.fuelSurchargeSell,
          targetBuy: data.targetBuy,
          targetSell: data.targetSell,
          carrierID: undefined,
          carrierName: undefined,
          carrierQuote: undefined,
          clientCost: undefined,
          clientQuote: undefined,
          customCost: undefined,
          customerQuote: undefined,
          expirationDate: undefined,
          feesMap: undefined,
          ilCost: undefined,
          isVolumeRate: false,
          negotiationType: undefined,
          quoteID: undefined,
          transitTime: null,
          warning: undefined,
          id: 0,
          exceedsLinearFoot: false,
          exceedsCubicCapacity: false,
          exceedsMaxWeight: false,
          isTLRate: true,
          processingFee: null,
          carrierCharge: (Number(data.targetBuy) - Number(data.fuelSurchargeBuy)),
          customerCharge: (Number(data.targetSell) - Number(data.fuelSurchargeSell)),
          fuelSurchargeAvg: data.fuelSurchargeAvg,
          ratePerMileAvg: data.ratePerMileAvg,
          marketAvg: data.marketAvg,
          marketLow: data.marketLow,
          marketHigh: data.marketHigh,
          originName: data.originName,
          originType: data.originType,
          destinationName: data.destinationName,
          destinationType: data.destinationType,
          timeFrame: data.timeFrame,
          equipment: data.equipment,
          serviceProviderType: null,
          mileage: data.mileage
        };
        this.rateGrid.ratesLoaded = true;
        this.rateGrid.setSelectedValue(rate);
        this.rateGrid.truckloadRatesData.update(items => [...items, rate]);
      };
      this.rateGrid.validRates = true;
      fn();
      this.rateGrid.hideGrid = false;
      this.rateGrid.dt.find(t => t.gridName == 'truckloadRates')?.rerender();
      this.rateGrid.dt.find(t => t.gridName == 'truckloadRatesMore')?.rerender();
      this.rateGrid.historyRatesBtn = true;
      this.rateGrid.hideHistoryRatesGrid = true;
      setTimeout(() => this.rateGrid.dt.first.reDrawTable(this.rateGrid.truckloadRatesData()), 100);

    } else {
      const truckloadWeight = this.getWeightItems(this.editLineItems);
      if (truckloadWeight > 0) {
        this.rateGrid.fetchRates();
      }
    }
  }

  editSetManualQuotes(quotes: TLManualQuote[] = []) {
    for (const quote of quotes as TLManualQuote[]) {
      let selectedValue: any = null;
      let mcnumber: any = '';
      let carrierName: any = '';
      if (quote.carrierID == '1') {
        carrierName = quote.carrierName;
        selectedValue = [{
          item: quote.carrierName,
          value: quote.carrierID.toString()
        }];
      } else {
        if (quote.carrierID && quote.carrierID !== '' && quote.carrierID !== '0') {
          const value = this.carrierList.find(i => i.carrierID === (quote.carrierID ? parseInt(quote.carrierID) : null));
          if (value) {
            mcnumber = value.mcNumber;
            carrierName = value.carrierName;
            const mcNumber = value.mcNumber ? 'MC: #' + value.mcNumber + '. ' : '';
            const dotNumber = value.dotNumber ? 'DOT: #' + value.dotNumber : '';
            const descNumbers = mcNumber + dotNumber;
            selectedValue = [{
              item: value.carrierName + (descNumbers !== '' ? ' (' + descNumbers + ')' : ''),
              value: value.carrierID?.toString()
            }];
          }
        }
      }

      this.tlQuotes.push({
        quoteID: quote.quoteID,
        carrierName,
        carrierID: quote.carrierID,
        clientCost: quote.clientCost,
        carrierCost: quote.carrierCost,
        quoteNumber: quote.quoteNumber,
        transitTime: quote.transitTime,
        notes: quote.notes,
        assigned: quote.assigned,
        truckNotUsed: quote.truckNotUsed,
        mcNumber: mcnumber,
        selected: selectedValue,
        equipment: quote.equipment,
        reasonCode: quote.reasonCode,
        lostReasonNotes: quote.lostReasonNotes,
        currencyID: quote.currencyID,
        exchangeRate: quote.exchangeRate,
        rateDate: quote.rateDate,
        exchangeInfo: quote.exchangeInfo,
        clientQuote: quote.clientQuote
      });
    }
    if (this.quotes) {
      this.quotes.setManualQuotesForEdit(this.tlQuotes, this.truck);
    } else {
      setTimeout(() => this.quotes.setManualQuotesForEdit(this.tlQuotes, this.truck), 1000);
    }
  }

  editSetManualTruckFees(truckFees: TruckFees[] | any) {
    for (const truckFee of truckFees) {
      this.oldTruckFees.push({
        truckFeesId: truckFee.truckFeesId,
        truckId: truckFee.truckId,
        accessorialTypeId: truckFee.accessorialTypeId,
        amount: truckFee.amount,
        sellAmount: truckFee.sellAmount,
        carrierCharge: truckFee.carrierCharge,
        customerCharge: truckFee.customerCharge,
        truckQuoteId: truckFee.truckQuoteId,
        carrierId: truckFee.carrierId,
        feeIncurredAt: truckFee.feeIncurredAt,
        feeStartTime: truckFee.feeStartTime,
        feeEndTime: truckFee.feeEndTime,
        stopNum: truckFee.stopNum
      });
    }
  }

  isValidPostToLoadBoard() {
    const isValid = true;
    if (!this.newShipmentForm.controls["shipmentForm"].get('equipment')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperCity')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperState')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeCity')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeState')?.value) { return false; }
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value) { return false; }
    if (!this.freightTotals.totalLbsSum) { return false; }
    if (!this.freightTotals.linearFeet) { return false; }
    return isValid;
  }

  setEditGroupCustomizations(groupID: number | null) {
    this.clientPlantAllowMABDInput = false;
    this.clientPlantRequireDimensions = false;
    this.clientPlantPPA = '';
    this.clientPlantPPAAdjustment = -1;

    this.igs.getGroupCustomizations(groupID).subscribe({
      next: response => {
        this.customizations.length = 0;
        for (const customization of response as Customization[]) {
          this.customizations.push(customization);
          if (customization.customizationID === 76) { this.enableTrackingEmails = true; }
          if (customization.customizationID === 48) {
            this.clientPlantRequireDimensions = true;
          }
          if (customization.customizationID === 72) {
            this.clientPlantAllowMABDInput = true;
          }
          if (customization.customizationID === 30) {
            if (customization.intValue == 3) {
              this.clientPlantPPA = 'NET_RATE_MARKUP';
            } else if (customization.intValue == 1) {
              this.clientPlantPPA = 'GROSS_RATE_DISCOUNT';
            }
          }
          if (customization.customizationID === 26) {
            this.clientPlantPPAAdjustment = customization.intValue;
          }

          if (customization.customizationID === 33) {
            this.showNonDirectPoints = true;
          }

          if (customization.customizationID === 10) {
            this.poMoniker = customization.stringValue;
          }

          if (customization.customizationID === 87) { this.showCheckInsuranceAmount = true; }
        }
      }
    });
  }

  async postToLoadBoard(truck: any, updateToLoadBoard = false) {
    this.spinner.show('spinnerShipmentForm').then();

    if (!updateToLoadBoard) {
      this.ls.postLoadBoard(truck).subscribe({
        error: () => {
          this.spinner.hide('spinnerShipmentForm').then();
        },
        complete: () => {
          this.spinner.hide('spinnerShipmentForm').then();
        }
      });
    } else {
      this.ls.updateLoadBoard(truck).subscribe({
        error: () => {
          this.spinner.hide('spinnerShipmentForm').then();
        },
        complete: () => {
          this.spinner.hide('spinnerShipmentForm').then();
        }
      });
    }
  }

  onClickDeleteShipment() {
    Swal.fire({
      title: 'Are you sure you want to delete this shipment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteShipment();
      } else {
        return;
      }
    });
  }

  addSpecialInstruction(event: { item: any; remove: any; }) {
    this.getSpecialInstruction(event.item, event.remove);
  }

  scrollTo(el: Element | null) {
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
    }
  }

  scrollToError() {
    const elementWithError = document.querySelector('input.ng-invalid');
    this.scrollTo(elementWithError);
  }

  cancelShipment() {
    this.spinner.hide('spinnerShipmentForm');
    this.rateGrid.ngOnInit();
    this.rateGrid.ngOnChanges(null);
    this.rateGrid.showFetchRatesButton();
  }

  setTruckloadShipment(trukStatus: string = 'PREBOOKED') {
    const clientQuotes = this.truck?.tlQuotes ? this.truck.tlQuotes.filter((item) => item.clientQuote) : [];
    const tlquotes = this.createManualQuoteMapping();
    for (const quote of clientQuotes) {
      tlquotes.push(quote);
    }
    const shipments: ShipmentSave[] | any = [];

    // Multistop truckload, add multiple shipments
    if (this.multiStopRequired) {
      let index = 0;
      for (const stopControl of this.multiStop.controls) {
        const stop = stopControl.value;
        const consignee: Location = {
          id: stop.multiStopId,
          name: stop.multiStopName,
          plant: stop.multiStopPlant,
          streetAddress: stop.multiStopAddress1,
          address2: stop.multiStopAddress2,
          address3: '',
          city: stop.multiStopCity,
          state: stop.multiStopState,
          zip: stop.multiStopZip,
          phone: stop.multiStopPhone,
          contact: '',
          country: stop.multiStopCountry,
          email: stop.multiStopEmail
        };

        const accessorials: any[] = [];
        if (stop.multiStopAcc) {
          for (const accessorial of stop.multiStopAcc) {
            accessorials.push({accessorialID: accessorial.chtID});
          }
        }

        const lineItems = [] as LineItem[];
        const freightItems = this.stopsLineItems[index].lineItems;

        if (freightItems.length > 0) {
          for (const freight of freightItems) {
            freight.location = stop.multiStopAddress1;
            lineItems.push(freight);
          }
        }

        let stopRefFields: any[] = [];
        let stopDetail: ShipmentDetails | any = null;
        let stopShipment: ShipmentSave | any = null;

        if (this.truckID && this.truck?.shipments && this.truck?.shipments?.length > 1 && stop.multiStopShipmentId) {
          const sshipments: ShipmentSave[] | any = this.truck?.shipments;
          stopShipment = sshipments.find((s: any) => s.shipmentDetail?.shipmentID == stop.multiStopShipmentId.toString());
          if (stopShipment) {
            stopDetail = stopShipment.shipmentDetail;
            stopRefFields = stopShipment.referenceFields.length > 0 ? stopShipment.referenceFields : [];
          }
        }

        const stopShipmentDetail: ShipmentDetails = {
          shipmentID: stop.multiStopShipmentId,
          shipmentStatus: stopDetail ? stopDetail.shipmentStatus : this.shipment?.shipmentDetail?.shipmentStatus,
          enteredShipDate: stopDetail ? stopDetail.enteredShipDate : this.shipment?.shipmentDetail?.enteredShipDate,
          mabdDate: stopDetail ? stopDetail.mabdDate : this.shipment?.shipmentDetail?.mabdDate,
          mode: this.shipment?.shipmentDetail?.mode ?? '',
          terms: this.shipment?.shipmentDetail?.terms ?? '',
          priority: this.shipment?.shipmentDetail?.priority ?? '',
          specialInstructions: stop ? stop.multiStopSpecialInstructionsText : this.shipment?.shipmentDetail?.specialInstructions,
          carrier: this.shipment?.shipmentDetail?.carrier ?? '',
          carrierID: this.shipment?.shipmentDetail?.carrierID ?? '',
          proNumber: stopDetail ? stopDetail.proNumber : this.shipment?.shipmentDetail?.proNumber,
          bolNumber: stopDetail ? stopDetail.bolNumber : this.shipment?.shipmentDetail?.bolNumber,
          poNumber: stop ? stop.multiStopPoNumber : this.shipment?.shipmentDetail?.poNumber,
          pickupNumber: stopDetail ? stopDetail.pickupNumber : this.shipment?.shipmentDetail?.pickupNumber,
          publishedTransitTime: stopDetail ? stopDetail.publishedTransitTime : this.shipment?.shipmentDetail?.publishedTransitTime,
          estimatedTransitTime: stopDetail ? stopDetail.estimatedTransitTime : this.shipment?.shipmentDetail?.estimatedTransitTime,
          calculatedTransitTime: stopDetail ? stopDetail.calculatedTransitTime : this.shipment?.shipmentDetail?.calculatedTransitTime,
          actualShipDate: stopDetail ? (stopDetail.actualShipDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.actualShipDate) ? this.shipment?.shipmentDetail?.actualShipDate : null),
          scheduledDeliveryDate: stopDetail ? (stopDetail.scheduledDeliveryDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.scheduledDeliveryDate) ? this.shipment?.shipmentDetail?.scheduledDeliveryDate : null),
          carrierEstimatedDeliveryDate: stopDetail ?
            (stopDetail.carrierEstimatedDeliveryDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.carrierEstimatedDeliveryDate) ? this.shipment?.shipmentDetail?.carrierEstimatedDeliveryDate : null),
          deliveryAppointmentDate: stopDetail ? (stopDetail.deliveryAppointmentDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.deliveryAppointmentDate) ? this.shipment?.shipmentDetail?.deliveryAppointmentDate : null),
          appointmentSet: stopDetail ? stopDetail.appointmentSet : this.shipment?.shipmentDetail?.appointmentSet,
          actualDeliveryDate: stopDetail ? (stopDetail.actualDeliveryDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.actualDeliveryDate) ? this.shipment?.shipmentDetail?.actualDeliveryDate : null),
          quoteID: this.shipment?.shipmentDetail?.quoteID ?? '' ,
          quotedCost: this.shipment?.shipmentDetail?.quotedCost ?? '',
          ilCost: this.shipment?.shipmentDetail?.ilCost ?? '',
          clientCost: this.shipment?.shipmentDetail?.clientCost ?? '',
          customerCost: this.shipment?.shipmentDetail?.customerCost ?? '',
          exception: stopDetail ? stopDetail.exception : this.shipment?.shipmentDetail?.exception,
          note: stopDetail ? stopDetail.note : this.shipment?.shipmentDetail?.note,
          stopType: stop.multiStopType,
          serviceLevel: this.shipment?.shipmentDetail?.serviceLevel ?? '',
          truckNickName: this.shipment?.shipmentDetail?.truckNickName ?? '',
          driverPhone: this.shipment?.shipmentDetail?.driverPhone ?? '',
          licensePlateNumber: this.shipment?.shipmentDetail?.licensePlateNumber ?? '',
          proLoadNumber: stopDetail ? stopDetail.proLoadNumber :  this.shipment?.shipmentDetail?.proLoadNumber,
          stopOrder: stopDetail ? stopDetail.stopOrder : this.shipment?.shipmentDetail?.stopOrder,
          createdOn: stopDetail ? stopDetail.createdOn : this.shipment?.shipmentDetail?.createdOn,
          isCorrectedBOL: stopDetail ? stopDetail.isCorrectedBOL : this.shipment?.shipmentDetail?.isCorrectedBOL,
          pickupAppointmentStart: stopDetail ? stopDetail.pickupAppointmentStart ?? null : null,
          pickupAppointmentStop: stopDetail ? stopDetail.pickupAppointmentStop ?? null : null,
          deliveryAppointmentStart: stopDetail ? stopDetail.deliveryAppointmentStart ?? null : null,
          deliveryAppointmentStop: stopDetail ? stopDetail.deliveryAppointmentStop ?? null : null,
          appointmentRequired: stopDetail ? stopDetail.appointmentRequired :  null,
          contact: stopDetail ? stopDetail.contact : this.shipment?.shipmentDetail?.contact,
          additionalValue: stopDetail ? stopDetail.additionalValue : this.shipment?.shipmentDetail?.additionalValue,
          isReturn: stopDetail ? stopDetail.isReturn : this.shipment?.shipmentDetail?.isReturn,
          problem: stopDetail ? stopDetail.problem : false,
          whiteGlove: '0',
          deliveryAppointmentRequired: stopDetail ?
            stopDetail.deliveryAppointmentRequired : this.shipment?.shipmentDetail?.deliveryAppointmentRequired,
          deliveryException: stopDetail ? stopDetail.deliveryException : this.shipment?.shipmentDetail?.deliveryException,
          originalDeliveryDate: stopDetail ? (stopDetail.originalDeliveryDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.originalDeliveryDate) ? this.shipment?.shipmentDetail?.originalDeliveryDate : null),
          originalShipDate: stopDetail ? (stopDetail.originalShipDate ?? null) : (this.isDate(this.shipment?.shipmentDetail?.originalShipDate) ? this.shipment?.shipmentDetail?.originalShipDate : null),
          pickupException: stopDetail ? stopDetail.pickupException : this.shipment?.shipmentDetail?.pickupException,
          truckID: this.truckID ? this.truckID : null,
          selectedCarrierRateUUID: this.shipment?.shipmentDetail?.selectedCarrierRateUUID ?? null,
          isSpotRate: this.shipment?.shipmentDetail?.isSpotRate ?? null,
          negotiationType: this.negotiationType ? this.negotiationType : null
        };

        // Set appointment dates and times and appointment required flag
        if (this.isDate(stop.multiStopPickupAppointmentStart)) {
          stopShipmentDetail.pickupAppointmentStart = this.convertDatetimeToUtc(stop.multiStopPickupAppointmentStart, this.clientTimeZoneName);
        }
        if (this.isDate(stop.multiStopPickupAppointmentStop)) {
          stopShipmentDetail.pickupAppointmentStop = this.convertDatetimeToUtc(stop.multiStopPickupAppointmentStop, this.clientTimeZoneName);
        }
        if (this.isDate(stop.multiStopDeliveryAppointmentStart)) {
          stopShipmentDetail.deliveryAppointmentStart = this.convertDatetimeToUtc(stop.multiStopDeliveryAppointmentStart, this.consigneeTimeZoneName);
        }
        if (this.isDate(stop.multiStopDeliveryAppointmentStop)) {
          stopShipmentDetail.deliveryAppointmentStop = this.convertDatetimeToUtc( stop.multiStopDeliveryAppointmentStop, this.consigneeTimeZoneName);
        }

        let stopRefField: any = null;
        let stopRefIndex: any = null;
        stopRefFields.forEach((element: any, idx) => {
          if (element.tiberID && element.tiberID == 2) {
            stopRefIndex = idx;
            stopRefField = element;
          }
        });

        if (stopRefField || (stop.multiStopSoNumber && stop.multiStopSoNumber !== '')) {
          if (stopRefField) {
            stopRefFields[stopRefIndex].value = stop.multiStopSoNumber && stop.multiStopSoNumber !== '' ? stop.multiStopSoNumber : null;
          } else {
            const soRefField = this.reference.referenceDropDown?.find((item: any) => item.tiberID == 2);
            stopRefFields.push({
              fieldID: null,
              value: stop.multiStopSoNumber && stop.multiStopSoNumber !== '' ? stop.multiStopSoNumber : null,
              fieldTypeID: soRefField ? soRefField.rftID : null,
              description: soRefField ? soRefField.rftDescription : 'SO Number',
              tiberID: 2
            });
          }
        }

        const newShipment: ShipmentSave = {
          shipmentDetail: stopShipmentDetail,
          client: this.shipment?.client ?? null,
          user: this.userDetail,
          carrierDetail: this.shipment?.carrierDetail ?? null,
          shipper: this.shipment?.shipper ?? null,
          consignee,
          billTo: this.shipment?.billTo ?? null,
          lineItems,
          referenceFields: stopRefFields,
          openReferenceFields: [],
          manualQuotes: [],
          accessorials,
          historicalEvents: stopShipment ? stopShipment.historicalEvents : this.shipment?.historicalEvents,
          targetRates: this.shipment?.targetRates ?? null,
          notificationMails: stopShipment ? stopShipment.notificationMails : this.shipment?.notificationMails,
          whiteGlove: null,
          trackingContacts: stop.multiStopTrackingContacts ?? []
        };
        shipments.push(newShipment);
        index++;
      }

      // Push final shipment to list
      shipments.push(this.shipment);
    } else {
      // Not multistop, so just add the original shipment
      shipments.push(this.shipment);
    }

    let linearFeetValue = 0;
    if (this.freightTotals?.linearFeet) {
      linearFeetValue = this.freightTotals?.linearFeet;
    } else if (this.truck && this.truck.linearFoot) {
      linearFeetValue = this.truck.linearFoot;
      const ft: any[] = this.freightTotals.freights;
      if (ft && ft.find((item: any) => item.unitType !== 'TRUCK') && linearFeetValue == 53) {
        linearFeetValue = 0;
      }
    }

    if (this.shipmentType === 'Truckload' && this.shipment?.lineItems && this.shipment?.lineItems.length > 0) {
      let multiFrieght: any[];
      multiFrieght = this.shipment?.lineItems ?? [];
      if (multiFrieght.find((item: any) => item.unitType === 'TRUCK')) {
        linearFeetValue = 53;
      }
    }

    // Calculate quoteDueBy by adding 1 or 2 hours depending on shipDate
    const shipDate = moment.utc(this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value).toDate();
    const quoteDueBy = new Date();
    const dayDiff = Math.floor((shipDate.getTime() - quoteDueBy.getTime()) / (1000 * 60 * 60 * 24));
    quoteDueBy.setHours(quoteDueBy.getHours() + (dayDiff == 0 ? 1 : 2));

    const truck: TruckSave = {
      truckID: this.truckID == null ? null : this.truckID,
      loadPosted: this.truck ? this.truck.loadPosted : false,
      loadBoardID: this.truck ? this.truck.loadBoardID : null,
      mpOrderId: this.truck ? this.truck.mpOrderId : '',
      pickupExceptionFK: this.truck?.pickupExceptionFK != null ? this.truck?.pickupExceptionFK : null,
      deliveryExceptionFK: this.truck?.deliveryExceptionFK != null ? this.truck?.deliveryExceptionFK : null,
      equipmentType: this.newShipmentForm.controls["shipmentForm"].get('equipment')?.value,
      shipDate: this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value,
      nickName: this.newShipmentForm.controls["truckNickName"].value,
      carrierName: this.truck ? this.truck.carrierName : null,
      carrierAddress: this.truck ? this.truck.carrierAddress : null,
      carrierPhone: this.truck ? this.truck.carrierPhone : null,
      carrierQuote: this.truck ? this.truck.carrierQuote : null,
      state: trukStatus ? trukStatus : (this.truck?.state ?? null),
      mapUrl: this.truck ? this.truck.mapUrl : null,
      carrierEmail: this.truck ? this.truck.carrierEmail : null,
      proLoadNumber: this.newShipmentForm.controls["proLoadNumber"].value,
      licensePlateNo: this.newShipmentForm.controls["licensePlateNumber"].value,
      isCompanyTruck: this.truck ? this.truck.isCompanyTruck : 0,
      lasttouch: this.truck ? this.truck.lasttouch : null,
      carrierId: this.truck ? this.truck.carrierId : null,
      driverPhone: this.newShipmentForm.controls["driverPhone"].value,
      quoteDueBy: quoteDueBy.toISOString().slice(0, 19).replace('T', ' '),
      lastUpdated: null,
      shipments,
      tlQuotes: tlquotes,
      mileage: this.freightTotals?.mileage ? this.freightTotals?.mileage : 0,
      truckFees: this.truckFees,
      linearFoot: linearFeetValue,
      isProblem: false,
      salesRep: this.truck ? this.truck.salesRep : null,
      trailerNumber: this.truck ? this.truck.trailerNumber : null,
      extTruckNumber: this.truck ? this.truck.extTruckNumber : null,
      tractorNumber: this.truck ? this.truck.tractorNumber : null
    };

    return truck;
  }

  setTruckEdit(carriersData: CarrierDetail[] | any = null) {
    const fnTruckEdit = () => {
      this.tss.getTruck(this.truckID).subscribe({
        next: (response: any) => {
          this.shipmentType = 'Truckload';
          this.isShipmentEdit = true;
          this.truck = this.timezoneProcessor(response, 'TL');
          this.oldTruckload = JSON.parse(JSON.stringify(this.truck));
          if (this.truck?.tlQuotes) {
            for (let i = 0; i < this.truck.tlQuotes.length; i++) {
              if (this.truck.tlQuotes[i].quoteID && this.truck.tlQuotes[i].assigned && !this.truck.tlQuotes[i].truckNotUsed) {
                this.quoteSelected = this.truck.tlQuotes[i];
              }
              if (this.truck.tlQuotes[i].quoteID && this.truck.tlQuotes[i].truckNotUsed) {
                this.quotesNotUsed.push(this.truck.tlQuotes[i]);
              }
              if (this.truck.tlQuotes[i]) {
                if (this.truck.tlQuotes[i].assigned == true && this.truck.tlQuotes[i].carrierID != '1') { this.quoteAssigned = true; }
                if (this.truck.tlQuotes[i].assigned == true && this.truck.tlQuotes[i].carrierID != '1') {
                  this.carrierQuoteAssigned = this.truck.tlQuotes[i].carrierID;
                }
              }
            }
          }
          this.truckFees = this.truck?.truckFees ?? [];
          this.shipment = response.shipments.length === 1 ? response.shipments[0] : response.shipments[response.shipments.length - 1];
          this.shipmentID = this.shipment?.shipmentDetail?.shipmentID;
          if (this.truck?.shipments && this.truck?.shipments?.length > 1) { this.showMultiStopFields = true; }
          const orf: any[] = this.shipment?.openReferenceFields ?? [];
          this.oldOpenReferenceFields = orf.map((arrayElement) => Object.assign({}, arrayElement));
          this.clientPlantID = this.shipment?.client?.tiberID;
          this.currentGroupID = this.shipment?.client?.groupID ?? null;
          this.currentClient = this.shipment?.client?.clientCode + '-' + this.shipment?.client?.companyName;
          this.currentGroupName = this.shipment?.client?.groupName + '-' + this.shipment?.client?.address;
          this.clientDropdown.currentClient = this.shipment?.client?.clientCode + '-' + this.shipment?.client?.companyName;
          this.clientDropdown.currentGroupName = this.shipment?.client?.groupName + '-' + this.shipment?.client?.address;
          this.clientDropdown.currentGroup = this.shipment?.client?.groupID;
          this.clientDropdown.setClient(true);
          this.preSelectedCarrierID = this.shipment?.carrierDetail?.tiberID ?? null;
          this.preSelectedCarrierName = this.shipment?.carrierDetail?.carrierName ?? null;
          this.clientPlantSelected = true;
          this.setEditGroupCustomizations(this.currentGroupID);
          this.editSetDetails();
          this.editSetShipperConsignee();
          this.editSetFreight();
          this.editSetManualQuotes(this.truck?.tlQuotes?.filter((x) => x.clientQuote == false) ?? []);
          this.editSetManualTruckFees(this.truck?.truckFees);
          this.setEditStops();
          this.editSetTimezones();
          this.setEditMode(this.shipment?.shipmentDetail?.mode);
          if (this.disabledEditAsClone) {
            this.disableEdit = false;
          }
        },
        error: () => {
          this.spinner.hide('spinnerShipmentForm').then();
          Swal.fire('Something went wrong trying to load Truckload Shipment', '', 'warning').then(() => {
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/new']);
            });
          });
        },
        complete: async () => {
          this.spinner.hide('spinnerShipmentForm').then();
          setTimeout(() => this.resetShipmentEdited(), 1000);
          const fnc = () => {
            this.setEditTargetRate(this.shipment?.targetRates);
          };
          setTimeout(() => this.setMileage(fnc), 1000);
          this.minDate = formatDate(this.shipment?.shipmentDetail?.enteredShipDate ?? '', 'yyyy-MM-dd', 'en', '');
          this.clientDropdown.groupForm.get('client')?.setValue(this.currentClient);
          $('#client').removeClass('ng-invalid');
          if (this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value) {
            $('#shipmentBillTo').removeClass('ng-invalid');
          }

          if (this.newShipmentForm.controls["shipmentForm"].get('modes')?.value) {
            $('#modes').removeClass('ng-invalid');
          }

          if (this.newShipmentForm.controls["shipmentForm"].get('equipment')?.value) {
            $('#equipment').removeClass('ng-invalid').removeClass('is-invalid');
          }

          setTimeout(() => {
            if (document.querySelectorAll('input.ng-invalid').length > 0) {
              $('input.ng-invalid').removeClass('ng-invalid');
            }
          }, 500);
        }
      });
    };

    this.getCarrierList(carriersData, fnTruckEdit);
  }

  refreshCarrierList() {
    this.spinner.show('spinnerShipmentForm').then();
    const fn = () => {
      this.spinner.hide('spinnerShipmentForm').then();
    };
    this.getCarrierList(null, fn);
  }

  async createAuditingNotes(shipmentDetails: any) {
    // edit shipment notes
    const notesText = [];

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };

    if (this.editShipperAndConsignee.shipmentDetail.enteredShipDate?.split('T')[0] !==
      shipmentDetails.shipmentDetail?.enteredShipDate?.split('T')[0]) {
      notesText.push(
        'Ship Date updated from (' +
        (this.isDate(this.editShipperAndConsignee.shipmentDetail.enteredShipDate) ?
          this.editShipperAndConsignee.shipmentDetail.enteredShipDate?.split('T')[0] : ' ') + ') to (' +
        (this.isDate(shipmentDetails?.shipmentDetail?.enteredShipDate) ?
          shipmentDetails.shipmentDetail?.enteredShipDate?.split('T')[0] : ' ') + ')'
      );
    }

    const editShipmentClientName = this.groupInfo.companyName;
    if (this.editShipperAndConsignee.client.companyName !== editShipmentClientName) {
      notesText.push('Client Name updated from (' + (this.editShipperAndConsignee.client.companyName ?
        this.editShipperAndConsignee.client.companyName : ' ') + ') to (' + (editShipmentClientName ? editShipmentClientName : ' ') + ')');
    }

    const editShipmentClientPlantName = this.groupInfo.groupName;
    if (this.editShipperAndConsignee.client.groupName !== editShipmentClientPlantName) {
      notesText.push('Plant updated from (' + (this.editShipperAndConsignee.client.groupName ?
        this.editShipperAndConsignee.client.groupName : ' ') + ') to (' + (editShipmentClientPlantName ?
        editShipmentClientPlantName : ' ') + ')');
    }

    // Billing terms
    if (this.editShipperAndConsignee.shipmentDetail.terms !== this.shipment?.shipmentDetail?.terms) {
      notesText.push('Billing terms (' + (this.editShipperAndConsignee.shipmentDetail.terms ?
          this.editShipperAndConsignee.shipmentDetail.terms : ' ') + ') to (' +
        (this.shipment?.shipmentDetail?.terms ? this.shipment?.shipmentDetail?.terms : ' ') + ')');
    }

    // bill to fields
    if ((this.shipment?.billTo == null && this.editShipperAndConsignee.billTo == null) || (this.shipment?.billTo == null &&
      this.editShipperAndConsignee.billTo.billtoID == null)) {
      // nothing to note
    } else {
      if (this.editShipperAndConsignee.billTo !== this.shipment?.billTo) {

        if (this.editShipperAndConsignee?.billTo?.name !== this.shipment?.billTo?.name) {
          notesText.push('Billing Terms Name updated from (' + (this.editShipperAndConsignee?.billTo?.name ?
            this.editShipperAndConsignee?.billTo?.name : ' ') + ') to (' + (this.shipment?.billTo?.name ?
            this.shipment?.billTo?.name : ' ') + ')');
        }

        if (this.editShipperAndConsignee?.billTo?.careof !== this.shipment?.billTo?.careof) {
          if (!(this.editShipperAndConsignee.shipmentDetail.terms == 'Prepaid' && this.editShipperAndConsignee.shipmentDetail.terms ==
            this.shipment?.shipmentDetail?.terms)) {
            notesText.push('Billing Terms Care Of updated from (' + (this.editShipperAndConsignee?.billTo?.careof ?
              this.editShipperAndConsignee?.billTo?.careof : ' ') + ') to (' + (this.shipment?.billTo?.careof ?
              this.shipment?.billTo?.careof : ' ') + ')');
          }
        }

        if (this.editShipperAndConsignee?.billTo?.address !== this.shipment?.billTo?.address) {
          notesText.push('Billing Terms Address updated from (' + (this.editShipperAndConsignee?.billTo?.address ?
            this.editShipperAndConsignee?.billTo?.address : ' ') + ') to (' + (this.shipment?.billTo?.address ?
            this.shipment?.billTo?.address : ' ') + ')');
        }

        if (this.editShipperAndConsignee?.billTo?.zip !== this.shipment?.billTo?.zip) {
          notesText.push('Billing Terms Zip updated from (' + (this.editShipperAndConsignee?.billTo?.zip ?
            this.editShipperAndConsignee?.billTo?.zip : ' ') + ') to (' + (this.shipment?.billTo?.zip ?
            this.shipment?.billTo?.zip : ' ') + ')');
        }

        if (this.editShipperAndConsignee?.billTo?.city !== this.shipment?.billTo?.city) {
          notesText.push('Billing Terms City updated from (' + (this.editShipperAndConsignee?.billTo?.city ?
            this.editShipperAndConsignee?.billTo?.city : ' ') + ') to (' + (this.shipment?.billTo?.city ?
            this.shipment?.billTo?.city : ' ') + ')');
        }

        if (this.editShipperAndConsignee?.billTo?.state !== this.shipment?.billTo?.state) {
          notesText.push('Billing Terms State updated from (' + (this.editShipperAndConsignee?.billTo?.state ?
            this.editShipperAndConsignee?.billTo?.state : ' ') + ') to (' + (this.shipment?.billTo?.state ?
            this.shipment?.billTo?.state : ' ') + ')');
        }

      }
    }

    if (Boolean(this.editShipperAndConsignee.shipmentDetail.appointmentRequired) !==
      Boolean(this.shipment?.shipmentDetail?.appointmentRequired)) {
      notesText.push('Appointment Required from (' +
        (this.editShipperAndConsignee.shipmentDetail.appointmentRequired ? 'Checked' : 'Not Checked') + ') to (' +
        (this.shipment?.shipmentDetail?.appointmentRequired ? 'Checked)' : 'Not Checked)'));
    }

    if (Boolean(this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentRequired) !==
      Boolean(this.shipment?.shipmentDetail?.deliveryAppointmentRequired)) {
      notesText.push('Delivery Appointment Required from (' +
        (this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentRequired ? 'Checked' : 'Not Checked') + ') to (' +
        (this.shipment?.shipmentDetail?.deliveryAppointmentRequired ? 'Checked)' : 'Not Checked)'));
    }

    // appointment set
    if (Boolean(this.editShipperAndConsignee.shipmentDetail.appointmentSet) !== Boolean(this.shipment?.shipmentDetail?.appointmentSet)) {
      notesText.push('Appointment Set updated from (' +
        (this.editShipperAndConsignee.shipmentDetail.appointmentSet ? 'Checked' : 'Not Checked') + ') to (' +
        (this.shipment?.shipmentDetail?.appointmentSet ? 'Checked)' : 'Not Checked)'));
    }

    // pickupAppointmentStart
    if (this.shipment?.shipmentDetail?.pickupAppointmentStart && this.pickupAppointmentStartSet) {
      notesText.push('Pickup ' + (this.shipmentType !== 'LTL' ? 'Window' : 'Appointment') + ' Start updated from  (' +
        (this.isDate(this.editShipperAndConsignee.shipmentDetail.pickupAppointmentStart) ?
          new Date(this.editShipperAndConsignee.shipmentDetail.pickupAppointmentStart).toLocaleDateString('en-US', options) : ' ') +
        ') to (' + (this.isDate(this.shipment?.shipmentDetail?.pickupAppointmentStart) ?
          new Date(this.pickupAppointmentStart ?? '').toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // pickup Appointment stop
    if (this.shipment?.shipmentDetail?.pickupAppointmentStop && this.pickupAppointmentStopSet) {
      notesText.push('Pickup ' + (this.shipmentType !== 'LTL' ? 'Window' : 'Appointment') + ' Stop updated from (' +
        (this.isDate(this.editShipperAndConsignee.shipmentDetail.pickupAppointmentStop) ?
          new Date(this.editShipperAndConsignee.shipmentDetail.pickupAppointmentStop).toLocaleDateString('en-US', options) : ' ') +
        ') to (' + (this.isDate(this.shipment?.shipmentDetail?.pickupAppointmentStop) ?
          new Date(this.pickupAppointmentStop ?? '').toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // Delivery Date Appointment Start
    if (this.shipment?.shipmentDetail?.deliveryAppointmentStart && this.deliveryAppointmentStartSet) {
      notesText.push('Delivery ' + (this.shipmentType !== 'LTL' ? 'Window' : 'Appointment') + ' Start updated from (' +
        (this.isDate(this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentStart) ?
          new Date(this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentStart).toLocaleDateString('en-US', options) : ' ')
        + ') to (' + (this.isDate(this.shipment?.shipmentDetail?.deliveryAppointmentStart) ?
          new Date(this.deliveryAppointmentStart ?? '').toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // Delivery Date Appointment Stop
    if (this.shipment?.shipmentDetail?.deliveryAppointmentStop && this.deliveryAppointmentStopSet) {
      notesText.push('Delivery ' + (this.shipmentType !== 'LTL' ? 'Window' : 'Appointment') + ' Stop updated from (' +
        (this.isDate(this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentStop) ?
          new Date(this.editShipperAndConsignee.shipmentDetail.deliveryAppointmentStop).toLocaleDateString('en-US', options) : ' ')
        + ') to (' + (this.isDate(this.shipment?.shipmentDetail?.deliveryAppointmentStop) ?
          new Date(this.deliveryAppointmentStop ?? '').toLocaleDateString('en-US', options) : ' ') + ')');
    }

    // Contact
    if (this.editShipperAndConsignee.shipmentDetail.contact !== this.shipment?.shipmentDetail?.contact) {
      notesText.push('Contact updated from (' + (this.editShipperAndConsignee.shipmentDetail.contact ?
        this.editShipperAndConsignee.shipmentDetail.contact : ' ') + ') to (' + (this.shipment?.shipmentDetail?.contact ?
        this.shipment?.shipmentDetail?.contact : ' ') + ')');
    }

    // Special Instructions
    if (this.shipmentType === 'LTL') {
      if (this.editShipperAndConsignee.shipmentDetail.specialInstructions !== this.shipment?.shipmentDetail?.specialInstructions) {
        notesText.push('Special Instructions updated from (' + (this.editShipperAndConsignee.shipmentDetail.specialInstructions ?
            this.editShipperAndConsignee.shipmentDetail.specialInstructions : ' ') + ') to (' +
          (this.shipment?.shipmentDetail?.specialInstructions ? this.shipment?.shipmentDetail?.specialInstructions : ' ') + ')');
      }

      // PO number
      if (this.editShipperAndConsignee.shipmentDetail.poNumber !== this.shipment?.shipmentDetail?.poNumber) {
        notesText.push('PO updated from (' + (this.editShipperAndConsignee.shipmentDetail.poNumber ?
          this.editShipperAndConsignee.shipmentDetail.poNumber : ' ') + ') to (' + (this.shipment?.shipmentDetail?.poNumber ?
          this.shipment?.shipmentDetail?.poNumber : ' ') + ')');
      }
    }

    // isReturn
    if (this.editShipperAndConsignee.shipmentDetail.isReturn !== this.shipment?.shipmentDetail?.isReturn) {
      notesText.push('Mark Shipment as Return from (' + (this.editShipperAndConsignee.shipmentDetail.isReturn ?
        this.editShipperAndConsignee.shipmentDetail.isReturn : 'false') + ') to (' + (this.shipment?.shipmentDetail?.isReturn ?
        this.shipment?.shipmentDetail?.isReturn : 'false') + ')');
    }

    // serviceLevel
    if (this.editShipperAndConsignee.shipmentDetail.serviceLevel !== this.shipment?.shipmentDetail?.serviceLevel) {
      notesText.push('Service Level updated from (' + (this.editShipperAndConsignee.shipmentDetail.serviceLevel ?
        this.editShipperAndConsignee.shipmentDetail.serviceLevel : ' ') + ') to (' + (this.shipment?.shipmentDetail?.serviceLevel ?
        this.shipment?.shipmentDetail?.serviceLevel : ' ') + ')');
    }

    // priority
    if (this.editShipperAndConsignee.shipmentDetail.priority !== this.shipment?.shipmentDetail?.priority) {
      notesText.push('Priority updated from (' + (this.editShipperAndConsignee.shipmentDetail.priority ?
        this.editShipperAndConsignee.shipmentDetail.priority : ' ') + ') to (' + (this.shipment?.shipmentDetail?.priority ?
        this.shipment?.shipmentDetail?.priority : ' ') + ')');
    }

    // mabdDate
    if (!this.editShipperAndConsignee.shipmentDetail.mabdDate && (!this.shipment?.shipmentDetail?.mabdDate ||
      this.shipment?.shipmentDetail?.mabdDate == '')) {
      // nothing to note
    } else if (this.editShipperAndConsignee.shipmentDetail.mabdDate !== this.shipment?.shipmentDetail?.mabdDate) {
      notesText.push('MABD updated from (' + (this.editShipperAndConsignee.shipmentDetail.mabdDate ?
        this.editShipperAndConsignee.shipmentDetail.mabdDate : ' ') + ') to (' + (this.shipment?.shipmentDetail?.mabdDate ?
        this.shipment?.shipmentDetail?.mabdDate : ' ') + ')');
    }

    // ilCost
    if ((!this.editShipperAndConsignee.shipmentDetail.ilCost && (!this.shipment?.shipmentDetail?.ilCost ||
        this.shipment?.shipmentDetail?.ilCost == '0')) ||
      ((this.editShipperAndConsignee.shipmentDetail.ilCost == '0.00' || this.editShipperAndConsignee.shipmentDetail.ilCost == '0' ||
        !this.editShipperAndConsignee.shipmentDetail.ilCost) && (this.shipment?.shipmentDetail?.ilCost == '0.00' ||
        this.shipment?.shipmentDetail?.ilCost == '0' || !this.shipment?.shipmentDetail?.ilCost))) {
      // nothing to note
    } else if (this.editShipperAndConsignee.shipmentDetail.ilCost != this.shipment?.shipmentDetail?.ilCost) {
      notesText.push('IL Cost updated from (' + (this.editShipperAndConsignee.shipmentDetail.ilCost ?
        this.editShipperAndConsignee.shipmentDetail.ilCost : ' ') + ') to (' + (this.shipment?.shipmentDetail?.ilCost ?
        this.shipment?.shipmentDetail?.ilCost : ' ') + ')');
    }

    // clientCost
    if ((!this.editShipperAndConsignee.shipmentDetail.clientCost && (!this.shipment?.shipmentDetail?.clientCost ||
        this.shipment?.shipmentDetail?.clientCost == '0')) ||
      ((this.editShipperAndConsignee.shipmentDetail.clientCost == '0.00' || this.editShipperAndConsignee.shipmentDetail.clientCost == '0' ||
        !this.editShipperAndConsignee.shipmentDetail.clientCost) && (this.shipment?.shipmentDetail?.clientCost == '0.00' ||
        this.shipment?.shipmentDetail?.clientCost == '0' || !this.shipment?.shipmentDetail?.clientCost))) {
      // nothing to note
    } else if (this.editShipperAndConsignee.shipmentDetail.clientCost !== this.shipment?.shipmentDetail?.clientCost) {
      notesText.push('Client Cost updated from (' + (this.editShipperAndConsignee.shipmentDetail.clientCost ?
        this.editShipperAndConsignee.shipmentDetail.clientCost : ' ') + ') to (' + (this.shipment?.shipmentDetail?.clientCost ?
        this.shipment?.shipmentDetail?.clientCost : ' ') + ')');
    }

    // customerCost
    if ((!this.editShipperAndConsignee.shipmentDetail.customerCost && (!this.shipment?.shipmentDetail?.customerCost ||
      this.shipment?.shipmentDetail?.customerCost == '0')) || ((this.editShipperAndConsignee.shipmentDetail.customerCost == '0.00' ||
        this.editShipperAndConsignee.shipmentDetail.customerCost == '0' || !this.editShipperAndConsignee.shipmentDetail.customerCost) &&
      (this.shipment?.shipmentDetail?.customerCost == '0.00' || this.shipment?.shipmentDetail?.customerCost == '0' ||
        !this.shipment?.shipmentDetail?.customerCost))) {
      // nothing to note
    } else if (this.editShipperAndConsignee.shipmentDetail.customerCost !== this.shipment?.shipmentDetail?.customerCost) {
      notesText.push('Customer Cost updated from (' + (this.editShipperAndConsignee.shipmentDetail.customerCost ?
        this.editShipperAndConsignee.shipmentDetail.customerCost : ' ') + ') to (' + (this.shipment?.shipmentDetail?.customerCost ?
        this.shipment?.shipmentDetail?.customerCost : ' ') + ')');
    }

    // reference fields
    if (this.oldOpenReferenceFields !== this.shipment?.openReferenceFields) {
      if (this.shipment?.openReferenceFields) {
        for (let i = 0; i < this.shipment.openReferenceFields.length; i++) {
          const oldReferences: any[] = this.oldOpenReferenceFields;
          const oldReference = oldReferences.find(ref => ref.rftID === this.shipment?.openReferenceFields[i].rftID);
          if (!oldReference) {
            notesText.push(this.shipment.openReferenceFields[i].rftDescription + ' updated from () to (' +
              (this.shipment.openReferenceFields[i].value ? this.shipment.openReferenceFields[i].value : ' ') + ')');
          } else if (this.shipment.openReferenceFields[i].value !== oldReference.value) {
            notesText.push(this.shipment.openReferenceFields[i].rftDescription + ' updated from (' +
              (oldReference.value ? oldReference.value : ' ') + ') to (' + (this.shipment.openReferenceFields[i].value ?
                this.shipment.openReferenceFields[i].value : ' ') + ')');
          }
        }
      }

      for (let i = 0; i < this.oldOpenReferenceFields.length; i++) {
        const oldReferences: any[] = this.shipment?.openReferenceFields ?? [];
        const oldReference = oldReferences.find(ref => ref.rftID === this.oldOpenReferenceFields[i].rftID);
        if (!oldReference) {
          notesText.push(this.oldOpenReferenceFields[i].rftDescription + ' updated from (' + (this.oldOpenReferenceFields[i].value ?
            this.oldOpenReferenceFields[i].value : ' ') + ') to ()');
        }
      }
    }

    if (this.editShipperAndConsignee.referenceFields !== this.shipment?.referenceFields) {
      for (let i = 0; i < this.editShipperAndConsignee.referenceFields.length; i++) {
        const newReferences: ReferenceField[] | any = this.shipment?.referenceFields;
        const newReference: ReferenceField | any = newReferences.find(
          (ref: any) => ref.description === this.editShipperAndConsignee.referenceFields[i].description);
        if (!newReference) {
          notesText.push(this.editShipperAndConsignee.referenceFields[i].description + ' updated from (' +
            (this.editShipperAndConsignee.referenceFields[i].value ? this.editShipperAndConsignee.referenceFields[i].value : ' ') +
            ') to ()');
        } else if (this.editShipperAndConsignee.referenceFields[i].value !== newReference.value) {
          notesText.push(this.editShipperAndConsignee.referenceFields[i].description + ' updated from (' +
            (this.editShipperAndConsignee.referenceFields[i].value ? this.editShipperAndConsignee.referenceFields[i].value : ' ') +
            ') to (' + (newReference.value ? newReference.value : ' ') + ')');
        }
      }

      if (this.shipment?.referenceFields) {
        for (let i = 0; i < this.shipment.referenceFields.length; i++) {
          const newReferences: ReferenceField[] = this.editShipperAndConsignee.referenceFields;
          const newReference: ReferenceField | any = newReferences.find(
            ref => ref.description === this.shipment?.referenceFields[i].description);
          if (!newReference) {
            notesText.push(this.shipment.referenceFields[i].description + ' updated from () to (' +
              (this.shipment.referenceFields[i].value ? this.shipment.referenceFields[i].value : ' ') + ')');
          }
        }
      }
    }

    // Additional Insurance
    if (this.editShipperAndConsignee.shipmentDetail.additionalValue !== this.shipment?.shipmentDetail?.additionalValue) {
      notesText.push('Additional Insurance updated from (' + (this.editShipperAndConsignee.shipmentDetail.additionalValue ?
        this.editShipperAndConsignee.shipmentDetail.additionalValue : ' ') + ') to (' + (this.shipment?.shipmentDetail?.additionalValue ?
        this.shipment?.shipmentDetail?.additionalValue : ' ') + ')');
    }

    // log any changes for consignee
    if (this.shipment?.consignee == this.editShipperAndConsignee.consignee) {

    } else {

      if (this.shipment?.consignee?.zip !== this.editShipperAndConsignee.consignee.zip) {
        notesText.push('Consignee Zip updated from (' + (this.editShipperAndConsignee.consignee.zip ?
          this.editShipperAndConsignee.consignee.zip : ' ') + ') to (' + (this.shipment?.consignee?.zip ?
          this.shipment?.consignee?.zip : ' ') + ')');
      }

      if (this.shipment?.consignee?.streetAddress !== this.editShipperAndConsignee.consignee.streetAddress) {
        notesText.push('Consignee Address updated from (' + (this.editShipperAndConsignee.consignee.streetAddress ?
          this.editShipperAndConsignee.consignee.streetAddress : ' ') + ') to (' + (this.shipment?.consignee?.streetAddress ?
          this.shipment?.consignee?.streetAddress : ' ') + ')');
      }

      if (this.shipment?.consignee?.state !== this.editShipperAndConsignee.consignee.state) {
        notesText.push('Consignee State updated from (' + (this.editShipperAndConsignee.consignee.state ?
          this.editShipperAndConsignee.consignee.state : ' ') + ') to (' + (this.shipment?.consignee?.state ?
          this.shipment?.consignee?.state : ' ') + ')');
      }

      if (this.shipment?.consignee?.countryCode !== this.editShipperAndConsignee.consignee.countryCode) {
        notesText.push('Consignee Country updated from (' + (this.editShipperAndConsignee.consignee.countryCode ?
          this.editShipperAndConsignee.consignee.countryCode : ' ') + ') to (' + (this.shipment?.consignee?.countryCode ?
          this.shipment?.consignee?.countryCode : ' ') + ')');
      }

      if (this.shipment?.consignee?.plant !== this.editShipperAndConsignee.consignee.plant) {
        notesText.push('Consignee Plant updated from (' + (this.editShipperAndConsignee.consignee.plant ?
          this.editShipperAndConsignee.consignee.plant : ' ') + ') to (' + (this.shipment?.consignee?.plant ?
          this.shipment?.consignee?.plant : ' ') + ')');
      }

      if (this.shipment?.consignee?.phone !== this.editShipperAndConsignee.consignee.phone) {
        notesText.push('Consignee Phone updated from (' + (this.editShipperAndConsignee.consignee.phone ?
          this.editShipperAndConsignee.consignee.phone : ' ') + ') to (' + (this.shipment?.consignee?.phone ?
          this.shipment?.consignee?.phone : ' ') + ')');
      }

      if (this.shipment?.consignee?.name !== this.editShipperAndConsignee.consignee.name) {
        notesText.push('Consignee Name updated from (' + (this.editShipperAndConsignee.consignee.name ?
          this.editShipperAndConsignee.consignee.name : ' ') + ') to (' + (this.shipment?.consignee?.name ?
          this.shipment?.consignee?.name : ' ') + ')');
      }

      if (this.shipment?.consignee?.id !== this.editShipperAndConsignee.consignee.id) {
        notesText.push('Consignee ID updated from (' + (this.editShipperAndConsignee.consignee.id ?
          this.editShipperAndConsignee.consignee.id : ' ') + ') to (' + (this.shipment?.consignee?.id ?
          this.shipment?.consignee?.id : ' ') + ')');
      }

      if (this.shipment?.consignee?.email !== this.editShipperAndConsignee.consignee.email) {
        notesText.push('Consignee Email updated from (' + (this.editShipperAndConsignee.consignee.email ?
          this.editShipperAndConsignee.consignee.email : ' ') + ') to (' + (this.shipment?.consignee?.email ?
          this.shipment?.consignee?.email : ' ') + ')');
      }

      if (this.shipment?.consignee?.contact !== this.editShipperAndConsignee.consignee.contact) {
        notesText.push('Consignee Contact updated from (' + (this.editShipperAndConsignee.consignee.contact ?
          this.editShipperAndConsignee.consignee.contact : ' ') + ') to (' + (this.shipment?.consignee?.contact ?
          this.shipment?.consignee?.contact : ' ') + ')');
      }

      if (this.shipment?.consignee?.city !== this.editShipperAndConsignee.consignee.city) {
        notesText.push('Consignee City updated from (' + (this.editShipperAndConsignee.consignee.city ?
          this.editShipperAndConsignee.consignee.city : ' ') + ') to (' + (this.shipment?.consignee?.city ?
          this.shipment?.consignee?.city : ' ') + ')');
      }

      if (this.shipment?.consignee?.address3?.toString() !== this.editShipperAndConsignee.consignee.address3?.toString()) {
        notesText.push('Consignee Address 3 updated from (' + (this.editShipperAndConsignee.consignee.address3 ?
          this.editShipperAndConsignee.consignee.address3 : ' ') + ') to (' + (this.shipment?.consignee?.address3 ?
          this.shipment?.consignee?.address3 : ' ') + ')');
      }

      if (this.shipment?.consignee?.address2?.toString() !== this.editShipperAndConsignee.consignee.address2?.toString()) {
        notesText.push('Consignee Address 2 updated from (' + (this.editShipperAndConsignee.consignee.address2 ?
          this.editShipperAndConsignee.consignee.address2 : ' ') + ') to (' + (this.shipment?.consignee?.address2 ?
          this.shipment?.consignee?.address2 : ' ') + ')');
      }
    }

    // Carrier
    if (this.shipment?.carrierDetail?.tiberID == null && this.editShipperAndConsignee.carrierDetail == null) {
      // nothing to note
    } else {
      if (this.shipmentType === 'LTL' &&
        this.shipment?.carrierDetail?.tiberID?.toString() !== this.editShipperAndConsignee.carrierDetail.tiberID?.toString()) {
        notesText.push('Carrier updated from (' + (this.editShipperAndConsignee.carrierDetail?.carrierName ?
          this.editShipperAndConsignee.carrierDetail?.carrierName : ' ') + ') to (' + (this.shipment?.carrierDetail?.carrierName ?
          this.shipment?.carrierDetail?.carrierName : ' ') + ')');
      }
    }

    // log any changes for freight to notes
    const lineText: string[] = [];
    for (let i = 0; i < this.editLineItems.length; i++) {
      lineText.length = 0;
      if (this.editLineItems[i] !== this.lineItems[i]) {
        if (this.editLineItems[i].productCode !== this.lineItems[i].productCode) {
          lineText.push('Freight Item number updated from (' + (this.editLineItems[i].productCode ?
            this.editLineItems[i].productCode : ' ') + ') to (' + (this.lineItems[i].productCode ?
            this.lineItems[i].productCode : ' ') + ')');
        }

        if (this.editLineItems[i].productDescription !== this.lineItems[i].productDescription) {
          lineText.push('Freight Description updated from (' + (this.editLineItems[i].productDescription ?
            this.editLineItems[i].productDescription : ' ') + ') to (' + (this.lineItems[i].productDescription ?
            this.lineItems[i].productDescription : ' ') + ')');
        }

        if (this.editLineItems[i].nmfc !== this.lineItems[i].nmfc) {
          lineText.push('Freight NMFC updated from (' + (this.editLineItems[i].nmfc ? this.editLineItems[i].nmfc : ' ') +
            ') to (' + (this.lineItems[i].nmfc ? this.lineItems[i].nmfc : ' ') + ')');
        }

        if (this.editLineItems[i].freightClass !== this.lineItems[i].freightClass) {
          lineText.push('Freight Class updated from (' + (this.editLineItems[i].freightClass ? this.editLineItems[i].freightClass : ' ') +
            ') to (' + (this.lineItems[i].freightClass ? this.lineItems[i].freightClass : ' ') + ')');
        }

        if (this.editLineItems[i].hazmat !== this.lineItems[i].hazmat) {
          lineText.push('Freight HM updated from (' + (this.editLineItems[i].hazmat ? 'Checked' : 'Not Checked') + ') to (' +
            (this.lineItems[i].hazmat ? 'Checked' : 'Not Checked') + ')');
        }

        if (this.editLineItems[i].handlingUnits !== this.lineItems[i].handlingUnits) {
          lineText.push('Freight H/U updated from (' + (this.editLineItems[i].handlingUnits ? this.editLineItems[i].handlingUnits : ' ') +
            ') to (' + (this.lineItems[i].handlingUnits ? this.lineItems[i].handlingUnits : ' ') + ')');
        }

        if (this.editLineItems[i].unitType !== this.lineItems[i].unitType) {
          lineText.push('Freight Unit Type updated from (' + (this.editLineItems[i].unitType ? this.editLineItems[i].unitType : ' ') +
            ') to (' + (this.lineItems[i].unitType ? this.lineItems[i].unitType : ' ') + ')');
        }

        if (this.editLineItems[i].pieces !== this.lineItems[i].pieces) {
          lineText.push('Freight Pieces updated from (' + (this.editLineItems[i].pieces ? this.editLineItems[i].pieces : ' ') +
            ') to (' + (this.lineItems[i].pieces ? this.lineItems[i].pieces : ' ') + ')');
        }

        if (this.editLineItems[i].unitWeight !== this.lineItems[i].unitWeight) {
          lineText.push('Freight Lbs/Units updated from (' + (this.editLineItems[i].unitWeight ? this.editLineItems[i].unitWeight : ' ') +
            ') to (' + (this.lineItems[i].unitWeight ? this.lineItems[i].unitWeight : ' ') + ')');
        }

        if (this.editLineItems[i].totalWeight !== this.lineItems[i].totalWeight) {
          lineText.push('Freight Total Lbs updated from (' + (this.editLineItems[i].totalWeight ? this.editLineItems[i].totalWeight : ' ') +
            ') to (' + (this.lineItems[i].totalWeight ? this.lineItems[i].totalWeight : ' ') + ')');
        }

        if (this.editLineItems[i].length !== this.lineItems[i].length) {
          lineText.push('Freight Length updated from (' + (this.editLineItems[i].length ? this.editLineItems[i].length : ' ') + ') to (' +
            (this.lineItems[i].length ? this.lineItems[i].length : ' ') + ')');
        }

        if (this.editLineItems[i].width !== this.lineItems[i].width) {
          lineText.push('Freight Width updated from (' + (this.editLineItems[i].width ? this.editLineItems[i].width : ' ') + ') to (' +
            (this.lineItems[i].width ? this.lineItems[i].width : ' ') + ')');
        }

        if (this.editLineItems[i].height !== this.lineItems[i].height) {
          lineText.push('Freight Height updated from (' + (this.editLineItems[i].height ? this.editLineItems[i].height : ' ') + ') to (' +
            (this.lineItems[i].height ? this.lineItems[i].height : ' ') + ')');
        }

        if (lineText.length > 0) { notesText.push(lineText.join(', ')); }
      }
    }

    // log any changes for manual quotes to notes
    if (this.shipmentType === 'LTL' && this.editShipperAndConsignee.manualQuotes.length > 0) {
      if (this.shipment && this.shipment.manualQuotes.length === 0) { notesText.push('Quotes were removed.'); }
      if (this.shipment && this.shipment.manualQuotes.length > 0) {
        const quotes: ManualQuote[] = this.editShipperAndConsignee.manualQuotes;
        const oldManualQuotes = quotes.filter((q) => q.rateType?.toString() == '2');
        const newQuotes: ManualQuote[] = this.shipment?.manualQuotes;
        const newManualQuotes = newQuotes.filter((q) => q.rateType?.toString() == '2');

        let j = oldManualQuotes.length - 1;
        for (let i = newManualQuotes.length - 1; i >= 0; i--) {
          lineText.length = 0;
          if (j < 0) { break; }
          if (newManualQuotes[i].carrierName !== oldManualQuotes[j].carrierName) {
            lineText.push('Carrier Name updated from (' + (oldManualQuotes[j].carrierName ? oldManualQuotes[j].carrierName : ' ') +
              ') to (' + (newManualQuotes[i].carrierName ? newManualQuotes[i].carrierName : ' ') + ')');
          }

          if (newManualQuotes[i].clientCost !== oldManualQuotes[j].clientCost) {
            lineText.push('Client cost updated from (' + (oldManualQuotes[j].clientCost ? oldManualQuotes[j].clientCost : ' ') + ') to (' +
              (newManualQuotes[i].clientCost ? newManualQuotes[i].clientCost : ' ') + ')');
          }

          if (newManualQuotes[i].carrierCost !== oldManualQuotes[j].carrierCost) {
            lineText.push('Carrier cost updated from (' + (oldManualQuotes[j].carrierCost ? oldManualQuotes[j].carrierCost : ' ') +
              ') to (' + (newManualQuotes[i].carrierCost ? newManualQuotes[i].carrierCost : ' ') + ')');
          }

          if (newManualQuotes[i].quoteNumber !== oldManualQuotes[j].quoteNumber) {
            lineText.push('Quote number updated from (' + (oldManualQuotes[j].quoteNumber ? oldManualQuotes[j].quoteNumber : ' ') +
              ') to (' + (newManualQuotes[i].quoteNumber ? newManualQuotes[i].quoteNumber : ' ') + ')');
          }

          if (newManualQuotes[i].transitTime?.toString() !== oldManualQuotes[j].transitTime?.toString()) {
            lineText.push('Transit time updated from (' + (oldManualQuotes[j].transitTime ? oldManualQuotes[j].transitTime : ' ') +
              ') to (' + (newManualQuotes[i].transitTime ? newManualQuotes[i].transitTime : ' ') + ')');
          }

          if (newManualQuotes[i].notes !== oldManualQuotes[j].notes) {
            lineText.push('Note updated from (' + (oldManualQuotes[j].notes ? oldManualQuotes[j].notes : ' ') + ') to (' +
              (newManualQuotes[i].notes ? newManualQuotes[i].notes : ' ') + ')');
          }

          if (lineText.length > 0) { notesText.push('User ' + this.userName + ' has changed a manual quote: ' + lineText.join(', ')); }
          j = j - 1;
        }
      }
    }

    if (this.shipmentType !== 'LTL') {

      // log any changes for TL Quotes
      let quoteFound = false;
      for (let i = 0; i < this.tlQuotes.length; i++) {
        quoteFound = false;
        lineText.length = 0;
        if (this.truck?.tlQuotes) {
          for (let j = 0; j < this.truck.tlQuotes.length; j++) {
            if (this.tlQuotes[i].quoteID == this.truck.tlQuotes[j].quoteID) {
              quoteFound = true;
              const quoteCarrierName = this.truck.tlQuotes[j].carrierName ? this.truck.tlQuotes[j].carrierName : '';
              // Note: no need to validate the MC number just validate the carrier Name
              if (this.tlQuotes[i].carrierName !== this.truck.tlQuotes[j].carrierName &&
                (this.tlQuotes[i].carrierName && this.tlQuotes[i].carrierName != '' && this.truck.tlQuotes[j].carrierName &&
                  this.truck.tlQuotes[j].carrierName != '')) {
                lineText.push('Carrier Name updated from (' + (this.tlQuotes[i].carrierName ? this.tlQuotes[i].carrierName : ' ') + ') to ('
                  + (this.truck.tlQuotes[j].carrierName ? this.truck.tlQuotes[j].carrierName : ' ') + ').');
              }
              if (this.tlQuotes[i].carrierCost !== this.truck.tlQuotes[j].carrierCost) {
                lineText.push('Carrier Cost updated from (' + (this.tlQuotes[i].carrierCost ? this.tlQuotes[i].carrierCost + ' ' +
                  (this.tlQuotes[i].currencyID === 2 ? 'CAD' : 'USD') : ' ') + ') to (' +(this.truck.tlQuotes[j].carrierCost ?
                  this.truck.tlQuotes[j].carrierCost + ' ' + (this.truck.tlQuotes[j].currencyID === 2 ? 'CAD' : 'USD') : ' ') + ').');
              }
              if (this.tlQuotes[i].clientCost !== this.truck.tlQuotes[j].clientCost) {
                lineText.push('Client Cost updated from (' + (this.tlQuotes[i].clientCost ? this.tlQuotes[i].clientCost + ' ' +
                  (this.truck.shipments && this.truck.shipments[0].client?.cutAbbreviation ? this.truck.shipments[0].client?.cutAbbreviation : '') : ' ') + ') to (' + (this.truck.tlQuotes[j].clientCost ?
                  this.truck.tlQuotes[j].clientCost + ' ' + (this.truck.shipments && this.truck.shipments[0].client?.cutAbbreviation ? this.truck.shipments[0].client?.cutAbbreviation : '') : ' ') + ').');
              }
              if (this.tlQuotes[i].notes !== this.truck.tlQuotes[j].notes) {
                lineText.push('Note updated from (' + (this.tlQuotes[i].notes ? this.tlQuotes[i].notes : ' ') + ') to (' +
                  (this.truck.tlQuotes[j].notes ? this.truck.tlQuotes[j].notes : ' ') + ').');
              }
              if (this.tlQuotes[i].quoteNumber !== this.truck.tlQuotes[j].quoteNumber) {
                lineText.push('Quote Number updated from (' + (this.tlQuotes[i].quoteNumber ? this.tlQuotes[i].quoteNumber : ' ') +
                  ') to (' + (this.truck.tlQuotes[j].quoteNumber ? this.truck.tlQuotes[j].quoteNumber : ' ') + ').');
              }
              if (this.tlQuotes[i].transitTime !== this.truck.tlQuotes[j].transitTime) {
                lineText.push('Transit time updated from (' + (this.tlQuotes[i].transitTime ? this.tlQuotes[i].transitTime : ' ') +
                  ') to (' + (this.truck.tlQuotes[j].transitTime ? this.truck.tlQuotes[j].transitTime : ' ') + ').');
              }
              if (this.tlQuotes[i].equipment !== this.truck.tlQuotes[j].equipment) {
                lineText.push('Equipment updated from (' + (this.tlQuotes[i].equipment ? this.tlQuotes[i].equipment : ' ') + ') to (' +
                  (this.truck.tlQuotes[j].equipment ? this.truck.tlQuotes[j].equipment : ' ') + ').');
              }
              if (this.tlQuotes[i].reasonCode !== this.truck.tlQuotes[j].reasonCode) {
                lineText.push('Reason code updated from (' + (this.tlQuotes[i].reasonCode ? this.tlQuotes[i].reasonCode : ' ') + ') to (' +
                  (this.truck.tlQuotes[j].reasonCode ? this.truck.tlQuotes[j].reasonCode : ' ') + ').');
              }
              if (this.tlQuotes[i].currencyID !== this.truck.tlQuotes[j].currencyID) {
                const currencyFromName =
                  Constants.CURRENCY_DROPDOWN.find(x => x.value == this.tlQuotes[i].currencyID)?.item;
                const currencyToName =
                  Constants.CURRENCY_DROPDOWN.find(x => x.value == this.truck?.tlQuotes?.[j]?.currencyID)?.item;
                lineText.push('Currency updated from (' + (this.tlQuotes[i].currencyID ? currencyFromName : ' ') + ') to (' +
                  (this.truck.tlQuotes[j].currencyID ? currencyToName : ' ') + ').');
              }
              if (this.truck.tlQuotes[j].exchangeRate && this.truck.tlQuotes[j].exchangeRate !== 1 &&
                this.truck.tlQuotes[j].exchangeRate !== this.tlQuotes[i].exchangeRate) {
                lineText.push('Exchange rate: ' + (this.truck.tlQuotes[j].exchangeRate ? this.truck.tlQuotes[j].exchangeRate : ' ') + '.');
              }
              if (lineText.length > 0) { notesText.push('Quote updated, Quote ID: ' + this.tlQuotes[i].quoteID + ', Carrier: ' +
                quoteCarrierName + '. \r\n' + lineText.join('\r\n')); }
            }
          }
        }
        if (!quoteFound) {
          notesText.push('Quote Removed, ' + (this.tlQuotes[i].carrierName ? ('Carrier: ' + this.tlQuotes[i].carrierName + '.') : '') +
            ' Quote ID: ' + this.tlQuotes[i].quoteID);
        }
      }

      // log any Accessories changes
      let AccessoryFound = false;
      const accessoriesTypesList = Constants.ACCESSORIAL_TYPES_DROPDOWN;
      for (let i = 0; i < this.oldTruckFees.length; i++) {
        AccessoryFound = false;
        lineText.length = 0;
        for (let j = 0; j < this.truckFees.length; j++) {
          if (this.oldTruckFees[i].truckFeesId === this.truckFees[j].truckFeesId) {
            AccessoryFound = true;
            const accessoriesFromName =
              accessoriesTypesList.find(x => x.value == this.oldTruckFees[i]?.accessorialTypeId?.toString());
            const accessoriesToName =
              accessoriesTypesList.find(x => x.value == this.truck?.truckFees[j]?.accessorialTypeId?.toString());

            if (this.oldTruckFees[i].truckQuoteId !== this.truckFees[j].truckQuoteId) {
              lineText.push('Quote ID updated from (' + (this.oldTruckFees[i].truckQuoteId ? this.oldTruckFees[i].truckQuoteId : ' ') +
                ') to (' + (this.truckFees[j].truckQuoteId ? this.truckFees[j].truckQuoteId : ' ') + ').');
            }

            if (this.oldTruckFees[i].amount !== this.truckFees[j].amount) {
              lineText.push('Buy Amount updated from (' + (this.oldTruckFees[i].amount ? this.oldTruckFees[i].amount : ' ') + ') to ('
                + (this.truckFees[j].amount ? this.truckFees[j].amount : ' ') + ').');
            }

            if (this.oldTruckFees[i].sellAmount !== this.truckFees[j].sellAmount) {
              lineText.push('Sell Amount updated from (' + (this.oldTruckFees[i].sellAmount ? this.oldTruckFees[i].sellAmount : ' ') +
                ') to (' + (this.truckFees[j].sellAmount ? this.truckFees[j].sellAmount : ' ') + ').');
            }

            if (this.oldTruckFees[i].accessorialTypeId !== this.truckFees[j].accessorialTypeId) {
              lineText.push('Type updated from (' + (this.oldTruckFees[i].accessorialTypeId ? accessoriesFromName?.item : ' ') + ') to (' +
                (this.truckFees[j].accessorialTypeId ? accessoriesToName?.item : ' ') + ').');
            }

            if (this.oldTruckFees[i].feeIncurredAt !== this.truck?.truckFees[j].feeIncurredAt) {
              lineText.push('Occurred At updated from (' + (this.oldTruckFees[i].feeIncurredAt ? this.oldTruckFees[i].feeIncurredAt : ' ') +
                ') to (' + (this.truck?.truckFees[j].feeIncurredAt ? this.truck?.truckFees[j].feeIncurredAt : ' ') + ').');
            }

            if (this.oldTruckFees[i].feeStartTime !== this.truck?.truckFees[j].feeStartTime) {
              lineText.push('Time In updated from (' + (this.oldTruckFees[i].feeStartTime ? this.oldTruckFees[i].feeStartTime : ' ') +
                ') to (' + (this.truck?.truckFees[j].feeStartTime ? this.truck?.truckFees[j].feeStartTime : ' ') + ').');
            }

            if (this.oldTruckFees[i].feeEndTime !== this.truck?.truckFees[j].feeEndTime) {
              lineText.push('Time Out updated from (' + (this.oldTruckFees[i].feeEndTime ? this.oldTruckFees[i].feeEndTime : ' ') +
                ') to (' + (this.truck?.truckFees[j].feeEndTime ? this.truck?.truckFees[j].feeEndTime : ' ') + ').');
            }

            if (this.oldTruckFees[i].stopNum !== this.truck?.truckFees[j].stopNum) {
              lineText.push('Stop # updated from (' + (this.oldTruckFees[i].stopNum ? this.oldTruckFees[i].stopNum : ' ') + ') to (' +
                (this.truck?.truckFees[j].stopNum ? this.truck?.truckFees[j].stopNum : ' ') + ').');
            }

            if (lineText.length > 0) { notesText.push('Accessory ' + accessoriesToName?.item + ' updated. \r\n'  + lineText.join('\r\n')); }
          }
        }
        if (!AccessoryFound) {
          const accessoriesFromName = accessoriesTypesList.find(
            x => x.value == this.oldTruckFees[i].accessorialTypeId?.toString());
          notesText.push('Accessory ' + accessoriesFromName?.item + ' Removed.');
        }
      }

      // mode log
      if (this.oldShipmentType !== this.newShipmentType) {
        const modeFromName = this.modesDropdown?.find(x => x.modeId == this.oldShipmentType);
        const modeToName = this.modesDropdown?.find(x => x.modeId == this.newShipmentType);
        notesText.push('Mode updated from (' + (this.oldShipmentType ? modeFromName?.modDescription : ' ') + ') to (' +
          (this.newShipmentType ? modeToName?.modDescription : ' ') + ')');
      }
    }

    for (let i = 0; i < notesText.length; i++) {
      const note: Note = {
        notText: notesText[i],
        notCognitoUsername: this.userName,
        notID: null,
        notTimeStamp: new Date(),
        clientNote: false,
        isNeedsManagement: false
      } as Note;
      this.rs.addNote(shipmentDetails.shipmentDetail.shipmentID, false, note).subscribe();
    }

    if (this.shipmentType !== 'LTL' && this.oldTruckload?.shipments) {
      for (let i = 0; i < this.oldTruckload?.shipments.length; i++) {
        lineText.length = 0;
        if (this.truck?.shipments){
          for (let j = 0; j < this.truck?.shipments?.length; j++) {
            if (this.oldTruckload?.shipments[i].shipmentDetail?.shipmentID ==
              this.truck?.shipments[j].shipmentDetail?.shipmentID) {
              if (this.oldTruckload?.shipments[i].shipmentDetail?.poNumber !== this.truck?.shipments[j].shipmentDetail?.poNumber) {
                lineText.push('PO Number (STOP #' + this.truck?.shipments[j].shipmentDetail?.shipmentID + ') updated from (' +
                  (this.oldTruckload?.shipments[i].shipmentDetail?.poNumber ?
                    this.oldTruckload?.shipments[i].shipmentDetail?.poNumber : ' ') + ') to (' +
                  (this.truck?.shipments[j].shipmentDetail?.poNumber ? this.truck?.shipments[j].shipmentDetail?.poNumber : ' ') + ')');
              }

              // Special Instructions
              if (this.oldTruckload?.shipments[i].shipmentDetail?.specialInstructions !==
                this.truck?.shipments[j].shipmentDetail?.specialInstructions) {
                lineText.push('Special Instructions (STOP #' + this.truck?.shipments[j].shipmentDetail?.shipmentID + ') updated from (' +
                  (this.oldTruckload?.shipments[i].shipmentDetail?.specialInstructions ?
                    this.oldTruckload?.shipments[i].shipmentDetail?.specialInstructions : ' ') + ') to (' +
                  (this.truck?.shipments[j].shipmentDetail?.specialInstructions ?
                    this.truck?.shipments[j].shipmentDetail?.specialInstructions : ' ') + ')');
              }

              if (lineText.length > 0) {
                const shipId = Number(this.truck?.shipments[i].shipmentDetail?.shipmentID);
                const note: Note = {
                  notText: lineText.join('\r\n'),
                  notCognitoUsername: this.userName,
                  notID: null,
                  notTimeStamp: new Date(),
                  clientNote: false,
                  isNeedsManagement: false
                } as Note;
                this.rs.addNote(shipId, false, note).subscribe();
              }
            }
          }
        }
      }
    }
  }

  getLineItemsByStop(index: number, event: any): any {
    // MAINLY TO FORMAT LINE ITEMS FOR THE RATE REQUEST
    const stopLineItems: any = [];
    const lineItems: any = event;

    lineItems.forEach((value: any) => {
      stopLineItems.push({
        productID: value.productID,
        productCode: value.item,
        productDescription: value.description,
        nmfc: value.nmfcNumber,
        freightClass: value.classNumber,
        handlingUnits: value.unitNumber,
        unitType: value.unitType,
        hazmat: value.hm == true ? 1 : 0,
        pieces: value.piecesNumber,
        length: value.length,
        width: value.width,
        height: value.height,
        unitWeight: value.piecesInputOne,
        totalWeight: value.piecesInputTwo,
        stackable: value.stackChk != '' ? value.stackChk : false,
        sameSkid: value.sameSkid,
        location: value.location
      });
    });

    if (this.stopsLineItems.length > 0) {
      this.stopsLineItems[index] = {lineItems: []};
      this.stopsLineItems[index].lineItems = stopLineItems;
    } else {
      this.stopsLineItems.push({
        lineItems: stopLineItems
      });
    }
    // this.isValidCreateBOL = false;
    this.rateGrid.fetchRatesBtn = true;
    this.getTotalsLineItems(this.rateRequestLineItems, this.stopsLineItems);
  }

  getTotalsLineItems(lineItems: any, stopItems: any) {
    const allLineItems: any[] = [];
    if (lineItems.length > 0) {
      lineItems.forEach((item: any) => {
        allLineItems.push(item);
      });
    }

    if (stopItems.length > 0) {
      stopItems.forEach((value: any) => {
        const items: any[] = value.lineItems;
        items.forEach((item: any) => {
          allLineItems.push(item);
        });
      });
    }
    this.freightTotals.updateTotals(allLineItems);
  }

  resetShipmentEdited() {
    this.shipmentEdited = false;
    this.shipmentEditedCount = 0;
    this.global.shipmentEdited.set(false);
    this.carrierOnboarded = false;
    this.carrierOnboardedNotes.length = 0;
  }

  // Shipment Form Group
  private getShipment() {
    return this.fb.group({
      shipmentDate: ['', Validators.required],
      pickupAppointmentStart: [''],
      pickupAppointmentStop: [''],
      deliveryAppointmentStart: [''],
      deliveryAppointmentTimeStart: [''],
      deliveryAppointmentStop: [''],
      appointmentRequired: [''],
      deliveryAppointmentRequired: [''],
      appointmentSet: [''],
      receivingHourStart: [null],
      receivingHourStop: [null],
      contact: [''],
      shipmentBillTo: [''],
      negotiationType: [''],
      MABDDate: [''],
      type: ['Direct'],
      priority: ['STANDARD'],
      equipment: [null],
      modes: ['', Validators.required]
    });
  }

  // Shipper and Consignee Form Group
  private getShipperConsignee() {
    return this.fb.group({
      // Shipper Controls
      shipperID: [''],
      shipperName: [''],
      shipperPlant: [''],
      shipperAddress1: ['', Validators.required],
      shipperAddress2: [''],
      shipperCountry: ['USA', Validators.required],
      shipperZip: ['', Validators.required],
      shipperCity: ['', Validators.required],
      shipperState: ['', Validators.required],
      shipperEmail: ['', ],
      shipperContact: [''],
      shipperPhone: [''],
      shipperPickupAcc: [''],
      // Consignee Controls
      consigneeID: [''],
      consigneeName: [''],
      consigneePlant: [''],
      consigneeAddress1: ['', Validators.required],
      consigneeAddress2: [''],
      consigneeCountry: ['USA', Validators.required],
      consigneeZip: ['', Validators.required],
      consigneeCity: ['', Validators.required],
      consigneeState: ['', Validators.required],
      consigneeEmail: [''],
      consigneeContact: [''],
      consigneePhone: [''],
      consigneeDeliveryAcc: [''],
      // Bill to controls
      billtoID: [''],
      billToName: [''],
      billToCareOf: [''],
      billToAddress1: [''],
      billToAddress2: [''],
      billToZip: [''],
      billToCity: [''],
      billToState: [''],
      billToEmail: [''],
      billToPhone: [''],
      multiStop: this.fb.array([this.getMultiStop()]),
      // Consignee Recipient Controls
      consigneeRecipientName: [''],
      consigneeRecipientTelephone: [''],
      consigneeRecipientEmail: [''],
      deliveryWindowStart: [''],
      deliveryWindowEnd: [''],
      consigneeRecipientFloor: [''],
      consigneeTier: [''],
      consigneeRecipientElevator: [''],
      consigneeRecipientDeliveryInstructions: ['']
    });
  }

  private getMultiStop(Id = '', type = '', name = '', plant = '', address = '',
                       address2 = '', zip = '', city = '', state = '', email  = '',
                       phone = '', acc = '', pickupStart = '', pickupStop = '',
                       delStart = '', delStop = '', shipmentId: any = null, poNumber = '', soNumber = '',
                       country= 'USA', specialInstruction = '', trackingContacts: TrackingContacts[] = []) {
    return this.fb.group({
      multiStopType: [type],
      multiStopId: [Id],
      multiStopName: [name],
      multiStopPlant: [plant],
      multiStopAddress1: [address],
      multiStopAddress2: [address2],
      multiStopZip: [zip],
      multiStopCountry: [country],
      multiStopCity: [city],
      multiStopState: [state],
      multiStopEmail: [email],
      multiStopPhone: [phone],
      multiStopAcc: [acc],
      multiStopPickupAppointmentStart: [pickupStart],
      multiStopPickupAppointmentStop: [pickupStop],
      multiStopDeliveryAppointmentStart: [delStart],
      multiStopDeliveryAppointmentStop: [delStop],
      multiStopShipmentId: [shipmentId],
      multiStopPoNumber: [poNumber],
      multiStopSoNumber: [soNumber],
      multiStopSpecialInstructionsText: [specialInstruction],
      multiStopTrackingContacts: [trackingContacts]
    });
  }

  dtPickerEventListener() {
    const container = document.querySelectorAll('input[type=\'time\']');
    container.forEach((inputDate) => {
      inputDate.addEventListener('focus', function(event) {
        const target = event.target as HTMLInputElement;
        if (target.getAttribute("type") === "time") {
          target.showPicker();
        }
      });
    });

    const dateContainer = document.querySelectorAll('input[type=\'date\']');
    dateContainer.forEach((inputDate) => {
      inputDate.addEventListener('focus', function(event: any) {
        const target = event.target as HTMLInputElement;
        if (target.getAttribute("type") === "date") {
          target.showPicker();
        }
      });
    });
  }

  onTypePlant(controlName: string) {
    if (controlName === 'consigneeName' && this.consigneePlantDropDown.isRequired &&
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeName')?.value !== '') {
      this.consigneePlantDropDown.isRequired = false;
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.setValidators(null);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneePlant')?.updateValueAndValidity();
    }

    if (controlName === 'shipperName' && this.shipperPlantDropDown.isRequired &&
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperName')?.value !== '') {
      this.shipperPlantDropDown.isRequired = false;
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.setValidators(null);
      this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperPlant')?.updateValueAndValidity();
    }
  }

  onSelectEquipment(value: any) {
    if (value && value.includes('REEFER')) {
      this.Toast.fire({
        icon: 'warning',
        title: 'You have selected a Reefer equipment, please specify temperature'
      });
      if (!this.reference.existingOpenReferenceFields()) {
        this.reference.addReferenceByName('Required Temperature');
        const i = this.reference?.existingOpenReferenceFields()?.length - 1;
        setTimeout(() => {
          $('#existingRefDropDown' + i).attr('disabled', 'true');
          $('#openReferenceValue' + i).prop('required', true);
        }, 100);
      } else if (!this.reference.existingOpenReferenceFields().some((ref: any) => ref.rftID == 240)) {
        this.reference.addReferenceByName('Required Temperature');
        const i = this.reference.existingOpenReferenceFields().length - 1;
        setTimeout(() => {
          $('#existingRefDropDown' + i).attr('disabled', 'true');
          $('#openReferenceValue' + i).prop('required', true);
        }, 100);
      }
    } else {
      if (this.reference.existingOpenReferenceFields()) {
        this.reference.existingOpenReferenceFields.set(this.reference.existingOpenReferenceFields().filter((ref: any) => ref.rftID !== 240));
      }
    }
  }

  validateEquipment() {
    if (this.shipmentType === 'Truckload') {
      let isValid = true;
      const equipment = this.newShipmentForm.controls["shipmentForm"].get('equipment')?.value;
      if (equipment == null || equipment == '') {
        $('#equipment').addClass('is-invalid');
        this.scrollTo(document.querySelector('input#equipment'));
        return true;
      }
      if (equipment && equipment.includes('REEFER')) {
        if (this.reference.existingOpenReferenceFields().length === 0) {
          isValid = false;
        }
        if (this.reference.existingOpenReferenceFields().some((ref: any) => ref.rftID == 240)) {
          const ref = this.reference.existingOpenReferenceFields().find((r: any) => r.rftID == 240);
          if (ref.value == '' || ref.value == null) { isValid = false; }
        }
      }
      if (!isValid) {
        this.Toast.fire({
          icon: 'warning',
          title: 'You have selected a Reefer equipment, please specify temperature'
        });
        return true;
      }
    }
    return false;
  }

  setEditRateData() {
    this.getLineItems(this.freight.freights.value, true);
    this.rateGrid.shipDate = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value;
    const tempRatesData: RateGrid[] = [];
    if (this.shipment?.manualQuotes) {
      for (const savedRate of this.shipment.manualQuotes) {
        const rate = {
          id: savedRate.quoteID ? parseInt(savedRate.quoteID) : null,
          assigned: savedRate.assigned,
          rateType: savedRate.rateType,
          carrierID: savedRate.carrierID,
          carrierName: savedRate.carrierName,
          transitTime: savedRate.transitTime,
          ilCost: savedRate.carrierCost,
          carrierCost: savedRate.carrierCost,
          clientCost: savedRate.clientCost,
          customCost: null,
          feesMap: null,
          carrierQuote: null,
          clientQuote: null,
          customerQuote: null,
          quoteID: savedRate.quoteID,
          quoteNumber: savedRate.quoteNumber,
          warning: null,
          isVolumeRate: (savedRate.rateType == RateType.RATER_VOLUME),
          expirationDate: null,
          negotiationType: savedRate.serviceLevel,
          targetRateID: null,
          timeStamp: savedRate.timeStamp,
          creationDate: savedRate.timeStamp,
          fuelSurchargeBuy: null,
          fuelSurchargeSell: null,
          targetBuy: (savedRate.rateType == RateType.TARGET_TL ? savedRate.carrierCost : null),
          targetSell: (savedRate.rateType == RateType.TARGET_TL ? savedRate.clientCost : null),
          exceedsLinearFoot: false,
          exceedsCubicCapacity: false,
          exceedsMaxWeight: false,
          isTLRate: (savedRate.rateType == RateType.TARGET_TL),
          processingFee: null,
          carrierCharge: undefined,
          customerCharge: undefined,
          fuelSurchargeAvg: null,
          ratePerMileAvg: null,
          marketAvg: null,
          serviceProviderType: (this.shipment?.shipmentDetail?.shipmentStatus === 'PARCEL_SHIPPED' ? 'Parcel' : null),
          notes: savedRate.notes,
          UUID: savedRate.assigned == true ? (this.shipment?.shipmentDetail?.selectedCarrierRateUUID ?? '') : '',
          currencyType: savedRate.assigned == true ? (this.shipment?.client?.cutAbbreviation ?? '') : '',
          carCurrencyType: savedRate.assigned == true ? (this.shipment?.carrierDetail?.carcutAbbreviation ?? '') : ''
        };
        if (savedRate.assigned == true) {
          if (savedRate.rateType == RateType.MANUAL_LTL) { this.rateGrid.selectedRateType = savedRate.rateType; }
          this.preSelectedCarrierName = savedRate.carrierName;
          this.rateGrid.setSelectedValue(rate);
        }
        tempRatesData.push(rate);
      }
    }
    this.rateGrid.rates = tempRatesData;
    this.rateGrid.historyRatesBtn = true;
    this.rateGrid.hideHistoryRatesGrid = true;
    this.rateGrid.validRates = true;
    this.rateGrid.totalLinearFeet = this.freight.linearFeet;
    if (this.shipment?.carrierDetail?.tiberID) {
      this.rateGrid.preSelectedCarrierID = this.shipment?.carrierDetail.tiberID.toString();
      this.rateGrid.preSelectedCarrierName = this.preSelectedCarrierName;
    }
    this.rateGrid.ratesLoaded = true;
    this.rateGrid.ratesData.set([]);
    this.rateGrid.ratesData.update(() => tempRatesData);
    this.rateGrid.hideGrid = false;
    setTimeout(() => {
      this.rateGrid.rates = tempRatesData;
      this.rateGrid.dt.find(t => t.gridName === 'ltlRates')?.reDrawTable(tempRatesData);
      this.rateGrid.hideGrid = false;
      setTimeout(() => this.rateGrid.setDisabledTableRates(), 100);
      setTimeout(() => this.rateGrid.fillCostBreakdown(this.shipment?.accessorials ?? []), 100);
    }, 100);
  }

  isValidShipment(btn: any = null) {
    if (this.shipmentType !== 'LTL') {
      if (this.carrierSelected()) {
        if (this.newShipmentForm.valid && this.rateGrid?.ratesGridForm?.get('selectedRate')?.value.assigned &&
          !this.validateCarrrierOnboard() && btn === 'truckloadPending') { return false; }
        if (this.newShipmentForm.valid && this.rateGrid?.ratesGridForm?.get('selectedRate')?.value.assigned &&
          this.validateCarrrierOnboard()) { return false; }
      } else {
        if (document.querySelectorAll('input[id^=\'stop-\'].ng-invalid').length === 0 && this.newShipmentForm.valid &&
          btn === 'truckloadPrebooked') { return false; }

        if (btn === 'truckloadPrebooked') {
        } else {
          if (this.isValidCreateBOL) { return false; }
        }

        if (this.newShipmentForm.valid && this.rateGrid?.ratesGridForm?.get('selectedRate')?.value.assigned) { return false; }
      }
    } else {
      if (this.isValidCreateBOL) { return false; }
      if (this.newShipmentForm.valid && this.rateGrid?.ratesGridForm?.get('selectedRate')?.value.assigned) { return false; }
    }
    return true;
  }

  validateCarrrierOnboard() {
    const tlQuote = this.newShipmentForm.get('tlQuotes')?.value?.quotes;
    let quoteAssigned = null;
    for (const i in tlQuote) {
      if (tlQuote[i].quoteID && tlQuote[i].assigned && !tlQuote[i].truckNotUsed) {
        quoteAssigned = tlQuote[i];
      }
    }
    this.quoteSelected = quoteAssigned;

    for (const i in tlQuote) {
      if (tlQuote[i].carrierID !== null && tlQuote[i].carrierID !== '') {
        return this.quotes.isCarrierOnboarded(tlQuote[i].carrierID);
      }
    }
    return false;
  }

  addCheapestRate() {
    const rates = this.rateGrid.ratesData();
    if (rates.length > 0) {
      rates.sort((a: any, b: any) => parseFloat(a.ilCost) - parseFloat(b.ilCost));
      if (rates[0]) {
        let refIndex = this.shipment ? this.shipment["referenceFields"].findIndex(
          (ref: ReferenceField) => ref.fieldTypeID === 1276) : -1;
        if (refIndex > -1) {
          if (this.shipment && this.shipment["referenceFields"])
            this.shipment["referenceFields"][refIndex].value = rates[0].carrierID;
        } else {
          let saveRef: ReferenceField = {
            fieldID: null,
            value: rates[0].carrierID,
            fieldTypeID: 1276,
            description: 'Cheapest_Carrier_ID',
            tiberID: null
          };
          // @ts-ignore
          this.shipment?.referenceFields?.push(saveRef);
        }

        refIndex = this.shipment ? this.shipment["referenceFields"].findIndex((ref: ReferenceField) => ref.fieldTypeID === 1277) : -1;
        if (refIndex > -1) {
          if (this.shipment && this.shipment["referenceFields"]) this.shipment["referenceFields"][refIndex].value = rates[0].clientCost;
        } else {
          const saveRef: ReferenceField = {
            fieldID: null,
            value: rates[0].clientCost,
            fieldTypeID: 1277,
            description: 'Cheapest_Carrier_Sell',
            tiberID: null
          };
          // @ts-ignore
          this.shipment?.referenceFields?.push(saveRef);
        }
      }
    }
  }

  carrierSelected() {
    const tlQuote = this.newShipmentForm.get('tlQuotes')?.value?.quotes;
    for (const i in tlQuote) {
      if (tlQuote[i].carrierID !== null && tlQuote[i].carrierID !== '') {
        return true;
      }
    }
    return false;
  }

  resetWhiteGlove() {
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeTier')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientFloor')?.setValue('');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientElevator')?.setValue('N/A');
    this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientDeliveryInstructions')?.setValue('');
  }

  setdeliveryWindowEnd(val: any) {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.value) {
      this.deliveryWindowStartcheck = true;
    } else {
      this.deliveryWindowStartcheck = this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.invalid;
    }
    this.deliveryWindowEnd = val.target.value;
    this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.setValue('');
  }

  deliveryWindowEndCheck() {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.value) {
      this.deliveryWindowEndcheck = true;
    } else {
      this.deliveryWindowEndcheck = this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.invalid;
    }
  }

  onChangeRecipientName() {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.value) {
      this.recipientNamecheck = true;
    } else {
      this.recipientNamecheck = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.invalid;
    }
  }

  onChangeRecipientTelephone() {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.value) {
      this.telephoneCheck = true;
    } else {
      this.telephoneCheck = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.invalid;
    }
  }

  onChangeRecipientEmail() {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.value) {
      this.emailCheck = true;
    } else {
      this.emailCheck = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.invalid;
    }
  }

  onChangeDeliveryInstructions() {
    if (!this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientDeliveryInstructions')?.value) {
      this.deliveryInstructions = true;
    } else {
      this.deliveryInstructions = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientDeliveryInstructions')?.invalid;
    }
  }

  onKeypressEvent(event: any) {
    const isnum = /^\d+$/.test(event.target.value);
    if (!isnum) {
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.setValue('');
    }
  }

  whiteGlovevalidate() {
    return this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowEnd')?.invalid ||
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientName')?.invalid ||
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientTelephone')?.invalid ||
      this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeRecipientEmail')?.invalid ||
      this.newShipmentForm.controls["shipperConsigneeForm"].get('deliveryWindowStart')?.invalid;
  }

  setMileage(fn: any = null) {
    const shipperZip = this.newShipmentForm.controls["shipperConsigneeForm"].get('shipperZip')?.value;
    const consigneeZip = this.newShipmentForm.controls["shipperConsigneeForm"].get('consigneeZip')?.value;
    this.ms.getMileage(shipperZip, consigneeZip, 'Truckload').subscribe({
      next: response => {
        if (this.truck) this.truck.mileage = response.mileage;
        this.rateGrid.mileage = response.mileage;
        this.freightTotals.mileage = response.mileage;
        if (typeof fn === 'function') {
          fn();
        }
      },
      complete: () => {
        this.freightTotals.mileage = this.truck?.mileage ?? 0;
      }
    });
  }

  setLineItemsByStop(index: number, lineItems: any) {
    if (this.stopsLineItems.length > 0) {
      this.stopsLineItems[index] = { lineItems };
    } else {
      this.stopsLineItems.push({
        lineItems
      });
    }
  }

  setEditStops() {
    this.removeMultiStop(0);
    if (this.truck?.shipments && this.truck?.shipments?.length > 1) {
      for (let i = 0; i < this.truck.shipments.length - 1; i++) {
        const stop: ShipmentSave = this.truck.shipments[i];
        const accessorialValues = [];

        for (const accessorial of stop.accessorials) {
          // Pickups
          if (accessorial.accessorialID === 23) {
            accessorialValues.push(this.pickupDropdown[0]);
          }
          if (accessorial.accessorialID === 22) {
            accessorialValues.push(this.pickupDropdown[1]);
          }
          if (accessorial.accessorialID === 169) {
            accessorialValues.push(this.pickupDropdown[2]);
          }
          if (accessorial.accessorialID === 21) {
            accessorialValues.push(this.pickupDropdown[3]);
          }
          if (accessorial.accessorialID === 7) {
            accessorialValues.push(this.pickupDropdown[4]);
          }

          // Deliveries
          if (accessorial.accessorialID === 26) {
            accessorialValues.push(this.deliveryDropdown[0]);
          }
          if (accessorial.accessorialID === 180) {
            accessorialValues.push(this.deliveryDropdown[1]);
          }
          if (accessorial.accessorialID === 24) {
            accessorialValues.push(this.deliveryDropdown[2]);
          }
          if (accessorial.accessorialID === 4) {
            accessorialValues.push(this.deliveryDropdown[3]);
          }
          if (accessorial.accessorialID === 25) {
            accessorialValues.push(this.deliveryDropdown[4]);
          }
        }

        let stopSoNumber = '';
        stop.referenceFields.forEach((element: any) => {
          if (element.tiberID && element.tiberID == 2) { stopSoNumber = element.value; }
        });

        this.multiStop.push(this.getMultiStop(
          stop.consignee?.id ? stop.consignee?.id.toString() : '',
          stop.shipmentDetail?.stopType ? stop.shipmentDetail?.stopType : 'Pick Up',
          stop.consignee?.name ?? '',
          stop.consignee?.plant ?? '',
          stop.consignee?.streetAddress ?? '',
          stop.consignee?.address2 ?? '',
          stop.consignee?.zip ?? '',
          stop.consignee?.city ?? '',
          stop.consignee?.state ?? '',
          stop.consignee?.email ?? '',
          stop.consignee?.phone ?? '',
          '',
          stop.shipmentDetail?.pickupAppointmentStart ?
            formatDate(stop.shipmentDetail.pickupAppointmentStart, 'yyyy-MM-dd HH:mm', 'en', 'America/New_York') :
            '',
          stop.shipmentDetail?.pickupAppointmentStop ?
            formatDate(stop.shipmentDetail.pickupAppointmentStop, 'yyyy-MM-dd HH:mm', 'en', 'America/New_York') : '',
          stop.shipmentDetail?.deliveryAppointmentStart ?
            formatDate(stop.shipmentDetail.deliveryAppointmentStart, 'yyyy-MM-dd HH:mm', 'en', 'America/New_York') : '',
          stop.shipmentDetail?.deliveryAppointmentStop ?
            formatDate(stop.shipmentDetail.deliveryAppointmentStop, 'yyyy-MM-dd HH:mm', 'en', 'America/New_York') : '',
          stop.shipmentDetail?.shipmentID,
          stop.shipmentDetail?.poNumber ?? '',
          stopSoNumber,
          stop.consignee?.countryCode ?? '',
          stop.shipmentDetail?.specialInstructions ?? '',
          stop.trackingContacts
        ));
        this.multiStop.at(i).get('multiStopAcc')?.setValue(accessorialValues);
        this.multiStopAddValidators();
        this.setLineItemsByStop(i, stop.lineItems);
      }
    }
    this.getTotalsLineItems(this.editLineItems, this.stopsLineItems);
    this.freightTotals.linearFeet = this.truck?.linearFoot ?? 0;
    this.freightTotals.mileage = this.truck?.mileage ?? 0;
  }

  setEditMode(shipmentType: any) {
    this.oldShipmentType = shipmentType;
  }

  onChangeStopDates(field: string | null = null, index: number) {
    let pickupStart = this.multiStop.at(index).get('multiStopPickupAppointmentStart')?.value;
    let pickupStop = this.multiStop.at(index).get('multiStopPickupAppointmentStop')?.value;
    let deliveryStart = this.multiStop.at(index).get('multiStopDeliveryAppointmentStart')?.value;
    let deliveryStop = this.multiStop.at(index).get('multiStopDeliveryAppointmentStop')?.value;
    let shipDate = this.newShipmentForm.controls["shipmentForm"].get('shipmentDate')?.value;
    const timeDate = this.newShipmentForm.controls["shipmentForm"].get('pickupAppointmentStart')?.value;
    shipDate = shipDate + 'T' + (timeDate !== '' ? timeDate : '00:00');
    shipDate = new Date(shipDate);

    if (pickupStart && pickupStart !== '') {
      pickupStart = pickupStart.replace(' ', 'T');
      pickupStart = new Date(pickupStart);
    }

    if (pickupStop && pickupStop !== '') {
      pickupStop = pickupStop.replace(' ', 'T');
      pickupStop = new Date(pickupStop);
    }

    if (deliveryStart && deliveryStart !== '') {
      deliveryStart = deliveryStart.replace(' ', 'T');
      deliveryStart = new Date(deliveryStart);
    }

    if (deliveryStop && deliveryStop !== '') {
      deliveryStop = deliveryStop.replace(' ', 'T');
      deliveryStop = new Date(deliveryStop);
    }

    if ((pickupStart && pickupStart !== '' && shipDate > pickupStart) || (pickupStop && pickupStop !== '' && shipDate > pickupStop)) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Additional Stop Appointment Dates cannot Be Less than Shipment Date'});
      return false;
    }

    if (pickupStart && deliveryStart && pickupStart !== '' && deliveryStart !== '' && pickupStart > deliveryStart) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Delivery Appointment Dates cannot Be Less than Pickup ' +
          'Appointment Start Date'});
      return false;
    }

    if (pickupStart && deliveryStop && pickupStart !== '' && deliveryStop !== '' && pickupStart > deliveryStop) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Delivery Appointment Dates cannot Be Less than Pickup ' +
          'Appointment Start Date'});
      return false;
    }

    if (pickupStart && pickupStop && pickupStart !== '' && pickupStop !== '' && pickupStart > pickupStop) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Pickup Date Appointment Start cannot be Greater than Pickup ' +
          'Date Appointment Stop'});
      return false;
    }

    if (pickupStart && deliveryStart && pickupStart !== '' && deliveryStart !== '' && pickupStart > deliveryStart) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Delivery Appointment Dates cannot Be Less than Pickup ' +
          'Appointment Start Date'});
      return false;
    }

    if (pickupStart && deliveryStop && pickupStart !== '' && deliveryStop !== '' && pickupStart > deliveryStop) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Delivery Appointment Dates cannot Be Less than Pickup ' +
          'Appointment Start Date'});
      return false;
    }

    if (deliveryStart && deliveryStop && deliveryStart !== '' && deliveryStop !== '' && deliveryStart > deliveryStop) {
      if (field) { this.multiStop.at(index).get(field)?.setValue(''); }
      Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Delivery Date Appointment Start cannot Be Greater than Delivery ' +
          'Date Appointment Stop'});
      return false;
    }

    return true;
  }

  createCarrierOnboardedNote(event: any) {
    this.carrierOnboarded = true;
    const filtered = this.carrierOnboardedNotes.filter((val) => {
      return val.index != event.index;
    });
    this.carrierOnboardedNotes.length = 0;
    this.carrierOnboardedNotes = filtered;
    this.carrierOnboardedNotes.push(event);
  }

  checkModeItem(event: any) {
    this.rateGrid.isWhiteGlove = 0;
    this.disabledPriority = false;
    if (event === 'Guaranteed LTL') {
      this.newShipmentForm.controls["shipmentForm"].get('priority')?.setValue('Guaranteed');
      this.disabledPriority = true;
    }
    if (event === 'White Glove') {
      this.deliveryAssessorialListSection = true;
      this.rateGrid.isWhiteGlove = 1;
    } else {
      this.resetWhiteGlove();
      this.whiteglovetier = true;
      this.deliveryAssessorialListSection = false;
    }

    if (event === 'Dedicated') {
      this.getSpecialInstruction('** DEDICATED SHIPMENT **', false);
    } else {
      this.getSpecialInstruction('** DEDICATED SHIPMENT **', true);
    }
  }

  removeOnboardNote(event: any) {
    const filtered = this.carrierOnboardedNotes.filter((val) => {
      return val.index != event;
    });
    this.carrierOnboardedNotes.length = 0;
    this.carrierOnboardedNotes = filtered;
    this.carrierOnboarded = this.carrierOnboardedNotes.length > 0;
  }

  convertDatetimeToUtc(date: any, timezone: any) {
    if (timezone != '' && date != '') {
      const dateInPT = momentTimezone.tz(date, 'YYYY-MM-DDTHH:mm', timezone);
      const dateInUTC = dateInPT.utc();
      const dateStringInUTC = dateInUTC.format('YYYY-MM-DDTHH:mm');
      if (dateStringInUTC != 'Invalid date') {
        return formatDate(dateStringInUTC, 'yyyy-MM-ddTHH:mm', 'en-US');
      }
      return '';
    } else {
      return date;
    }

  }

  timezoneProcessor(data: any, mode: string) {
    if (mode === 'TL') {
      let count = 0;
      for (const shipment of data.shipments) {
        const consigneeTimezone = (shipment.consignee.timezone) ? shipment.consignee.timezone : 'UTC';
        const shipperTimezone = (shipment.shipper.timezone) ? shipment.shipper.timezone : 'UTC';

        const pickupAppointmentStart = this.convertTimezone(shipment.shipmentDetail.pickupAppointmentStart, shipperTimezone);
        const pickupAppointmentStop = this.convertTimezone(shipment.shipmentDetail.pickupAppointmentStop, shipperTimezone);
        const deliveryAppointmentStart = this.convertTimezone(shipment.shipmentDetail.deliveryAppointmentStart, consigneeTimezone);
        const deliveryAppointmentStop = this.convertTimezone(shipment.shipmentDetail.deliveryAppointmentStop, consigneeTimezone);

        data.shipments[count].shipmentDetail.pickupAppointmentStart =
          (pickupAppointmentStart != 'Invalid date') ? pickupAppointmentStart : '';
        data.shipments[count].shipmentDetail.pickupAppointmentStop =
          (pickupAppointmentStop != 'Invalid date') ? pickupAppointmentStop : '';
        data.shipments[count].shipmentDetail.deliveryAppointmentStart =
          (deliveryAppointmentStart != 'Invalid date') ? deliveryAppointmentStart : '';
        data.shipments[count].shipmentDetail.deliveryAppointmentStop =
          (deliveryAppointmentStop != 'Invalid date') ? deliveryAppointmentStop : '';
        count ++;
      }
    }
    if (mode === 'LTL') {
      const consigneeTimezone = (data.consignee.timezone) ? data.consignee.timezone : 'UTC';
      const shipperTimezone = (data.shipper.timezone) ? data.shipper.timezone : 'UTC';

      const pickupAppointmentStart = this.convertTimezone(data.shipmentDetail.pickupAppointmentStart, shipperTimezone);
      const pickupAppointmentStop = this.convertTimezone(data.shipmentDetail.pickupAppointmentStop, shipperTimezone);
      const deliveryAppointmentStart = this.convertTimezone(data.shipmentDetail.deliveryAppointmentStart, consigneeTimezone);
      const deliveryAppointmentStop = this.convertTimezone(data.shipmentDetail.deliveryAppointmentStop, consigneeTimezone);

      data.shipmentDetail.pickupAppointmentStart = (pickupAppointmentStart != 'Invalid date') ? pickupAppointmentStart : '';
      data.shipmentDetail.pickupAppointmentStop = (pickupAppointmentStop != 'Invalid date') ? pickupAppointmentStop : '';
      data.shipmentDetail.deliveryAppointmentStart = (deliveryAppointmentStart != 'Invalid date') ? deliveryAppointmentStart : '';
      data.shipmentDetail.deliveryAppointmentStop = (deliveryAppointmentStop != 'Invalid date') ? deliveryAppointmentStop : '';
    }
    return data;
  }

  convertTimezone(timedate: any, timezone: any) {
    const myDate = momentTimezone.utc(timedate).tz(timezone);
    return myDate.format('YYYY-MM-DD HH:mm:ss');
  }

  getSelectedRate() {
    if (this.shipment?.manualQuotes) {
      for (let i = 0; i < this.shipment.manualQuotes.length; i++) {
        const quotex = this.shipment.manualQuotes[i];
        if (quotex.rateType && quotex.rateType !== 2 && quotex.assigned) {
          if (this.shipment?.carrierDetail) { this.shipment.carrierDetail.carrierName = quotex.carrierName; }
          this.preSelectedCarrierName = quotex.carrierName;
          this.rateSelected = this.shipment.manualQuotes[i];
        }
      }
    }
  }

  saveRates() {
    // assign selected rate to true and make all others false
    for (let i = 0; i < this.customRates.length; i++) {
      if (this.rateGrid.ratesGridForm.get('selectedRate')?.value.rateType == '2' &&
        this.customRates[i].quoteID == this.rateGrid.ratesGridForm.get('selectedRate')?.value.quoteID) {
        this.customRates[i].assigned = true;
      } else if (this.rateGrid.ratesGridForm.get('selectedRate')?.value.rateType == '2' &&
        this.customRates[i].id == this.rateGrid.ratesGridForm.get('selectedRate')?.value.id) {
        this.customRates[i].assigned = true;
      } else {
        this.customRates[i].assigned = false;
      }
    }

    if (this.shipmentType === 'LTL') {
      if (this.rateGrid.ratesData().length > 0) {
        const selrate = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
        for (const data of this.rateGrid.ratesData()) {
          if (data) {
            let isSelectedRate = false;
            if (data?.carrierID && selrate?.carrierID) {
              if (data.carrierID.toString() == selrate.carrierID.toString() && data.carrierName == selrate.carrierName.toString() &&
                selrate.assigned && data?.negotiationType?.toString() == selrate?.negotiationType?.toString() &&
                data.rateType == selrate.rateType) {
                isSelectedRate = true;
              }
            }

            const selectedRate: ManualQuote = {
              quoteID: this.shipmentID ? (data?.id && data?.id > 0 ? data.id.toString() : null) : null,
              carrierName: (data.carrierName ? data.carrierName : ''),
              carrierID: data.carrierID,
              clientCost: data.clientCost,
              carrierCost: data.ilCost,
              quoteNumber: data.quoteNumber,
              transitTime: data.transitTime,
              notes: (data?.notes ? data?.notes : ''),
              assigned: isSelectedRate,
              rateType: data.rateType,
              serviceLevel: data.negotiationType
            };

            if (data.rateType && data.rateType.toString() == '2') {
              const indexRate = this.customRates.findIndex(
                (r) => r.rateType?.toString() == '2' && r.carrierID?.toString() == data.carrierID?.toString() );
              if (indexRate >= 0) {
                this.customRates[indexRate] = selectedRate;
              } else {
                this.customRates.push(selectedRate);
              }
            } else {
              this.customRates.push(selectedRate);
            }
          }
        }
      }
    }
  }

  async postToTruckerTools(truck: any) {
    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: 'Load updated in Trucker Tools.',
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;

    this.tts.postLoad(truck).subscribe({
      next: response => {
        if (response.statusCode == 200) {
          this.rs.addNote(Number(truck.shipments[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID), false, note)
            .subscribe();
        }
      }
    });
  }

  getWeightItems(items: LineItem[]) {
    let truckloadWeight = 0;
    for (const i in items) {
      if (items[i].totalWeight != null || items[i].totalWeight?.toString() !== '') {
        truckloadWeight = truckloadWeight + (items[i].totalWeight ?? 0);
      }
    }
    return truckloadWeight;
  }

  get getNumOfStops(): number[] {
    const numOfStops = [];
    if (this.showMultiStopFields) {
      for (let i = 1; i <= this.multiStop.length; i++) {
        numOfStops.push(i);
      }
      numOfStops.push(numOfStops.length + 1);
    }
    return numOfStops;
  }

  createAccesorialFeeNotes(truck: any) {
    if (truck && truck?.truckFees && truck?.truckFees.length > 0) {
      for (const fee of truck.truckFees) {
        if (fee.truckFeesId == null && fee.accessorialTypeId != null) {
          const accessorialName =
            Constants.ACCESSORIAL_TYPES_DROPDOWN.find(x => x.value == fee.accessorialTypeId?.toString());
          const noteText = 'Accessorial Added: ' +  (accessorialName?.item ?? '') + '. Carrier Charge $' + (fee.amount ? fee.amount : '0') +
            '. Client Charge $' + (fee.sellAmount ? fee.sellAmount : '0') + '.' +
            (fee.feeIncurredAt == null || fee.feeIncurredAt == '' ? '' : ' Ocurred at ' + fee.feeIncurredAt + '.' ) +
            (fee.stopNum == null || fee.stopNum == 0 ? '' : ' Stop #' + fee.stopNum + '.' ) +
            (fee.feeStartTime == null || fee.feeStartTime == '' ? '' : ' Time In ' +
              fee.feeStartTime.replace('T', ' ') + '.' ) +
            (fee.feeEndTime == null || fee.feeEndTime == '' ? '' : ' Time Out ' +
              fee.feeEndTime.replace('T', ' ') + '.' );

          const note: Note = {
            notText: noteText,
            notCognitoUsername: this.userName,
            notID: null,
            notTimeStamp: new Date(),
            clientNote: false,
            isNeedsManagement: false
          } as Note;
          this.rs.addNote(Number(truck?.shipments[truck.shipments.length - 1]?.shipmentDetail?.shipmentID), false, note)
            .subscribe();
        }
      }
    }
  }

  validatingTruckFees() {
    const truckFees: TruckFees[] = this.createTruckFees();
    if (truckFees.length === 0) { return true; }
    if (truckFees.length === 1) {
      if (!truckFees[0].amount && !truckFees[0].sellAmount && !truckFees[0].accessorialTypeId) {
        return true;
      }
    }

    let validTruckFees = true;
    for (let i = 0; i < truckFees.length; i++) {

      if (truckFees[i].accessorialTypeId == null || truckFees[i].accessorialTypeId?.toString() === '') {
        $('#accessorialTypeId' + i).addClass('is-invalid');
        validTruckFees = false;
      }

      if (truckFees[i].amount == null || truckFees[i].amount?.toString() === '') {
        $('#amount' + i).addClass('is-invalid');
        validTruckFees = false;
      }

      if (truckFees[i].sellAmount == null || truckFees[i].sellAmount?.toString() === '') {
        $('#sellAmount' + i).addClass('is-invalid');
        validTruckFees = false;
      }
    }

    return validTruckFees;
  }

  validateQuotesMissingEquipment() {
    for (let i = 0; i < this.quotes.quotes.controls.length; i++) {
      const equipmentValue = this.quotes.quotes.controls[i].value.equipment;
      const carrierValue = this.quotes.quotes.controls[i].value.carrierID;
      if (carrierValue) {
        if (equipmentValue === null || equipmentValue === '') {
          $('#equipment' + i).addClass('is-invalid');
          return false;
        }
      }
    }
    return true;
  }

  validateQuotesMissingReasonCode() {
    let flagReasonCode = false;
    for (let i = 0; i < this.quotes.quotes.length; i++) {
      if (this.quotes.quotes.at(i).get('assigned')?.value == true && this.quotes.validateReasonCode(i)) {
        flagReasonCode = true;
        break;
      }
    }
    return flagReasonCode;
  }

  validateReasonCode() {
    if (this.quotes.truck()) {
      this.quotes.truck().update((values: any) => ({
        ...values,
        truckFees: this.truckFees
      }));
    }
    for (let i = 0; i < this.quotes.quotes.length; i++) {
      if (this.quotes.quotes.at(i).get('assigned')?.value == true) {
        this.quotes.hideReasonCode(i);
        break;
      }
    }
  }

  onQuoteRemovedEvent(event: any) {
    this.selectedQuoteRemoved = event;
  }

  onSelectedQuoteEvent(event: any) {
    this.selectedQuoteDeselected = event;
  }

  validateSmallParcelRate() {
    this.isSmallParcelRate = false;
    const data = this.rateGrid.ratesGridForm.get('selectedRate')?.value;
    if (this.shipmentType === 'LTL' && data && data.serviceProviderType?.toUpperCase() === 'PARCEL' ) {
      this.newShipmentForm.controls["shipmentForm"].get('modes')?.setValue('Small package');
      this.isSmallParcelRate = true;
    }
  }

  isDate(date: any) {
    return (!(date == '' || date == null || date == '0000-00-00 00:00:00' || date == '0000-00-00T00:00:00' || date == 'Invalid date'));
  }

  getSaveTargetRates(truckID: any) {
    const truckloadWeight = this.getWeightItems(this.createLineItemMapping());
    if (this.targetRate == null && truckloadWeight > 0) { this.rateGrid.saveTargetRates(truckID); }
  }

  isBillToRequired() {
    return this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == '3rd Party' ||
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == 'Collect' ||
      this.newShipmentForm.controls["shipmentForm"].get('shipmentBillTo')?.value == 'Prepaid';
  }

  validateBillTo(createBOL = false) {
    let billToError = false;
    if (this.shipmentType === 'Truckload' || createBOL || this.rateGrid.ratesGridForm.get('selectedRate')?.value.carrierID ||
      this.showCorrectedBolWarining) {
      // verify bill to name is filled out when collect or 3rd party is selected for billing terms - verify bill to is selected
      const billTo = (document.getElementById('shipmentBillTo') as HTMLSelectElement)?.value;
      if (billTo) {
        const billToName = (document.getElementById('billToName') as HTMLSelectElement)?.value;
        const billToAddress = (document.getElementById('billToAddress1') as HTMLSelectElement)?.value;
        const billToZip = (document.getElementById('billToZip') as HTMLSelectElement)?.value;
        const billToCity = (document.getElementById('billToCity') as HTMLSelectElement)?.value;
        const billToState = (document.getElementById('billToState') as HTMLSelectElement)?.value;
        if (billToName.length === 0 || billToName == '') {
          this.scrollTo(document.querySelector('input#billToName'));
          billToError = true;
        }
        if (billToAddress.length === 0 || billToAddress == '') {
          this.scrollTo(document.querySelector('input#billToAddress1'));
          billToError = true;
        }
        if (billToZip.length === 0 || billToZip == '') {
          this.scrollTo(document.querySelector('input#billToZip'));
          billToError = true;
        }
        if (billToCity.length === 0 || billToCity == '') {
          this.scrollTo(document.querySelector('input#billToCity'));
          billToError = true;
        }
        if (billToState.length === 0 || billToState == '') {
          this.scrollTo(document.querySelector('input#billToState'));
          billToError = true;
        }
      } else {
        this.scrollTo(document.querySelector('input#shipmentBillTo'));
        billToError = true;
      }
      if (billToError) {
        document.getElementById('newShipmentForm')?.classList.add('was-validated');
        this.scrollToError();
      }
    }
    return billToError;
  }

  setCarrierCurrency() {
    let carCurrency = this.truck?.shipments && this.truck?.shipments[0]?.carrierDetail ?
      (this.truck?.shipments[0]?.carrierDetail?.carcutAbbreviation ?? 'USD') : 'USD';
    if (!(this.truck?.tlQuotes && this.truck?.tlQuotes.length > 0)) { return carCurrency; }
    const selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true);
    if (selectedQuote.length > 0) { carCurrency = selectedQuote[0].currencyID == 2 ? 'CAD' : 'USD'; }
    return carCurrency;
  }

  setClientCurrency(type = "client") {
    let currencyType = 'USD'
    if (type == "client" && this.truck?.shipments) {
      currencyType = this.truck.shipments[0]?.client?.cutAbbreviation ?? 'USD'
    } else if (type == "carrier" && this.truck?.shipments) {
      currencyType = this.truck.shipments[0].carrierDetail?.carcutAbbreviation ?? 'USD'
    }
    return currencyType
  }

  getTrackingContactsAndSendMail(shipment: any, statusUpdate: any, trackDate: any, truckID = null, carrierName = '') {
    if (shipment.trackingContacts) {
      const trackingState = statusUpdate.trackingState.toString().toUpperCase();
      const contactMails = [];
      for (const contact of shipment.trackingContacts) {
        contactMails.push({
          emailAddress: contact.emailAddress,
          booked: trackingState === 'BOOKED' ? contact.eventProfile?.booked : false,
          delivered: trackingState === 'DELIVERED' ? contact.eventProfile?.delivered : false
        });
      }
      const filteredContactMails = contactMails.filter((v, i, a) => a.findIndex(v2 => (JSON.stringify(v) === JSON.stringify(v2))) === i);
      for (const contact of filteredContactMails) {
        if ((trackingState === 'BOOKED' && contact.booked) ||
          (trackingState === 'DELIVERED' && contact.delivered)) {
          if (this.shipmentType === 'LTL') {
            this.emailService.sendTrackingMailLTL(shipment, statusUpdate, trackDate, contact.emailAddress, true);
          } else {
            this.emailService.sendTrackingMailTL(truckID, shipment, statusUpdate, trackDate, contact.emailAddress, carrierName, true);
          }
        }
      }
    }
  }

  sendStatusNotificationMail(statusUpdate: any, trackDate: any, truck: any) {
    let carrierName = '';
    const shipmentID: string = statusUpdate.shipmentID.toString();
    const trackingState: string = statusUpdate.trackingState.toString().toUpperCase();
    const selectedQuote = truck.tlQuotes?.filter((item: any) => item.assigned == true);
    if (selectedQuote.length > 0) { carrierName = selectedQuote[0].carrierName; }
    for (const shipment of truck.shipments) {
      if (shipment.shipmentDetail.shipmentID.toString() === shipmentID) {
        if (shipment.notificationMails.length > 0) {
          for (const mail of shipment.notificationMails) {
            if (mail.statusNotEmail && mail.statusNotEmail !== '') {
              this.emailService.sendTrackingMailTL(truck.truckID, shipment, statusUpdate, trackDate, mail.statusNotEmail,
                carrierName, false);
            }
          }
        }
        // SEND TRACKING EMAIL ON BOOKED / DELIVERED STATUS
        if (this.enableTrackingEmails && (trackingState === 'BOOKED' || trackingState === 'DELIVERED')) {
          this.getTrackingContactsAndSendMail(shipment, statusUpdate, trackDate, truck.truckID, carrierName);
        }
      }
    }
  }

  getSpecialInstructionStop(index: number, item: any, remove: boolean = false) {
    // appends selected special instruction from dropdown to the special instruction text area
    if (item !== undefined) {
      const textAreaValue = this.multiStop.at(index).get('multiStopSpecialInstructionsText')?.value ?? '';
      let newTextValue = '';
      if (remove) {
        if (textAreaValue) { newTextValue = textAreaValue.replace(' ' + item + '.', ''); }
      } else {
        newTextValue = textAreaValue + ' ' + item + '.';
      }
      this.multiStop.at(index).get('multiStopSpecialInstructionsText')?.setValue(newTextValue, {onlySelf: false, emitEvent: true});
    }
  }

  disabledTrackingContacts() {
    if (this.shipmentID != null || this.truckID != null) {
      if (this.shipmentType === 'LTL') {
        return !(this.shipment?.shipmentDetail?.shipmentStatus === 'PENDING' ||
          this.shipment?.shipmentDetail?.shipmentStatus === 'PREBOOKED' ||
          this.shipment?.shipmentDetail?.shipmentStatus === 'FINDING_QUOTES' ||
          this.shipment?.shipmentDetail?.shipmentStatus === 'QUOTE_SENT_TO_CLIENT' ||
          this.shipment?.shipmentDetail?.shipmentStatus === 'COMPLETE' ||
          this.shipment?.shipmentDetail?.shipmentStatus === 'REQUEST_FOR_QUOTE');
      } else {
        return !(this.truck?.state === 'PENDING' || this.truck?.state === 'PREBOOKED' || this.truck?.state === 'FINDING_QUOTES' ||
          this.truck?.state === 'REQUEST_FOR_QUOTE' || this.truck?.state === 'QUOTE_SENT_TO_CLIENT' || this.truck?.state === 'COMPLETE');
      }
    }
    return false;
  }

  setEditTrackingContacts(index: any = null, stop: boolean = false) {
    if (this.shipmentID != null || this.truckID != null) {
      if (this.shipmentType === 'LTL' || !stop) {
        return this.shipmentType === 'LTL' ? this.shipment?.trackingContacts :
          (this.truck?.shipments ? (this.truck?.shipments[this.truck?.shipments?.length - 1]?.trackingContacts ?? []) : []);
      } else {
        return this.multiStop.at(index).get('multiStopTrackingContacts')?.value;
      }
    }
    return [];
  }

  getTrackingContactsEvent(event: any, index: any = null, stop: boolean = false) {
    if (this.shipmentType === 'LTL' || !stop) {
      this.trackingContacts = event;
    } else {
      this.multiStop.at(index).get('multiStopTrackingContacts')?.setValue(event);
    }
  }

  validatingTrackingContacts() {
    let validMails = true;
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if ((this.trackingContacts.length > 0 || this.multiStop.controls.length > 0) && !this.disabledTrackingContacts()) {
      let index = 0;
      for (const mail of this.trackingContacts) {
        const htmlElement = '#emailAddress' + (this.shipmentType === 'LTL' ? 'LTL-' : 'TL-1-') + index;
        if (mail.emailAddress && mail.emailAddress !== '') {
          if (reg.test(mail.emailAddress)) {
            $(htmlElement).removeClass('is-invalid').removeClass('invalid-mail');
          } else {
            $(htmlElement).addClass('is-invalid').addClass('invalid-mail');
            this.scrollTo(document.querySelector('input' + htmlElement));
            validMails = false;
          }
          const elementName = '#trackingEvents' + (this.shipmentType === 'LTL' ? 'LTL-' : 'TL-1-') + index;
          if (!mail.eventProfile?.booked && !mail.eventProfile?.delivered) {
            $(elementName).addClass('is-invalid');
            $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #dc3545 !important');
            this.scrollTo(document.querySelector('input' + elementName));
            validMails = false;
          } else {
            $(elementName).removeClass('is-invalid');
            $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #adadad !important');
          }
        } else {
          if (mail.FirstName || mail.LastName || mail.mobilePhoneNumber || mail.eventProfile?.booked || mail.eventProfile?.delivered) {
            $(htmlElement).addClass('is-invalid').addClass('invalid-mail');
            this.scrollTo(document.querySelector('input' + htmlElement));
            validMails = false;
          }
        }
        index = index + 1;
      }

      if (this.shipmentType === 'Truckload') {
        let stopIndex = 0;
        for (const stopControl of this.multiStop.controls) {
          const stop = stopControl.value;
          if (stop.multiStopTrackingContacts && stop.multiStopTrackingContacts.length > 0) {
            index = 0;
            for (const mail of stop.multiStopTrackingContacts) {
              const htmlElement = '#emailAddressTL' + stopIndex + '-' + index;
              if (mail.emailAddress && mail.emailAddress !== '') {
                if (reg.test(mail.emailAddress)) {
                  $(htmlElement).removeClass('is-invalid').removeClass('invalid-mail');
                } else {
                  $(htmlElement).addClass('is-invalid').addClass('invalid-mail');
                  this.scrollTo(document.querySelector('input' + htmlElement));
                  validMails = false;
                }
                const elementName = '#trackingEventsTL' + stopIndex + '-' + index;
                if (!mail.eventProfile?.booked && !mail.eventProfile?.delivered) {
                  $(elementName).addClass('is-invalid');
                  $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #dc3545 !important');
                  this.scrollTo(document.querySelector('input' + elementName));
                  validMails = false;
                } else {
                  $(elementName).removeClass('is-invalid');
                  $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #adadad !important');
                }
              } else {
                if (mail.FirstName || mail.LastName || mail.mobilePhoneNumber || mail.eventProfile?.booked || mail.eventProfile?.delivered) {
                  $(htmlElement).addClass('is-invalid').addClass('invalid-mail');
                  this.scrollTo(document.querySelector('input' + htmlElement));
                  validMails = false;
                }
              }
              index = index + 1;
            }
          }
          stopIndex = stopIndex + 1;
        }
      }
    }
    return validMails;
  }

  onChangeChkInsurance() {
    this.showInsuranceField = $('#chkAdditionalInsurance').prop('checked');
  }

  displayAdditionalInsurance() {
    const addInsurance = this.newShipmentForm.controls["additionalInsurance"].value;
    const checked = $('#chkAdditionalInsurance').prop('checked');
    return this.showInsuranceField || checked || (addInsurance && parseFloat(addInsurance.toString()) > 0);
  }

  validateInsuranceAmount() {
    $('#additionalInsurance').removeClass('is-invalid');
    const checked = $('#chkAdditionalInsurance').prop('checked');
    const addInsurance = this.newShipmentForm.controls["additionalInsurance"].value;
    if (checked && addInsurance && parseFloat(addInsurance.toString()) > 250000) {
      $('#additionalInsurance').addClass('is-invalid');
      return false;
    }
    return true;
  }

  uppercaseZipcode(controlName: string) {
    const zipcode = this.newShipmentForm.controls["shipperConsigneeForm"].get(controlName)?.value;
    if (zipcode && zipcode !== '') {
      this.newShipmentForm.controls["shipperConsigneeForm"].get(controlName)?.setValue(zipcode.toString().toUpperCase());
    }
  }

  convertToFormControl(absCtrl: AbstractControl | null): FormControl {
    return absCtrl as FormControl;
  }

  onClickHeader(expand: boolean, headerName: string) {
    if (headerName == 'quotes') {
      this.quotesDetails = !expand;
    }

    if (headerName == 'accessorials') {
      this.accessorialsDetails = !expand;
    }
  }
}

