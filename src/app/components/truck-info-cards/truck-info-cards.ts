import {
  Component, forwardRef, input, OnDestroy, OnInit, output, QueryList, ViewChild, ViewChildren, signal, effect
} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {formatDate} from '@angular/common';
import {ReportsService} from '../../services/reports/reports.service';
import {BookingDetails} from '../../interfaces/booking-details';
import {ShipmentHistory} from '../../interfaces/shipment-history';
import {Subscription} from 'rxjs';
import {environment} from '../../../environments/environment';
import {EmailModal} from '../email-modal/email-modal';
import moment from 'moment';
import {ShipmentSaveService} from '../../services/shipment-save/shipment-save.service';
import {ShipmentSave} from '../../interfaces/shipment-save';
import {Dispatch} from '../../interfaces/dispatch';
import {TruckSave} from '../../interfaces/truck-save';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {Router} from '@angular/router';
import {DataTable} from '../data-table/data-table';
import {TruckSaveService} from '../../services/truck-save/truck-save.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {Constants} from '../../constants/constants';
import Swal from 'sweetalert2';
import {LoadBoardService} from '../../services/loadboard/loadboard.service';
import {TruckerToolsService} from '../../services/TruckerTools/trucker-tools.service';
import {Global} from '../../common/global';
import {UploadService} from '../../services/upload/upload.service';
import {S3DocumentResponse} from '../../interfaces/s3-document-response';
import {AvailableStatus} from '../../interfaces/available-status';
import {TLManualQuote} from '../../interfaces/manual-quote';
import {Note} from '../../interfaces/note';
import {NoteFormGrid} from '../note-form-grid/note-form-grid';
import {NotificationMail} from '../../interfaces/notification-mail';
import {ReferenceFieldComponent} from '../reference-field/reference-field';
import {TrackingContacts} from '../../interfaces/tracking-contacts';
import {TruckFees} from '../../interfaces/truck-fees';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {MacropointService} from '../../services/macropoint/macropoint.service';
import {UserDetail} from '../../interfaces/user-detail';
import {BillTo} from '../../interfaces/bill-to';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-truck-info-cards',
  standalone: false,
  templateUrl: './truck-info-cards.html',
  styleUrl: './truck-info-cards.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TruckInfoCards),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TruckInfoCards),
      multi: true
    }
  ]
})
export class TruckInfoCards implements OnInit, OnDestroy {
  showEdit = input(false);
  shipmentID = input<any>(null);
  clientEmail = input('');
  inputTruck = input<TruckSave | any>(null);
  truck: TruckSave | any = null;
  poMoniker = input('');
  disabled = input(false);
  saveClientQuote = output<boolean>();
  changeUpdate = output<boolean>();
  changeNote = output<any>();
  getShipmentHist = output<any>();
  deliveryDateChange = output<boolean>();
  mabdDateChange = output<boolean>();
  mailSent = output<boolean>();
  @ViewChild(EmailModal) email!: EmailModal;
  @ViewChild(DataTable) dt!: DataTable;
  @ViewChild(NoteFormGrid) notes!: NoteFormGrid;
  @ViewChildren(NoteFormGrid) noteFormGrids!: QueryList<NoteFormGrid>;
  @ViewChildren(ReferenceFieldComponent) referenceFormGrids!: QueryList<ReferenceFieldComponent>;
  detailsData: BookingDetails = {} as BookingDetails;
  shipmentHistory: ShipmentHistory | null = null;
  shippingInfoGroup: any;
  canCreateLoadTrack = true;
  minDate: string = '';
  statuses: AvailableStatus[] = [] as AvailableStatus[];
  reasons: any[] = [];
  addShipment: number = 0;
  proLoadEntered = false;
  selectedDocument = '';
  selectedManualDocument: any = '';
  clientCode = '';
  documentSelect = false;
  documentManualSelect = false;
  dispatchInfo: Dispatch | null = null;
  viewAllTrackingShipmentID: string = '';
  viewAllTrackingHistoricalEvents: any[] = []
  viewAllTrackingHeaders: any[] = [];
  loadTrackErrorString = '';
  updateStatusArray: any[] = [];
  sortOrder: any[] = [];
  carrierConfirmationDocument: any = [];
  clientQuoteDocument: any = [];
  tnuConfirmationDocument: any = [];
  manualDocDropdown: S3DocumentResponse[] = [];
  dropDownSelected = false;
  billOfLadingDocument: any = [];
  selectedCarrier: string = '';
  states: any[] = Constants.STATE_DROPDOWN.sort();
  disableShipDrag = signal(true);
  emailSendSubject = '';
  emailSendAttachment: any = [];
  emailSendDocumentType = '';
  disableCard: any[] = [];
  multiStopTimezone: any[] = [];
  shipmentIDs: any[] = [];
  selectedCarrierCost = 0;
  selectedClientCost = 0;
  selectedMarginAmount: any = null;
  selectedMarginPercent: any = null;
  timezone: any;
  pickupAppointmentStart: any;
  receivingHourStart: any;
  receivingHourStop: any;
  pickupAppointmentStop: any;
  deliveryAppointmentStart: any;
  deliveryAppointmentStop: any;
  mostRecentLocation: any = '';
  mostRecentEventDate: any = '';
  selectedFile: File | null = null;
  exceptionDropdown = signal<any[]>([]);
  salesRepDropdown = signal<any[]>([]);
  global = Global;
  disableStatus = false;
  carrierCharge = 0;
  customerCharge = 0;
  previousStatus: any[] = [];
  currentStatus: any[] = [];
  quotesNotUsed: TLManualQuote[] = [];
  shipperTimezone: any = '';
  consigneeTimezone: any = '';
  todayDate: any;
  isEditMode = signal(false);
  shippingDatesGroup: FormGroup = new FormGroup({});
  validateLocation: any[] = [];
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
  trackingStatusForm: FormGroup = new FormGroup({});
  selectedQuote: TLManualQuote[] = [];
  notificationMails: NotificationMail[] | null = null;
  trackingContacts: TrackingContacts[] = [];
  showAddClientQuote = false;
  enableAddClientQuote = false;
  clientQuotes: TLManualQuote[] = [];
  noteList: any[] = [] as any[];
  macropointActive = false;
  truckerToolsActive = false;
  datActive = false;
  private subscription: Subscription | null = null;
  private userName = '';
  private shipment: ShipmentSave | null = null;

  constructor(private spinner: NgxSpinnerService, private tss: TruckSaveService, private fb: FormBuilder,
              private ss: ShipmentSaveService, private router: Router, private ls: LoadBoardService,
              private tts: TruckerToolsService, private igs: InternalGroupService, private ms: MacropointService,
              private authenticator: AuthenticatorService, private us: UploadService, private rs: ReportsService) {
    this.shippingDatesGroup = this.fb.group({
      pickupStart: this.fb.control(''),
      pickupStop: this.fb.control(''),
      actualPickupDate: this.fb.control(''),
      deliveryStart: this.fb.control(''),
      deliveryStop: this.fb.control(''),
      actualDeliveryDate: this.fb.control('')
    });

    this.trackingStatusForm = this.fb.group({
      trackingStatus: [''],
      trackingDate: [''],
      trackingMessage: [''],
      trackingCity: [''],
      trackingState: ['']
    });
  }

  get equipment() {
    const equipment: string[] = [];
    Constants.EQUIPMENT_TL_DROPDOWN.forEach((value) => {
      equipment.push(value.item);
    });
    return equipment;
  }

