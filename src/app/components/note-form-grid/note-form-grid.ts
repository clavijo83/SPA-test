import {
  AfterViewInit,
  Component,
  Injectable,
  input, model,
  OnInit, output,
  signal,
  ViewChild
} from '@angular/core';
import {DataTable} from '../data-table/data-table';
import {Note} from "../../interfaces/note";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ReportsService} from "../../services/reports/reports.service";
import moment from "moment";
import {TrackingService} from "../../services/tracking/tracking.service";
import Swal from "sweetalert2";
import {GroupsService} from "../../services/groups/groups.service";
import {ActiveNotesService} from "../../services/active-notes/active-notes.service";
import {Constants} from "../../constants/constants";
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-note-form-grid',
  standalone: false,
  templateUrl: './note-form-grid.html',
  styleUrl: './note-form-grid.css',
})
@Injectable()
export class NoteFormGrid implements OnInit, AfterViewInit {
  shipmentId = input<number | null>(null);
  expand = input(false);
  priority = model('');
  noteForm!: FormGroup;
  disableNoteBtn: boolean = true;
  notes: Note[] = [] as Note[];
  noteTableColumns: any;
  sortOrder: any;
  isTextAreaFocused = output<boolean>();
  @ViewChild(DataTable) dt!: DataTable;
  isInternalUser = signal(false)
  truckloadDetailsPage = false;
  shipmentType = input<'LTL' | 'Truckload'>('LTL');
  lastClientNote = output<string>();
  setPriority = output<string>();
  isNoteDeleteDisabled = true;
  private shipmentWasElevatedFlag = false;
  private shipmentWasExpeditedFlag = false;
  private userName: string = '';

  constructor(private fb: FormBuilder, private rs: ReportsService, private ts: TrackingService,
              private gs: GroupsService, private ans: ActiveNotesService, private authenticator: AuthenticatorService) {
    this.gs.isValidPermission().then(data => {
      this.isInternalUser.update(() => data);
    });
  }

  ngOnInit(): void {
    // TODO: Is IL2000 user, might need to change group in future
    this.noteForm = this.fb.group({
      notesText: this.fb.control(''),
      isClientNote: this.fb.control(false),
      isElevated: this.fb.control(this.priority() === 'ELEVATED'),
      isNeedsManagement: this.fb.control(false),
      isExpedited: this.fb.control(this.priority() === 'EXPEDITED')
    });

    //title is column name  - data is datafield
    this.noteTableColumns =
      [
        {
          title: 'Date',
          data: 'notTimeStamp',
          type: 'date',
          render: function (data: any) {
            let timezoneMap: any = Constants.TIMEZONE_MAP
            let timezoneOffset = moment(data).utcOffset();
            let timezone =  timezoneMap[timezoneOffset] || '';
            return data ? moment(data).format('MM/DD/YYYY hh:mm:ss A ') + timezone : '-';
          },
          width: "20%"
        },
        {
          title: 'Notes',
          data: 'notText',
          render: (data: any) => {
            if (data && data != '') {
              return data.replace(/\r\n/g, "<p style='margin-bottom: 0;' />");
            } else {
              return ''
            }
          }
        },
        {
          title: 'User Name',
          data: 'notCognitoUsername',
          width: '10%'
        },
        {
          orderable: false,
          title: '',
          data: 'clientNote',
          width: '3%',
          render: (data: any) => {
            if (data === true) {
              return '<i class="material-icons" style="font-size: 12px; width: 12px">message</i>';
            } else {
              return ''
            }
          }
        },
        {
          orderable: false,
          title: '',
          data: 'isNeedsManagement',
          width: '3%',
          render: (data: any) => {
            if (data === true) {
              return '<i class="material-icons" style="font-size: 12px; width: 12px">push_pin</i>';
            } else {
              return ''
            }
          }
        },
        {
          orderable: false,
          title: 'NoteID',
          data: 'notID',
          width: '5%'
        }
      ];

    //set column sort order [index,order]
    this.sortOrder = [[0, 'desc'], [1, 'desc']];
    this.getNotes();
    this.getUserName();

    if (window.location.toString().includes("truckload-details")) {
      this.truckloadDetailsPage = true;
    }
  }

