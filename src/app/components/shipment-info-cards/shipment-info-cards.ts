import {
  Component,
  forwardRef,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild
} from '@angular/core';
import {PopUpService} from '../../services/popup/pop-up.service';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {formatDate} from '@angular/common';
import {ReportsService} from '../../services/reports/reports.service';
import {BookingDetails} from '../../interfaces/booking-details';
import {ShipmentHistory} from '../../interfaces/shipment-history';
import {interval, Subscription} from 'rxjs';
import {environment} from '../../../environments/environment';
import {EmailModal} from '../email-modal/email-modal';
import moment from 'moment';
import {ShipmentSaveService} from '../../services/shipment-save/shipment-save.service';
import {ShipmentSave} from '../../interfaces/shipment-save';
import {Dispatch} from '../../interfaces/dispatch';
import {HistoricalEvent} from '../../interfaces/historical-event';
import Swal from 'sweetalert2';
import {Global} from '../../common/global';
import {UploadService} from '../../services/upload/upload.service';
import {S3DocumentResponse} from '../../interfaces/s3-document-response';
import * as momentTimezone from 'moment-timezone';
import {
  Address,
  CargoClaim,
  CarrierDetail,
  ClaimDetail,
  ClaimDocument,
  Code,
  CompanyDetail
} from '../../interfaces/cargo-claim';
import {CargoClaimService} from '../../services/cargo-claim/cargo-claim.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {GroupsService} from '../../services/groups/groups.service';
import {Note} from '../../interfaces/note';
import {TrackingContacts} from '../../interfaces/tracking-contacts';
import {UserDetail} from '../../interfaces/user-detail';
import {AuthenticatorService} from '@aws-amplify/ui-angular';
import {BillTo} from '../../interfaces/bill-to';

@Component({
  selector: 'app-shipment-info-cards',
  standalone: false,
  templateUrl: './shipment-info-cards.html',
  styleUrl: './shipment-info-cards.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShipmentInfoCards),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShipmentInfoCards),
      multi: true
    }
  ]
})
export class ShipmentInfoCards implements OnInit, OnDestroy {
  showEdit = input(false);
  shipmentID = input<any>(null);
  changeNote = output<any>();
  getShipmentHist = output<any>();
  deliveryDateChange = output<boolean>();
  actualShipDateChange = output<boolean>();
  mabdDateChange = output<boolean>();
  @ViewChild(EmailModal) email!: EmailModal;
  detailsData: BookingDetails = {} as BookingDetails;
  shipmentHistory = signal<ShipmentHistory | null>(null);
  modalHeader = signal('');
  modalBody = signal('');
  carrierPhone = signal('');
  shippingInfoGroup: any;
  minDate: string = '';
  todayDate = signal('');
  proTextCopied = false;
  confNumTextCopied = false;
  needPickupException = false;
  needDeliveryException = false;
  bolTextCopied = false;
  bookingIDTextCopied = false;
  documentSelect = false;
  documentManualSelect = false;
  selectedDocument: any = '';
  selectedManualDocument: any = '';
  manualDocDropdown: S3DocumentResponse[] = [];
  carrierConfirmationDocument: any = [];
  clientQuoteDocument: any = [];
  billOfLadingDocument: any = [];
  emailSendSubject = '';
  emailSendAttachment: any = [];
  emailSendDocumentType = '';
  selectedFile: File | null = null;
  dropDownSelected = false;
  clientCode = '';
  dispatchInfo: Dispatch | null = null;
  poMoniker = input('PO #') ;
  lastClientNote = input('-');
  shipmentPriority = model('STANDARD');
  private changes: any;
  private currentDate = new Date();
  private subscription: Subscription | null = null;
  private oldPro: any;
  private oldEnteredShipDate: any;
  private oldScheduledDeliveryDate: any;
  private oldPUConf: any;
  private oldIsReturn: any;
  private oldProblem: boolean = false;
  exceptionDropDown: any[] = [];
  private userName = '';
  originalCosts: any = {};
  shipment: ShipmentSave | null = null;
  shipperTimezone: any = '';
  consigneeTimezone: any = '';
  isClaimOpened = false;
  claimNumber = '';
  claimStatus = '';
  global = Global;
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
  readMore = false;
  isInternalUser = false;
  trackingContacts = signal<TrackingContacts[] | null>(null);

  constructor(private popup: PopUpService, private fb: FormBuilder, private rs: ReportsService,
              private ss: ShipmentSaveService, private us: UploadService, private ccs: CargoClaimService,
              private spinner: NgxSpinnerService, private gs: GroupsService, private authenticator: AuthenticatorService) {
  }

  ngOnInit(): void {
    this.todayDate.set(moment(new Date()).local().format('YYYY-MM-DD'));
    this.minDate = formatDate(this.currentDate, 'yyyy-MM-dd', 'en', '');
    this.getShipmentHistory();

    this.gs.isValidPermission().then(data => {
      this.isInternalUser = data;
    });

    this.shippingInfoGroup = this.fb.group({
      proNumber: this.fb.control(''),
      pickupNumber: this.fb.control(''),
      enteredShipDate: this.fb.control(''),
      scheduledDeliveryDate: this.fb.control(''),
      originalShipDate: this.fb.control(''),
      originalDeliveryDate: this.fb.control(''),
      actualShipDate: this.fb.control(''),
      deliveryDate: this.fb.control(''),
      mabdDate: this.fb.control(''),
      actualDeliveryDate: this.fb.control(''),
      pickupException: this.fb.control(''),
      deliveryException: this.fb.control(''),
      pickupAppointmentStart: this.fb.control(''),
      pickupAppointmentStop: this.fb.control(''),
      deliveryAppointmentStart: this.fb.control(''),
      deliveryAppointmentStop: this.fb.control(''),
      isReturn: this.fb.control({ value: '', disabled: true }),
      problem: this.fb.control({ value: '', disabled: true })
    });
    this.setShippingControls();
    this.copiedEvent();
    this.setUser();

    this.rs.getAvailableExceptions('ltl').subscribe({
      next: response => {
        for (const exception of response) {
          this.exceptionDropDown.push(exception);
        }
      }
    });

    this.fetchManualDocuments();
    this.attemptRefreshDocuments();
    this.getClaimByShipmentID(this.shipmentID());
  }

  goToCarrierSite(name: any, pro: any, id: any) {
    const site = this.popup.getCarrierSite(name, pro, id, this.shipmentHistory()?.carrierDetail?.trackingURL);
    if (site.includes('Tracking is not supported')) {
      this.modalHeader.set('Tracking not supported by ' + this.shipmentHistory()?.shipmentDetail?.carrier);
      this.modalBody.set(this.shipmentHistory()?.shipmentDetail?.carrier + ' does not support PRO tracking. For an up-to-date report about ' +
        'this shipment, please contact them directly at');
      this.carrierPhone.set(this.shipmentHistory()?.carrierDetail?.phone ?? '');
      $('#trackingModal').modal('show');
    } else {
      if (site !== '') this.popUp(site);
    }
  }

  popUp(URL: string) {
    let day = new Date();
    const id = day.getTime().toString();

    // Define window features
    const windowFeatures = 'toolbar=1,scrollbars=1,location=1,statusbar=1,menubar=1,resizable=1,width=760,height=550,left=10,top=10';

    // Open a new window and store the reference in an object or map
    window.open(URL, id, windowFeatures);
  }

  fetchManualDocuments() {
    this.us.getFiles(this.shipmentID(), 'LTL').subscribe({
      next: (response: any) => {
        for (const doc of response) {
          this.manualDocDropdown.push(doc);
        }
      }
    });
  }

  attemptRefreshDocuments() {
    this.getShipmentBOL(false);
    this.getShipmentCC(false);
    this.getShipmentCQ(false);
  }

  setFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  viewManualDocument(documentName: any) {
    for (const doc of this.manualDocDropdown) {
      if (doc.description == documentName) {
        const toPdf = this.base64ToBlob(doc.fileBytes);
        const file = new Blob([toPdf], {type: 'application/pdf'});
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
      }
    }
  }

  confirmFileUpload() {
    if (this.selectedFile) {
      const selectedFileName = $('#manualUploadFileType option:selected').val()
      const documentType = this.email.determineAbbreviatedType(selectedFileName?.toString() ?? '');
      let formData = new FormData();
      formData.append('file', this.selectedFile);
      this.us.uploadFile(formData, this.shipmentID(), documentType, 'LTL', 'ilconnect-manual-docs', 'LTL/', this.selectedFile.name).subscribe({
        next: () => {
          Swal.fire('', 'Successfully uploaded document.', 'success');
          setTimeout(() => window.location.reload(), 1000);
        },
        error: () => {
          Swal.fire('', 'Something went wrong. Failed to upload document..', 'warning');
        }
      });
    }
  }

  viewDocument(document: string, view = false) {
    if (document === 'carrierconfirmation') {
      this.getShipmentCC(view);
    } else if (document === 'BOL') {
      this.getShipmentBOL(view);
    } else if (document === 'clientquote') {
      this.getShipmentCQ(view);
    }
  }

  downloadDocument(document: string, view = false) {
    if (document === 'carrierconfirmation') {
      this.downloadShipmentCC(view);
    } else if (document === 'BOL') {
      this.downloadShipmentBOL(view);
    } else if (document === 'clientquote') {
      this.downloadShipmentCQ(view);
    }
  }

