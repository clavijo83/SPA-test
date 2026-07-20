import {Component, OnDestroy, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxSpinnerService} from 'ngx-spinner';
import {ReportsService} from '../../services/reports/reports.service';
import {ShipmentHistory} from '../../interfaces/shipment-history';
import {formatDate} from '@angular/common';
import {Constants} from '../../constants/constants';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AvailableStatus} from '../../interfaces/available-status';
import moment from 'moment';
import {DataTable} from '../data-table/data-table';
import {NoteFormGrid} from '../note-form-grid/note-form-grid';
import {ShipmentInfoCards} from '../shipment-info-cards/shipment-info-cards';
import {fromEvent, interval, Observable, Subscription} from 'rxjs';
import {TrackingService} from '../../services/tracking/tracking.service';
import {ShipmentDetails} from '../../interfaces/shipment-details';
import {EmailModal} from '../email-modal/email-modal';
import {Global} from '../../common/global';
import {Customization} from '../../interfaces/customization';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {ShipmentSaveService} from '../../services/shipment-save/shipment-save.service';
import {Note} from '../../interfaces/note';
import Swal from 'sweetalert2';
import {GroupsService} from '../../services/groups/groups.service';
import {TruckSaveService} from '../../services/truck-save/truck-save.service';
import {TruckSave} from '../../interfaces/truck-save';
import {ShipmentSave} from '../../interfaces/shipment-save';
import {EmailService} from '../../services/email/email.service';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-tracking-details',
  standalone: false,
  templateUrl: './tracking-details.html',
  styleUrl: './tracking-details.css',
})
export class TrackingDetails implements OnInit, OnDestroy {
  @ViewChild(NoteFormGrid) notes!: NoteFormGrid;
  @ViewChild(DataTable) dt!: DataTable;
  @ViewChild(ShipmentInfoCards) sic!: ShipmentInfoCards;
  @ViewChild(EmailModal) email!: EmailModal;
  currentState = true;
  showCloneFeature = false;
  showEdit = signal(true);
  shipmentID = signal<any>(null);
  states: string[] = [];
  currentStatus = signal<string>('');
  clientCode = signal('');
  shipmentHistory = signal<ShipmentHistory | null>(null);
  updateCosts = false;
  shipmentHistoryCreatedByEmail = signal<string>('');
  shipmentHistoryCreatedOn = signal<any>(null);
  showTrackingDetailsInfo = signal(true);
  shipmentDetail: WritableSignal<ShipmentDetails | null> = signal(null);
  headerExpanded = false;
  bookingExpanded = false;
  historyItem!: FormGroup;
  submitted = false;
  selectedState = '';
  showSavedToolTip = signal(false);
  selectedStatus = '';
  isInternalUser = false;
  isRequired = false;
  isTimeRequired = false;
  groupID: any;
  availableStatuses: AvailableStatus[] = [];
  statusDropdown: string[] = [];
  histTableColumns: any;
  histTableColumnsNoHeader: any;
  sortOrder: any;
  global = Global;
  poMoniker = signal('PO #');
  lastClientNote = signal('-');
  shipmentPriority = signal('');
  isInternalGroupMgmt = signal(false);
  hidePriceDetails = signal(true);
  whiteGlove = signal<any>(null);
  lastEventStatus: any = null;
  idShipmentsCopied: string[] | null = null;
  originalShipment: ShipmentSave | null = null;
  Toast = Swal.mixin({
    toast: true,
    position: 'center',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  private load = 0;
  private totalServiceCalls = 0; // If adding a new service call, increment this by 1
  private currentDate = new Date();
  private keyObservable$: Observable<Event> | null = null;
  private keySubscription$: Subscription | null = null;
  private userName = '';
  private subscription: Subscription | null = null;
  private isNoteTextAreaFocused = false;
  enableTrackingEmails = false;

  constructor(private gs: GroupsService, private fb: FormBuilder, private route: ActivatedRoute,
              private spinner: NgxSpinnerService, private sss: ShipmentSaveService, private emailService: EmailService,
              private router: Router, private rs: ReportsService, private ts: TrackingService,
              private igs: InternalGroupService, private tss: TruckSaveService, private authenticator: AuthenticatorService) {
    this.shipmentID.set(this.route.snapshot.paramMap.get('shipmentID'));
    this.groupID = this.route.snapshot.paramMap.get('groupID');
    this.gs.isValidPermission().then(data => {
      this.isInternalGroupMgmt.set(data);
    });
  }

  ngOnInit(): void {
    this.global.recordStatus.set('');

    this.gs.isValidPermission().then(data => {
      this.isInternalUser = data;
    });

    this.spinner.show('trackingDetails');
    this.tableColumns();
    this.states = Constants.STATE_DROPDOWN;

    this.historyItem = this.fb.group({
      proNumber: this.fb.control(''),
      pickupNumber: this.fb.control(''),
      date: this.fb.control(formatDate(this.currentDate, 'yyyy-MM-dd', 'en', '')),
      time: this.fb.control(''),
      city: this.fb.control(''),
      state: this.fb.control(''),
      status: this.fb.control(''),
      info: this.fb.control(''),
      actualShipDate: this.fb.control(''),
      actualDeliveryDate: '',
      mabdDate: ''
    });

    this.getAvailableStatuses();
    // Initializes
    this.resetHistoryTrackingControls();
    // Key Subscription
    this.keyObservable$ = fromEvent(document, 'keydown');
    this.keySubscription$ = this.keyObservable$.subscribe(key => {
      this.keyEvent(key);
    });
    this.getUserName();
    if (this.groupID && this.groupID.toString() !== 'undefined') { this.getGroupCustomizations(this.groupID); }

    // hide details buy section
    $('.hideDetailsBuy').hide();
    this.getShipmentDetail();
  }

  // details buy price
  showHideDetailsBuy() {
    this.hidePriceDetails.set(!this.hidePriceDetails);
    if ($('.hideDetailsBuy').is(':visible')) {
      $('.hideDetailsBuy').hide();
    } else {
      $('.hideDetailsBuy').show();
    }
  }

  saveUpdatedCosts() {
    let updateText = '';
    this.updateCosts = false;
    if (this.sic.originalCosts.ilCost != this.shipmentHistory()?.shipmentDetail?.ilCost) {
      this.updateCosts = true;
      updateText += 'Updated ILCost value from (' + (this.sic.originalCosts.ilCost ? this.sic.originalCosts.ilCost : '') + ' ' +
        this.shipmentHistory()?.client?.cutAbbreviation + ') to (' + this.shipmentHistory()?.shipmentDetail?.ilCost + ' ' +
        this.shipmentHistory()?.client?.cutAbbreviation + '). \n';
    }
    if (this.sic.originalCosts.clientCost != this.shipmentHistory()?.shipmentDetail?.clientCost) {
      this.updateCosts = true;
      updateText += 'Updated Client Cost value from (' + (this.sic.originalCosts.clientCost ? this.sic.originalCosts.clientCost : '') +
        ' ' + this.shipmentHistory()?.client?.cutAbbreviation + ') to (' + this.shipmentHistory()?.shipmentDetail?.clientCost + ' ' +
        this.shipmentHistory()?.client?.cutAbbreviation + '). \n';
    }
    if (this.sic.originalCosts.customerCost != this.shipmentHistory()?.shipmentDetail?.customerCost) {
      this.updateCosts = true;
      updateText += 'Updated Customer Cost value from (' + (this.sic.originalCosts.customerCost ? this.sic.originalCosts.customerCost : '')
        + ' ' + this.shipmentHistory()?.client?.cutAbbreviation + ') to (' + this.shipmentHistory()?.shipmentDetail?.customerCost + ' ' +
        this.shipmentHistory()?.client?.cutAbbreviation + '). \n';
    }
    if (this.updateCosts) {
      const note: Note = {
        notText: updateText,
        notCognitoUsername: this.userName,
        notID: null,
        notTimeStamp: null,
        clientNote: false,
        isNeedsManagement: false
      };
      const costs = {
        ilCost: this.shipmentHistory()?.shipmentDetail?.ilCost ? this.shipmentHistory()?.shipmentDetail?.ilCost.toString() : null,
        clientCost: this.shipmentHistory()?.shipmentDetail?.clientCost ? this.shipmentHistory()?.shipmentDetail?.clientCost.toString() : null,
        customerCost: this.shipmentHistory()?.shipmentDetail?.customerCost ? this.shipmentHistory()?.shipmentDetail?.customerCost.toString() : null
      };
      this.sss.updateShipmentCosts(this.shipmentID(), costs).subscribe({
        next: () => {
          if (updateText !== '') {
            this.rs.addNote(this.shipmentID(), false, note).subscribe();
          }
        }
      });
    }
  }

  // show/hide clone feature when clicked
  onShowCloneFeature() {
    if (!this.showCloneFeature) {
      // show clone feature
      this.showCloneFeature = true;
      // hide tracking details
      this.showTrackingDetailsInfo.set(false);
    } else if (this.showCloneFeature) {
      // hide clone feature
      this.showCloneFeature = false;
      // show tracking details
      this.showTrackingDetailsInfo.set(true);
    }
  }

  statusEmailBody() {
    return '\n' + '______________________________________________________________________________________________________________' + '\n' +
      'Shipment ID: ' + (this.clientCode() ? this.clientCode() + '-' : '') + (this.shipmentID() ?? '') + '\n' +
      'BOL#: ' + (this.shipmentHistory()?.shipmentDetail?.bolNumber ? this.shipmentHistory()?.shipmentDetail?.bolNumber : '') + '\n' +
      'Ship Date: ' + (this.isDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate ?? '', 'MM/dd/yyyy', 'en', '') : '') + '\n' +
      'Origin: ' + (this.shipmentHistory()?.shipper?.city && this.shipmentHistory()?.shipper?.state ?
        this.shipmentHistory()?.shipper?.city.toUpperCase() + ', ' + this.shipmentHistory()?.shipper?.state + ' ' : '') + '\n' +
      'Destination: ' + (this.shipmentHistory()?.consignee?.city &&
      this.shipmentHistory()?.consignee?.state ? this.shipmentHistory()?.consignee?.city.toUpperCase() + ', ' +
        this.shipmentHistory()?.consignee?.state.toUpperCase() + ' ' : '') + '\n\n' +
      'If you have additional questions or requests please contact your Logistics Planner directly at ' +
      (this.shipmentHistory()?.client?.lpTeamEmail ?? 'redteam@il2000.com') + '\n' +
      'or 1-877-373-4525.'; // default into redteam@il2000.com
  }

  getShipmentDetail() {
    let sd = {} as ShipmentDetails;
    this.shipmentDetail.set(sd);
    this.rs.getShipmentHistory(this.shipmentID()).subscribe({
      next: response => {
        this.originalShipment = response;
        this.shipmentDetail.set(response.shipmentDetail);
        if (response?.shipmentDetail?.truckID != null && response?.shipmentDetail?.truckID != '' && response?.shipmentDetail?.truckID > 0) {
          this.router.navigate(['/SPAs/tracking/truckload-details/' + response.shipmentDetail.truckID + '/' + response.client?.groupID]);
        }
        if (this.groupID && this.groupID.toString() === 'undefined') {
          this.groupID = response.client?.groupID;
          this.getGroupCustomizations(this.groupID);
        }
        this.whiteGlove.set(this.shipmentDetail()?.whiteGlove === '1' ? response.whiteGlove : null);
      }
    });
  }

  determineExceptions() {
    this.sic.needPickupException = false;
    this.sic.needDeliveryException = false;
    // formatting dates
    let enteredShipDate = this.sic.shippingInfoGroup.get('enteredShipDate')?.value;
    if (this.sic.shippingInfoGroup.get('enteredShipDate')?.value) { enteredShipDate = enteredShipDate + 'T00:00:00'; }
    let actualShipDate = this.sic.shippingInfoGroup.get('actualShipDate')?.value;
    if (this.sic.shippingInfoGroup.get('actualShipDate')?.value) { actualShipDate = actualShipDate + 'T00:00:00'; }
    let scheduledDeliveryDate = this.sic.shippingInfoGroup.get('scheduledDeliveryDate')?.value;
    if (this.sic.shippingInfoGroup.get('scheduledDeliveryDate')?.value) { scheduledDeliveryDate = scheduledDeliveryDate + 'T00:00:00'; }
    let actualDeliveryDate = this.sic.shippingInfoGroup.get('actualDeliveryDate')?.value;
    if (this.sic.shippingInfoGroup.get('actualDeliveryDate')?.value) { actualDeliveryDate = actualDeliveryDate + 'T00:00:00'; }
    // validating dates
    if (new Date(enteredShipDate).toString() !== new Date(this.shipmentDetail()?.enteredShipDate ?? '').toString()) {
      this.sic.needPickupException = true;
    }
    if (new Date(enteredShipDate) > new Date(this.shipmentDetail()?.originalShipDate ?? '') &&
      this.shipmentDetail()?.originalShipDate) { this.sic.needPickupException = true; }
    if (new Date(actualShipDate) > new Date(this.shipmentDetail()?.originalShipDate ?? '') &&
      this.shipmentDetail()?.originalShipDate) { this.sic.needPickupException = true; }
    if (new Date(actualShipDate) > new Date(enteredShipDate)) { this.sic.needPickupException = true; }
    if (new Date(scheduledDeliveryDate).toString() !== new Date(this.shipmentDetail()?.scheduledDeliveryDate ?? '').toString() &&
      this.sic.shippingInfoGroup.get('scheduledDeliveryDate')?.value) { this.sic.needDeliveryException = true; }
    if (new Date(scheduledDeliveryDate) > new Date(this.shipmentDetail()?.originalDeliveryDate ?? '') &&
      this.shipmentDetail()?.originalDeliveryDate) { this.sic.needDeliveryException = true; }
    if (new Date(actualDeliveryDate) > new Date(this.shipmentDetail()?.originalDeliveryDate ?? '') &&
      this.shipmentDetail()?.originalDeliveryDate) { this.sic.needDeliveryException = true; }
    if (new Date(actualDeliveryDate) > new Date(scheduledDeliveryDate)) { this.sic.needDeliveryException = true; }
    // validating delivery dates vs MABD
    if (this.shipmentDetail()?.mabdDate) {
      if (new Date(scheduledDeliveryDate) > new Date(this.shipmentDetail()?.mabdDate ?? '') ||
        new Date(actualDeliveryDate) > new Date(this.shipmentDetail()?.mabdDate ?? '')) {
        this.sic.needDeliveryException = true;
      }
    }
  }

  onSaveClick(): any {
    this.determineExceptions();

    if ((this.sic.needPickupException && (this.sic.shippingInfoGroup.get('pickupException')?.value == null ||
        this.sic.shippingInfoGroup.get('pickupException')?.value == '')) ||
      (this.sic.needDeliveryException && (this.sic.shippingInfoGroup.get('deliveryException')?.value == null ||
        this.sic.shippingInfoGroup.get('deliveryException')?.value == ''))) {
      if (this.sic.shippingInfoGroup.get('pickupException')?.value) { this.sic.needPickupException = false; }
      if (this.sic.shippingInfoGroup.get('deliveryException')?.value) { this.sic.needDeliveryException = false; }
      this.sic.showExceptionModal();
      return true;
    }

    if (!this.sic.validatingTrackingContacts()) { return false; }

    this.gs.isValidPermission().then(data => {
      if (data) {
        this.spinner.show('savingTrackingDetails').then();

        let fn = () => {
          this.savedClicked();
          this.addShipmentHistory();
          this.saveUpdatedCosts();
          this.sic.createChangeNote();
        };

        this.sic.updateShipmentDetails(null, fn);

        setTimeout(() => {
          this.spinner.hide('savingTrackingDetails').then();
          Swal.fire({
            icon: 'success', title: '', html: 'Shipment successfully updated', timer: 2000,
            timerProgressBar: true
          }).then(() => {
            this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
              this.router.navigate(['SPAs/tracking/tracking-details/' + this.shipmentID() + '/' + this.groupID]);
            });
          });
        }, 2000);
      }
    });

