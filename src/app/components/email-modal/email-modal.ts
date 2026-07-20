import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Email} from '../../interfaces/email';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ReportsService} from '../../services/reports/reports.service';
import {UploadService} from '../../services/upload/upload.service';
import {EmailService} from '../../services/email/email.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {InternalGroupService} from '../../services/internal-group/internal-group.service';
import {Note} from '../../interfaces/note';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-email-modal',
  standalone: false,
  templateUrl: './email-modal.html',
  styleUrl: './email-modal.css',
})
export class EmailModal implements OnInit {
  @Output() eventEmailSent: EventEmitter<any> = new EventEmitter<any>();
  @Input() BOLNumber = '';
  @Input() emailBody = '';
  @Input() noteEmailBody: string | null = null;
  @Input() documentType: string | null = '';
  @Input() attachments: any = [];
  @Input() btnLabel = 'Email';
  @Input() btnClassType = 'Primary';
  @Input() fromEmailAddress = 'redteam@il2000.com';
  @Input() ccSender = false;
  @Input() ccEmail: string | null = null;
  @Input() emailSubject = '';
  @Input() toEmailAddress = '';
  @Input() disableBtn = true;
  @Input() customStyling!: string;
  @Input() isHtml = false;
  @Input() sendingManualDoc = false;
  @Input() truckBOLs: any[] = [];
  @Input() htmlEmailBody = '';
  @Input() identifierType = 'LTL';
  @Input() hideDocumentUpload = false;
  @Input() emailModalLabel = 'New Message';
  @Input() emailIcon = false;
  @Input() emailIconLight = false;
  @Input() hideModalButton = false;
  @Input() disableButton = false;
  @Input() clientCode = '';
  @Input() reloadAfterSend = true;
  @Input() hideBtn = false;
  emailForm!: FormGroup;
  emailError = false;
  private user: any;
  selectedFile: File | null = null;
  emailSent = false;
  todayDate!: Date;
  imageBills: any = [];
  noteString = '';
  @Input() emailModalName = 'EmailComponent';
  private emailData: any;
  messageError = 'Error Sending Email - Message Not Sent';

  constructor(private fb: FormBuilder,
              private rs: ReportsService,
              private emailService: EmailService,
              private spinner: NgxSpinnerService,
              private igs: InternalGroupService,
              private us: UploadService,
              public authenticator: AuthenticatorService) {
  }

  get emailControls() {
    return this.emailForm.get('email') as FormGroup;
  }

  ngOnInit(): void {
    this.todayDate = new Date();
    this.todayDate.setSeconds(0);
    this.getUserName();

    this.fromEmailAddress = this.fromEmailAddress ? this.fromEmailAddress : 'redteam@il2000.com';
    this.emailForm = this.fb.group({
      email: this.getEmailControls()
    });

    if (this.clientCode !== '') {
      this.getClientGroupEmail();
    }
  }

  // add a document upload type in the email form modal
  documentUploadType(event: Event) {
    this.documentType = (event.target as HTMLInputElement).value
    // set the current email subject in modal to document an upload type with shipment id
    this.emailForm.get('email')?.get('emailSubject')?.setValue(this.emailSubject + ' : ' + this.documentType, {
      onlySelf: true,
      emitEvent: false
    });
  }

  getUserName() {
    this.authenticator.subscribe(() => {
      this.user = this.authenticator?.user ?? null;
      if (this.user) {
        return this.user.username;
      }
    });
  }

  determineAbbreviatedType(value: string | null) : any {
    if (value != null) {
      this.documentType = value;
    }
    if (this.documentType === 'Bill of Lading') {
      return 'B';
    }
    if (this.documentType === 'Carrier Confirmation') {
      return 'CC';
    }
    if (this.documentType === 'Client Quote') {
      return 'CQ';
    }
    if (this.documentType === 'Quote Response') {
      return 'QR';
    }
    if (this.documentType === 'Tracking Response') {
      return 'TR';
    }
    if (this.documentType === 'Insurance Certificate') {
      return 'IC';
    }
    if (this.documentType === 'Proof of Delivery') {
      return 'PD';
    }
    if (this.documentType === 'Other' || this.documentType === 'Other Document') {
      return 'OT';
    }
    if (value != null) {
      this.documentType = null;
    }
  }

  setFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  sendEmail(modalActive = true) {
    const abbreviatedType = this.determineAbbreviatedType(null);
    this.messageError = 'Error Sending Email - Message Not Sent';
    const sender = this.emailForm.get('email')?.get('emailFrom')?.value;
    const recipient = this.emailForm.get('email')?.get('emailTo')?.value;
    const subject = this.emailForm.get('email')?.get('emailSubject')?.value;
    if (sender === '' || sender == null || recipient === '' || recipient == null || subject === '' || subject == null) {
      if (sender === '' || sender == null) { this.messageError = 'Error Sending Email - Sender is missing.'; }
      if (recipient === '' || recipient == null) { this.messageError = 'Error Sending Email - Recipient is missing.'; }
      if (subject === '' || subject == null) { this.messageError = 'Error Sending Email - Subject is missing.'; }
      this.emailError = true;
      return;
    }

    let email = this.emailControls.controls;
    this.emailData = {
      from: email["emailFrom"].value,
      toAddress: email["emailTo"].value,
      ccSender: this.ccSender,
      ccEmail: this.ccEmail,
      subject: email["emailSubject"].value,
      message: this.isHtml ? this.htmlEmailBody : email["emailBody"].value,
      imageBills: this.attachments,
      isHtml: this.isHtml
    };
    const emailValues = this.emailData as Email;
    if (modalActive) { this.spinner.show('emailModal'); }

    // Upload and send file with email
    if (this.selectedFile) {
      let formData = new FormData();
      formData.append('file', this.selectedFile);
      if (this.emailData.message.includes('Truck ID:')) {
        this.identifierType = 'TL';
      }
      this.us.uploadFile(formData, this.BOLNumber, abbreviatedType, this.identifierType, 'ilconnect-manual-docs',
        this.identifierType + '/', this.selectedFile.name).subscribe({
        next: response => {
          this.emailService.sendEmailWithManualDoc(emailValues, this.documentType, response.key).subscribe({
            next: () => {
              this.emailSentNotes();
            },
            error: () => {
              if (modalActive) { this.spinner.hide('emailModal'); }
              this.emailError = true;
              this.emailSent = false;
            },
            complete: () => {
              this.emailComplete(modalActive);
              if (this.reloadAfterSend) {
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }
          });
        }
      });
      // Send email of an already uploaded document
    } else if (this.sendingManualDoc) {
      if (this.emailData.message.includes('Truck ID:')) {
        this.identifierType = 'TL';
      }
      const documentAbbreviatedType = this.determineAbbreviatedType(this.documentType);
      const key = this.identifierType + '/' + this.BOLNumber + '-' + documentAbbreviatedType + '-' + this.identifierType + '.pdf';
      this.emailService.sendEmailWithManualDoc(emailValues, this.documentType, key).subscribe({
        next: () => {
          this.emailSentNotes();
        },
        error: () => {
          this.spinner.hide('emailModal');
          this.emailError = true;
          this.emailSent = false;
        },
        complete: () => {
          this.emailComplete(modalActive);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      });
    } else {
      // Send email of an auto-generated document
      this.emailService.sendEmail(emailValues).subscribe({
        next: () => {
          this.emailSentNotes();
        },
        error: () => {
          this.spinner.hide('emailModal');
          this.emailError = true;
          this.emailSent = false;
        },
        complete: () => {
          this.emailComplete(modalActive);
          if (this.reloadAfterSend) {
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        }
      });
    }
  }

  onModalCloseClick() {
    this.messageError = 'Error Sending Email - Message Not Sent';
    this.emailForm.get('email')?.reset();
    this.imageBills = [];
    this.initializeEmailControls(this.fromEmailAddress, this.emailSubject, this.toEmailAddress, this.emailBody);
    this.emailSent = false;
    this.emailError = false;
    this.noteString = '';
    $('#emailModal' + this.emailModalName).modal('hide');
  }

  getEmailAttachmentBody() {
    this.initializeEmailControls(this.fromEmailAddress, this.toEmailAddress, this.emailSubject, this.emailBody);
  }

  getEmailControls() {
    return this.fb.group({
      emailFrom: this.fb.control(''),
      emailTo: this.fb.control(''),
      emailSubject: this.fb.control(''),
      emailBody: this.fb.control('')
    });
  }

  initializeEmailControls(emailFromAddress: any, emailToAddress: any, emailSubject: any, emailBody: any) {
    this.emailForm.get('email')?.get('emailFrom')?.setValue(emailFromAddress, {onlySelf: true, emitEvent: false});
    this.emailForm.get('email')?.get('emailSubject')?.setValue(emailSubject, {
      onlySelf: true,
      emitEvent: false
    });
    this.emailForm.get('email')?.get('emailTo')?.setValue(emailToAddress, {onlySelf: true, emitEvent: false});
    this.emailForm.get('email')?.get('emailBody')?.setValue(emailBody, {onlySelf: true, emitEvent: false});
  }

  emailSentNote() {
    let notesText: string;
    notesText = this.noteString.slice(0, -1) + ' ' + 'sent to' + ' ' + this.emailForm.get('email')?.get('emailTo')?.value;
    this.eventEmailSent.emit(notesText);
  }

  getClientGroupEmail() {
    this.igs.getClientDropdown().subscribe({
      next: response => {
        // REDUCE TO REMOVE DUPLICATE CLIENT CODES
        const client = response.reduce((accumulator: any, current: any) => {
          if (!accumulator.some((item: any) => item.clientCode === current.clientCode)) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);
        client.forEach((c: any) => {
          if (this.clientCode == c.clientCode) {
            this.fromEmailAddress = c.groupTeamEmail ? c.groupTeamEmail : 'redteam@il2000.com';
          }
        });
      }
    });
  }

  emailSentNotes() {
    const note: Note = {
      notID: null,
      notTimeStamp: this.todayDate,
      notText: 'Email sent from (' + this.emailData.from + ') to (' + this.emailData.toAddress + ') with subject matter (' +
        this.emailData.subject + '). ' + (this.noteEmailBody ? '\r\n Message: ' + this.noteEmailBody : ''),
      isNeedsManagement: false,
      notCognitoUsername: this.user.username ?? '',
      clientNote: false
    } as Note;

    if (this.truckBOLs.length > 0) {
      for (const ShipmentID of this.truckBOLs) {
        this.rs.addNote(ShipmentID, false, note).subscribe();
      }
    } else if (this.BOLNumber !== '') {
      this.rs.addNote(Number(this.BOLNumber), false, note).subscribe();
    }
    this.noteEmailBody = null;
  }

  emailComplete(modalActive: boolean) {
    this.emailError = false;
    this.emailSent = true;
    this.emailSentNote();
    this.spinner.hide('emailModal');
    if (modalActive) {
      const closeEmail = 'close-email' + this.emailModalName;
      const messageSent = 'MessageSent' + this.emailModalName;
      const closeSuccess = 'close-success' + this.emailModalName;

      setTimeout(() => {
        document.getElementById(closeEmail)?.click();
      }, 1000);

      setTimeout(() => {
        document.getElementById(messageSent)?.click();
      }, 1000);

      setTimeout(() => {
        document.getElementById(closeSuccess)?.click();
      }, 3000);
    }
  }
}
