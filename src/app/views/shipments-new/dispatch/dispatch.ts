import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {formatDate} from "@angular/common";
import moment from 'moment';
import {CustomTimePicker} from '../../../components/custom-time-picker/custom-time-picker';
import {environment} from "../../../../environments/environment";
import {ReportsService} from "../../../services/reports/reports.service";
import {ShipmentSaveService} from "../../../services/shipment-save/shipment-save.service";
import {DispatchRequest} from "../../../interfaces/dispatch-request";
import {ActivatedRoute} from "@angular/router";
import {Holidays} from '../../../interfaces/holidays';
import {NgxSpinnerService} from "ngx-spinner";
import {Global} from '../../../common/global';
import {Constants} from "../../../constants/constants";
import Swal from "sweetalert2";
import {Calendar} from '../../../components/calendar/calendar';
import {AuthenticatorService} from "@aws-amplify/ui-angular";
import * as zipToTimezone from 'zipcode-to-timezone';

@Component({
  selector: 'app-dispatch',
  standalone: false,
  templateUrl: './dispatch.html',
  styleUrl: './dispatch.css',
})
export class Dispatch implements OnInit {
  @ViewChild(CustomTimePicker) time!: CustomTimePicker;
  @ViewChild(Calendar) datePicker!: Calendar;
  dispatchForm!: FormGroup;
  public invalidEndTime: boolean = false;
  public minDate!: Date;
  carrierInfo: any;
  shipperZip = '23452' // TODO: Needs to be the real shipper Zip
  shipmentID: any;
  invalidDates: Array<Date> = [];
  isEmailBOLDisabled: boolean = true;
  clientCode: string = '';
  shipperEmail: string = '';
  shipperContact: string = '';
  shipperPhone: string = '';
  BolAttachment: any = [];
  lpTeamEmail: string = 'redteam@il2000.com';
  startHour: string = '08';
  startMin: string = '15';
  endHour: string = '11';
  endMin: string = '15';
  global = Global;
  documentToPrint: string = 'bol';
  dropdownDocuments: string[] = [];
  private currentDate = new Date();
  private userName: string = '';

  constructor(private fb: FormBuilder, private rs: ReportsService, private sss: ShipmentSaveService, private route: ActivatedRoute,
              private spinner: NgxSpinnerService, public authenticator: AuthenticatorService) {
    this.shipmentID = this.route.snapshot.paramMap.get("shipmentID");
    this.shipperZip = history.state.data?.shipper.zip ? history.state.data?.shipper.zip : '23452'
    this.carrierInfo = history.state.data?.carrierDetail ? history.state.data?.carrierDetail : {
      carrierName: "",
      address1: "",
      city: "",
      phone: "",
      state: "",
      postalCode: "",
      holidays: []
    };
    this.carrierInfo.holidays.forEach((holiday: Holidays) => {
      this.invalidDates.push(new Date(holiday.holidayDate));
    });
    this.clientCode = history.state.data?.client?.clientCode ? history.state.data?.client?.clientCode : '';
    this.shipperEmail = history.state.email ? history.state.email : '';
    this.shipperPhone = history.state.phone ? history.state.phone : '';
    this.shipperContact = history.state.contact ? history.state.contact : '';
    this.lpTeamEmail = history.state.data?.client?.lpTeamEmail ? history.state.data?.client?.lpTeamEmail : this.lpTeamEmail;
  }

  get startTime() {
    let startTime = this.time.startTime; // this.dispatchForm.controls['time'].get('startTime')?.value;
    return startTime.hour + ':' + startTime.minute;
  }

  get endTime() {
    let endTime = this.time.endTime; // this.dispatchForm.controls['time'].get('endTime')?.value;
    return endTime.hour + ':' + endTime.minute;
  }

  get endTimeMedian() {
    return this.time.endTime.median; //this.dispatchForm.controls['time'].get('endTime')?.value.median
  }