  downloadShipmentCC(view: any) {
    this.rs.getCCFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          const toPdf = this.base64ToBlob(response.pdf);
          const file = new Blob([toPdf], {type: 'application/pdf'});
          const fileURL = URL.createObjectURL(file);
          let link = document.createElement('a');
          link.href = fileURL;
          link.download = 'carrierconfirmation.pdf';
          link.click();
        }
      },
      error: () => {
        if (view) {
          Swal.fire('Carrier Confirmation Document', '<b><i>Document could not be generated</i></b>', 'warning');
        }
      }
    });
  }

  downloadShipmentBOL(view: any) {
    this.rs.getBOLFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          const toPdf = this.base64ToBlob(response.pdf);
          const file = new Blob([toPdf], {type: 'application/pdf'});
          const fileURL = window.URL.createObjectURL(file);
          let link = document.createElement('a');
          link.href = fileURL;
          link.download = 'bol.pdf';
          link.click();
        }
      },
      error: () => {
        if (view) {
          Swal.fire('Bill of Lading Document', '<b><i>Document could not be generated</i></b>', 'warning');
        }
      }
    });
  }

  downloadShipmentCQ(view: any) {
    this.rs.getCQFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          const toPdf = this.base64ToBlob(response.pdf);
          const file = new Blob([toPdf], {type: 'application/pdf'});
          const fileURL = URL.createObjectURL(file);
          let link = document.createElement('a');
          link.href = fileURL;
          link.download = 'clientquote.pdf';
          link.click();
        }
      },
      error: () => {
        if (view) {
          Swal.fire('Carrier Confirmation Document', '<b><i>Document could not be generated</i></b>', 'warning');
        }
      }
    });
  }

  getShipmentCC(view: any) {
    this.rs.getCCFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          if (response.pdf.length < 2000) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
          } else {
            const toPdf = this.base64ToBlob(response.pdf);
            const file = new Blob([toPdf], {type: 'application/pdf'});
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL);
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

  getShipmentBOL(view: any) {
    this.rs.getBOLFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          if (response.pdf.length < 2000) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
          } else {
            const toPdf = this.base64ToBlob(response.pdf);
            const file = new Blob([toPdf], {type: 'application/pdf'});
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL);
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

  getShipmentCQ(view: any) {
    this.rs.getCQFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (view) {
          if (response.pdf.length < 2000) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
          } else {
            const toPdf = this.base64ToBlob(response.pdf);
            const file = new Blob([toPdf], {type: 'application/pdf'});
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL);
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

  setEmailDocument(document: string) {
    this.emailSendAttachment.length = 0;
    if (document === 'carrierconfirmation') {
      this.emailSendAttachment = this.carrierConfirmationDocument;
      this.emailSendSubject = 'Carrier Confirmation - Shipment ' + this.shipmentID();
      this.emailSendDocumentType = 'Carrier Confirmation';
    }
    if (document === 'clientquote') {
      this.emailSendAttachment = this.clientQuoteDocument;
      this.emailSendSubject = 'Client Quote - Shipment ' + this.shipmentID();
      this.emailSendDocumentType = 'Quote Response';
    }
    if (document === 'BOL') {
      this.emailSendAttachment = this.billOfLadingDocument;
      this.emailSendSubject = 'Bill of Lading - Shipment ' + this.shipmentID();
      this.emailSendDocumentType = 'Bill of Lading';
    }
  }

  openUploadModal() {
    document.getElementById('uploadFileModalButton')?.click();
  }

  getDirtyValues(form: any) {
    let dirtyValues: any = {};
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

  mapException(ExceptionID: any) {
    for (let exception of this.exceptionDropDown) {
      if (ExceptionID == exception.ExceptionID) {
        return exception.ExceptionName.toUpperCase();
      }
    }
    return '';
  }

  createChangeNote() {
    let noteString = '';
    this.changes = this.getDirtyValues(this.shippingInfoGroup);
    let shipdetail = this.shipmentHistory()?.shipmentDetail;
    let oldValue = ' ';
    Object.entries(this.changes).forEach(
      ([key, value]) => {
        if (key === 'proNumber') {
          noteString += 'Changed PRO/Load Number from \'' + (this.oldPro ? this.oldPro : ' ') + '\' to ' + value + '. \n';
        }
        if (key === 'pickupNumber') {
          noteString += 'Changed Pickup Confirmation Number from \'' + (this.oldPUConf ? this.oldPUConf : ' ') + '\' to ' + value + '. \n';
        }
        if (key === 'enteredShipDate') {
          oldValue = this.isDate(shipdetail?.enteredShipDate) ? moment(shipdetail?.enteredShipDate ?? '').format('MM/DD/YYYY') : '\' \'';
          noteString += 'Changed Scheduled Pickup Date from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'actualShipDate') {
          oldValue = this.isDate(shipdetail?.actualShipDate) ? moment(shipdetail?.actualShipDate ?? '').format('MM/DD/YYYY') : '\' \'';
          noteString += 'Changed Actual Pickup Date from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'pickupException') {
          oldValue = shipdetail?.pickupException ?
            this.exceptionDropDown.find(e => e.ExceptionID == shipdetail.pickupException).ExceptionName : ' ';
          noteString += 'Changed Pickup Exception reason from \'' + oldValue + '\' to \'' +
            this.exceptionDropDown.find(e => e.ExceptionID == value).ExceptionName + '\'. \n';
        }
        if (key === 'scheduledDeliveryDate') {
          oldValue = this.isDate(shipdetail?.scheduledDeliveryDate) ? moment(shipdetail?.scheduledDeliveryDate ?? '').format('MM/DD/YYYY') : '\' \'';
          noteString += 'Changed Scheduled Delivery Date from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'actualDeliveryDate') {
          oldValue = this.isDate(shipdetail?.actualDeliveryDate) ? moment(shipdetail?.actualDeliveryDate ?? '').format('MM/DD/YYYY') : '\' \'';
          noteString += 'Changed Actual Delivery Date from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'deliveryException') {
          oldValue = shipdetail?.deliveryException ?
            this.exceptionDropDown.find(e => e.ExceptionID == shipdetail.deliveryException).ExceptionName : ' ';
          noteString += 'Changed Delivery Exception reason from \'' + oldValue + '\' to \'' +
            this.exceptionDropDown.find(e => e.ExceptionID == value).ExceptionName + '\'. \n';
        }
        if (key === 'pickupAppointmentStart') {
          oldValue = this.isDate(shipdetail?.pickupAppointmentStart) ? moment(shipdetail?.pickupAppointmentStart ?? '').format('MM/DD/YYYY hh:mm') : '\' \'';
          noteString += 'Changed Pickup Start Date and Time from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'pickupAppointmentStop') {
          oldValue = this.isDate(shipdetail?.pickupAppointmentStop) ? moment(shipdetail?.pickupAppointmentStop ?? '').format('MM/DD/YYYY hh:mm') : '\' \'';
          noteString += 'Changed Pickup Stop Date and Time from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'deliveryAppointmentStart') {
          oldValue = this.isDate(shipdetail?.deliveryAppointmentStart) ? moment(shipdetail?.deliveryAppointmentStart ?? '').format('MM/DD/YYYY hh:mm') : '\' \'';
          noteString += 'Changed Delivery Start Date and Time from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'deliveryAppointmentStop') {
          oldValue = shipdetail?.deliveryAppointmentStop ? moment(shipdetail.deliveryAppointmentStop).format('MM/DD/YYYY hh:mm') : '\' \'';
          noteString += 'Changed Delivery Stop Date and Time from ' + oldValue + ' to ' +
            (value != '' ? moment(value as any).format('MM/DD/YYYY hh:mm') : '\' \'') + '. \n';
        }
        if (key === 'isReturn') {
          noteString += 'Changed if Shipment is a return from ' + (this.oldIsReturn ? this.oldIsReturn : 'false') + ' to ' + value + '. \n';
        }
        if (key === 'problem') {
          noteString += 'Changed if Shipment is marked as Problem from ' + (this.oldProblem ? this.oldProblem : 'false') +
            ' to ' + value + '. \n';
        }
      });

    if (noteString !== '') {
      this.changeNote.emit(noteString);
    }
  }

  convertDatetimeToUtc(date: any, timezone: any) {
    if (timezone != '' && date != '') {
      const dateInPT = moment.tz(date, 'YYYY-MM-DDTHH:mm', timezone);
      const dateInUTC = moment.utc(dateInPT);
      const tzOffset = moment(new Date()).utcOffset();
      const dateStringInUTC = dateInUTC.utcOffset(tzOffset).format('YYYY-MM-DDTHH:mm');

      if (dateStringInUTC != 'Invalid date') {
        return formatDate(dateStringInUTC, 'yyyy-MM-ddTHH:mm', 'en-US');
      }
      return '';
    } else {
      return date;
    }
  }

  updateShipmentDetails(values: any = null, fn: any = null) {
    const oldScheduledDate = this.isDate(this.oldEnteredShipDate) ?
      formatDate(this.oldEnteredShipDate, 'yyyy-MM-dd', 'en', '') : '';
    if (oldScheduledDate != this.shippingInfoGroup.get('enteredShipDate')?.value &&
      !this.shipmentHistory()?.shipmentDetail?.originalShipDate) {
      this.shippingInfoGroup.get('originalShipDate').setValue(oldScheduledDate);
    }

    const oldScheduledDelDate = this.isDate(this.oldScheduledDeliveryDate) ?
      formatDate(this.oldScheduledDeliveryDate, 'yyyy-MM-dd', 'en', '') : '';
    if (oldScheduledDelDate != this.shippingInfoGroup.get('scheduledDeliveryDate')?.value &&
      !this.shipmentHistory()?.shipmentDetail?.originalDeliveryDate) {
      this.shippingInfoGroup.get('originalDeliveryDate').setValue(oldScheduledDelDate);
    }

    // UPDATE VALUES
    let shipmentDetail = {
      proNumber: this.shippingInfoGroup.get('proNumber').value,
      pickupNumber: this.shippingInfoGroup.get('pickupNumber').value,
      actualShipDate: this.isDate(this.shippingInfoGroup.get('actualShipDate').value) ? this.shippingInfoGroup.get('actualShipDate').value : null,
      mabdDate: this.shippingInfoGroup.get('mabdDate').value,
      actualDeliveryDate: this.isDate(this.shippingInfoGroup.get('actualDeliveryDate').value) ? this.shippingInfoGroup.get('actualDeliveryDate').value : null,
      scheduledDeliveryDate: this.isDate(this.shippingInfoGroup.get('scheduledDeliveryDate').value) ? this.shippingInfoGroup.get('scheduledDeliveryDate').value : null,
      enteredShipDate: this.shippingInfoGroup.get('enteredShipDate').value,
      pickupException: this.shippingInfoGroup.get('pickupException').value,
      deliveryException: this.shippingInfoGroup.get('deliveryException').value,
      pickupAppointmentStart: this.shippingInfoGroup.get('pickupAppointmentStart').value != '' ?
        moment(this.shippingInfoGroup.get('pickupAppointmentStart').value).utc().format('YYYY-MM-DD hh:mm:ss') : null,
      pickupAppointmentStop: this.shippingInfoGroup.get('pickupAppointmentStop').value != '' ?
        moment(this.shippingInfoGroup.get('pickupAppointmentStop').value).utc().format('YYYY-MM-DD hh:mm:ss') : null,
      deliveryAppointmentStart: this.shippingInfoGroup.get('deliveryAppointmentStart').value != '' ?
        moment(this.shippingInfoGroup.get('deliveryAppointmentStart').value).utc().format('YYYY-MM-DD hh:mm:ss') : null,
      deliveryAppointmentStop: this.shippingInfoGroup.get('deliveryAppointmentStop').value != '' ?
        moment(this.shippingInfoGroup.get('deliveryAppointmentStop').value).utc().format('YYYY-MM-DD hh:mm:ss') : null,
      originalShipDate: this.isDate(this.shippingInfoGroup.get('originalShipDate').value) ? this.shippingInfoGroup.get('originalShipDate').value : null,
      originalDeliveryDate: this.isDate(this.shippingInfoGroup.get('originalDeliveryDate').value) ? this.shippingInfoGroup.get('originalDeliveryDate').value : null,
      isReturn: this.shippingInfoGroup.get('isReturn').value,
      problem: this.shippingInfoGroup.get('problem').value,
      trackingContacts: this.shipmentHistory()?.trackingContacts
    };

    const shipperTZ = this.shipmentHistory()?.shipper?.timezone;
    const consigneeTZ = this.shipmentHistory()?.consignee?.timezone;

    shipmentDetail.pickupAppointmentStart = shipmentDetail.pickupAppointmentStart != null ?
      this.convertDatetimeToUtc(shipmentDetail.pickupAppointmentStart, shipperTZ) : null;
    shipmentDetail.pickupAppointmentStop = shipmentDetail.pickupAppointmentStop != null ?
      this.convertDatetimeToUtc(shipmentDetail.pickupAppointmentStop, shipperTZ) : null;
    shipmentDetail.deliveryAppointmentStart = shipmentDetail.deliveryAppointmentStart != null ?
      this.convertDatetimeToUtc(shipmentDetail.deliveryAppointmentStart, consigneeTZ) : null;
    shipmentDetail.deliveryAppointmentStop = shipmentDetail.deliveryAppointmentStop != null ?
      this.convertDatetimeToUtc(shipmentDetail.deliveryAppointmentStop, consigneeTZ) : null;

    if (values) {
      if (this.shipmentHistory()?.shipmentDetail) {
        this.shipmentHistory()!.shipmentDetail!.proNumber = this.shippingInfoGroup.get('proNumber').value;
        this.shipmentHistory()!.shipmentDetail!.pickupNumber = this.shippingInfoGroup.get('pickupNumber').value;
        this.shipmentHistory()!.shipmentDetail!.actualShipDate = this.shippingInfoGroup.get('actualShipDate').value;
        this.shipmentHistory()!.shipmentDetail!.mabdDate = this.shippingInfoGroup.get('mabdDate').value;
        this.shipmentHistory()!.shipmentDetail!.originalShipDate = this.shippingInfoGroup.get('originalShipDate').value;
        this.shipmentHistory()!.shipmentDetail!.originalDeliveryDate = this.shippingInfoGroup.get('originalDeliveryDate').value;
        this.shipmentHistory()!.shipmentDetail!.actualDeliveryDate = this.shippingInfoGroup.get('actualDeliveryDate').value;
        this.shipmentHistory()!.shipmentDetail!.scheduledDeliveryDate = this.shippingInfoGroup.get('scheduledDeliveryDate').value;
        this.shipmentHistory()!.shipmentDetail!.enteredShipDate = this.shippingInfoGroup.get('enteredShipDate').value;
        this.shipmentHistory()!.shipmentDetail!.pickupException = this.shippingInfoGroup.get('pickupException').value;
        this.shipmentHistory()!.shipmentDetail!.deliveryException = this.shippingInfoGroup.get('deliveryException').value;
        this.shipmentHistory()!.shipmentDetail!.pickupAppointmentStart = this.shippingInfoGroup.get('pickupAppointmentStart').value != '' ?
          moment(this.shippingInfoGroup.get('pickupAppointmentStart').value).format('YYYY-MM-DD hh:mm:ss') : null;
        this.shipmentHistory()!.shipmentDetail!.pickupAppointmentStop = this.shippingInfoGroup.get('pickupAppointmentStop').value != '' ?
          moment(this.shippingInfoGroup.get('pickupAppointmentStop').value).format('YYYY-MM-DD hh:mm:ss') : null;
        this.shipmentHistory()!.shipmentDetail!.deliveryAppointmentStart = this.shippingInfoGroup.get('deliveryAppointmentStart').value != '' ?
          moment(this.shippingInfoGroup.get('deliveryAppointmentStart').value).format('YYYY-MM-DD hh:mm:ss') : null;
        this.shipmentHistory()!.shipmentDetail!.deliveryAppointmentStop = this.shippingInfoGroup.get('deliveryAppointmentStop').value != '' ?
          moment(this.shippingInfoGroup.get('deliveryAppointmentStop').value).format('YYYY-MM-DD hh:mm:ss') : null;
        this.shipmentHistory()!.shipmentDetail!.specialInstructions = values?.specialInstructions;
        this.shipmentHistory()!.shipmentDetail!.isReturn = this.shippingInfoGroup.get('isReturn').value;
        this.shipmentHistory()!.shipmentDetail!.problem = this.shippingInfoGroup.get('problem').value;
      }
      this.shipmentHistory()!.referenceFields = values?.references;
      this.shipmentHistory()!.openReferenceFields = values?.openReferenceFields;
      this.shipmentHistory()!.billTo = {
        billtoID: this.shipmentHistory()?.billTo?.billtoID ?? null,
        careof: this.shipmentHistory()?.billTo?.careof ?? '',
        country: this.shipmentHistory()?.billTo?.country ?? '',
        name: values?.billedToName,
        address: values?.billedToAddress,
        city: values?.billedToCity,
        state: values?.billedToState,
        zip: values?.billedToZip
      } as BillTo
    }

    const userDetail: UserDetail = {
      userID: null,
      userName: this.userName
    };

    this.shipment = {
      shipmentDetail: this.shipmentHistory()?.shipmentDetail,
      referenceFields: this.shipmentHistory()?.referenceFields ?? [],
      billTo: this.shipmentHistory()?.billTo ?? null,
      client: this.shipmentHistory()?.client ?? null,
      user: userDetail,
      carrierDetail: this.shipmentHistory()?.carrierDetail ?? null,
      shipper: this.shipmentHistory()?.shipper ?? null,
      consignee: this.shipmentHistory()?.consignee ?? null,
      lineItems: this.shipmentHistory()?.lineItems ?? [],
      accessorials: this.shipmentHistory()?.accessorials ?? [],
      openReferenceFields: this.shipmentHistory()?.openReferenceFields ?? [],
      targetRates: null,
      historicalEvents: this.shipmentHistory()?.historicalEvents ?? [],
      manualQuotes: [],
      whiteGlove: null,
      notificationMails: this.shipmentHistory()?.notificationMails ?? [],
      trackingContacts: this.shipmentHistory()?.trackingContacts ?? []
    };

    // UPDATE SHIPMENT
    if (values) {
      this.ss.updateShipment(this.shipment).subscribe({
        next: () => {
          if (typeof fn === 'function') {
            fn();
          }
        }
      });
    } else {
      this.rs.updateTrackingShipmentDetails(this.shipmentID(), shipmentDetail).subscribe({
        next: () => {
          if (typeof fn === 'function') {
            fn();
          }
        }
      });
    }
  }

  setShippingControls() {
    let shippingDetailsInfo = {
      proNumber: this.shipmentHistory()?.shipmentDetail?.proNumber ?? '',
      pickupNumber: this.shipmentHistory()?.shipmentDetail?.pickupNumber ?? '',
      originalShipDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.originalShipDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.originalShipDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      originalDeliveryDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.originalDeliveryDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.originalDeliveryDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      actualShipDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      enteredShipDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.enteredShipDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.enteredShipDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      scheduledDeliveryDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.scheduledDeliveryDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.scheduledDeliveryDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      mabdDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.mabdDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.mabdDate ?? '', 'yyyy-MM-dd', 'en', '') : '',
      actualDeliveryDate: this.isDate(this.shipmentHistory()?.shipmentDetail?.actualDeliveryDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.actualDeliveryDate ?? '', 'yyyy-MM-dd', 'en', '') : null,
      pickupException: this.shipmentHistory()?.shipmentDetail?.pickupException ?? '',
      deliveryException: this.shipmentHistory()?.shipmentDetail?.deliveryException ?? '',
      pickupAppointmentStart: this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStart && this.isDate(this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStart) ?
        this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStart : '',
      pickupAppointmentStop: this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStop && this.isDate(this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStop) ?
        this.shipmentHistory()?.shipmentDetail?.pickupAppointmentStop : '',
      deliveryAppointmentStart: this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStart && this.isDate(this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStart) ?
        this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStart : '',
      deliveryAppointmentStop: this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStop && this.isDate(this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStop) ?
        this.shipmentHistory()?.shipmentDetail?.deliveryAppointmentStop : '',
      isReturn: this.shipmentHistory()?.shipmentDetail?.isReturn ?? false,
      problem: this.shipmentHistory()?.shipmentDetail?.problem ?? false
    };
    this.shippingInfoGroup.reset(shippingDetailsInfo);
  }

  getShipmentHistory() {
    let sd = {} as ShipmentHistory;
    this.shipmentHistory.set(sd);
    this.rs.getShipmentHistory(this.shipmentID()).subscribe({
      next: response => {
        this.shipmentHistory.update(() => this.timezoneProcessor(response));
        this.trackingContacts.set(this.shipmentHistory()?.trackingContacts ?? []);
        this.dispatchInfo = response?.dispatchInfo;
        this.oldPro = this.shipmentHistory()?.shipmentDetail?.proNumber;
        this.oldEnteredShipDate = this.shipmentHistory()?.shipmentDetail?.enteredShipDate && this.isDate(this.shipmentHistory()?.shipmentDetail?.enteredShipDate) ? this.shipmentHistory()?.shipmentDetail?.enteredShipDate : '';
        this.oldScheduledDeliveryDate = this.shipmentHistory()?.shipmentDetail?.scheduledDeliveryDate && this.isDate(this.shipmentHistory()?.shipmentDetail?.scheduledDeliveryDate) ? this.shipmentHistory()?.shipmentDetail?.scheduledDeliveryDate : '';
        this.oldIsReturn = this.shipmentHistory()?.shipmentDetail?.isReturn;
        this.oldProblem = this.shipmentHistory()?.shipmentDetail?.problem ?? false;
        this.oldPUConf = this.shipmentHistory()?.shipmentDetail?.pickupNumber;
        this.getShipmentHist.emit(this.shipmentHistory());
        this.shipmentPriority.update(()=> this.shipmentHistory()?.shipmentDetail?.priority ?? 'STANDARD');

        if (this.shipmentHistory()?.shipmentDetail?.priority === 'ELEVATED' || this.shipmentHistory()?.shipmentDetail?.priority === 'EXPEDITED') {
          document.getElementById('shipmentPriorityTag')?.classList.add('bold');
        }

        this.originalCosts = {
          ilCost: this.shipmentHistory()?.shipmentDetail?.ilCost,
          clientCost: this.shipmentHistory()?.shipmentDetail?.clientCost,
          customerCost: this.shipmentHistory()?.shipmentDetail?.customerCost,
        };

        let originalBOLFileName = '123/' + this.shipmentID() + 'B.pdf';
        this.billOfLadingDocument.push({
          id: null,
          shipmentID: null,
          typeDescription: 'Original BOL',
          fileName: originalBOLFileName,
          entryDate: null,
          typeLetter: null,
          isClientVisible: null
        });

        let originalCCFileName = '123/' + this.shipmentID() + 'C.pdf';
        this.carrierConfirmationDocument.push({
          id: null,
          shipmentID: null,
          typeDescription: 'Original Carrier Confirmation',
          fileName: originalCCFileName,
          entryDate: null,
          typeLetter: null,
          isClientVisible: null
        });

        let originalCQFileName = '123/' + this.shipmentID() + 'Q.pdf';
        this.clientQuoteDocument.push({
          id: null,
          shipmentID: null,
          typeDescription: 'Client Quote',
          fileName: originalCQFileName,
          entryDate: null,
          typeLetter: null,
          isClientVisible: null
        });

        this.clientCode = this.shipmentHistory()?.client?.clientCode ?? '';
        if ((this.shipmentHistory()?.shipmentDetail?.proNumber == '') && (this.detailsData.proNum == '' || this.detailsData.proNum == null)) {
          this.rs.getPRONumber(this.shipmentID()).subscribe({
            next: response => {
              if (this.shipmentHistory()?.shipmentDetail) this.shipmentHistory()!.shipmentDetail!.proNumber = response;
              this.detailsData.proNum = response;
            }
          });
        }
      }
    });
  }

  copied(event: any, type = '') {
    if (event) {
      switch (type) {
        case 'pro': {
          this.proTextCopied = true;
          break;
        }
        case 'confNum': {
          this.confNumTextCopied = true;
          break;
        }
        case 'bol': {
          this.bolTextCopied = true;
          break;
        }
        case 'bookingID': {
          this.bookingIDTextCopied = true;
          break;
        }
      }
    }
  }

  // RESETS CLIPBOARD ICON AFTER PRO NUMBER IS COPIED
  copiedEvent() {
    const source = interval(10000);
    this.subscription = source.subscribe(() => {
        if (this.proTextCopied) {
          this.proTextCopied = false;
        }
        if (this.confNumTextCopied) {
          this.confNumTextCopied = false;
        }
        if (this.bolTextCopied) {
          this.bolTextCopied = false;
        }
        if (this.bookingIDTextCopied) {
          this.bookingIDTextCopied = false;
        }
      }
    );
  }

  ngOnDestroy(): void {
    // Remember to unsubscribe to the event
    if (this.subscription) this.subscription.unsubscribe();
  }

  statusEmailBody() {
    return '\n' + '_______________________________________________________________________________________________________________' + '\n' +
      'Shipment ID: ' + (this.clientCode ? this.clientCode + '-' : '') + (this.shipmentID() ?? '') + '\n' +
      'BOL#: ' + (this.shipmentHistory()?.shipmentDetail?.bolNumber ? this.shipmentHistory()?.shipmentDetail?.bolNumber : '') + '\n' +
      'Ship Date: ' + (this.isDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate) ?
        formatDate(this.shipmentHistory()?.shipmentDetail?.actualShipDate ?? '', 'MM/dd/yyyy', 'en', '') : '') + '\n' +
      'Origin: ' + (this.shipmentHistory()?.shipper?.city && this.shipmentHistory()?.shipper?.state ?
        this.shipmentHistory()?.shipper?.city.toUpperCase() + ', ' + this.shipmentHistory()?.shipper?.state + ' ' : '') + '\n' +
      'Destination: ' + (this.shipmentHistory()?.consignee?.city && this.shipmentHistory()?.consignee?.state ?
        this.shipmentHistory()?.consignee?.city.toUpperCase() + ', ' + this.shipmentHistory()?.consignee?.state.toUpperCase() + ' ' : '') + '\n\n' +
      'If you have additional questions or requests please contact your Logistics Planner directly at ' +
      (this.shipmentHistory()?.client?.lpTeamEmail ?? 'redteam@il2000.com') + '\n' +
      'or 1-877-373-4525.'; // default into redteam@il2000.com
  }

  getBOL() {
    this.rs.getBOLFromLambda(this.shipmentID()).subscribe({
      next: response => {
        if (response.pdf.length < 2000) {
          window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID());
        } else {
          let toPdf = this.base64ToBlob(response.pdf);
          let file = new Blob([toPdf], {type: 'application/pdf'});
          let fileURL = URL.createObjectURL(file);
          window.open(fileURL);
        }
      }
    });
  }

  setManualDocumentType() {
    this.emailSendSubject = this.selectedManualDocument +  ' - Shipment ' + this.shipmentID();
  }

  base64ToBlob(base64String: string | null) {
    base64String = 'data:application/pdf;base64,' + base64String;
    let byteString = atob(base64String.split(',')[1]);
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'application/pdf'});
  }

  onDeliveryDateChange() {
    this.deliveryDateChange.emit(true);
  }

  onActualShipDateChange() {
    this.actualShipDateChange.emit(true);
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  showExceptionModal() {
    $('#missingExceptionModal').modal('show');
  }

  isDate(date: any) {
    return !(date == '' || date == null || date == '0000-00-00 00:00:00' || date == '0000-00-00T00:00:00' || date == 'Invalid date');
  }

  getLastTrackingMessage() {
    if (this.shipmentHistory()?.historicalEvents && (this.shipmentHistory()?.historicalEvents?.length ?? 0) > 0) {
      let history: HistoricalEvent[] = this.shipmentHistory()?.historicalEvents ?? [];
      return history[0].trackingMessage ?? '';
    }
    return '-';
  }

  updatePriority(priority: 'STANDARD' | 'ELEVATED' | 'EXPEDITED' | 'GUARANTEED') {
    let shipmentDetail = {priority};
    this.rs.updateTrackingShipmentDetails(this.shipmentID(), shipmentDetail).subscribe({
      next: () => {
        let noteText = 'Shipment Priority changed from ' + this.shipmentPriority() + ' to ' + priority;
        this.shipmentPriority.update(() => priority);
        if (this.shipmentHistory()?.shipmentDetail) this.shipmentHistory()!.shipmentDetail!.priority = priority;
        this.changeNote.emit(noteText);
        this.Toast.fire({
          icon: 'success',
          title: 'Shipment successfully set back to STANDARD priority.'
        });
      }
    });
  }

  validateDates(event: any, input: string) {
    if (event.value == '') { return; }
    let splitDate = event.value.split('-');
    let splitTime: any = null;
    let dateTovalid: any = null;

    // Pickup Dates
    if (input == 'enteredShipDate') {
      let oldScheduledDate = this.isDate(this.oldEnteredShipDate) ? formatDate(this.oldEnteredShipDate, 'yyyy-MM-dd', 'en', '') : '';
      if (oldScheduledDate != this.shippingInfoGroup.get('enteredShipDate').value) {
        this.shippingInfoGroup.get('pickupException').setValue('');
        $('#pickupException').addClass('invalid');
      }

      // dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      // Scheduled Pickup vs Original Ship Date - validation removed by hotfix GLOB-2688
      // if (this.shipmentHistory().shipmentDetail.originalShipDate){
      //   splitDate = this.shipmentHistory().shipmentDetail.originalShipDate.split('T')[0].split('-')
      //   let original = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      //   if (dateTovalid < original) {
      //     event.value = ''
      //     Swal.fire({icon: 'warning', title:'', html: '<b/><i/>Scheduled Pickup Date cannot be Less than Original Ship Date'})
      //       .then(()=> {
      //         document.getElementById(event.id).focus();
      //       })
      //     return
      //   }
      // }

      // //Scheduled Pickup vs Actual Pickup
      // if (this.shippingInfoGroup.get('actualShipDate').value){
      //   splitDate = this.shippingInfoGroup.get('actualShipDate').value.split('-')
      //   let actual = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      //   if (dateTovalid > actual) {
      //     event.value = ''
      //     Swal.fire({icon: 'warning', title:'', html: '<b/><i/>Scheduled Pickup Date cannot be greater than Actual Pickup Date'})
      //       .then(()=> {
      //         document.getElementById(event.id).focus();
      //       })
      //     return
      //   }
      // }
    }

    if (input == 'pickupAppointmentStart') {
      splitDate = event.value.split('T')[0].split('-');
      splitTime = event.value.split('T')[1].split(':');
      dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
      // Start Pickup Appointment vs End Pickup Appointment
      if (this.shippingInfoGroup.get('pickupAppointmentStop').value &&
        this.shippingInfoGroup.get('pickupAppointmentStop').value !== '0000-00-00 00:00:00' &&
        this.shippingInfoGroup.get('pickupAppointmentStop').value !== '0000-00-00T00:00:00') {

        let aptDate = this.shippingInfoGroup.get('pickupAppointmentStop').value.toString();
        splitDate = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('pickupAppointmentStop').value.split('T')[0].split('-') :
          this.shippingInfoGroup.get('pickupAppointmentStop').value.split(' ')[0].split('-');

        splitTime = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('pickupAppointmentStop').value.split('T')[1].split(':') :
          this.shippingInfoGroup.get('pickupAppointmentStop').value.split(' ')[1].split(':');

        let aptStop = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
        if (dateTovalid > aptStop) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>Start Pickup Appointment Date cannot be Greater than End Pickup Appointment Date'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return;
        }
      }
    }

    if (input == 'pickupAppointmentStop') {
      splitDate = event.value.split('T')[0].split('-');
      splitTime = event.value.split('T')[1].split(':');
      dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
      // Start Pickup Appointment vs End Pickup Appointment
      if (this.shippingInfoGroup.get('pickupAppointmentStart').value &&
        this.shippingInfoGroup.get('pickupAppointmentStart').value !== '0000-00-00 00:00:00' &&
        this.shippingInfoGroup.get('pickupAppointmentStart').value !== '0000-00-00T00:00:00') {

        let aptDate = this.shippingInfoGroup.get('pickupAppointmentStart').value.toString();
        splitDate = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('pickupAppointmentStart').value.split('T')[0].split('-') :
          this.shippingInfoGroup.get('pickupAppointmentStart').value.split(' ')[0].split('-');

        splitTime = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('pickupAppointmentStart').value.split('T')[1].split(':') :
          this.shippingInfoGroup.get('pickupAppointmentStart').value.split(' ')[1].split(':');

        let aptStart = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
        if (dateTovalid < aptStart) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>End Pickup Appointment Date cannot be less than Start Pickup Appointment Date'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return;
        }
      }
    }

    if (input == 'actualShipDate') {
      // dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      // //Actual Pickup vs Scheduled Pickup
      // if (this.shippingInfoGroup.get('enteredShipDate').value){
      //   splitDate = this.shippingInfoGroup.get('enteredShipDate').value.split('-')
      //   let schedule = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      //   if (dateTovalid < schedule) {
      //     event.value = ''
      //     Swal.fire({icon: 'warning', title:'', html: '<b/><i/>Actual Pickup Date cannot be Less than Schedule Pickup Date'})
      //       .then(()=> {
      //         document.getElementById(event.id).focus();
      //       })
      //     return
      //   }
      // }
    }

    // Delivery Dates
    if (input == 'scheduledDeliveryDate') {

      dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
      // GLOB-3090: allow Scheduled Delivery Less than Original Delivery Date
      // Scheduled Delivery vs Original Delivery
      // if (this.shipmentHistory().shipmentDetail.originalDeliveryDate) {
      // splitDate = this.shipmentHistory().shipmentDetail.originalDeliveryDate.split('T')[0].split('-')
      // let original = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      // if (dateTovalid < original) {
      //   event.value = ''
      //   Swal.fire({
      //     icon: 'warning',
      //     title: '',
      //     html: '<b/><i/>Scheduled Delivery Date cannot be Less than Original Delivery Date'
      //   })
      //     .then(() => {
      //       document.getElementById(event.id).focus();
      //     })
      //   return
      // }
      // }

      if (this.shippingInfoGroup.get('actualDeliveryDate').value) {
        splitDate = this.shippingInfoGroup.get('actualDeliveryDate').value.split('-');
        let actual = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
        if (dateTovalid > actual) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>Scheduled Delivery Date cannot be greater than Actual Delivery Date'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return;
        }
      }
    }

    if (input == 'deliveryAppointmentStart') {
      splitDate = event.value.split('T')[0].split('-');
      splitTime = event.value.split('T')[1].split(':');
      dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
      // Start Delivery Appointment vs End Delivery Appointment
      if (this.shippingInfoGroup.get('deliveryAppointmentStop').value &&
        this.shippingInfoGroup.get('deliveryAppointmentStop').value !== '0000-00-00 00:00:00' &&
        this.shippingInfoGroup.get('deliveryAppointmentStop').value !== '0000-00-00T00:00:00') {

        let aptDate = this.shippingInfoGroup.get('deliveryAppointmentStop').value.toString();
        splitDate = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('deliveryAppointmentStop').value.split('T')[0].split('-') :
          this.shippingInfoGroup.get('deliveryAppointmentStop').value.split(' ')[0].split('-');

        splitTime = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('deliveryAppointmentStop').value.split('T')[1].split(':') :
          this.shippingInfoGroup.get('deliveryAppointmentStop').value.split(' ')[1].split(':');

        let aptStop = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
        if (dateTovalid > aptStop) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>Start Delivery Appointment Date cannot be Greater than End Delivery Appointment Date'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return;
        }
      }

      // Delivery Appointment > Scheduled Delivery and not DELIVERED
      if ((this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'BOOKED' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'PICKED_UP' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'AT_ORIGIN_DOCK' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'IN_TRANSIT' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'AT_DELIVERY_DOCK' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'AT_DELIVERY' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'OUT_FOR_DELIVERY' ||
        this.shipmentHistory()?.shipmentDetail?.shipmentStatus == 'PROBLEM')) {

        let fnSetException = () => {
          let newScheduleDate = formatDate(this.shippingInfoGroup.get('deliveryAppointmentStart').value, 'yyyy-MM-dd', 'en', '');
          this.shippingInfoGroup.get('scheduledDeliveryDate').setValue(newScheduleDate);
          this.shippingInfoGroup.get('deliveryException').setValue(1); // Appointment Exception
          this.Toast.fire({
            icon: 'info',
            title: 'Appointment Exception set as a Delivery Exception'
          });
        };

        if (this.shippingInfoGroup.get('scheduledDeliveryDate').value) {
          let aptStart = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
          splitDate = this.shippingInfoGroup.get('scheduledDeliveryDate').value.split('-');
          let schedule = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
          if (aptStart > schedule) {
            fnSetException();
            return;
          }
        } else {
          fnSetException();
          return;
        }
      }
    }

    if (input == 'deliveryAppointmentStop') {
      splitDate = event.value.split('T')[0].split('-');
      splitTime = event.value.split('T')[1].split(':');
      dateTovalid = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
      // End Delivery Appointment vs Start Delivery Appointment
      if (this.shippingInfoGroup.get('deliveryAppointmentStart').value &&
        this.shippingInfoGroup.get('deliveryAppointmentStart').value !== '0000-00-00 00:00:00' &&
        this.shippingInfoGroup.get('deliveryAppointmentStart').value !== '0000-00-00T00:00:00') {

        let aptDate = this.shippingInfoGroup.get('deliveryAppointmentStart').value.toString();
        splitDate = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('deliveryAppointmentStart').value.split('T')[0].split('-') :
          this.shippingInfoGroup.get('deliveryAppointmentStart').value.split(' ')[0].split('-');

        splitTime = aptDate.indexOf('T') > -1 ? this.shippingInfoGroup.get('deliveryAppointmentStart').value.split('T')[1].split(':') :
          this.shippingInfoGroup.get('deliveryAppointmentStart').value.split(' ')[1].split(':');

        let aptStart = new Date(splitDate[0], splitDate[1] - 1, splitDate[2], splitTime[0], splitTime[1]);
        if (dateTovalid < aptStart) {
          event.value = '';
          Swal.fire({
            icon: 'warning',
            title: '',
            html: '<b/><i/>End Delivery Appointment Date cannot be less than Start Delivery Appointment Date'
          }).then(() => {
            document.getElementById(event.id)?.focus();
          });
          return;
        }
      }
    }

    if (input == 'actualDeliveryDate') {
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
        return;
      }

      // //Actual Delivery vs Schedule Delivery
      // if (this.shippingInfoGroup.get('scheduledDeliveryDate').value){
      //   splitDate = this.shippingInfoGroup.get('scheduledDeliveryDate').value.split('-')
      //   let schedule = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
      //   if (dateTovalid < schedule) {
      //     event.value = ''
      //     Swal.fire({icon: 'warning', title:'', html: '<b/><i/>Actual Delivery Date cannot be Less than Schedule Delivery Date'})
      //       .then(()=> {
      //         document.getElementById(event.id).focus();
      //       })
      //     return
      //   }
      // }
    }
  }

  timezoneProcessor(response: any) {
    this.consigneeTimezone = response.consignee.timezone ? Intl.DateTimeFormat('en', {
      timeZone: response.consignee.timezone,
      timeZoneName: 'short'
    }).format(new Date()).split(' ')[1] : 'UTC';
    this.shipperTimezone = response.shipper.timezone ? Intl.DateTimeFormat('en', {
      timeZone: response.shipper.timezone,
      timeZoneName: 'short'
    }).format(new Date()).split(' ')[1] : 'UTC';

    let consigneeTimezone = response.consignee.timezone;
    let shipperTimezone = response.shipper.timezone;

    let pickupAppointmentStart = this.convertTimezone(response.shipmentDetail.pickupAppointmentStart, shipperTimezone);
    let pickupAppointmentStop = this.convertTimezone(response.shipmentDetail.pickupAppointmentStop, shipperTimezone);
    let deliveryAppointmentStart = this.convertTimezone(response.shipmentDetail.deliveryAppointmentStart, consigneeTimezone);
    let deliveryAppointmentStop = this.convertTimezone(response.shipmentDetail.deliveryAppointmentStop, consigneeTimezone);

    response.shipmentDetail.pickupAppointmentStart = pickupAppointmentStart;
    response.shipmentDetail.pickupAppointmentStop = pickupAppointmentStop;
    response.shipmentDetail.deliveryAppointmentStart = deliveryAppointmentStart;
    response.shipmentDetail.deliveryAppointmentStop = deliveryAppointmentStop;

    return response;
  }

  convertTimezone(timedate: any, timezone: any) {
    if (timezone && timedate) {
      const myDate = momentTimezone.utc(timedate).tz(timezone);
      return myDate.format('YYYY-MM-DD HH:mm:ss');
    }
    return timedate;
  }

  onBtnOpenClaim() {
    document.getElementById('openClaimPopButton')?.click();
  }

  openClaim() {
    this.spinner.show();
    const cargoClaim = {} as CargoClaim;
    cargoClaim.shipmentId = this.shipmentHistory()?.shipmentDetail?.shipmentID ?? '';
    cargoClaim.groupId = this.shipmentHistory()?.client?.groupID ?? null;

    const claimDetail = {} as ClaimDetail;
    claimDetail.claimType = 'Loss and Damage';
    // carrier
    const carrier = {} as CarrierDetail;
    carrier.fullName = this.truncateString(this.shipmentHistory()?.carrierDetail?.carrierName ?? '');
    carrier.code = this.shipmentHistory()?.carrierDetail?.tiberID ?? '';
    carrier.scac = this.shipmentHistory()?.carrierDetail?.scac ?? '';
    const Address = this.addressCheck(this.shipmentHistory()?.carrierDetail?.address1 ?? '');
    carrier.line1 = Address.line1;
    carrier.line2 = Address.line2;
    carrier.city = this.shipmentHistory()?.carrierDetail?.city ?? '';
    carrier.state = this.shipmentHistory()?.carrierDetail?.state ?? '';
    carrier.zipCode = this.shipmentHistory()?.carrierDetail?.postalCode ?? '';
    carrier.phoneNumber = this.shipmentHistory()?.carrierDetail?.phone ?? '';
    claimDetail.carrier = carrier;
    // Company
    const company = {} as CompanyDetail;
    company.fullName = this.truncateString(this.shipmentHistory()?.client?.companyName ?? '');
    company.code = String(this.shipmentHistory()?.client?.groupID);
    company.contactName = this.shipmentHistory()?.client?.contactName ?? '';
    company.contactEmail = this.shipmentHistory()?.client?.email ?? '';
    const companyAddress = this.addressCheck(this.shipmentHistory()?.client?.address ?? '');
    company.line1 = companyAddress.line1;
    company.line2 = companyAddress.line2;
    company.city = this.shipmentHistory()?.client?.city ?? '';
    company.state = this.shipmentHistory()?.client?.state ?? '';
    company.zipCode = this.shipmentHistory()?.client?.zip ?? '';
    claimDetail.company = company;
    // Shipper
    const shipper = {} as Address;
    shipper.fullName = this.truncateString(this.shipmentHistory()?.shipper?.name ?? '');
    shipper.code = String(this.shipmentHistory()?.shipper?.id);
    const shipperAddress = this.addressCheck(this.shipmentHistory()?.shipper?.streetAddress ?? '');
    shipper.line1 = shipperAddress.line1;
    shipper.line2 = shipperAddress.line2;
    shipper.city = this.shipmentHistory()?.shipper?.city ?? '';
    shipper.state = this.shipmentHistory()?.shipper?.state ?? '';
    shipper.country = this.shipmentHistory()?.shipper?.country ?? '';
    shipper.zipCode = this.shipmentHistory()?.shipper?.zip ?? '';
    claimDetail.shipper = shipper;
    // consignee
    const consignee = {} as Address;
    consignee.fullName = this.truncateString(this.shipmentHistory()?.consignee?.name ?? '');
    consignee.code = String(this.shipmentHistory()?.consignee?.id);
    const consigneeAddress = this.addressCheck(this.shipmentHistory()?.consignee?.streetAddress ?? '');
    consignee.line1 = consigneeAddress.line1;
    consignee.line2 = consigneeAddress.line2;
    consignee.city = this.shipmentHistory()?.consignee?.city ?? '';
    consignee.state = this.shipmentHistory()?.consignee?.state ?? '';
    consignee.country = this.shipmentHistory()?.consignee?.country ?? '';
    consignee.zipCode = this.shipmentHistory()?.consignee?.zip ?? '';
    claimDetail.consignee = consignee;
    // Claimant
    const claimant = {} as Address;
    claimant.fullName = this.truncateString(this.shipmentHistory()?.client?.companyName + ' C/O IL2000');
    claimant.code = this.shipmentHistory()?.client?.clientCode ?? '';
    claimant.line1 = 'PO BOX 8372';
    claimant.city = 'VIRGINIA BEACH';
    claimant.state = 'VA';
    claimant.country = 'UNITED STATES';
    claimant.zipCode = '23450';
    claimDetail.claimant = claimant;
    // Reason Code
    const reasonCode = {} as Code;
    reasonCode.code = (document.getElementById('claimReasonDropdown') as HTMLSelectElement).value;
    claimDetail.reasonCode = reasonCode;
    // Status Code
    const statusCode = {} as Code;
    statusCode.code = 'P';
    statusCode.value = 'Pending';
    claimDetail.statusCode = statusCode;
    claimDetail.billOfLadingDate = this.shipmentHistory()?.shipmentDetail?.actualShipDate ?? '';
    claimDetail.deliveryDate = this.shipmentHistory()?.shipmentDetail?.actualDeliveryDate ?? '';
    claimDetail.billOfLadingCarrier = this.shipmentHistory()?.shipmentDetail?.bolNumber ?? '';

    if (this.shipmentHistory()?.shipmentDetail?.proNumber) {
      const claimDocuments = {} as ClaimDocument;
      claimDocuments.documentType = 'Freight Bill (PRO) Document';
      claimDocuments.display = this.shipmentHistory()?.shipmentDetail?.proNumber ?? '';
      claimDocuments.dateOf = formatDate(this.currentDate, 'yyyy-MM-dd', 'en', '');
      claimDetail.claimDocuments = [claimDocuments];
    }

    cargoClaim.claimDetails = [claimDetail];

    this.ccs.createClaim(cargoClaim).subscribe({
      next: response => {
        this.isClaimOpened = true;
        this.claimNumber = response[0]?.claimNumber;
        this.claimStatus = cargoClaim.claimDetails[0].statusCode.value;

        let note = {
          notText: 'Claim Opened. ' + this.claimNumber,
          notCognitoUsername: this.userName,
          notID: null,
          notTimeStamp: new Date(),
          clientNote: false,
          isNeedsManagement: false
        } as Note;
        this.rs.addNote(this.shipmentID(), false, note).subscribe();
        this.spinner.hide();
        Swal.fire(this.claimNumber, 'Claim Opened Successfully.', 'success').then(
          result => {
            if (result.isConfirmed || result.isDismissed) {
              document.location.reload();
            }
          }
        );
      },
      error: (error) => {
        this.spinner.hide();
        Swal.fire('', 'Failed to Create Claim. ' + error, 'error');
      }
    });
  }

  getClaimByShipmentID(shipmentID: string) {
    this.ccs.getClaim(shipmentID).subscribe({
      next: response => {
        if (response.claimNumber) {
          this.isClaimOpened = true;
          this.claimNumber = response.claimNumber;
          this.claimStatus = response.statusCode.value;
        } else {
          this.isClaimOpened = false;
        }
      }
    });
  }

  truncateString(data: string) {
    return data.substring(0, 40).trim();
  }

  addressCheck(address: string) {
    let result = {
      line1: address,
      line2: ''
    };

    if (address && address.length > 40) {
      result.line1 = address.substring(0, 40);
      result.line2 = address.substring(40);
    }
    return result;
  }

  showCarrierName() {
    let carrierName = this.shipmentHistory()?.carrierDetail?.carrierName?.toUpperCase() ?? '';
    if (this.shipmentHistory()?.manualQuotes && (this.shipmentHistory()?.manualQuotes?.length ?? 0) > 0) {
      for (let savedRate of (this.shipmentHistory()?.manualQuotes ?? [])) {
        if (savedRate.assigned == true) {
          carrierName = savedRate.carrierName ?? '';
          break;
        }
      }
    }
    return carrierName + ' ' + (this.shipmentHistory()?.carrierDetail?.scac != null ? '(' +
      (this.shipmentHistory()?.carrierDetail?.scac?.toUpperCase() ?? '') + ')' : '');
  }

  changeException(event: any, input: any) {
    if (event.value != '') { $('#' + input).removeClass('invalid'); }
  }

  getTrackingContactsEvent(event: any) {
    if (this.shipmentHistory()?.trackingContacts) this.shipmentHistory()!.trackingContacts = event;
  }

  scrollTo(el: any) {
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
    }
  }

  validatingTrackingContacts() {
    let validMails = true;
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (this.shipmentHistory()?.trackingContacts && (this.shipmentHistory()?.trackingContacts.length ?? 0) > 0 &&
      !this.disabledTrackingContacts()) {
      let index = 0;
      for (const trackingContact of (this.shipmentHistory()?.trackingContacts ?? [])) {
        if (trackingContact.emailAddress && trackingContact.emailAddress !== '') {
          if (reg.test(trackingContact.emailAddress)) {
            $('#emailAddressLTL-' + index).removeClass('is-invalid')
              .removeClass('invalid-mail');
          } else {
            $('#emailAddressLTL-' + index).addClass('is-invalid')
              .addClass('invalid-mail');
            this.scrollTo(document.querySelector('input#emailAddressLTL-' + index));
            validMails = false;
          }
          const elementName = '#trackingEventsLTL-' + index;
          if (!trackingContact.eventProfile?.booked && !trackingContact.eventProfile?.delivered) {
            $(elementName).addClass('is-invalid');
            $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #dc3545 !important');
            this.scrollTo(document.querySelector('input' + elementName));
            validMails = false;
          } else {
            $(elementName).removeClass('is-invalid');
            $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #adadad !important');
          }
        } else {
          if (trackingContact.FirstName || trackingContact.LastName || trackingContact.mobilePhoneNumber ||
            trackingContact.eventProfile?.booked || trackingContact.eventProfile?.delivered) {
            $('#emailAddressLTL-' + index).addClass('is-invalid').addClass('invalid-mail');
            this.scrollTo(document.querySelector('input#emailAddressLTL-' + index));
            validMails = false;
          }
        }
        index = index + 1;
      }
    }
    return validMails;
  }

  disabledTrackingContacts() {
    return !(this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'PENDING' ||
      this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'PREBOOKED' ||
      this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'FINDING_QUOTES' ||
      this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'QUOTE_SENT_TO_CLIENT' ||
      this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'COMPLETE' ||
      this.shipmentHistory()?.shipmentDetail?.shipmentStatus === 'REQUEST_FOR_QUOTE');
  }
}