  deleteNote() {
    // let noteID = document.getElementById('deleteNote-'+this.shipmentId())?.value
    let noteID = $('#deleteNote-' + this.shipmentId() + ' option:selected').val();

    if (noteID && this.shipmentId()) {
      this.ans.deleteShipmentNote(this.shipmentId()?.toString() ?? '', noteID.toString(), this.userName).subscribe({
        next: () => {
          this.notes.length = 0;
          this.getNotes();
          // document.getElementById('deleteNote-'+this.shipmentId()).value = 'Select Note to Delete'
          $('#deleteNote-' + this.shipmentId()).val('Select Note to Delete')
          if (this.notes.length == 0) {
            this.isNoteDeleteDisabled = true;
          }
        }
      })
    }
  }

  onChangeNote(data: any) {
    data.value = data.value === " " ? null : data.value;
    this.disableNoteBtn = data.value === '' || data.value === null;
  }

  addNewNote(notesText = '') {
    notesText = notesText === '' ? this.noteForm.get('notesText')?.value.trim() : notesText;

    if (notesText !== "") {
      if (this.noteForm.get('isElevated')?.value && this.noteForm.get('isExpedited')?.value) {
        Swal.fire('Add note', '<i>Cannot select to Elevate and Expedite Shipment. Please select only one.</i>', 'warning').then()
      } else {
        this.disableNoteBtn = true;
        this.noteForm.get('notesText')?.setValue('', {onlySelf: true, emitEvent: false});
        if (this.noteForm.get('isElevated')?.value == true) {
          document.getElementById('elevate-button-id')?.classList.add('btn-success');
          document.getElementById('elevate-button-id')?.classList.add('elevate-shipment');
          if (this.shipmentWasElevatedFlag) {
            this.addNoteService(this.shipmentId(), this.noteForm.get('isClientNote')?.value, false, 'Shipment Priority changed from ' + this.priority().toUpperCase() + ' to ELEVATED with note: ' + notesText);
          }
        }
        if (this.noteForm.get('isExpedited')?.value == true) {
          document.getElementById('expedite-button-id')?.classList.add('btn-success');
          document.getElementById('expedite-button-id')?.classList.add('expedite-shipment');
          if (this.shipmentWasExpeditedFlag) {
            this.addNoteService(this.shipmentId(), this.noteForm.get('isClientNote')?.value, false, 'Shipment Priority changed from ' + this.priority().toUpperCase() + ' to EXPEDITED with note: ' + notesText);
          }
        }
        if (this.noteForm.get('isNeedsManagement')?.value == true) {
          this.addNoteService(this.shipmentId(), this.noteForm.get('isClientNote')?.value, this.noteForm.get('isNeedsManagement')?.value, 'Shipment marked needs management with note: ' + notesText);
        }
        if (!this.shipmentWasElevatedFlag && !this.shipmentWasExpeditedFlag) {
          this.addNoteService(this.shipmentId(), this.noteForm.get('isClientNote')?.value, this.noteForm.get('isNeedsManagement')?.value, notesText);
        }
        this.shipmentWasExpeditedFlag = false;
        this.shipmentWasElevatedFlag = false;
      }
      this.noteForm.get('isClientNote')?.setValue(false);
    }

    this.notes.length = 0;
    this.getNotes();
    this.addNewEntry()
  }

  //Updates data when there is a new entry to the table
  addNewEntry() {
    this.getLastNote()
    this.dt.rerender();
  }

  getNotes() {
    if (this.shipmentId() === null || this.shipmentId() === undefined) {
      this.notes = [];
    } else {
      if (this.notes.length > 0) this.notes.length = 0;
      this.rs.getNotes(this.shipmentId() ?? 0).subscribe({
        next: (response: Note[]) => {
          let shipNotes: Note[] = response as Note[];
          for (let shipNote of shipNotes) {
            let shipNoteDate = new Date(shipNote.notTimeStamp ?? '');
            shipNote.notTimeStamp = new Date(shipNoteDate.getTime() - (shipNoteDate.getTimezoneOffset() * 60000));
            if (shipNote.notCognitoUsername == null)
              shipNote.notCognitoUsername = 'Tiber';
            this.notes.push(shipNote);
          }
          this.dt.rerender();
        }
      });
    }
  }