    this.isRequired = false;
    this.sic.needPickupException = false;
    this.sic.needDeliveryException = false;
    this.clearValidators();
  }

  onCancelClick() {
    this.showEdit.set(true);
    this.showSavedToolTip.set(false);
    // RESET HISTORY TRACKING DATA
    this.resetHistoryTrackingControls();
    this.sic.setShippingControls();
    this.selectedState = '';
    // RESET VALIDATORS
    this.clearValidators();
    this.isRequired = false;
    this.isTimeRequired = false;
  }

  resetHistoryTrackingControls(edit = false) {
    if ($('#trackingDetailsForm').hasClass('was-validated')) {
      $('#trackingDetailsForm').removeClass('was-validated');
    }

    const historyItemObj = {
      date: formatDate(this.currentDate, 'yyyy-MM-dd', 'en', ''),
      time: '',
      city: '',
      state: '',
      status: '',
      info: ''
    };
    this.historyItem.reset(historyItemObj);
    if (edit && this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'PARCEL_SHIPPED') {
      this.historyItem.get('status')?.setValue('PARCEL_SHIPPED');
    }
  }

  getShipmentHist(event: any) {
    this.shipmentHistory.set(event);
    this.shipmentDetail.set(this.shipmentHistory()?.shipmentDetail ?? null);
    this.clientCode.set(this.shipmentHistory()?.client?.clientCode ?? '');
    if (this.shipmentHistory()) {
      // set header created by email
      this.shipmentHistoryCreatedByEmail.set(this.shipmentHistory()?.user?.email ?? '');

      // convert date to javascript date and local time
      const createdOn = new Date(this.shipmentHistory()?.shipmentDetail?.createdOn ?? '');
      const newDate = new Date(createdOn + '' + 'UTC');
      this.shipmentHistoryCreatedOn.set(moment(newDate, 'MM/DD/YYYY hh:mm A').format('MM/DD/YYYY, hh:mm A'));
      this.spinner.hide('trackingDetails');

      // get the most recent historical event's tracking state and set as status header
      const curStatus = this.shipmentHistory()?.shipmentDetail?.shipmentStatus ?? (this.shipmentHistory()?.historicalEvents?.[0].trackingState ?? '');
      this.currentStatus.set(curStatus);
      if (this.shipmentHistory()?.historicalEvents && (this.shipmentHistory()?.historicalEvents?.length ?? 0) > 0) {
        this.historyItem.get('status')?.setValue(this.shipmentHistory()?.historicalEvents?.[0].trackingState);
      }
    }
  }

  getAvailableStatuses() {
    this.rs.getAvailableStatuses().subscribe({
      next: response => {
        let statusString: string[] = [];
        this.availableStatuses = response;
        this.sortAndFilter(this.availableStatuses);
        this.availableStatuses.forEach(status => {
          statusString.push(status.status);
        });
        this.sortAndFilter(statusString).forEach((v: any) => {
          if (!v.includes('EXCEPTION')) {
            this.statusDropdown.push(v);
          }
        });
      },
      error: () => {
        this.load++;
        if (this.load === this.totalServiceCalls) {
          this.spinner.hide('trackingDetails');
        }
      }
    });
  }

  onEditClick() {
    this.resetHistoryTrackingControls(true);
    this.sic.setShippingControls();
    this.showEdit.set(false);
  }

  headerClicked(sectionId: string) {
    let hideIcon = '';
    let showIcon = ''
    if (sectionId === '#bookingDetails') {
      hideIcon = '#bookingExpandLess';
      showIcon = '#bookingExpandMore'
    } else {
      hideIcon = '#historyExpandLess';
      showIcon = '#historyExpandMore';
    }
    if ($(hideIcon).is(":visible")) {
      $(hideIcon).hide();
      $(showIcon).show();
    } else {
      $(hideIcon).show();
      $(showIcon).hide();
    }
  }

  onBtnEditShipmentClick() {
    this.router.navigateByUrl('SPAs/new/' + this.shipmentID() + '/' + this.groupID).then();
  }

  getUserName() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  addShipmentHistory() {
    const historicalEvent = {
      eventDate: this.historyItem.get('date')?.value,
      eventTime: this.historyItem.get('time')?.value,
      trackingState: this.historyItem.get('status')?.value,
      trackingMessage: this.historyItem.get('info')?.value ? this.historyItem.get('info')?.value : this.historyItem.get('status')?.value,
      currentCity: this.historyItem.get('city')?.value,
      currentState: this.historyItem.get('state')?.value,
      apiUpdate: false,
      enteredBy: this.userName
    };

    if ((this.historyItem.get('status')?.value !== '' && this.historyItem.get('status')?.value !== 'PARCEL_SHIPPED') ||
      (this.historyItem.get('status')?.value == 'PARCEL_SHIPPED' && (this.historyItem.get('city')?.value !== '' ||
        this.historyItem.get('state')?.value !== '' || this.historyItem.get('info')?.value !== ''))) {
      // Adds new array element to beginning of array
      this.shipmentHistory()?.historicalEvents?.unshift({
        carrierScac: null,
        proNumber: null,
        bolNumber: null,
        poNumber: null,
        pickupNumber: null,
        eventDate: historicalEvent.eventDate,
        eventTime: historicalEvent.eventTime,
        trackingState: historicalEvent.trackingState,
        trackingMessage: historicalEvent.trackingMessage,
        currentLocation: historicalEvent.currentCity && historicalEvent.currentState ? historicalEvent.currentCity + ',' +
          historicalEvent.currentState : (historicalEvent.currentCity != '' && historicalEvent.currentState === '' ?
          historicalEvent.currentCity : (historicalEvent.currentCity === '' && historicalEvent.currentState != '' ?
            historicalEvent.currentState : '')),
        destinationETA: null,
        apiUpdate: false,
        enteredBy: this.userName,
        entryTimeStamp: null
      });

      // Adds new historical event to database
      this.rs.addShipmentHistory(this.shipmentID(), historicalEvent).subscribe({
        next: () => {
          this.sendStatusNotificationMail(historicalEvent);
          this.notes.addNoteService(this.shipmentID(), false, false, 'Status updated to : ' + historicalEvent.trackingState);
          this.dt.rerender();
        }
      });
    }
  }

  // Method to handle status change
  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedStatus = selectElement.value;
  }

  confirmCreateAsTruckload() {
    this.spinner.show('trackingDetailsSpinner').then();
    let truck: TruckSave = {
      truckID: null,
      loadPosted: false,
      loadBoardID: null,
      pickupExceptionFK: null,
      deliveryExceptionFK: null,
      equipmentType: null,
      shipDate: new Date(this.shipmentHistory()?.shipmentDetail?.originalShipDate ?? ''),
      nickName: '',
      carrierName: null,
      carrierAddress: null,
      carrierPhone: null,
      carrierQuote: null,
      state: this.selectedStatus,
      carrierEmail: null,
      proLoadNumber: '',
      licensePlateNo: '',
      isCompanyTruck: 0,
      lasttouch: null,
      carrierId: null,
      driverPhone: '',
      quoteDueBy: null,
      lastUpdated: null,
      mapUrl: null,
      shipments: [],
      tlQuotes: [],
      mileage: 0,
      truckFees: [],
      linearFoot: 0,
      isProblem: false,
      trailerNumber: null,
      extTruckNumber: null,
      mpOrderId: null,
      tractorNumber: null
    };

    this.tss.saveTruck(truck).subscribe({
      next: response => {
        $('#createAsTruckModal').modal('hide');
        truck.truckID = response.truckID;
        this.tss.addShipmentToTruck(truck, this.shipmentHistory()?.shipmentDetail?.shipmentID, '0').subscribe({
          next: () => {
            this.router.navigate(['SPAs/new/truckload/' + truck.truckID + '/' + this.groupID]).then(() => {
              this.spinner.hide('trackingDetailsSpinner').then();
            });
          },
          error: () => {
            this.spinner.hide('trackingDetailsSpinner').then();
          }
        });
      },
      error: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      }
    });
  }

  onBtnCreateAsTruckload() {
    document.getElementById('createAsTruckModalButton')?.click();
  }

  setSubmit() {
    this.submitted = true;
    if (this.historyItem.valid) {
      this.onSaveClick();
    } else {
      $('#trackingDetailsForm').addClass('was-validated');
    }
  }

  tableColumns() {
    // set column sort order [index,order]
    this.sortOrder = [[0, 'desc'], [5, 'desc']];

    this.histTableColumns = [
      {
        title: 'Date',
        data: 'eventDate',
        type: 'date',
        width: '20%',
        render(data: any, type: any, row: any) {
          let date = new Date(data);
          date.setDate(date.getDate() + 1);
          let time = row.eventTime;
          let formatDate = moment(date, 'MM/DD/YYYY').format('MM/DD/YYYY');
          if (row.apiUpdate) {
            return moment.utc(formatDate + ' ' + time).local().format('MM/DD/YYYY hh:mm A');
          } else {
            // return moment(formatDate + ' ' + time, 'MM/DD/YYYY hh:mm A').format('MM/DD/YYYY hh:mm A');
            return moment(data + ' ' + time, 'YYYY-MM-DD hh:mm A').format('MM/DD/YYYY hh:mm A');
          }
        },
        orderable: true
      },
      {
        title: 'Status',
        data: 'trackingState',
        orderable: false
      },
      {
        title: 'Location',
        data: 'currentLocation',
        orderable: false
      },
      {
        title: 'Status Info',
        data: 'trackingMessage',
        orderable: false
      },
      {
        title: `<i class="material-icons" style="font-size: 14px" data-bs-toggle="tooltip" title="Tracking Status Icon">info</i>`,
        data: 'apiUpdate',
        orderable: false,
        render(data: any, type: any, row: any) {
          if (data == 'INITIALIZED' || data == 'YES') {
            if (row.Priority === 'ELEVATED') {
              return '<span hidden>0</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">arrow_upward</i>' + '</span>';
            }
            if (row.Priority === 'EXPEDITED') {
              return '<span hidden>0</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:#6f42c1; font-size:9px">directions_run</i>' + '</span>';
            } else {
              return '<span hidden>3</span><span tabindex="0">' +
                '<i class="material-icons m-1" style="color:green; font-size:8px">fiber_manual_record</i> ' + '</span>';
            }
          } else {
            return '<span hidden>1</span><span tabindex="0">' +
              '<i class="material-icons m-1" style="color:red; font-size:8px">clear</i>' + '</span>';
          }
        }
      },
      {
        title: 'Entered At',
        data: 'entryTimeStamp',
        orderable: true,
        render(data: any) {
          let date = new Date(data);
          let formatDate = moment(date, 'MM/DD/YYYY HH:mm:ss').format('MM/DD/YYYY HH:mm:ss');
          return moment.utc(formatDate).local().format('MM/DD/YYYY hh:mm:ss A');
        },
      }
    ];

    this.histTableColumnsNoHeader = [
      {
        title: '',
        data: 'eventDate',
        width: '32.5%',
        render(data: any, type: any, row: any) {
          let date = new Date(data);
          date.setDate(date.getDate() + 1);
          let time = row.eventTime;
          let formatDate = moment(date, 'MM/DD/YYYY').format('MM/DD/YYYY');
          if (row.apiUpdate) {
            return moment.utc(formatDate + ' ' + time).local().format('MM/DD/YYYY hh:mm A');
          } else {
            return moment(formatDate + ' ' + time, 'MM/DD/YYYY hh:mm A').format('MM/DD/YYYY hh:mm A');
          }
        },
        orderable: false
      },
      {
        title: '',
        data: null,
        defaultContent: '',
        orderable: false
      },
      {
        title: '',
        data: 'trackingState',
        width: '18%',
        orderable: false
      },
      {
        title: '',
        data: 'currentLocation',
        width: '25%',
        orderable: false
      },
      {
        title: '',
        data: 'trackingMessage',
        orderable: false
      },
      {
        title: '',
        data: 'entryTimeStamp',
        orderable: false,
        visible: false
      }
    ];
  }

  setState(event: any) {
    this.historyItem.get('state')?.setValue(event);
  }

  setStatus() {
    const event = (document.getElementById('status') as HTMLInputElement).value;
    this.historyItem.get('status')?.setValue(event);

    if (this.shipmentDetail()?.shipmentStatus == 'PARCEL_SHIPPED' && event !== 'PARCEL_SHIPPED') {
      this.historyItem.get('status')?.setValue('PARCEL_SHIPPED');
    }

    if (event == 'DELIVERED' || event == 'APPOINTMENT_SET' || event == 'AT_DELIVERY' || event == 'OUT_FOR_DELIVERY') {
      this.historyItem.get('city')?.setValue(this.shipmentHistory()?.consignee?.city);
      this.historyItem.get('state')?.setValue(this.shipmentHistory()?.consignee?.state);
      this.selectedState = this.shipmentHistory()?.consignee?.state ?? '';
    } else if (event == 'AT_PICKUP' || event == 'AWAITING_PICKUP' || event == 'PICKED_UP') {
      this.historyItem.get('city')?.setValue(this.shipmentHistory()?.shipper?.city);
      this.historyItem.get('state')?.setValue(this.shipmentHistory()?.shipper?.state);
      this.selectedState = this.shipmentHistory()?.shipper?.state ?? '';
    }

    // set or remove problem flag
    if (this.shipmentDetail()?.shipmentStatus == 'PROBLEM' && event !== 'PROBLEM') {
      this.sic.shippingInfoGroup.get('problem')?.setValue(false);
    } else if (event == 'PROBLEM') {
      this.sic.shippingInfoGroup.get('problem')?.setValue(true);
    } else {
      if (this.shipmentDetail()?.shipmentStatus !== 'PROBLEM' && event !== 'PROBLEM' && this.lastEventStatus == 'PROBLEM') {
        this.sic.shippingInfoGroup.get('problem')?.setValue(false);
      }
    }

    // ADD TIME VALIDATOR
    this.historyItem.get('time')?.setValidators([Validators.required]);
    this.isTimeRequired = true;
    $('#trackingDetailsForm').addClass('was-validated');
    this.lastEventStatus = event;
  }

  sortAndFilter(data: any) {
    return data.sort().filter((x: any, i: any, a: any) => !i || x != a[i - 1]);
  }

  keyEvent(event: any) {
    if (event.key === 'Enter' && !this.showEdit()) {
      this.setSubmit();
    }
    if (event.key === 'Escape' && !this.showEdit()) {
      this.onCancelClick();
    }
    if (event.key === 'e' && this.showEdit() && !this.isNoteTextAreaFocused) {
      this.onEditClick();
    }
  }

  getPurchaseOrderTotals(item: string) {
    const totals = this.shipmentHistory()?.lineItems ?? [];
    let total = 0;

    for (const i in totals) {
      switch (item) {
        case 'hu': {
          total += totals[i].handlingUnits ?? 0;
          break;
        }
        case 'pieces': {
          total += totals[i].pieces ?? 0;
          break;
        }
        case 'weight': {
          if (totals[i].totalWeight) {
            total += totals[i].totalWeight;
          } else {
            total += totals[i].unitWeight ?? 0;
          }
          break;
        }
      }
    }
    return total;
  }

  ngOnDestroy(): void {
    // Unsubscribe to key subscription
    this.keySubscription$?.unsubscribe();
  }

  savedClicked() {
    this.ts.updateLastUpdated(this.shipmentID()).subscribe();
    this.showSavedToolTip.set(true);
    const source = interval(500);
    this.subscription = source.subscribe(() => {
        this.showSavedToolTip.set(false);
        this.showEdit.set(true);
        this.subscription!.unsubscribe();
      }
    );
  }

  noteTextAreaFocused(event: any) {
    this.isNoteTextAreaFocused = event;
  }

  deliveryDateChangeCheck(event: any) {
    if (event) {
      this.addValidators();
      this.isRequired = true;
      // USED TO SET TIME INPUT TO REQUIRED - ADDITIONAL CONDITIONAL LOGIC FOR TIME
      this.isTimeRequired = true;
      $('#trackingDetailsForm').addClass('was-validated');
    }
  }

  mabdDateChangeCheck(event: any) {
    if (event) {
      this.addValidators();
      this.isRequired = true;
      // USED TO SET TIME INPUT TO REQUIRED - ADDITIONAL CONDITIONAL LOGIC FOR TIME
      this.isTimeRequired = true;
      $('#trackingDetailsForm').addClass('was-validated');
    }
  }

  addValidators() {
    this.historyItem.get('date')?.setValidators([Validators.required]);
    this.historyItem.get('time')?.setValidators([Validators.required]);
    this.historyItem.get('date')?.updateValueAndValidity();
    this.historyItem.get('time')?.updateValueAndValidity();
  }

  clearValidators() {
    this.historyItem.get('date')?.clearValidators();
    this.historyItem.get('time')?.clearValidators();
    this.historyItem.get('date')?.updateValueAndValidity();
    this.historyItem.get('time')?.updateValueAndValidity();
  }

  getGroupCustomizations(groupID: number) {
    this.igs.getGroupCustomizations(groupID).subscribe({
      next: response => {
        for (const customization of response as Customization[]) {
          if (customization.customizationID === 10) { this.poMoniker.set(customization.stringValue); }
          if (customization.customizationID === 76) { this.enableTrackingEmails = true; }
        }
      }
    });
  }

  setLastClientNote(event: any) {
    this.lastClientNote.set(event);
  }

  setPriority(event: any) {
    this.shipmentPriority.set(event);
  }

  async duplicateLoadOnClick() {
    Swal.fire({
      title: 'Load duplication',
      icon: 'question',
      html: 'Do you want to duplicate shipment?',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continue',
      input: 'text',
      inputLabel: 'Type number of duplicates to be generated, Max. value 10.',
      inputValue: 1,
      didOpen: () => {
        $('input[type="text"].swal2-input').on('keypress', (event) => {
          let key = event.which;
          return !(key < 48 || key > 57);
        });
      },
      inputValidator: (value): any => {
        if (!value) { return 'Number of duplicates must be provided and must be greater than zero!'; }
        if (parseInt(value) === 0) { return 'Number of duplicates must be provided and must be greater than zero!'; }
        if (parseInt(value) > 10) { return 'Maximum number of duplicates is 10.'; }
      },
      inputAttributes: {
        maxlength: '2',
        onpaste: 'return false;',
        ondrop: 'return false;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show('trackingDetailsSpinner').then();
        const numOfCopies = parseInt(result.value);
        this.idShipmentsCopied = [];
        let shipmentToCopy: ShipmentSave = {
          shipmentDetail: this.originalShipment?.shipmentDetail,
          client: this.originalShipment?.client ?? null,
          user: {
            userID: null,
            userName: this.userName
          },
          carrierDetail: null,
          shipper: this.originalShipment?.shipper ?? null,
          consignee: this.originalShipment?.consignee ?? null,
          billTo: this.originalShipment?.billTo ?? null,
          lineItems: [],
          referenceFields: [],
          openReferenceFields: [],
          manualQuotes: [],
          accessorials: [],
          historicalEvents: [],
          targetRates: null,
          notificationMails: [],
          whiteGlove: this.originalShipment?.whiteGlove ?? null,
          trackingContacts: []
        };
        shipmentToCopy.shipmentDetail.shipmentID = null;
        shipmentToCopy.shipmentDetail.shipmentStatus = 'PREBOOKED';
        shipmentToCopy.shipmentDetail.enteredShipDate = formatDate(Date(), 'yyyy-MM-dd', 'en', '');
        shipmentToCopy.shipmentDetail.carrier = null;
        shipmentToCopy.shipmentDetail.carrierID = null;
        shipmentToCopy.shipmentDetail.proNumber = null;
        shipmentToCopy.shipmentDetail.bolNumber = null;
        shipmentToCopy.shipmentDetail.clientCost = null;
        shipmentToCopy.shipmentDetail.ilCost = null;
        shipmentToCopy.shipmentDetail.customerCost = null;
        shipmentToCopy.shipmentDetail.quotedCost = null;
        shipmentToCopy.shipmentDetail.quoteID = null;
        shipmentToCopy.shipmentDetail.actualDeliveryDate = null;
        shipmentToCopy.shipmentDetail.actualShipDate = null;
        shipmentToCopy.shipmentDetail.scheduledDeliveryDate = null;
        shipmentToCopy.shipmentDetail.deliveryAppointmentDate = null;
        shipmentToCopy.shipmentDetail.pickupAppointmentStart = null;
        shipmentToCopy.shipmentDetail.pickupAppointmentStop = null;
        shipmentToCopy.shipmentDetail.deliveryAppointmentStart = null;
        shipmentToCopy.shipmentDetail.deliveryAppointmentStop = null;
        shipmentToCopy.shipmentDetail.pickupException = null;
        shipmentToCopy.shipmentDetail.deliveryException = null;

        if (numOfCopies === 1) {
          this.sendCreateShipment(shipmentToCopy);
        } else {
          for (let i = 0; i < numOfCopies; i++) {
            setTimeout(() => {
              this.sendCreateShipment(shipmentToCopy, numOfCopies);
            }, 1000);
          }
          setTimeout(() => {
            this.closeDuplicationModal();
          }, 3000);
        }
      } else {
        // cancel duplicates
        return;
      }
    });
  }

  async sendCreateShipment(shipment: any, numOfCopies = 1) {
    let shipmentCopied: any = null;
    this.sss.saveShipment(shipment).subscribe({
      next: response => {
        shipmentCopied = response;
      },
      error: () => {
        this.spinner.hide('trackingDetailsSpinner').then();
      },
      complete: async () => {
        this.idShipmentsCopied?.push(shipmentCopied.shipmentDetail.shipmentID);
        window.open('/SPAs/new/' + shipmentCopied.shipmentDetail.shipmentID + '/' + shipmentCopied.client.groupID, '_blank');
        if (numOfCopies == 1) {
          this.closeDuplicationModal();
        }
      }
    });
  }

  closeDuplicationModal() {
    this.spinner.hide('trackingDetailsSpinner').then();
    this.Toast.fire({
      icon: 'success',
      title: 'Load duplication',
      html: 'Load duplicates succesfully.'
    }).then(() => {
      Swal.fire('Load duplication', 'Shipments IDs: ' + this.idShipmentsCopied?.join(', ') + '.', 'success');
    });
  }

  sendStatusNotificationMail(historicalEvent: any) {
    const trackingState = historicalEvent.trackingState.toString();
    if (this.shipmentHistory()?.notificationMails && (this.shipmentHistory()?.notificationMails.length ?? 0) > 0) {
      for (const mail of (this.shipmentHistory()?.notificationMails ?? [])) {
        if (mail.statusNotEmail && mail.statusNotEmail !== '') {
          this.emailService.sendTrackingMail(this.shipmentHistory(), historicalEvent, mail.statusNotEmail, false);
        }
      }
    }
    // SEND TRACKING EMAIL ON BOOKED / DELIVERED STATUS
    if (this.enableTrackingEmails && (trackingState === 'BOOKED' || trackingState === 'DELIVERED')) {
      this.getTrackingContactsAndSendMail(historicalEvent);
    }
  }

  getTrackingContactsAndSendMail(statusUpdate: any) {
    if (this.shipmentHistory()?.trackingContacts) {
      const trackingState = statusUpdate.trackingState.toString();
      const contactMails = [];
      for (const contact of (this.shipmentHistory()?.trackingContacts ?? [])) {
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
          this.emailService.sendTrackingMail(this.shipmentHistory(), statusUpdate, contact.emailAddress, true);
        }
      }
    }
  }

  isDate(date: any) {
    return !(date == '' || date == null || date == '0000-00-00 00:00:00' || date == '0000-00-00T00:00:00' || date == 'Invalid date');
  }
}