  get pickupDate() {
    return this.dispatchForm.get('pickupDate')?.value;
  }

  ngOnInit(): void {
    this.minDate = this.currentDate;
    Constants.DOCUMENTS_TO_PRINT.forEach(value => {
      this.dropdownDocuments.push(value.item)
    });
    this.dispatchForm = this.fb.group({
      pickupDate: this.fb.control(this.currentDate),
      contactName: this.fb.control(this.shipperContact),
      contactEmail: this.fb.control(this.shipperEmail),
      contactPhone: this.fb.control(this.shipperPhone),
      specialInstructions: this.fb.control(''),
      typeDocument: this.fb.control(Constants.DOCUMENTS_TO_PRINT[0].item)
    });
    this.setNextShipperLocalTime();
    this.generateBOL(false, true);
    this.setUser();
  }

  isAfterThree() {
    // Get today's date with no time
    let timezone = zipToTimezone.lookup(this.shipperZip); // Ex: America/New_York
    // Make sure timezone is returned, if not just return false
    if (timezone != null) {
      let today = this.currentDate;
      today.setHours(0, 0, 0, 0);

      // Get currently set ship date with no time
      let shipDate = new Date(this.dispatchForm.get('pickupDate')?.value);
      shipDate.setHours(0, 0, 0, 0);
      shipDate.setDate(shipDate.getDate() + 1);

      // Get the local hour of the shipper
      let time = new Date();
      let timeString = time.toLocaleTimeString("it-IT", {timeZone: timezone})
      let localHour = +timeString.split(':')[0];

      // Check if today's date is the same as the ship date and local shipper time is past 3pm
      if (today.getDate() == shipDate.getDate() && localHour >= 15) {
        // TODO: Popup modal whenever true
        $('#unauthorizedModal').modal('show');
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  closeModal() {
    $('#unauthorizedModal').modal('hide');
    $('.modal-backdrop').remove();
  }

  timeLimit(): void {
    let startTime = moment(this.startTime, 'HH:mm');
    // let endMin = moment(this.endTime, 'HH:mm').format('mm');
    let endHour = moment(startTime).add(3, 'hour').format('HH');

    if (this.time.startTimeChange) {
      endHour = endHour === '00' ? '0' : endHour;

      if (parseInt(endHour) >= 0 && parseInt(endHour) <= 11) {
        if (this.endTimeMedian != 'AM') {
          this.time.getMedian('end');
        }
      }

      if (parseInt(endHour) >= 12 && parseInt(endHour) <= 23) {
        if (this.endTimeMedian != 'PM') {
          this.time.getMedian('end');
        }
      }

      //UPDATE END TIME
      // this.dispatchForm.controls['time'].get('endTime')?.setValue({
      //   hour: endHour,
      //   minute: endMin,
      //   median: this.endTimeMedian
      // }, {onlySelf: false, emitEvent: false});
    }

    //CHECK IF WE NEED TO UPDATE END TIME MINUTE
    let endTime = moment(this.endTime, 'HH:mm');
    let hours = moment.duration(endTime.diff(startTime)).asHours();

    if (this.time.startTimeMinChange && (hours < 3)) {
      this.time.setEndMinToStartMin();
    }

    //TIME VALIDATION CHECK
    this.timeLimitCheck();
  }

  dispatchShipment() {
    let pickupDate = this.datePicker.value;
    let readyByTime = this.time.startTime
    let readyByTimeString = readyByTime.hour + readyByTime.minute;
    let pickupByTime = this.time.endTime
    let pickupByTimeString = pickupByTime.hour + pickupByTime.minute;

    let dispatchRequest: DispatchRequest = {
      dispatchMessage: this.dispatchForm.get('specialInstructions')?.value,
      readyBy: readyByTimeString,
      pickupBy: pickupByTimeString,
      shipDate: formatDate(pickupDate ?? this.currentDate, 'yyyy-MM-dd', 'en', ''),
      contactEmail: this.dispatchForm.get('contactEmail')?.value,
      contactName: this.dispatchForm.get('contactName')?.value,
      contactPhone: this.dispatchForm.get('contactPhone')?.value,
    };

    this.spinner.show('dispatchSpinner').then();

    this.sss.dispatchShipment(this.shipmentID, dispatchRequest).subscribe({
      next: () => {
        this.addShipmentHistory()
        Swal.fire('Pickup successfully scheduled', '', 'success').then(() => {
          this.generateBOL(true);
        })
      },
      error: () => {
        this.spinner.hide('dispatchSpinner').then();
        Swal.fire('Unable to schedule shipment pickup', '', 'warning')
      },
      complete: () => {
        this.spinner.hide('dispatchSpinner').then();
      }
    })
  }

  generateBOL(showBOLDoc: boolean = false, showBOLDocOnPageLoad: boolean = false) {
    this.spinner.show('dispatchSpinner').then();
    this.rs.getBOLFromLambda(this.shipmentID, this.documentToPrint).subscribe({
      next: response => {
        // Fallback if lambda fails
        if (response.pdf.length < 2000) {

          if (showBOLDocOnPageLoad) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID, 'bolOnPageLoad', 'width="900,height=900');
          }

          if (showBOLDoc) {
            window.open(environment.ENV_ICARUS_BASE_URL + '/ship/printbol?id=' + this.shipmentID, 'bol', 'width="900,height=900');
            $('#bolModal').modal('show');
          }
        } else {
          let toPdf = this.base64ToBlob(response.pdf);
          let file = new Blob([toPdf], {type: 'application/pdf'});
          let fileURL = URL.createObjectURL(file);

          if (showBOLDocOnPageLoad) {
            window.open(fileURL, 'bolOnPageLoad', 'width="900,height=900');
          }

          if (showBOLDoc) {
            window.open(fileURL, 'bol', 'width="900,height=900');
            $('#bolModal').modal('show');
          }
        }
      },
      error: () => {
        this.spinner.hide('dispatchSpinner').then();
      },
      complete: () => {
        //Enable the email btn once BOL is generated.
        this.isEmailBOLDisabled = false;
        //Generated File Name for Original BOL.
        let originalBOLFileName = '123/' + this.shipmentID.toString() + 'B.pdf';
        this.BolAttachment.push({
          id: null,
          shipmentID: null,
          typeDescription: 'Original BOL',
          fileName: originalBOLFileName,
          entryDate: null,
          typeLetter: null,
          isClientVisible: null
        });
        this.spinner.hide('dispatchSpinner').then();
      }
    });
  }

  base64ToBlob(base64String: string) {
    base64String = 'data:application/pdf;base64,' + base64String;
    let byteString = atob(base64String.split(',')[1]);
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'application/pdf'});
  }

  timeLimitCheck(): void {
    let startTime = moment(this.startTime, 'HH:mm');
    let endTime = moment(startTime).add(3, 'hour');
    let selectedEndTime = moment(this.endTime, 'HH:mm');

    if (selectedEndTime != endTime || selectedEndTime <= startTime) {
      this.invalidEndTime = true;
    }

    if (selectedEndTime > startTime && selectedEndTime >= endTime) {
      this.invalidEndTime = false;
    }
  }

  formValid(): boolean {
    let valid = true;

    if (this.isAfterThree()) {
      valid = false;
    }

    if (this.invalidEndTime) {
      valid = false;
    }

    return valid;
  }

  //Method to Check Start & EndTime Values When Time Picker Median is clicked
  onMedianClick() {
    //TIME VALIDATION CHECK
    this.timeLimitCheck();
  }

  emailBodyMessage() {
    let body = 'BOL for Shipment ID:' + this.clientCode + '-' + this.shipmentID + '\n\n';
    let closingMessage = 'If you have additional questions or requests please contact your Logistics Planner directly at ' +
      this.lpTeamEmail + '\n' + 'or 1-877-373-4525.';
    return body + closingMessage;
  }

  setNextShipperLocalTime() {
    // Make sure timezone is returned
    let timezone = zipToTimezone.lookup(this.shipperZip);
    if (timezone != null) {
      // Get the local hour of the shipper
      let curDate = new Date();
      let timeString = curDate.toLocaleTimeString("it-IT", {timeZone: timezone});
      let localHour = Number(timeString.split(':')[0]);
      let localMin = this.setMinuteInternals(Number(timeString.split(':')[1]));
      if (localMin == '00') {
        localHour = localHour + 1;
      }
      let endLocalHour = Number(localHour) + 3;
      // Set the local hour of the shipper
      this.startHour = this.setHour(localHour);
      this.startMin = localMin;
      this.endHour = this.setHour(endLocalHour);
      this.endMin = this.startMin;
      this.setHourAndMinute(true);
    } else {
      // Set default hour and minutes
      this.setHourAndMinute(false);
    }
  }

  setHour(hour: number) {
    if (hour === 24) {
      return '12';
    }
    if (hour > 24) {
      return (hour - 24).toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      });
    }

    return hour.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    });
  }

  setMinuteInternals(minute: number) {
    if (minute >= 0 && minute <= 14) {
      return '15';
    }
    if (minute >= 14 && minute <= 29) {
      return '30';
    }
    if (minute >= 30 && minute <= 44) {
      return '45';
    }
    return '00';
  }

  setHourAndMinute(shipperTime = false) {

    if (!shipperTime) {
      this.startHour = '08';
      this.startMin = '15';
      this.endHour = '11';
      this.endMin = '15';
    }

    if (this.time?.btnLabelStart) {
      this.time.btnLabelStart = (parseInt(this.startHour) >= 0 && parseInt(this.startHour) <= 11) ? 'AM' : 'PM';
      this.time.btnLabelEnd = (parseInt(this.endHour) >= 0 && parseInt(this.endHour) <= 11) ? 'AM' : 'PM';

      this.time.initStartHours();
      this.time.initEndHours();

      // this.dispatchForm.controls['time'].get('startTime')?.setValue({
      //   hour: this.time.getHour(this.startHour, this.time.startHours),
      //   minute: this.startMin,
      //   median: this.time.btnLabelStart
      // }, {onlySelf: false, emitEvent: true});
      //
      // this.dispatchForm.controls['time'].get('endTime')?.setValue({
      //   hour: this.time.getHour(this.endHour, this.time.endHours),
      //   minute: this.endMin,
      //   median: this.time.btnLabelEnd
      // }, {onlySelf: false, emitEvent: true});
    }
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'typeDocument') {
      this.dispatchForm.get('typeDocument')?.setValue(value);
    }
  }

  setTypeDocument() {
    let doctype = this.dispatchForm.get('typeDocument')?.value;
    for (let docs of Constants.DOCUMENTS_TO_PRINT) {
      if (docs.item == doctype) {
        this.documentToPrint = docs.value
        break;
      }
    }
  }

  addShipmentHistory() {
    let readyByTime = this.time.startTime; // this.dispatchForm.controls['time'].get('startTime')?.value
    let readyByTimeString = readyByTime.hour + ':' + readyByTime.minute;

    let historicalEvent = {
      eventDate: formatDate(this.datePicker.value, 'yyyy-MM-dd', 'en', ''),
      eventTime: readyByTimeString,
      trackingState: 'BOOKED',
      trackingMessage: 'Schedule Pickup',
      currentCity: '',
      currentState: '',
      apiUpdate: false,
      enteredBy: this.userName
    }

    this.rs.addShipmentHistory(this.shipmentID, historicalEvent).subscribe();
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? null;
    });
  }
}