  //Get Auths for Notes
  getUserName() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? '';
    });
  }

  addNoteService(shipmentId: any = null, isClientNote = false, isNeedsManagement = false, noteString = '', priority = true) {
    let note = {
      notText: noteString,
      notCognitoUsername: this.userName,
      notTimeStamp: null,
      notID: null,
      isNeedsManagement,
      clientNote: isClientNote
    };
    let todayDate: Date = new Date();

    this.notes.push({
      notID: null,
      notTimeStamp: todayDate,
      notText: note.notText,
      isNeedsManagement: note.isNeedsManagement,
      notCognitoUsername: note.notCognitoUsername,
      clientNote: isClientNote
    });

    this.ts.updateLastUpdated(shipmentId).subscribe();

    this.rs.addNote(shipmentId, isClientNote, note).subscribe({
      next: () => {
        this.notes.length = 0;
        this.getNotes();
      },
      complete: () => {
        if (priority) this.updatePriority();
      }
    });
  }

  headerClicked(id: any) {
    let hideIcon = '#openIcon' + id;
    let closeIcon = '#closeIcon' + id
    if ($(hideIcon).is(":visible")) {
      $(hideIcon).hide();
      $(closeIcon).show();
    } else {
      $(hideIcon).show();
      $(closeIcon).hide();
    }
  }

  ngAfterViewInit() {
    if (this.expand()) {
      if (document.getElementById("cardHeader")) {
        document.getElementById("cardHeader")?.click();
      }
    }
  }

  noteType(ctrlName: string = '') {
    let controlValue = this.noteForm.get(ctrlName)?.value;
    if (controlValue === false) {
      this.noteForm.get(ctrlName)?.setValue(true);
      if (ctrlName == 'isElevated') {
        this.shipmentWasElevatedFlag = true;
      } else if (ctrlName == 'isExpedited') {
        this.shipmentWasExpeditedFlag = true;
      }
    } else {
      this.noteForm.get(ctrlName)?.setValue(false);
      if (ctrlName == 'isElevated') {
        this.shipmentWasElevatedFlag = false;
      } else if (ctrlName == 'isExpedited') {
        this.shipmentWasExpeditedFlag = false;
      }
    }
  }

  textAreaFocus(type: string = '') {
    if (type === 'in') {
      this.isTextAreaFocused.emit(true);
    }
    if (type === 'out') {
      this.isTextAreaFocused.emit(false);
    }
  }

  updatePriority() {
    //UPDATE SHIPMENT PRIORITY
    if ((this.noteForm.get('isElevated')?.value && this.noteForm.get('isExpedited')?.value == false) ||
      (this.noteForm.get('isElevated')?.value === false && this.noteForm.get('isExpedited')?.value)) {
      let priority: string = '';

      if (this.noteForm.get('isElevated')?.value) {
        priority = 'ELEVATED'
      }
      if (this.noteForm.get('isExpedited')?.value) {
        priority = 'EXPEDITED'
      }

      let shipmentDetail = {
        priority: priority
      }
      this.rs.updateTrackingShipmentDetails(this.shipmentId()?.toString() ?? '', shipmentDetail).subscribe({
        next: () => {
          this.priority.update(() => priority);
          this.setPriority.emit(priority)
        }
      });
    }
  }

  getLastNote() {
    let note = '-'
    if (this.notes.length > 0) {
      let clientnotes = this.notes.sort((a, b) => b.notTimeStamp!.getTime() - a.notTimeStamp!.getTime()).filter(x => x.clientNote);
      if (clientnotes.length > 0) {
        note = clientnotes[0].notText ?? ''
      }
    }
    this.lastClientNote.emit(note)
  }
}
