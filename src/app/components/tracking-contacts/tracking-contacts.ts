import {Component, input, OnInit, output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {UtilityService} from '../../services/utility/utility.service';
import {EventProfile, TrackingContacts} from '../../interfaces/tracking-contacts';

@Component({
  selector: 'app-tracking-contacts',
  standalone: false,
  templateUrl: './tracking-contacts.html',
  styleUrl: './tracking-contacts.css',
})
export class TrackingContactsComponent implements OnInit {
  trackingContactsFormGroup!: FormGroup;
  shipTrackID = input<number | null>(null);
  trackingContactsMail = input<TrackingContacts[]>([]);
  shipmentType = input('LTL');
  trackingContactsEvent = output<any>();
  disabled = input(false);
  dropdownSettings = {};

  constructor(private ab: FormBuilder, public utilityService: UtilityService) {
  }

  get trackingContacts() {
    return this.trackingContactsFormGroup.get('trackingContacts') as FormArray;
  }

  get trackingEventsData() {
    return [{
      eventID: 21,
      description: 'BOOKED'
    },
      {
        eventID: 110,
        description: 'DELIVERED'
      }];
  }

  ngOnInit() {
    const mailRows = [];

    // initiate drop down settings
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'eventID',
      textField: 'description',
      itemsShowLimit: 5,
      allowSearchFilter: false,
      enableCheckAll: false
    };

    if (this.trackingContactsMail().length > 0) {
      for (const mail of this.trackingContactsMail()) {
        let events = [];
        if (mail.eventProfile && mail.eventProfile.booked) { events.push({
          eventID: 21,
          description: 'BOOKED'
        }); }
        if (mail.eventProfile && mail.eventProfile.delivered) { events.push({
          eventID: 110,
          description: 'DELIVERED'
        }); }
        mailRows.push(
          this.getTrackingContactsData(mail.shipTrackID, mail.FirstName, mail.LastName, mail.emailAddress, mail.mobilePhoneNumber,
            mail.eventProfileFK, mail.shipmentFK, mail.eventProfile, events));
      }
    } else {
      mailRows.push(this.getTrackingContactsData());
    }

    this.trackingContactsFormGroup = this.ab.group({
      trackingContacts: this.ab.array(mailRows)
    });

    for (let index = 0; index < this.trackingContacts.length; index++) {
      const elementName = '#trackingEvents' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index;
      setTimeout(() => {
        $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').css('height', '31px');
      }, 100);
    }
  }

  addTrackingContacts() {
    this.trackingContacts.push(this.getTrackingContactsData());
    const index = (this.trackingContacts.length - 1).toString();
    const elementName = '#trackingEvents' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index;
    setTimeout(() => {
      $(elementName + ' > div > div:nth-child(1) > span.dropdown-btn').css('height', '31px');
    }, 100);
  }

  onChange(event: any, controlName = '', index: number) {
    const value = event.target.value;
    if (controlName === 'emailAddress') {
      this.utilityService.isrequired[index] = value == null || value === '';
      if (value && value !== '') { this.utilityService.isrequired[index] = !this.isValidEmail(index, event); }
      this.checkValidValues();
    }
    this.trackingContactsEvent.emit(this.trackingContacts.value);
  }

  removeControl(index: number) {
    const event: EventProfile = { eventProfileID: null, booked: false, delivered: false };
    const emptyControl = this.ab.group({
      shipTrackID: [null],
      FirstName: [''],
      LastName: [''],
      emailAddress: [''],
      mobilePhoneNumber: [''],
      eventProfileFK: [null],
      shipmentFK: [null],
      eventProfile: [event]
    });

    if (this.trackingContacts.length > 1) {
      this.trackingContacts.removeAt(index);
    } else {
      this.trackingContacts.setControl(0, emptyControl);
    }
  }

  checkValidValues() {
    for (const i in this.utilityService.isrequired) {
      if (this.utilityService.isrequired[i]) {
        this.utilityService.check = true;
        return;
      }
    }
    this.utilityService.check = false;
  }

  isValidEmail(index: number, event: any) {
    const value = event.target.value;
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (value === '' || reg.test(value)) {
      $('#emailAddress' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index)
        .removeClass('is-invalid').removeClass('invalid-mail');
      return true;
    } else {
      $('#emailAddress' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index)
        .addClass('is-invalid').addClass('invalid-mail');
      return false;
    }
  }

  private getTrackingContactsData(shipTrackID: any = null, firstName: any = '', lastName: any = '', emailAddress: any = '',
                                  phoneNumber: any = '', eventProfileID: any = null, shipmentID: any = null,
                                  events: any = { eventProfileID: null, booked: false, delivered: false },
                                  selectedEvent: any = []) {
    return this.ab.group({
      shipTrackID: [shipTrackID],
      FirstName: [firstName],
      LastName: [lastName],
      emailAddress: [emailAddress],
      mobilePhoneNumber: [phoneNumber],
      eventProfileFK: [eventProfileID],
      shipmentFK: [shipmentID],
      eventProfile: [events],
      selectedEvent: [selectedEvent]
    });
  }

  setTrackingEvent(index: number, event: any, checked: boolean = true) {
    const events = this.trackingContacts.at(index).get('eventProfile')?.value;
    if (event.description === 'BOOKED') { events.booked = checked; }
    if (event.description === 'DELIVERED') { events.delivered = checked; }
    if (checked) {
      const elementName1 = '#trackingEvents' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index;
      $(elementName1).removeClass('is-invalid');
      $(elementName1 + ' > div > div:nth-child(1) > span.dropdown-btn').attr('style', 'border-color: #adadad !important');
    }
    const elementName = '#lblTrackingEvents' + (this.shipmentType() === 'LTL' ? 'LTL' : 'TL' + this.shipTrackID()) + '-' + index;
    this.checkMultiSelectValues(elementName, events && events.booked || events.delivered);
    this.trackingContacts.at(index).get('eventProfile')?.setValue(events);
    this.trackingContactsEvent.emit(this.trackingContacts.value);
  }

  // NEEDED FOR MULTI SELECT FLOATING LABEL
  checkMultiSelectValues(elementName: string, showElement: boolean) {
    if (showElement) {
      $(elementName).removeAttr('hidden');
    } else {
      $(elementName).attr('hidden', 'true');
    }
  }
}

