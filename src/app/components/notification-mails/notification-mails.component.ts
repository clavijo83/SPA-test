import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import Swal from "sweetalert2";
import {UtilityService} from "../../services/utility/utility.service";
import {NotificationMail} from "../../interfaces/notification-mail";

@Component({
  selector: 'app-notification-mails',
  standalone: false,
  templateUrl: './notification-mails.component.html',
  styleUrl: './notification-mails.component.css',
})
export class NotificationMailsComponent implements OnInit {
  notificationMailFg: FormGroup = new FormGroup({
    notificationMails: new FormArray([])
  });
  @Input() notMailId: number | null = null
  @Input() notMails: NotificationMail[] = [];
  @Input() shipmentType: 'LTL' | 'Truckload' = 'LTL';
  @Output() getNotifications = new EventEmitter<any>(true);
  @Input() disabled?: boolean = false;
  Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  constructor(private ab: FormBuilder, public utilityService: UtilityService) {
  }

  get notificationMails() {
    return this.notificationMailFg.get('notificationMails') as FormArray;
  }

  ngOnInit() {
    let mailRows = [];
    if (this.notMails.length > 0) {
      for (let mail of this.notMails) {
        mailRows.push(this.getNotificationMails(mail['statusNotId'], mail['statusNotEmail']));
      }
    } else {
      mailRows.push(this.getNotificationMails());
    }

    this.notificationMailFg = this.ab.group({
      notificationMails: this.ab.array(mailRows)
    });
  }

  addNotificationMails() {
    this.notificationMails.push(this.getNotificationMails());
  }

  onChange(event: any, controlName = '', index: number) {
    let value = event.target.value
    if (controlName === 'statusNotEmail') {
      this.utilityService.isrequired[index] = value == null || value === '';
      if (value && value !== '') this.utilityService.isrequired[index] = !this.isValidEmail(index, event)
      this.checkValidValues()
    }
    this.getNotifications.emit(this.notificationMails.value)
  }

  removeControl(index: number) {
    let emptyControl = this.ab.group({
      statusNotId: [null],
      statusNotEmail: ['']
    });

    if (this.notificationMails.length > 1) {
      this.notificationMails.removeAt(index);
    } else {
      this.notificationMails.setControl(0, emptyControl);
    }
  }

  checkValidValues() {
    for (let i in this.utilityService.isrequired) {
      if (this.utilityService.isrequired[i]) {
        this.utilityService.check = true;
        return
      }
    }
    this.utilityService.check = false;
  }

  isValidEmail(index: any, event: any) {
    let value = event.target.value
    const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (value == '' || reg.test(value)) {
      $('#statusNotEmail' + (this.shipmentType == 'LTL' ? 'LTL' : 'TL' + this.notMailId) + '-' + index).removeClass('is-invalid').removeClass('invalid-mail')
      return true
    } else {
      $('#statusNotEmail' + (this.shipmentType == 'LTL' ? 'LTL' : 'TL' + this.notMailId) + '-' + index).addClass('is-invalid').addClass('invalid-mail')
      return false
    }
  }

  private getNotificationMails(statusNotId: number | null = null, statusNotEmail: any = '') {
    return this.ab.group({
      statusNotId: [statusNotId],
      statusNotEmail: [statusNotEmail]
    });
  }
}