  onChangeTruck = effect(() => {
    this.truck = this.inputTruck();
    if (this.truck) {

      this.tss.getSalesRep().subscribe({
        next: response => {
          this.salesRepDropdown.set(response);
          this.setCarrierSalesRep(this.truck.salesRep?.toString() ?? '', this.truck.salesRepUser);
        }
      });

      if (this.truck.proLoadNumber !== '' && this.truck.proLoadNumber != null) {
        this.proLoadEntered = true;
      }

      if (this.truck.shipments) this.getNoteList(this.truck.shipments?.[0]?.client?.groupID);
      this.clientQuotes = this.setClientQuotes();
      if (this.truck.tlQuotes) {
        for (const item of this.truck?.tlQuotes ?? []) {
          if (item.quoteID && item.truckNotUsed) {
            this.quotesNotUsed.push(item);
          }
        }
      }

      let i = 0;
      if (this.truck.shipments) {
        for (const shipment of this.truck.shipments ?? []) {
          this.disableCard.push(false);
          this.validateLocation.push({city: false, state: false, date: false});
          this.multiStopTimezone[i] = this.truck?.shipments?.[i].consignee?.timezone ?
            Intl.DateTimeFormat('en', {timeZone: this.truck?.shipments?.[i].consignee?.timezone, timeZoneName: 'short'})
              .format(new Date()).split(' ')[1] : 'UTC';

          i++;
          this.shipmentIDs.push(shipment?.shipmentDetail?.shipmentID);

          if (shipment.historicalEvents.length > 0) {
            this.previousStatus.push({
              trackingState: shipment.historicalEvents[0].trackingState,
              eventDate: shipment.historicalEvents[0].eventDate,
              eventTime: shipment.historicalEvents[0].eventTime,
              trackingMessage: shipment.historicalEvents[0].trackingMessage,
            });

            if (shipment.historicalEvents.length > 1) {
              this.currentStatus.push({
                trackingState: shipment.historicalEvents[1].trackingState,
                eventDate: shipment.historicalEvents[1].eventDate,
                eventTime: shipment.historicalEvents[1].eventTime,
                trackingMessage: shipment.historicalEvents[1].trackingMessage
              });
            }
          }

          this.updateStatusArray.push({
            shipmentID: shipment.shipmentDetail.shipmentID,
            actualDate: '',
            trackingDate: '',
            trackingMessage: '',
            trackingState: '',
            currentCity: '',
            currentState: '',
            enteredBy: ''
          });
        }
      }

      this.calculateFinancialReview(this.truck?.tlQuotes ?? []);

      // Check if load track is data is input
      if ((this.truck?.driverPhone === '' || this.truck?.driverPhone == null) &&
        (this.truck?.extTruckNumber === '' || this.truck?.extTruckNumber == null)) {
        if (this.truckerToolsActive) {
          this.loadTrackErrorString += '\n' + ' Driver phone or Truck number missing.';
        } else {
          this.loadTrackErrorString += '\n' + ' Driver phone number missing.';
        }
        this.canCreateLoadTrack = false;
      }
      if (this.truck?.proLoadNumber === '' || this.truck?.proLoadNumber == null) {
        this.loadTrackErrorString += '\n' + ' Pro/Load number missing.';
        this.canCreateLoadTrack = false;
      }
      if (this.selectedCarrier === '' || this.selectedCarrier == null) {
        this.loadTrackErrorString += '\n' + ' Must select a carrier to create load track.';
        this.canCreateLoadTrack = false;
      }

      // disable dragging of shipments
      if (this.truck?.shipments && (this.truck?.shipments?.length ?? 0) > 1) {
        this.disableShipDrag.set(false);
      }

      this.disableShipDrag.set(!(this.truck?.state === 'PENDING' || this.truck?.state === 'PREBOOKED' ||
        this.truck?.state === 'REQUEST FOR QUOTE'));

      if (this.truck?.state !== 'PENDING' && this.truck?.state !== 'PREBOOKED' && this.truck?.state !== 'REQUEST FOR QUOTE') {
        const originalCCFileName = '124/' + this.truck?.truckID + 'C.pdf';
        this.carrierConfirmationDocument.push({
          id: null,
          shipmentID: null,
          typeDescription: 'Original Carrier Confirmation',
          fileName: originalCCFileName,
          entryDate: null,
          typeLetter: null,
          isClientVisible: null
        });
      }

      this.tnuConfirmationDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Original Carrier Confirmation',
        fileName: null,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });

      const originalCQFileName = '124/' + this.truck?.truckID + 'Q.pdf';
      this.clientQuoteDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Client Quote',
        fileName: originalCQFileName,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });

      const originalBOLFileName = '124/' + this.truck?.truckID + 'B.pdf';
      this.billOfLadingDocument.push({
        id: null,
        shipmentID: null,
        typeDescription: 'Original BOL',
        fileName: originalBOLFileName,
        entryDate: null,
        typeLetter: null,
        isClientVisible: null
      });

      if (this.truck?.state === 'PENDING' || this.truck?.state === 'REQUEST FOR QUOTE') {
        if (this.truck?.proLoadNumber == null || this.truck?.proLoadNumber === '') {
          const clientCode = this.truck?.shipments ? (this.truck?.shipments?.[0]?.client?.clientCode ?? '') : '';
          this.truck!.proLoadNumber = clientCode + (this.truck?.truckID ?? '');
        }
      }

      if (this.truck?.shipments) {
        this.pickupAppointmentStart = this.truck?.shipments?.[0]?.shipmentDetail.pickupAppointmentStart;
        this.pickupAppointmentStop = this.truck?.shipments?.[0]?.shipmentDetail.pickupAppointmentStop;
        this.shipperTimezone = this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].shipper?.timezone ?
          Intl.DateTimeFormat('en', {
            timeZone: this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].shipper?.timezone,
            timeZoneName: 'short'
          }).format(new Date()).split(' ')[1] : 'UTC';
        this.deliveryAppointmentStart = this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].shipmentDetail.deliveryAppointmentStart;
        this.deliveryAppointmentStop = this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].shipmentDetail.deliveryAppointmentStop;

        this.consigneeTimezone = this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].consignee?.timezone ?
          Intl.DateTimeFormat('en', {
            timeZone: this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].consignee?.timezone,
            timeZoneName: 'short'
          }).format(new Date()).split(' ')[1] : 'UTC';

        this.receivingHourStart = this.truck?.shipments?.[0].consignee?.receivingHourStart ?
          this.truck?.shipments?.[0].consignee?.receivingHourStart : '';
        this.receivingHourStop = this.truck?.shipments?.[0].consignee?.receivingHourStop ?
          this.truck?.shipments?.[0].consignee?.receivingHourStop : '';

        if (this.truck?.shipments?.[0]?.consignee?.receivingHourStart &&
          (this.truck?.shipments?.[0]?.consignee?.receivingHourStart?.toString()?.length ?? 0) > 0) {
          if (this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString().length === 3) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString() ?? ''; // Convert to string
            const receivingHourStart = '0' + numberString.slice(0, 1) + ':' + numberString.slice(1);
            this.receivingHourStart = moment(receivingHourStart, 'hh:mm').format('hh:mm A');
          } else if (this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString().length === 2) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString() ?? ''; // Convert to string
            const receivingHourStart = '00:' + numberString[0] + numberString[1];
            this.receivingHourStart = moment(receivingHourStart, 'hh:mm').format('hh:mm A');
          } else if (this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString().length === 1) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStart?.toString() ?? ''; // Convert to string
            const receivingHourStart = '00:0' + numberString[0];
            this.receivingHourStart = moment(receivingHourStart, 'hh:mm').format('hh:mm A');
          } else {
            const receivingHourStart = this.truck?.shipments?.[0].consignee?.receivingHourStart ?? '';
            this.receivingHourStart = moment(receivingHourStart, 'hh:mm').format('hh:mm A');
          }
        } else {
          this.receivingHourStart = '';
        }

        if (this.truck?.shipments?.[0].consignee?.receivingHourStop &&
          (this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString()?.length ?? 0) > 0) {
          if (this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString().length === 3) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString() ?? ''; // Convert to string
            const receivingHourStop = '0' + numberString.slice(0, 1) + ':' + numberString.slice(1);
            this.receivingHourStop = moment(receivingHourStop, 'hh:mm').format('hh:mm A');
          } else if (this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString().length === 2) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString() ?? ''; // Convert to string
            const receivingHourStop = '00:' + numberString[0] + numberString[1];
            this.receivingHourStop = moment(receivingHourStop, 'hh:mm').format('hh:mm A');
          } else if (this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString().length === 1) {
            const numberString = this.truck?.shipments?.[0].consignee?.receivingHourStop?.toString() ?? ''; // Convert to string
            const receivingHourStop = '00:0' + numberString[0];
            this.receivingHourStop = moment(receivingHourStop, 'hh:mm').format('hh:mm A');
          } else {
            const receivingHourStop = this.truck?.shipments?.[0].consignee?.receivingHourStop ?? '';
            this.receivingHourStop = moment(receivingHourStop, 'hh:mm').format('hh:mm A');
          }
        } else {
          this.receivingHourStop = '';
        }
      }

      this.setShippingDatesGroup();
      this.fetchManualDocuments();
      this.attemptRefreshDocuments();
      this.preViewCompleteTracking();
    }
  });

  ngOnInit(): void {
    this.macropointActive = environment.MACROPOINT_API_ACTIVE;
    this.truckerToolsActive = environment.TRUCKER_TOOLS_API_ACTIVE;
    this.datActive = environment.DAT_API_ACTIVE;
    this.setUser();
    this.todayDate = moment(new Date()).local().format('YYYY-MM-DD');
    const timezoneMap: any = Constants.TIMEZONE_MAP;
    const timezoneOffset = moment(new Date()).utcOffset();
    this.timezone = timezoneMap[timezoneOffset] ?? '';

    this.rs.getAvailableStatusesTL().subscribe({
      next: response => {
        for (const status of response) {
          this.statuses.push(status);
        }
      }
    });

    this.rs.getAvailableExceptions('tl').subscribe({
      next: response => {
        this.exceptionDropdown.set(response);
      }
    });

    this.reasons = ['DATA ENTRY ERROR', 'CLIENT DOCUMENTATION/INFO EXCEPTION', 'SHIPPER EXCEPTION', 'CONSIGNEE EXCEPTION',
      'CLIENT SCHEDULE CHANGE', 'WEATHER DELAY', 'CARRIER FAILED', 'APPOINTMENT EXCEPTION', 'NO FAULT CHANGE', 'HOLIDAY'];

    this.viewAllTrackingHeaders = [
      {
        title: 'Event Time',
        data: 'eventDate',
        type: 'date',
        orderable: true,
        render(data: any, type: any, row: any) {
          const eventDateTime = moment.utc(`${row.eventDate} ${row.eventTime}`, 'YYYY-MM-DD HH:mm ');
          return eventDateTime.local().format('MM/DD/YYYY hh:mm A ');
        }
      },
      {
        title: 'State',
        data: 'trackingState',
        orderable: true
      },
      {
        title: 'Message',
        data: 'trackingMessage',
        orderable: true
      },
      {
        title: 'Location',
        data: 'currentLocation',
        orderable: true
      },
      {
        title: 'Entered At',
        data: 'entryTimeStamp',
        type: 'date',
        orderable: true,
        render(data: any, type: any, row: any) {
          const eventDateTime = moment.utc(`${row.entryTimeStamp}`, 'YYYY-MM-DD HH:mm ');
          return eventDateTime.local().format('MM/DD/YYYY hh:mm A ');
        }
      },
      {
        title: 'Entered By',
        data: 'enteredBy',
        orderable: true
      }
    ];

    this.sortOrder = [[0, 'desc'], [4, 'desc']];
  }

  getShortTimeZone(longTimeZone: any) {
    if (longTimeZone != null) {
      return Intl.DateTimeFormat('en', {
        timeZone: longTimeZone,
        timeZoneName: 'short'
      }).format(new Date()).split(' ')[1];
    } else {
      return 'UTC';
    }
  }

  // Disable other cards from being edited if one was edited
  statusChangeMade(index: number) {
    for (let i = 0; i < (this.truck?.shipments?.length ?? 0); i++) {
      if (i !== index) {
        this.disableCard[i] = true;
      }
    }
    this.validateLocationUpdate();
  }

  changeSalesRep(event: any) {
    this.truck!.salesRep = event.target.value;
    this.changeUpdate.emit(true);
  }

  attemptRefreshDocuments() {
    this.getTruckBOL(false);
    this.getTruckCC(false);
    this.getTruckCQ(false);
  }

  fetchManualDocuments() {
    this.manualDocDropdown.length = 0;
    this.us.getFiles(this.truck?.truckID, 'TL').subscribe({
      next: (response: any) => {
        for (const doc of response) {
          this.manualDocDropdown.push(doc);
        }
      }
    });
  }

  setFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  convertDateTimeToLocalString(date: any, time: any, removeSeconds = false) {
    if (date && time) {
      const eventDateTime = new Date(`${date}T${time}Z`);
      const eventTimestamp = eventDateTime.getTime();

      const tzOffset = new Date().getTimezoneOffset();
      const eventLocalTimestamp = eventTimestamp - (tzOffset * 60 * 1000);
      const eventLocalTimestampString = new Date(eventLocalTimestamp);

      const eventLocalDate = eventLocalTimestampString.toLocaleDateString('en-US', {timeZone: 'UTC'});
      let eventLocalTime = eventLocalTimestampString.toLocaleTimeString('en-US', {timeZone: 'UTC'});
      if (removeSeconds) {
        eventLocalTime = eventLocalTime.replace(/:\d{2}\s/, ' ').toUpperCase();
      }
      return eventLocalDate + ' ' + eventLocalTime;
    }
    return '';
  }

  confirmFileUpload() {
    if (this.selectedFile) {
      this.spinner.show('createLoadTrackSpinner').then();
      const selectedFileName = $('#manualUploadFileType option:selected').val()
      const documentType = this.email.determineAbbreviatedType(selectedFileName?.toString() ?? '');
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      this.us.uploadFile(formData, this.truck?.truckID, documentType, 'TL', 'ilconnect-manual-docs', 'TL/',
        this.selectedFile.name).subscribe({
        next: () => {
          this.fetchManualDocuments();
          this.spinner.hide('createLoadTrackSpinner').then();
          $('#uploadFileModal').modal('hide');
          Swal.fire('', 'Successfully uploaded document.', 'success');
        },
        error: () => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('', 'Something went wrong. Failed to upload document..', 'warning');
        }
      });
    }
  }

  openUploadModal() {
    document.getElementById('uploadFileModalButton')?.click();
  }

  preViewCompleteTracking() {
    this.viewAllTrackingHistoricalEvents.length = 0;
    this.viewAllTrackingShipmentID = 'Truck: ' + this.truck?.truckID;
    this.mostRecentLocation = '';
    if (this.truck?.shipments) {
      for (const shipment of this.truck?.shipments) {
        for (const event of shipment.historicalEvents) {
          this.viewAllTrackingHistoricalEvents.push(event);
        }
      }
    }

    this.mostRecentLocation = '';
    this.mostRecentEventDate = '';

    try {
      for (const event of this.viewAllTrackingHistoricalEvents) {
        if (event.currentLocation !== null && this.mostRecentLocation === '') {
          this.mostRecentLocation = event.currentLocation;
        }
        if (event.eventDate !== null && event.eventTime !== null && this.mostRecentEventDate === '') {
          this.mostRecentEventDate = new Date(`${event.eventDate}T${event.eventTime}`);
        }
        const eventDateTime = new Date(`${event.eventDate}T${event.eventTime}`);
        if (eventDateTime > new Date(this.mostRecentEventDate)) {
          this.mostRecentEventDate = eventDateTime;
          if (event.currentLocation !== null) {
            this.mostRecentLocation = event.currentLocation;
          }
        }
      }
      const userTimeZoneOffset = this.mostRecentEventDate.getTimezoneOffset();
      this.mostRecentEventDate = new Date(this.mostRecentEventDate.getTime() - (userTimeZoneOffset * 60 * 1000));
    } catch (Exception) {

    }

    if (this.viewAllTrackingHistoricalEvents.length > 0) {
      this.dt?.rerender();
    }
  }

  deleteTruck() {
    document.getElementById('deleteTruckModalButton')?.click();
  }

  viewDocument(document: string, view = false) {
    if (document === 'carrierconfirmation') {
      this.getTruckCC(view);
    } else if (document === 'BOL') {
      this.getTruckBOL(view);
    } else if (document === 'clientquote') {
      this.getTruckCQ(view);
    } else if (document && document.toString().startsWith('tnuconfirmation')) {
      const quoteNumber = document.toString().split('-')[1];
      this.getTnuDocument(quoteNumber);
    } else {
      window.open(document, 'bolOnPageLoad', 'width="900,height=900');
    }
  }

  downloadDocument(document: string, view = false) {
    if (document === 'carrierconfirmation') {
      this.downloadTruckCC(view);
    } else if (document === 'BOL') {
      this.downloadTruckBOL(view);
    } else if (document === 'clientquote') {
      this.downloadTruckCQ(view);
    } else if (document && document.toString().startsWith('tnuconfirmation')) {
      const quoteNumber = document.toString().split('-')[1];
      this.getTnuDocument(quoteNumber, true);
    }
  }

  processDocument(obj: any, docName: string = 's3Document', action: 'view' | 'download' = 'view') {
    if (action === 'view') {
      const toPdf = (docName === 's3Document' ? this.base64ToBlob(obj.fileBytes) : this.base64ToBlob(obj.pdf));
      const file = new Blob([toPdf], {type: 'application/pdf'});
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    } else {
      const toPdf = this.base64ToBlob(obj.pdf);
      const file = new Blob([toPdf], {type: 'application/pdf'});
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = docName;
      link.click();
    }
  }

  downloadTruckCC(view: boolean) {
    const selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true);
    if (selectedQuote) {
      this.rs.getTruckCCFromLambda(Number(selectedQuote[0].quoteID)).subscribe({
        next: response => {
          if (view) {
            this.processDocument(response, 'carrierconfirmation.pdf', 'download');
          }
        },
        error: () => {
          if (view) {
            Swal.fire('Client Quote Document', '<b><i>Document could not be generated</i></b>', 'warning');
          }
        }
      });
    }
  }

  downloadTruckBOL(view: boolean) {
    this.rs.getTruckBOLFromLambda(this.truck?.truckID).subscribe({
      next: response => {
        if (view) {
          this.processDocument(response, 'bol.pdf', 'download');
        }
      },
      error: () => {
        if (view) {
          Swal.fire('Bill of Lading Document', '<b><i>Document could not be generated</i></b>', 'warning');
        }
      }
    });
  }

  downloadTruckCQ(view: boolean) {
    const selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true);
    if (selectedQuote) {
      this.rs.getTruckClientQuoteFromLambda(Number(selectedQuote[0].quoteID)).subscribe({
        next: response => {
          if (view) {
            this.processDocument(response, 'clientquote.pdf', 'download');
          }
        },
        error: () => {
          if (view) {
            Swal.fire('Client Quote Document', '<b><i>Document could not be generated</i></b>', 'warning');
          }
        }
      });
    }
  }

  viewManualDocument(documentName: string) {
    for (const doc of this.manualDocDropdown) {
      if (doc.description === documentName) {
        this.processDocument(doc);
      }
    }
  }

  setEmailDocument(document: string) {
    this.email.ccSender = false;
    this.email.ccEmail = null;
    this.email.noteEmailBody = null;
    if (document === 'carrierconfirmation') {
      this.email.fromEmailAddress = 'tl@il2000.com';
      this.emailSendAttachment = this.carrierConfirmationDocument;
      this.emailSendSubject = 'Carrier Confirmation - Truck ' + this.truck?.truckID;
      this.emailSendDocumentType = 'Carrier Confirmation';
      this.email.noteEmailBody = this.emailBodyNote();
    }
    if (document === 'clientquote') {
      this.email.fromEmailAddress = 'tl@il2000.com';
      this.emailSendAttachment = this.clientQuoteDocument;
      this.emailSendSubject = 'Client Quote - Truck ' + this.truck?.truckID;
      this.emailSendDocumentType = 'Quote Response';
    }
    if (document === 'carrierconfirmation' || document === 'clientquote') {
      this.email.ccSender = true;
      this.email.ccEmail = 'tl@il2000.com';
    }
    if (document && document.toString().startsWith('tnuconfirmation')) {
      this.email.fromEmailAddress = 'truckload@il2000.com';
      const quoteId = document.toString().split('-')[1];
      const carrier = document.toString().split('-')[2];
      this.tnuConfirmationDocument[0].fileName = '124/' + quoteId + 'T.pdf';
      this.emailSendAttachment = this.tnuConfirmationDocument;
      this.emailSendSubject = 'TNU Confirmation - ' + carrier;
      this.emailSendDocumentType = 'TNU Confirmation';
    }
    if (document === 'BOL') {
      this.email.fromEmailAddress = 'truckload@il2000.com';
      this.emailSendAttachment = this.billOfLadingDocument;
      this.emailSendSubject = 'Bill of Lading - Truck ' + this.truck?.truckID;
      this.emailSendDocumentType = 'Bill of Lading';
    } else {
      this.emailSendSubject = $('#docSelect option:selected').text() + ' - Truck ' + this.truck?.truckID;
    }
  }

  confirmDeleteTruck() {
    this.tss.deleteTruck(this.truck?.truckID ?? 0).subscribe({
      next: () => {
        $('#deleteTruckModal').modal('toggle');
        this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
          this.router.navigate(['SPAs/new/']);
        });
      }
    });
  }

  createLoadTrack() {
    if (this.macropointActive) {
      this.onClickPostMacropointBoard();
    } else {
      this.spinner.show('createLoadTrackSpinner').then();
      this.tss.createLoadTrack(this.truck?.truckID ?? 0, this.truck?.isLoadTrackCreated === 1).subscribe({
        next: () => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Create Load Track', (this.truck?.isLoadTrackCreated === 1 ? 'Load track updated successfully' :
            'Load track created successfully'), 'success').then(() => {
            location.reload();
          });
        },
        error: error => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Create Load Track', '<i>' + error + '</i>', 'warning');
        }
      });
    }
  }

  viewAllTracking(shipmentID: number, historicalEvents: any[]) {
    this.viewAllTrackingHistoricalEvents.length = 0;
    this.viewAllTrackingShipmentID = 'Shipment: ' + shipmentID;
    for (const event of historicalEvents) {
      this.viewAllTrackingHistoricalEvents.push(event);
    }
    this.dt.rerender();
    document.getElementById('viewAllTrackingModalButton')?.click();
  }

  viewCompleteTracking() {
    this.viewAllTrackingHistoricalEvents.length = 0;
    this.viewAllTrackingShipmentID = 'Truck: ' + this.truck?.truckID;
    if (this.truck?.shipments) {
      for (const shipment of this.truck?.shipments ?? []) {
        for (const event of shipment.historicalEvents) {
          this.viewAllTrackingHistoricalEvents.push(event);
        }
      }
    }
    this.dt.rerender();
    document.getElementById('viewAllTrackingModalButton')?.click();
  }

  viewBOL(bolNumber: number) {
    this.rs.getBOLFromLambda(bolNumber).subscribe({
      next: response => {
        if (response.pdf.length < 2000) {
          window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
        } else {
          this.processDocument(response, 'LambdaFile');
        }
      },
      error: () => {
        Swal.fire('Bill of Lading Document', '<b><i>document could not be generated</i></b>', 'warning');
      }
    });
  }

  getTruckBOL(view: boolean) {
    this.rs.getTruckBOLFromLambda(this.truck?.truckID).subscribe({
      next: response => {
        if (view) {
          if (response.pdf.length < 2000) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
          } else {
            this.processDocument(response, 'LambdaFile');
          }
        }
      },
      error: () => {
        if (view) {
          Swal.fire('Bill of Lading Document', '<b><i>Document could not be generated</i></b>', 'warning');
        }
      }
    });
  }

  getTnuDocument(quoteId: string, download = false) {
    this.rs.getDocumentFromLambda(quoteId, 'tnuconfirmation').subscribe({
      next: response => {
        if (download) {
          this.processDocument(response, 'tnuconfirmation.pdf', 'download');
        } else {
          this.processDocument(response, 'LambdaFile');
        }
      },
      error: () => {
        Swal.fire('TNU Confirmation Document', '<b><i>Document could not be generated</i></b>', 'warning');
      }
    });
  }

  getTruckCQ(view: boolean) {
    if (!(this.truck?.tlQuotes && (this.truck?.tlQuotes?.length ?? 0) > 0)) {
      return;
    }
    this.selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true) ?? [];
    if (this.selectedQuote.length > 0) {
      this.rs.getTruckClientQuoteFromLambda(Number(this.selectedQuote[0].quoteID)).subscribe({
        next: response => {
          if (view) {
            if (response.pdf.length < 2000) {
              window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
            } else {
              this.processDocument(response, 'LambdaFile');
            }
          }
        },
        error: () => {
          if (view) {
            Swal.fire('Client Quote Document', '<b><i>Document could not be generated</i></b>', 'warning');
          }
        }
      });
    }
  }

  getTruckCC(view: boolean) {
    if (!(this.truck?.tlQuotes && (this.truck?.tlQuotes?.length ?? 0) > 0)) {
      return;
    }
    const selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true) ?? [];
    if (selectedQuote.length > 0) {
      this.rs.getTruckCCFromLambda(Number(selectedQuote[0].quoteID)).subscribe({
        next: response => {
          if (view) {
            if (response.pdf.length < 2000) {
              window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
            } else {
              this.processDocument(response, 'LambdaFile');
            }
          }
        },
        error: () => {
          if (view) {
            Swal.fire('Carrier Confirmation Document', '<b><i>Document could not be generated</i></b>', 'warning');
          }
        }
      });
    }
  }

  getDirtyValues(form: any) {
    const dirtyValues: any = {};
    Object.keys(form.controls).forEach(key => {
      const currentControl = form.controls[key];
      if (currentControl.dirty) {
        if (currentControl.controls) {
          dirtyValues[key] = this.getDirtyValues(currentControl);
        } else {
          dirtyValues[key] = currentControl.value;
        }
      }
    });
    return dirtyValues;
  }

  updateShipmentDetails(values: any = null) {
    const shipmentDetail = {
      proNumber: this.shippingInfoGroup.get('proNumber')?.value,
      pickupNumber: this.shippingInfoGroup.get('pickupNumber')?.value,
      actualShipDate: this.shippingInfoGroup.get('actualShipDate')?.value,
      mabdDate: this.shippingInfoGroup.get('mabdDate')?.value,
      carrierEstimatedDeliveryDate: this.shippingInfoGroup.get('deliveryDate')?.value
    };

    if (values) {
      if (this.shipmentHistory?.shipmentDetail) {
        this.shipmentHistory.shipmentDetail.proNumber = this.shippingInfoGroup.get('proNumber')?.value;
        this.shipmentHistory.shipmentDetail.pickupNumber = this.shippingInfoGroup.get('pickupNumber')?.value;
        this.shipmentHistory.shipmentDetail.actualShipDate = this.shippingInfoGroup.get('actualShipDate')?.value;
        this.shipmentHistory.shipmentDetail.mabdDate = this.shippingInfoGroup.get('mabdDate')?.value;
        this.shipmentHistory.shipmentDetail.carrierEstimatedDeliveryDate = this.shippingInfoGroup.get('deliveryDate')?.value;
        this.shipmentHistory.shipmentDetail.specialInstructions = values.specialInstructions;
      }
      this.shipmentHistory!.referenceFields = values.references;
      this.shipmentHistory!.openReferenceFields = values.openReferenceFields;
      this.shipmentHistory!.billTo = {
        billtoID: this.shipmentHistory?.billTo?.billtoID ?? null,
        careof: this.shipmentHistory?.billTo?.careof ?? '',
        country: this.shipmentHistory?.billTo?.country ?? '',
        name: values?.billedToName,
        address: values?.billedToAddress,
        city: values?.billedToCity,
        state: values?.billedToState,
        zip: values?.billedToZip
      } as BillTo
    }

    const userDetail: UserDetail = {
      userID: null,
      userName: this.userName,
      email: null
    };

    this.shipment = {
      shipmentDetail: this.shipmentHistory?.shipmentDetail,
      referenceFields: this.shipmentHistory?.referenceFields ?? [],
      billTo: this.shipmentHistory?.billTo ?? null,
      client: this.shipmentHistory?.client ?? null,
      user: userDetail,
      carrierDetail: this.shipmentHistory?.carrierDetail ?? null,
      shipper: this.shipmentHistory?.shipper ?? null,
      consignee: this.shipmentHistory?.consignee ?? null,
      historicalEvents: [],
      lineItems: this.shipmentHistory?.lineItems ?? [],
      accessorials: this.shipmentHistory?.accessorials ?? [],
      openReferenceFields: this.shipmentHistory?.openReferenceFields ?? [],
      targetRates: null,
      manualQuotes: [],
      notificationMails: this.shipmentHistory?.notificationMails ?? [],
      whiteGlove: null,
      trackingContacts: this.shipmentHistory?.trackingContacts ?? []
    };

    // UPDATE SHIPMENT
    if (values) {
      this.ss.updateShipment(this.shipment).subscribe({
        next: () => {
          this.getShipmentHistory();
        }
      });
    } else {
      this.rs.updateTrackingShipmentDetails(this.shipmentID(), shipmentDetail).subscribe({
        next: () => {
          this.getShipmentHistory();
        }
      });
    }
  }

  changeMade() {
    this.changeUpdate.emit(true);
  }

  getShipmentHistory() {
    this.shipmentHistory = {} as ShipmentHistory;
    this.rs.getShipmentHistory(this.shipmentID()).subscribe({
      next: response => {
        this.shipmentHistory = response;
        this.dispatchInfo = response?.dispatchInfo;
        this.getShipmentHist.emit(this.shipmentHistory);
        if (this.shipmentHistory?.shipmentDetail?.priority === 'ELEVATED' ||
          this.shipmentHistory?.shipmentDetail?.priority === 'EXPEDITED') {
          document.getElementById('shipmentPriorityTag')?.classList.add('bold');
        }
        this.clientCode = this.shipmentHistory?.client?.clientCode ? this.shipmentHistory?.client?.clientCode : '';
        if ((this.shipmentHistory?.shipmentDetail?.proNumber === '') &&
          (this.detailsData.proNum === '' || this.detailsData.proNum == null)) {
          this.rs.getPRONumber(this.shipmentID()).subscribe({
            next: resp => {
              this.shipmentHistory!.shipmentDetail!.proNumber = resp;
              this.detailsData.proNum = resp;
            }
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  statusEmailBody() {
    let emailBody = '';
    if (this.selectedDocument !== 'BOL' && this.selectedDocument !== 'carrierconfirmation' && this.selectedDocument !== 'clientquote' &&
      this.selectedDocument !== 'clientquote' && !this.selectedDocument.toString().startsWith('tnuconfirmation')) {
      emailBody += 'The following is a secured URL to access the ' + $('#docSelect option:selected').text() + ' for Truck ' +
        (this.truck?.truckID ? this.truck?.truckID : '') + ' : ' + this.selectedDocument;
    }

    const len = (this.truck?.shipments?.length ?? 0) - 1;
    emailBody += '\n' + '________________________________________________________________________________________________________' + '\n' +
      'Truck ID: ' + (this.truck?.truckID ? this.truck?.truckID : '') + '\n' +
      'BOL#s:' + this.getListBOLNumbers() + '\n' +
      'Ship Date: ' + (this.truck?.shipDate ? formatDate(this.truck?.shipDate ?? '', 'MM/dd/yyyy', 'en', '') : '') + '\n' +
      'Origin: ' + (this.truck?.shipments && this.truck?.shipments?.[0]?.shipper?.city && this.truck?.shipments?.[0]?.shipper?.state ?
        this.truck?.shipments?.[0]?.shipper?.city.toUpperCase() + ', ' + this.truck?.shipments?.[0]?.shipper?.state + ' ' : '') + '\n' +
      'Destination: ' + (this.truck?.shipments && this.truck?.shipments?.[len]?.consignee?.city && this.truck?.shipments?.[len]?.consignee?.state ?
        this.truck?.shipments?.[len]?.consignee?.city.toUpperCase() + ', ' +
        this.truck?.shipments?.[len]?.consignee?.state.toUpperCase() + ' ' : '') + '\n\n' +
      'If you have additional questions or requests please contact your Logistics Planner directly at truckload@il2000.com' + '\n' +
      'or 1-877-373-4525.';

    return emailBody;
  }

  setManualDocumentType() {
    this.emailSendSubject = this.selectedManualDocument + ' - Truck ' + this.truck?.truckID;
  }

  drop(event: any) {
    this.changeUpdate.emit(true);
    moveItemInArray(this.truck?.shipments ?? [], event.previousIndex, event.currentIndex);
  }

  getListBOLNumbers() {
    const BOLs = [];
    if (this.truck?.shipments) {
      for (const shipment of this.truck?.shipments ?? []) {
        BOLs.push(' ' + shipment.shipmentDetail.bolNumber);
      }
    }
    return BOLs;
  }

  base64ToBlob(base64String: string) {
    base64String = 'data:application/pdf;base64,' + base64String;
    const byteString = atob(base64String.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'application/pdf'});
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  onClickPostToLoadBoard() {
    const prevLF = this.truck?.linearFoot ?? 0;
    Swal.fire({
      title: (this.truck?.loadPosted ? 'Update load board' : 'Post to load board'),
      icon: 'question',
      html: 'Do you want to ' + (this.truck?.loadPosted ? 'update truckload on load board?' : 'post truckload on load board?'),
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continue',
      input: 'text',
      inputLabel: 'Please enter Linear Foot, current linear foot value is: ' + (this.truck?.linearFoot ?? '0'),
      inputValue: this.truck?.linearFoot ?? 0,
      didOpen: () => {
        $('input[type="text"].swal2-input').on('keypress', (event) => {
          const key = event.keyCode;
          return !(key < 48 || key > 57);
        });
      },
      inputValidator: (value): any => {
        if (!value) {
          return 'Linear foot must be provided and must be greater than zero!';
        }
        if (parseInt(value, 10) !== prevLF) {
          if (parseInt(value, 10) === 0) {
            return 'Linear foot must be provided and must be greater than zero!';
          }
        }
      },
      inputAttributes: {
        maxlength: '6',
        onpaste: 'return false;',
        ondrop: 'return false;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        // this.truck.update((values: any) => ({
        //   ...values,
        //   linearFoot: parseInt(result.value, 10)
        // }));
        this.truck!.linearFoot = parseInt(result.value, 10);
        let truckObj = this.truck;
        truckObj = this.convertToProcess(truckObj);
        if (prevLF !== parseInt(result.value, 10)) {
          this.tss.updateTruck(truckObj).subscribe({
            next: response => {
              truckObj = response;
              this.addLinearFootUpdatedNote(truckObj, prevLF.toString(), result.value);
              this.postToLoadBoard(truckObj, truckObj?.loadPosted);
            },
            error: () => {
              this.spinner.hide('createLoadTrackSpinner').then();
            }
          });
        } else {
          this.postToLoadBoard(truckObj, truckObj?.loadPosted);
        }
      } else {
        return;
      }
    });
  }

  postToLoadBoard(truck: any, updateToLoadBoard = false) {
    this.spinner.show('createLoadTrackSpinner').then();

    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: (updateToLoadBoard ? 'Load updated on DAT board' : 'Load posted on DAT board'),
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;

    if (!updateToLoadBoard) {
      this.ls.postLoadBoard(truck).subscribe({
        next: () => {
          const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
          this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Post to DAT board', 'Load posted on DAT board', 'success').then(() => {
            location.reload();
          });
        },
        error: e => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Post to DAT board', '<i>' + e + '</i>', 'warning').then();
        }
      });
    } else {
      this.ls.updateLoadBoard(truck).subscribe({
        next: () => {
          const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
          this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Update DAT board', 'Load updated on DAT board', 'success').then(() => {
            location.reload();
          });
        },
        error: e => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Update DAT board', '<i>' + e + '</i>', 'warning').then();
        }
      });
    }
  }

  postToTruckerBoard(truck: any, updateToTruckerBoard = false) {
    this.spinner.show('createLoadTrackSpinner').then();
    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: (updateToTruckerBoard ? 'Load updated on Trucker tools board' : 'Load posted on Trucker tools board'),
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;

    if (!updateToTruckerBoard) {
      this.tts.postLoad(truck).subscribe({
        next: response => {
          if (response.statusCode?.toString() === '200') {
            const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
            this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Post to trucker tools board', response.message, 'success').then(() => {
              location.reload();
            });
          } else {
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Trucker Tool Post Load', '<i>' + response.error + '</i>', 'warning').then();
          }
        },
        error: error => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Post to trucker tools board', '<i>' + error + '</i>', 'warning').then();
        }
      });
    } else {
      this.tts.postLoad(truck).subscribe({
        next: response => {
          if (response.statusCode?.toString() === '200') {
            const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
            this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Update load board', 'Load updated on Trucker tools board', 'success').then(() => {
              location.reload();
            });
          } else {
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Update trucker tools board', '<i>' + response.error + '</i>', 'warning').then();
          }
        },
        error: error => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Update trucker tools board', '<i>' + error + '</i>', 'warning').then();
        }
      });
    }
  }

  deleteFromLoadBoard() {
    Swal.fire({
      title: 'Delete Load',
      html: 'Are you sure you want to delete load ' + this.truck?.truckID + ' from the DAT board?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        this.ls.deleteLoadBoard(this.truck?.truckID).subscribe({
          next: () => {
            const todayDate: Date = new Date();
            todayDate.setSeconds(0);
            const note: Note = {
              notText: 'Load removed on DAT board',
              notCognitoUsername: this.userName,
              notTimeStamp: todayDate
            } as Note;
            const sId = this.truck?.shipments ? this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1].shipmentDetail.shipmentID : 0;
            this.rs.addNote(parseInt(sId, 10), false, note).subscribe();
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Delete load posted', 'Load removed on DAT board', 'success').then(() => {
              location.reload();
            });
          },
          error: error => {
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Delete load posted', '<i>' + error + '</i>', 'warning').then();
          }
        });
      } else {
        return;
      }
    });
  }

  onClickPostTruckerToolBoard() {
    const prevLF = this.truck?.linearFoot ?? 0;
    Swal.fire({
      title: (this.truck?.loadPostedTT ? 'Trucker Tools - Update Load' : 'Trucker Tools - Post Load'),
      icon: 'question',
      html: 'Do you want to ' + (this.truck?.loadPostedTT ? 'update load on trucker tools board?' : 'post load on trucker tools board?'),
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continue',
      input: 'text',
      inputLabel: 'Please enter Linear Foot, current linear foot value is: ' + (this.truck?.linearFoot ?? '0'),
      inputValue: this.truck?.linearFoot ?? 0,
      didOpen: () => {
        $('input[type="text"].swal2-input').on('keypress', (event) => {
          const key = event.keyCode;
          return !(key < 48 || key > 57);
        });
      },
      inputValidator: (value): any => {
        if (!value) {
          return 'Linear foot must be provided and must be greater than zero!';
        }
        if (parseInt(value, 10) !== prevLF) {
          if (parseInt(value, 10) === 0) {
            return 'Linear foot must be provided and must be greater than zero!';
          }
        }
      },
      inputAttributes: {
        maxlength: '6',
        onpaste: 'return false;',
        ondrop: 'return false;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        // this.truck.update((values: any) => ({
        //   ...values,
        //   linearFoot: parseInt(result.value, 10)
        // }));
        this.truck!.linearFoot = parseInt(result.value, 10);
        let truckObj = this.truck;
        truckObj = this.convertToProcess(truckObj);
        if (prevLF !== parseInt(result.value, 10)) {
          this.tss.updateTruck(truckObj).subscribe({
            next: response => {
              truckObj = response;
              this.addLinearFootUpdatedNote(truckObj, prevLF.toString(), result.value);
              this.postToTruckerBoard(truckObj, truckObj?.loadPostedTT);
            },
            error: () => {
              this.spinner.hide('createLoadTrackSpinner').then();
            }
          });
        } else {
          this.postToTruckerBoard(truckObj, truckObj?.loadPostedTT);
        }
      } else {
        return;
      }
    });
  }

  deleteFromTruckerBoard() {
    Swal.fire({
      title: 'Delete Load',
      html: 'Are you sure you want to delete load ' + this.truck?.truckID + ' from the Trucker tools board?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        this.tts.cancelLoad(this.truck).subscribe({
          next: response => {
            if (response.statusCode?.toString() === '200') {
              const todayDate: Date = new Date();
              todayDate.setSeconds(0);
              const note: Note = {
                notText: 'Load removed on Trucker tools board',
                notCognitoUsername: this.userName,
                notTimeStamp: todayDate
              } as Note;
              const shipId = this.truck?.shipments ? this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0;
              this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
              this.spinner.hide('createLoadTrackSpinner').then();
              Swal.fire('Delete Load', 'Load removed on Trucker tools board', 'success').then(() => {
                location.reload();
              });
            } else {
              this.spinner.hide('createLoadTrackSpinner').then();
              Swal.fire('Delete Load', '<i>' + response.error + '</i>', 'warning').then();
            }
          },
          error: error => {
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Delete Load', '<i>' + error + '</i>', 'warning').then();
          }
        });
      } else {
        return;
      }
    });
  }

  onClickPostLoad() {
    const prevLF = this.truck?.linearFoot ?? 0;
    Swal.fire({
      title: 'Post Load',
      icon: 'question',
      html: 'Do you want to post Load on boards?',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continue',
      input: 'text',
      inputLabel: 'Please enter Linear Foot, current linear foot value is: ' + (this.truck?.linearFoot ?? '0'),
      inputValue: this.truck?.linearFoot ?? 0,
      didOpen: () => {
        $('input[type="text"].swal2-input').on('keypress', (event) => {
          const key = event.keyCode;
          return !(key < 48 || key > 57);
        });
      },
      inputValidator: (value): any => {
        if (!value) {
          return 'Linear foot must be provided and must be greater than zero!';
        }
        if (parseInt(value, 10) !== prevLF) {
          if (parseInt(value, 10) === 0) {
            return 'Linear foot must be provided and must be greater than zero!';
          }
        }
      },
      inputAttributes: {
        maxlength: '6',
        onpaste: 'return false;',
        ondrop: 'return false;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        // this.truck.update((values: any) => ({
        //   ...values,
        //   linearFoot: parseInt(result.value, 10)
        // }));
        this.truck!.linearFoot = parseInt(result.value, 10);
        let truckObj = this.truck;
        truckObj = this.convertToProcess(truckObj);
        if (prevLF !== parseInt(result.value, 10)) {
          this.tss.updateTruck(truckObj).subscribe({
            next: response => {
              truckObj = response;
              this.addLinearFootUpdatedNote(truckObj, prevLF.toString(), result.value);
              this.postToLoad(truckObj);
            },
            error: () => {
              this.spinner.hide('createLoadTrackSpinner').then();
            }
          });
        } else {
          this.postToLoad(truckObj);
        }
      } else {
        return;
      }
    });
  }

  postToLoad(truck: any) {
    this.spinner.show('createLoadTrackSpinner').then();
    let datPosted = false;
    let ttPosted = false;
    let mpPosted = false;
    let loadBoardCounter = 0;
    let errorsCounter = 0;
    let errors = 'Error posting load on: <br/>';
    let message = 'Load posted successfully on: <br/>';

    const fn = () => {
      if (loadBoardCounter === 3) {
        this.spinner.hide('createLoadTrackSpinner').then();
        if (mpPosted || ttPosted || datPosted) {
          message = message + (errorsCounter > 0 ? '<br/>' + errors : '');
          Swal.fire({icon: 'success', title: 'Post Load', html: message}).then((result) => {
            if (result.isConfirmed) {
              const todayDate: Date = new Date();
              todayDate.setSeconds(0);
              const note: Note = {
                notText: 'Load posted on boards',
                notCognitoUsername: this.userName,
                notTimeStamp: todayDate
              } as Note;
              const shipId = truck?.shipments ? truck.shipments?.[truck.shipments.length - 1].shipmentDetail.shipmentID : 0;
              this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
              location.reload();
            }
          });
        } else {
          Swal.fire('Post Load', errors, 'warning').then();
        }
      }
    };

    if (this.datActive) {
      this.ls.postLoadBoard(truck).subscribe({
        next: () => {
          datPosted = true;
          message = message + '<b>DAT</b><br/>';
          loadBoardCounter += 1;
          fn();
        },
        error: error => {
          errors = errors + '<b>DAT:</b> ' + error + '<br/>';
          loadBoardCounter += 1;
          errorsCounter += 1;
          fn();
        }
      });
    } else {
      loadBoardCounter += 1;
      fn();
    }

    if (this.truckerToolsActive) {
      this.tts.postLoad(truck).subscribe({
        next: response => {
          if (response.statusCode?.toString() === '200') {
            ttPosted = true;
            message = message + '<b>Trucker Tools</b><br/>';
          } else {
            errors = errors + '<b>Trucker Tools:</b><br/>' + response.error + '<br/>';
            errorsCounter += 1;
          }
          loadBoardCounter += 1;
          fn();
        },
        error: error => {
          errors = errors + '<b>Trucker Tools:</b> ' + error + '<br/>';
          loadBoardCounter += 1;
          errorsCounter += 1;
          fn();
        }
      });
    } else {
      loadBoardCounter += 1;
      fn();
    }

    if (this.macropointActive) {
      // Macro point Post order
      this.ms.postLoad(truck).subscribe({
        next: () => {
          mpPosted = true;
          message = message + '<b>Macropoint</b><br/>';
          loadBoardCounter += 1;
          fn();
        },
        error: error => {
          errors = errors + '<b>Macropoint:</b> ' + error + '<br/>';
          loadBoardCounter += 1;
          errorsCounter += 1;
          fn();
        }
      });
    } else {
      loadBoardCounter += 1;
      fn();
    }
  }

  getCharge(type: string) {
    let cc = 0;
    this.truck?.truckFees.forEach((tf: TruckFees) => {
      if (type === 'carrier') {
        cc += parseFloat(tf.amount?.toString() ?? '0');
      }
      if (type === 'client') {
        cc += parseFloat(tf.sellAmount?.toString() ?? '0');
      }
    });
    return cc;
  }

  calculateFinancialReview(tlQuotes: TLManualQuote[]) {
    this.selectedClientCost = 0;
    this.selectedCarrierCost = 0;

    for (const tlQuote of tlQuotes) {
      if (tlQuote.assigned == true) {
        this.selectedCarrier = tlQuote.carrierName ?? '';
        this.selectedCarrierCost = Number(tlQuote.carrierCost);
        this.selectedClientCost = Number(tlQuote.clientCost);
      }
    }

    this.carrierCharge = this.getCharge('carrier');
    this.customerCharge = this.getCharge('client');
    this.selectedClientCost = this.selectedClientCost + this.customerCharge;
    this.selectedCarrierCost = this.selectedCarrierCost + this.carrierCharge;

    if (this.selectedCarrierCost > 0 && this.selectedClientCost > 0) {
      this.selectedMarginAmount = this.selectedClientCost - this.selectedCarrierCost;
      this.selectedMarginPercent = (this.selectedMarginAmount / this.selectedClientCost) * 100;
    }
  }

  toNumber(shipmentId: any) {
    if (shipmentId) {
      return parseInt(shipmentId, 10);
    }
    return null;
  }

  getNotes() {
    const data: any[] = [];
    this.noteFormGrids.forEach((noteFormGrid: NoteFormGrid) => {
      const field: any = {};
      const shipmentId = noteFormGrid.shipmentId();
      const text = noteFormGrid.noteForm.get('notesText')?.value.trim();
      const isClientNote = noteFormGrid.noteForm.get('isClientNote')?.value;
      const isNeedsManagement = noteFormGrid.noteForm.get('isNeedsManagement')?.value;
      if (text !== '') {
        field.shipmentId = shipmentId;
        field.text = text;
        field.isClientNote = isClientNote;
        field.isNeedsManagement = isNeedsManagement;
        data.push(field);
      }
    });
    return data;
  }

  validateStatusForPosting() {
    return this.truck?.state === 'FINDING_QUOTES' || this.truck?.state === 'PREBOOKED' || this.truck?.state === 'QUOTE_SENT_TO_CLIENT' ||
      this.truck?.state === 'PENDING';
  }

  validateStatusForProNumber() {
    return this.truck?.proLoadNumber && this.truck?.proLoadNumber !== '';
  }

  setShippingDatesGroup() {
    if (this.truck?.shipments) {
      const pickupAppointmentStart = this.isDate(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStart) ?
        formatDate(this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStart, 'HH:mm', 'en', 'America/New_York') : '';
      const pickupAppointmentStop = this.truck?.shipments?.[0].shipmentDetail.pickupAppointmentStop;
      const shipLen = (this.truck?.shipments?.length ?? 0) - 1;
      const deliveryAppointmentStart = this.isDate(this.truck?.shipments?.[shipLen].shipmentDetail.deliveryAppointmentStart) ?
        formatDate(this.truck?.shipments?.[shipLen].shipmentDetail.deliveryAppointmentStart, 'HH:mm', 'en', 'America/New_York') : '';
      const deliveryAppointmentStop = this.truck?.shipments?.[shipLen].shipmentDetail.deliveryAppointmentStop;

      const shippingDetailsInfo = {
        pickupStart: this.isDate(pickupAppointmentStart) ? pickupAppointmentStart : null,
        pickupStop: this.isDate(pickupAppointmentStop) ? pickupAppointmentStop : null,
        actualPickupDate: this.isDate(this.truck?.shipments?.[0].shipmentDetail.actualShipDate) ?
          formatDate(this.truck?.shipments?.[0].shipmentDetail.actualShipDate, 'yyyy-MM-dd', 'en', '') : null,
        deliveryStart: this.isDate(deliveryAppointmentStart) ? deliveryAppointmentStart : null,
        deliveryStop: this.isDate(deliveryAppointmentStop) ? deliveryAppointmentStop : null,
        actualDeliveryDate: this.isDate(this.truck?.shipments?.[shipLen].shipmentDetail.actualDeliveryDate) ?
          formatDate(this.truck?.shipments?.[shipLen].shipmentDetail.actualDeliveryDate, 'yyyy-MM-dd', 'en', '') : null
      };
      this.shippingDatesGroup.reset(shippingDetailsInfo);
    }
  }

  isDate(date: string) {
    return (!(date === '' || date == null || date === '0000-00-00 00:00:00' || date === '0000-00-00T00:00:00' || date === 'Invalid date'));
  }

  setDates(type: string, event: any, input: string) {
    this.validateDates(event, input).then(() => {
      if (type === 'pickup') {
        if (this.truck?.pickupExceptionFK == null || String(this.truck?.pickupExceptionFK).trim() === '') {
          event.value = '';
          Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Please Select Pickup Exception'});
        } else {
          if (this.shippingDatesGroup.get('pickupStart')?.value != '' && this.shippingDatesGroup.get('pickupStop')?.value != '') {
            let splitter = ' ';
            if (this.shippingDatesGroup.get('pickupStop')?.value.includes('T')) {
              splitter = 'T';
            }
            const parts = this.shippingDatesGroup.get('pickupStop')?.value.split(splitter);
            if (parts.length > 0) {
              if (this.truck?.shipments) {
                this.truck!.shipments![0]!.shipmentDetail!.pickupAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('pickupStart')?.value;
                // this.truck.shipments?.[0].shipmentDetail.update((values: any) => ({
                //   ...values,
                //   pickupAppointmentStart: parts[0] + ' ' + this.shippingDatesGroup.get('pickupStart')?.value
                // }));
              }
            }
          }
          if (this.shippingDatesGroup.get('pickupStop')?.value != '') {
            if (this.truck?.shipments) {
              this.truck!.shipments![0]!.shipmentDetail!.pickupAppointmentStop = this.shippingDatesGroup.get('pickupStop')?.value;
              this.truck!.shipments![0]!.shipmentDetail!.enteredShipDate = this.shippingDatesGroup.get('pickupStop')?.value;
              // this.truck.shipments?.[0].shipmentDetail.update((values: any) => ({
              //   ...values,
              //   pickupAppointmentStop: this.shippingDatesGroup.get('pickupStop')?.value,
              //   enteredShipDate: this.shippingDatesGroup.get('pickupStop')?.value
              // }));
            }
          }
          if (input === 'actualShipDate') {
            if (this.truck?.shipments) {
              this.truck!.shipments![0]!.shipmentDetail!.actualShipDate = this.shippingDatesGroup.get('actualPickupDate')?.value != '' ? this.shippingDatesGroup.get('actualPickupDate')?.value : null;
              // const actualShipDatex = this.shippingDatesGroup.get('actualPickupDate')?.value != '' ? this.shippingDatesGroup.get('actualPickupDate')?.value : null
              // this.truck.shipments?.[0].shipmentDetail.update((values: any) => ({
              //   ...values,
              //   actualShipDate: actualShipDatex
              // }));
            }
          }
        }
      }

      if (type === 'delivery') {
        if (this.truck?.deliveryExceptionFK == null || String(this.truck?.deliveryExceptionFK).trim() === '') {
          event.value = '';
          Swal.fire({icon: 'warning', title: '', html: '<b/><i/>Please Select Delivery Exception'});
        } else {
          const shipLen = (this.truck?.shipments?.length ?? 0) - 1;
          if (this.shippingDatesGroup.get('deliveryStart')?.value != '' && this.shippingDatesGroup.get('deliveryStop')?.value != '') {
            let splitter = ' ';
            if (this.shippingDatesGroup.get('deliveryStop')?.value.includes('T')) {
              splitter = 'T';
            }
            const parts = this.shippingDatesGroup.get('deliveryStop')?.value.split(splitter);
            if (parts.length > 0) {
              if (this.truck?.shipments) {
                this.truck!.shipments![shipLen]!.shipmentDetail!.deliveryAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('deliveryStart')?.value;
                // this.truck.update((values: any) => ({
                //   ...values,
                //   shipments: {
                //     ...values[shipLen],
                //     shipmentDetail: {
                //       ...values,
                //       deliveryAppointmentStart: parts[0] + ' ' + this.shippingDatesGroup.get('deliveryStart')?.value
                //     }
                //   }
                // }));
              }
            }
          }
          if (this.shippingDatesGroup.get('deliveryStop')?.value != '') {
            if (this.truck?.shipments) {
              this.truck!.shipments![shipLen]!.shipmentDetail!.deliveryAppointmentStop = this.shippingDatesGroup.get('deliveryStop')?.value;
              // this.truck.shipments?.[shipLen].shipmentDetail.update((values: any) => ({
              //   ...values,
              //   deliveryAppointmentStop: this.shippingDatesGroup.get('deliveryStop')?.value
              // }));
            }
          }
          if (input === 'actualDeliveryDate') {
            this.truck!.deliveryDate = this.shippingDatesGroup.get('actualDeliveryDate')?.value ? this.shippingDatesGroup.get('actualDeliveryDate')?.value : null;
            // this.truck.update((values: any) => ({
            //   ...values,
            //   deliveryDate: (this.shippingDatesGroup.get('actualDeliveryDate')?.value ? this.shippingDatesGroup.get('actualDeliveryDate')?.value : null)
            // }));
            if (this.truck?.shipments) {
              this.truck!.shipments![shipLen]!.shipmentDetail!.actualDeliveryDate = this.shippingDatesGroup.get('actualDeliveryDate')?.value ? this.shippingDatesGroup.get('actualDeliveryDate')?.value : null;
              // this.truck.shipments?.[shipLen].shipmentDetail.update((values: any) => ({
              //   ...values,
              //   actualDeliveryDate: (this.shippingDatesGroup.get('actualDeliveryDate')?.value ? this.shippingDatesGroup.get('actualDeliveryDate')?.value : null)
              // }));
            }
          }
        }
      }
    });

    this.changeUpdate.emit(true);
  }

  validateDates(event: any, input: string): Promise<void> {
    return new Promise<void>((resolve) => {

      if (event.value == '') {
        return resolve();
      }
      let splitDate = event.value.split('-');

      let splitTime: any = null;
      let dateTovalid: any = null;
      let splitter = ' ';

      if (input === 'pickupAppointmentStart') {
        let pickupAppointmentStart = '';
        splitter = ' ';

        if (this.shippingDatesGroup.get('pickupStop')?.value.includes('T')) {
          splitter = 'T';
        }
        const parts = this.shippingDatesGroup.get('pickupStop')?.value.split(splitter);
        if (parts.length > 0) {
          pickupAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('pickupStart')?.value;
        }
        dateTovalid = new Date(pickupAppointmentStart);

        // Start Pickup Appointment vs End Pickup Appointment
        if (this.shippingDatesGroup.get('pickupStop')?.value && this.shippingDatesGroup.get('pickupStop')?.value !== '0000-00-00 00:00:00') {
          splitter = ' ';
          if (this.shippingDatesGroup.get('pickupStop')?.value.includes('T')) {
            splitter = 'T';
          }
          splitDate = this.shippingDatesGroup.get('pickupStop')?.value.split(splitter)[0].split('-');
          splitTime = this.shippingDatesGroup.get('pickupStop')?.value.split(splitter)[1].split(':');
          const aptStop = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
          if (dateTovalid > aptStop) {
            event.value = '';
            this.shippingDatesGroup.get('pickupStart')?.setValue('');
            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>Start Pickup Appointment Date cannot be Greater than End Pickup Appointment Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }
      }

      if (input === 'pickupAppointmentStop') {
        splitDate = event.value.split('T')[0].split('-');
        splitTime = event.value.split('T')[1].split(':');
        dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);

        // Start Pickup Appointment vs End Pickup Appointment
        if (this.shippingDatesGroup.get('pickupStart')?.value &&
          this.shippingDatesGroup.get('pickupStart')?.value !== '0000-00-00 00:00:00') {
          let pickupAppointmentStart = '';
          splitter = ' ';

          if (this.shippingDatesGroup.get('pickupStop')?.value.includes('T')) {
            splitter = 'T';
          }
          const parts = this.shippingDatesGroup.get('pickupStop')?.value.split(splitter);
          if (parts.length > 0) {
            pickupAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('pickupStart')?.value;
          }

          const aptStart = new Date(pickupAppointmentStart);

          if (dateTovalid < aptStart) {
            event.value = '';
            this.shippingDatesGroup.get('pickupStop')?.setValue('');
            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>End Pickup Appointment Date cannot be less than Start Pickup Appointment Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }
      }

      // Delivery Dates
      if (input === 'scheduledDeliveryDate') {
        dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);

        // Scheduled Delivery vs Original Delivery
        if (this.shipmentHistory?.shipmentDetail?.originalDeliveryDate) {
          splitDate = this.shipmentHistory?.shipmentDetail?.originalDeliveryDate.split('T')[0].split('-');
          const original = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
          if (dateTovalid < original) {
            event.value = '';
            this.shippingDatesGroup.get('pickupStart')?.setValue('');
            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>Scheduled Delivery Date cannot be Less than Original Delivery Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }

        if (this.shippingDatesGroup.get('actualDeliveryDate')?.value) {
          splitDate = this.shippingDatesGroup.get('actualDeliveryDate')?.value.split('-');
          const actual = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
          if (dateTovalid > actual) {
            event.value = '';
            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>Scheduled Delivery Date cannot be greater than Actual Delivery Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }
      }

      if (input === 'deliveryAppointmentStart') {
        let deliveryAppointmentStart: string = '';
        splitter = ' ';

        if (this.shippingDatesGroup.get('deliveryStop')?.value.includes('T')) {
          splitter = 'T';
        }
        const parts = this.shippingDatesGroup.get('deliveryStop')?.value.split(splitter);
        if (parts.length > 0) {
          deliveryAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('deliveryStart')?.value;
        }
        dateTovalid = new Date(deliveryAppointmentStart);

        // Start Delivery Appointment vs End Delivery Appointment
        if (this.shippingDatesGroup.get('deliveryStop')?.value &&
          this.shippingDatesGroup.get('deliveryStop')?.value !== '0000-00-00 00:00:00') {

          splitter = ' ';
          if (this.shippingDatesGroup.get('deliveryStop')?.value.includes('T')) {
            splitter = 'T';
          }
          splitDate = this.shippingDatesGroup.get('deliveryStop')?.value.split(splitter)[0].split('-');
          splitTime = this.shippingDatesGroup.get('deliveryStop')?.value.split(splitter)[1].split(':');
          const aptStop = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);

          if (dateTovalid > aptStop) {
            event.value = '';
            this.shippingDatesGroup.get('deliveryStart')?.setValue('');

            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>Start Delivery Appointment Date cannot be Greater than End Delivery Appointment Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }
      }

      if (input === 'deliveryAppointmentStop') {
        splitDate = event.value.split('T')[0].split('-');
        splitTime = event.value.split('T')[1].split(':');
        dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);

        // End Delivery Appointment vs Start Delivery Appointment
        if (this.shippingDatesGroup.get('deliveryStart')?.value &&
          this.shippingDatesGroup.get('deliveryStart')?.value !== '0000-00-00 00:00:00') {
          let deliveryAppointmentStart: string = '';
          splitter = ' ';
          if (this.shippingDatesGroup.get('deliveryStop')?.value.includes('T')) {
            splitter = 'T';
          }
          const parts = this.shippingDatesGroup.get('deliveryStop')?.value.split(splitter);
          if (parts.length > 0) {
            deliveryAppointmentStart = parts[0] + ' ' + this.shippingDatesGroup.get('deliveryStart')?.value;
          }

          const aptStart = new Date(deliveryAppointmentStart);
          if (dateTovalid < aptStart) {
            event.value = '';
            this.shippingDatesGroup.get('deliveryStop')?.setValue('');

            Swal.fire({
              icon: 'warning',
              title: '',
              html: '<b/><i/>End Delivery Appointment Date cannot be less than Start Delivery Appointment Date'
            }).then(() => {
              document.getElementById(event.id)?.focus();
            });
            return resolve();
          }
        }
      }

      if (input === 'actualDeliveryDate') {
        dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
        // Actual Delivery vs Current Day
        if (dateTovalid > new Date()) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>Actual Delivery Date cannot be Greater than Current Day'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return resolve();
        }
      }

      return resolve();
    });
  }

  onEditClick() {
    this.isEditMode.set(true);
  }

  convertDatetimeToUtc(date: string, timezone: string) {
    if (timezone !== '' && date !== '') {
      const dateInPT = moment.tz(date, 'YYYY-MM-DDTHH:mm', timezone);
      const dateInUTC = moment.utc(dateInPT);
      const tzOffset = moment(new Date()).utcOffset();
      const dateStringInUTC = dateInUTC.utcOffset(tzOffset).format('YYYY-MM-DDTHH:mm');

      if (dateStringInUTC !== 'Invalid date') {
        return formatDate(dateStringInUTC, 'yyyy-MM-ddTHH:mm', 'en-US');
      }
      return '';
    } else {
      return date;
    }
  }

  convertToProcess(data: any) {
    for (let i = 0; i < data.shipments.length; i++) {
      const shipperTZ = data.shipments?.[i].shipper.timezone ? data.shipments?.[i].shipper.timezone : 'UTC';
      const consigneeTZ = data.shipments?.[i].consignee.timezone ? data.shipments?.[i].consignee.timezone : 'UTC';

      data.shipments[i]!.shipmentDetail!.pickupAppointmentStart = this.isDate(data.shipments?.[i].shipmentDetail.pickupAppointmentStart) ?
        this.convertDatetimeToUtc(data.shipments?.[i].shipmentDetail.pickupAppointmentStart, shipperTZ) : null;
      data.shipments[i]!.shipmentDetail!.pickupAppointmentStop = this.isDate(data.shipments?.[i].shipmentDetail.pickupAppointmentStop) ?
        this.convertDatetimeToUtc(data.shipments?.[i].shipmentDetail.pickupAppointmentStop, shipperTZ) : null;
      data.shipments[i]!.shipmentDetail!.deliveryAppointmentStart = this.isDate(data.shipments?.[i].shipmentDetail.deliveryAppointmentStart) ?
        this.convertDatetimeToUtc(data.shipments?.[i].shipmentDetail.deliveryAppointmentStart, consigneeTZ) : null;
      data.shipments[i]!.shipmentDetail!.deliveryAppointmentStop = this.isDate(data.shipments?.[i].shipmentDetail.deliveryAppointmentStop) ?
        this.convertDatetimeToUtc(data.shipments?.[i].shipmentDetail.deliveryAppointmentStop, consigneeTZ) : null;
    }

    let count = 0;
    for (const shipment of data.shipments) {
      const pickupAppointmentStart = !this.isDate(shipment.shipmentDetail.pickupAppointmentStart) ? null
        : moment(shipment.shipmentDetail.pickupAppointmentStart).utc().format('YYYY-MM-DDTHH:mm:ss');
      const pickupAppointmentStop = !this.isDate(shipment.shipmentDetail.pickupAppointmentStop) ? null
        : moment(shipment.shipmentDetail.pickupAppointmentStop).utc().format('YYYY-MM-DDTHH:mm:ss');
      const deliveryAppointmentStart = !this.isDate(shipment.shipmentDetail.deliveryAppointmentStart) ? null
        : moment(shipment.shipmentDetail.deliveryAppointmentStart).utc().format('YYYY-MM-DDTHH:mm:ss');
      const deliveryAppointmentStop = !this.isDate(shipment.shipmentDetail.deliveryAppointmentStop) ? null
        : moment(shipment.shipmentDetail.deliveryAppointmentStop).utc().format('YYYY-MM-DDTHH:mm:ss');

      data.shipments[count]!.shipmentDetail!.pickupAppointmentStart = pickupAppointmentStart;
      data.shipments[count]!.shipmentDetail!.pickupAppointmentStop = pickupAppointmentStop;
      data.shipments[count]!.shipmentDetail!.deliveryAppointmentStart = deliveryAppointmentStart;
      data.shipments[count]!.shipmentDetail!.deliveryAppointmentStop = deliveryAppointmentStop;
      count++;
    }
    return data;
  }

  validateLocationUpdate() {
    let validate = true;
    for (let i = 0; i < this.updateStatusArray.length; i++) {
      const statusItem = this.updateStatusArray[i];
      this.validateLocation[i].city = false;
      this.validateLocation[i].state = false;
      this.validateLocation[i].date = false;
      $('#trackingCity' + i).removeClass('is-invalid');
      $('#trackingState' + i).removeClass('is-invalid');
      if (statusItem.trackingState && (!statusItem.currentCity || !statusItem.currentState || !statusItem.trackingDate)) {
        if (!statusItem.currentCity) {
          this.validateLocation[i].city = true;
          $('#trackingCity' + i).addClass('is-invalid');
        }
        if (!statusItem.currentState) {
          this.validateLocation[i].state = true;
          $('#trackingState' + i).addClass('is-invalid');
        }
        if (!statusItem.trackingDate) {
          this.validateLocation[i].date = true;
          $('#trackingDate' + i).addClass('is-invalid');
        }
        validate = false;
      }
    }
    return validate;
  }

  onMailSent(document: string = '') {
    this.notes.getNotes();
    if (document === 'carrierconfirmation' || document === 'clientquote') {
      this.mailSent.emit(true);
    }
  }

  setCarrierSalesRep(userId: string, userName: any) {
    if (!userId || userId === '') {
      return;
    }
    const userExist = this.salesRepDropdown().find(i => i.UserID === parseInt(userId, 10).toString());
    if (!userExist) {
      this.salesRepDropdown.update(items => [...items, {UserID: userId, UserName: userName}]);
    }
  }

  getNotificationMails(index: any, event: any) {
    if (this.truck?.shipments) {
      this.truck!.shipments![index]!.notificationMails = event;
      // this.truck.shipments?.[index].update((values: any) => ({
      //   ...values,
      //   notificationMails: event
      // }));
    }
    this.changeUpdate.emit(true);
  }

  onChangePoNumber(index: any, event: any) {
    if (event == null || event === '') {
      setTimeout(() => {
        if (this.truck?.shipments) {
          this.truck!.shipments![index]!.shipmentDetail!.poNumber = ' ';
          // this.truck.shipments?.[index].shipmentDetail.update((values: any) => ({
          //   ...values,
          //   poNumber: ' '
          // }));
        }
      }, 100);
    } else {
      setTimeout(() => {
        if (this.truck?.shipments) {
          this.truck!.shipments![index]!.shipmentDetail!.poNumber = event.target.value;
          // this.truck.shipments?.[index].shipmentDetail.update((values: any) => ({
          //   ...values,
          //   poNumber: event.target.value
          // }));
        }
      }, 100);
    }
  }

  getStopReferenceFields(truck: TruckSave | null) {
    this.referenceFormGrids.forEach((refFormGrid: ReferenceFieldComponent) => {
      const shipmentId: string = refFormGrid.shipmentID() ?? '';
      const references = refFormGrid.saveReferences();
      const opeReferences = refFormGrid.saveOpenReferences();

      if (this.truck?.shipments) {
        for (let i = 0; i < (this.truck?.shipments?.length ?? 0); i++) {
          if (this.truck?.shipments?.[i].shipmentDetail.shipmentID === shipmentId) {
            if (references.length > 0) {
              references.forEach((ref: any) => {
                if (this.truck?.shipments) {
                  // @ts-ignore
                  this.truck.shipments?.[i].referenceFields.push(ref);
                }
              });
            }
            if (opeReferences.length > 0) {
              opeReferences.forEach((ref: any) => {
                if (this.truck?.shipments) {
                  // @ts-ignore
                  this.truck.shipments?.[i].openReferenceFields.push(ref);
                }
              });
            }
          }
        }
      }
    });

    return truck;
  }

  checkExceptionCodeExists(shipmentID: string, refFields: any[]) {
    this.referenceFormGrids.forEach((refFormGrid: ReferenceFieldComponent) => {
      if (refFormGrid.shipmentID() === shipmentID) {
        const matchesInClientFields = refFormGrid.clientFields()?.some(clientField =>
          clientField?.description === 'Exception Code' && refFormGrid.newRefName === 'Exception Code');
        refFormGrid.exceptionError = matchesInClientFields ||
          refFields.some(element => element.description?.toString() === 'Exception Code' && refFormGrid.newRefName === 'Exception Code') ||
          refFormGrid.existingOpenReferenceFields()?.some((element: any) =>
            element.rftDescription?.toString() === 'Exception Code' && refFormGrid.newRefName === 'Exception Code');
      }
    });
  }

  emailBodyNote() {
    const shipLen = (this.truck?.shipments?.length ?? 0) - 1;
    let messageBody = 'Truck ID: ' + (this.truck?.truckID ? this.truck?.truckID : '') + '. ' +
      'BOL#s:' + this.getListBOLNumbers() + '. ' +
      'Ship Date: ' + (this.truck?.shipDate ? formatDate(this.truck?.shipDate ?? '', 'MM/dd/yyyy', 'en', '') : '') + '. ' +
      'Origin: ' + (this.truck?.shipments && this.truck?.shipments?.[0].shipper?.city && this.truck?.shipments?.[0].shipper?.state ?
        this.truck?.shipments?.[0].shipper?.city.toUpperCase() + ', ' + this.truck?.shipments?.[0].shipper?.state + ' ' : '') + '. ' +
      'Destination: ' + (this.truck?.shipments && this.truck?.shipments?.[shipLen].consignee?.city && this.truck?.shipments?.[shipLen].consignee?.state ?
        this.truck?.shipments?.[shipLen].consignee?.city.toUpperCase() + ', ' +
        this.truck?.shipments?.[shipLen].consignee?.state.toUpperCase() + ' ' : '') + '. ';

    if (this.selectedDocument === 'carrierconfirmation' && this.truck?.tlQuotes) {
      for (const tlQuote of this.truck?.tlQuotes ?? []) {
        if (tlQuote.assigned == true) {
          messageBody += 'Carrier Rate: ' + (tlQuote.carrierCost ? tlQuote.carrierCost : '') + '. ';
        }
      }
    }
    return messageBody;
  }

  setCarrierCurrency() {
    let carCurrency = this.truck?.shipments && this.truck?.shipments?.[0]?.carrierDetail?.carcutAbbreviation ?
      this.truck?.shipments?.[0].carrierDetail?.carcutAbbreviation : 'USD';
    if (!(this.truck?.tlQuotes && (this.truck?.tlQuotes?.length ?? 0) > 0)) {
      return carCurrency;
    }
    const selectedQuote = this.truck?.tlQuotes?.filter((item: any) => item.assigned == true) ?? [];
    if (selectedQuote.length > 0) {
      carCurrency = selectedQuote[0].currencyID === 2 ? 'CAD' : 'USD';
    }
    return carCurrency;
  }

  onClickShowClientQuote(showClientQuote: boolean = false) {
    this.showAddClientQuote = showClientQuote;
  }

  setClientQuotes() {
    return this.truck?.tlQuotes?.filter((item: any) => item.clientQuote) ?? [];
  }

  checkTwoDecimals(event: any) {
    const reg = /^-?\d*(\.\d{0,2})?$/;
    const input = event.target.value + String.fromCharCode(event.charCode);
    if (!reg.test(input)) {
      event.preventDefault();
    }
  }

  enableSaveCQbtn() {
    if (this.clientQuotes.length === 0) {
      $('#costClientQuote').removeClass('is-invalid');
      $('#equipmentClientQuote').removeClass('is-invalid');
      const clientCost = $('#costClientQuote').val();
      const equipment = $('#equipmentClientQuote').val();

      if (!clientCost || clientCost?.toString() === '') {
        $('#costClientQuote').addClass('is-invalid');
      }
      if (!equipment || equipment?.toString() === '') {
        $('#equipmentClientQuote').addClass('is-invalid');
      }
      if (!clientCost || clientCost?.toString() === '' || parseFloat(clientCost.toString()) === 0 ||
        !equipment || equipment?.toString() === '') {
        return false;
      }

    } else {

      for (const quote of this.clientQuotes) {
        $('#costClientQuote-' + quote.quoteID).removeClass('is-invalid');
        $('#equipmentClientQuote-' + quote.quoteID).removeClass('is-invalid');
        const clientCost: any = $('#costClientQuote-' + quote.quoteID).val();
        const equipment: any = $('#equipmentClientQuote-' + quote.quoteID).val();

        if (!clientCost || clientCost?.toString() === '') {
          $('#costClientQuote-' + quote.quoteID).addClass('is-invalid');
        }
        if (!equipment || equipment?.toString() === '') {
          $('#equipmentClientQuote-' + quote.quoteID).addClass('is-invalid');
        }
        if (!clientCost || clientCost?.toString() === '' || !equipment || equipment?.toString() === '') {
          return false;
        }
        if (!this.enableAddClientQuote) {
          return false;
        }
      }
    }
    return true;
  }

  onclickClientQuoteEmit() {
    this.saveClientQuote.emit(true);
  }

  onClickSaveClientQuote() {
    const clientQuoteArray: TLManualQuote[] = [];
    if (this.clientQuotes.length === 0) {
      const clientCost: any = $('#costClientQuote').val();
      const transitTime: any = $('#ttClientQuote').val();
      const equipment: any = $('#equipmentClientQuote').val();
      const notes: any = $('#notesClientQuote').val();

      const newClientQuote: TLManualQuote = {
        quoteID: null,
        carrierID: '2',
        carrierName: 'IL2000',
        clientCost: clientCost.toString(),
        carrierCost: '0',
        quoteNumber: '',
        transitTime: transitTime.toString(),
        notes: notes.toString(),
        assigned: false,
        truckNotUsed: false,
        equipment: equipment.toString(),
        reasonCode: '',
        lostReasonNotes: '',
        currencyID: 1,
        exchangeRate: 1,
        rateDate: '',
        exchangeInfo: '',
        clientQuote: true
      };

      clientQuoteArray.push(newClientQuote);
      return clientQuoteArray;
    } else {

      for (const quote of this.clientQuotes) {
        const clientCost: any = $('#costClientQuote-' + quote.quoteID).val();
        const transitTime: any = $('#ttClientQuote-' + quote.quoteID).val();
        const equipment: any = $('#equipmentClientQuote-' + quote.quoteID).val();
        const notes: any = $('#notesClientQuote-' + quote.quoteID).val();

        const clientQuote = {
          quoteID: quote.quoteID,
          carrierID: '2',
          carrierName: 'IL2000',
          clientCost: clientCost.toString(),
          carrierCost: '0',
          quoteNumber: '',
          transitTime: transitTime.toString(),
          notes: notes.toString(),
          assigned: false,
          truckNotUsed: false,
          equipment: equipment.toString(),
          reasonCode: '',
          lostReasonNotes: '',
          currencyID: 1,
          exchangeRate: 1,
          rateDate: '',
          exchangeInfo: '',
          clientQuote: true
        };
        clientQuoteArray.push(clientQuote);
      }
      return clientQuoteArray;
    }
  }

  validateQuoteChanged(index: any) {
    this.enableAddClientQuote = false;
    const clientCost: any = $('#costClientQuote-' + index).val();
    const transitTime: any = $('#ttClientQuote-' + index).val();
    const equipment: any = $('#equipmentClientQuote-' + index).val();
    const notes: any = $('#notesClientQuote-' + index).val();

    const cqindex = this.clientQuotes.find((x) => x.quoteID === index?.toString());

    if (cqindex) {
      if (clientCost !== '' &&
        parseFloat(clientCost) !== parseFloat(cqindex.clientCost ?? '0')) {
        this.enableAddClientQuote = true;
      }

      if (transitTime?.toString() !== cqindex.transitTime?.toString()) {
        this.enableAddClientQuote = true;
      }

      if (equipment.toString() !== '' && equipment.toString() !== cqindex.equipment) {
        this.enableAddClientQuote = true;
      }

      if (notes?.toString() !== cqindex.notes) {
        this.enableAddClientQuote = true;
      }
    }

    return this.enableAddClientQuote;
  }

  getTrackingContactsEvent(index: number, event: any) {
    if (this.truck?.shipments) {
      this.truck!.shipments![index]!.trackingContacts = event;
      // this.truck.shipments?.[index].update((values: any) => ({
      //   ...values,
      //   trackingContacts: event
      // }));
    }
    this.changeUpdate.emit(true);
  }

  getSpecialInstruction(index: number, event: any, isTextArea = false) {
    // appends selected special instruction from dropdown to special instruction text area
    if (event && this.truck?.shipments) {
      if (isTextArea) {
        event = event.target.value;
        this.truck!.shipments![index]!.shipmentDetail!.specialInstructions = event + '.';
        // this.truck.shipments?.[index].shipmentDetail.update((values: any) => ({
        //   ...values,
        //   specialInstructions: event + '.'
        // }));
      } else {
        const textAreaValue = this.truck?.shipments?.[index].shipmentDetail.specialInstructions ?? '';
        this.truck!.shipments![index]!.shipmentDetail!.specialInstructions = textAreaValue + ' ' + event + '.';
        // this.truck.shipments?.[index].shipmentDetail.update((values: any) => ({
        //   ...values,
        //   specialInstructions: textAreaValue + ' ' + event + '.'
        // }));
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

  disabledTrackingContacts() {
    return !(this.truck?.state === 'PENDING' || this.truck?.state === 'PREBOOKED' || this.truck?.state === 'FINDING_QUOTES' ||
      this.truck?.state === 'REQUEST_FOR_QUOTE' || this.truck?.state === 'QUOTE_SENT_TO_CLIENT' || this.truck?.state === 'COMPLETE');
  }

  postToMacropointBoard(truck: any, updateOrder = false) {
    this.spinner.show('createLoadTrackSpinner').then();
    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: (updateOrder ? 'Load updated in Macropoint' : 'Load posted in Macropoint'),
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;

    if (!updateOrder) {
      this.ms.postLoad(truck).subscribe({
        next: response => {
          if (response) {
            const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
            this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Macropoint Post Order', response.message, 'success').then(() => {
              location.reload();
            });
          }
        },
        error: error => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Macropoint Post Order', '<i>' + error + '</i>', 'warning').then();
        }
      });
    } else {
      this.ms.updateLoad(truck).subscribe({
        next: response => {
          if (response) {
            const shipId = truck?.shipments ? truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0
            this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Macropoint Update Order', response.message, 'success').then(() => {
              location.reload();
            });
          }
        }, error: error => {
          this.spinner.hide('createLoadTrackSpinner').then();
          Swal.fire('Macropoint Update Order', '<i>' + error + '</i>', 'warning').then();
        }
      });
    }
  }

  deleteFromMacropointBoard() {
    Swal.fire({
      title: 'Delete Load',
      html: 'Are you sure you want to delete load ' + this.truck?.truckID + ' from the Macropoint board?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('createLoadTrackSpinner').then();
        this.ms.cancelLoad(this.truck?.truckID).subscribe({
          next: response => {
            if (response) {
              const todayDate: Date = new Date();
              todayDate.setSeconds(0);
              const note: Note = {
                notText: 'Load removed on Macropoint board',
                notCognitoUsername: this.userName,
                notTimeStamp: todayDate
              } as Note;
              const shipId = this.truck?.shipments ? this.truck?.shipments?.[(this.truck?.shipments?.length ?? 0) - 1]?.shipmentDetail?.shipmentID : 0;
              this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
              this.spinner.hide('createLoadTrackSpinner').then();
              Swal.fire('Delete Load', 'Load removed on Macropoint board', 'success').then(() => {
                location.reload();
              });
            }
          },
          error: error => {
            this.spinner.hide('createLoadTrackSpinner').then();
            Swal.fire('Delete Load', '<i>' + error + '</i>', 'warning').then();
          }
        });
      } else {
        return;
      }
    });
  }

  onClickPostMacropointBoard() {
    let truckObj = this.truck;
    truckObj = this.convertToProcess(truckObj);
    this.postToMacropointBoard(truckObj, !(this.truck?.mpOrderId == null || this.truck?.mpOrderId === ''));
  }

  addLinearFootUpdatedNote(truckObj: any, prevLF: string, value: string) {
    const todayDate: Date = new Date();
    todayDate.setSeconds(0);
    const note: Note = {
      notText: 'Linear foot updated from ' + prevLF + ' to ' + parseInt(value, 10).toString(),
      notCognitoUsername: this.userName,
      notTimeStamp: todayDate
    } as Note;
    const shipId = truckObj.shipments ? truckObj.shipments?.[truckObj.shipments.length - 1].shipmentDetail.shipmentID : 0
    this.rs.addNote(parseInt(shipId, 10), false, note).subscribe();
  }

  displayTrackingMap() {
    // Define window features
    const windowFeatures = 'toolbar=1,scrollbars=1,location=1,statusbar=1,menubar=1,resizable=1,width=760,height=550,left=10,top=10';
    // Open a new window and store the reference in an object or map
    if (this.truck?.mapUrl != null) window.open(this.truck?.mapUrl ?? '', '_blank', windowFeatures);
  }

  showDocumentSource(docUrl: string) {
    if (docUrl.toUpperCase().includes('TRUCKERTOOLS')) {
      return ' [Trucker Tools]';
    }
    if (docUrl.toUpperCase().includes('MACROPOINT')) {
      return ' [Macropoint]';
    }
    return ' [External Source]';
  }

  getTruckInfoCardDetails(type = 'client', index: any = null) {
    let infoCard = '';
    if (index == null) {
      index = this.truck?.shipments ? (this.truck?.shipments?.length ?? 0) - 1 : null;
    }

    if (this.truck?.shipments) {
      if (type === 'client') {
        infoCard = this.truck?.shipments?.[0]?.client?.clientCode ? '(' + this.truck?.shipments?.[0]?.client?.clientCode + ')' : '';
        infoCard = (this.truck?.tlQuotes ? this.selectedCarrier : '') + infoCard;
      }

      if (type === 'createdOn') {
        infoCard = this.truck?.shipments?.[0]?.shipmentDetail?.createdOn ?? '';
      }

      if (index == null) return '';

      if (type === 'shipperName') {
        infoCard = this.truck?.shipments?.[index].shipper?.name?.toUpperCase() ?? '';
      }

      if (type === 'shipperAddress') {
        infoCard = this.truck?.shipments?.[index].shipper?.streetAddress?.toUpperCase() ?? '';
      }

      if (type === 'shipperAddress2') {
        infoCard = this.truck?.shipments?.[index].shipper?.address2?.toUpperCase() ?? '';
      }

      if (type === 'shipperPhone') {
        infoCard = this.truck?.shipments?.[index].shipper?.phone ?? '';
      }

      if (type === 'shipperCity') {
        infoCard = this.truck?.shipments?.[index].shipper?.city?.toUpperCase() ?? '';
        if (infoCard !== '') infoCard = infoCard + ', ';
      }

      if (type === 'shipperState') {
        infoCard = this.truck?.shipments?.[index].shipper?.state ?? '';
        if (infoCard !== '') infoCard = infoCard + ' ';
      }

      if (type === 'shipperZip') {
        infoCard = this.truck?.shipments?.[index].shipper?.zip ?? '';
      }

      if (type === 'consigneeName') {
        infoCard = this.truck?.shipments?.[index].consignee?.name?.toUpperCase() ?? '';
      }

      if (type === 'consigneeAddress') {
        infoCard = this.truck?.shipments?.[index].consignee?.streetAddress?.toUpperCase() ?? '';
      }

      if (type === 'consigneeAddress2') {
        infoCard = this.truck?.shipments?.[index].consignee?.address2?.toUpperCase() ?? '';
      }

      if (type === 'consigneePhone') {
        infoCard = this.truck?.shipments?.[index].consignee?.phone ?? '';
      }

      if (type === 'consigneeCity') {
        infoCard = this.truck?.shipments?.[index].consignee?.city?.toUpperCase() ?? '';
        if (infoCard !== '') infoCard = infoCard + ', ';
      }

      if (type === 'consigneeState') {
        infoCard = this.truck?.shipments?.[index].consignee?.state ?? '';
        if (infoCard !== '') infoCard = infoCard + ' ';
      }

      if (type === 'consigneeZip') {
        infoCard = this.truck?.shipments?.[index].consignee?.zip ?? '';
      }

      if (type === 'consigneeEmail') {
        infoCard = this.truck?.shipments?.[index].consignee?.email?.toLowerCase() ?? '';
      }
    }

    return infoCard;
  }
}

