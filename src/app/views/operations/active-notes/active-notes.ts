import {Component, OnInit, ViewChild} from '@angular/core';
import {Global} from '../../../common/global';
import {GroupInfo} from '../../../interfaces/group-info';
import {ClientDropdown} from '../../../components/client-dropdown/client-dropdown';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../../../constants/constants';
import {CarrierDetail} from '../../../interfaces/carrier-detail';
import {CarrierProfilingService} from '../../../services/carrier-profiling/carrier-profiling.service';
import {ActiveNotes} from '../../../interfaces/active-notes';
import {NgxSpinnerService} from 'ngx-spinner';
import Swal from 'sweetalert2';
import {ActivatedRoute, Router} from '@angular/router';
import {ActiveNotesService} from '../../../services/active-notes/active-notes.service';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-active-notes',
  standalone: false,
  templateUrl: './active-notes.html',
  styleUrl: './active-notes.css',
})
export class ActiveNotesComponent implements OnInit {
  @ViewChild(ClientDropdown) clientDropdown!: ClientDropdown;
  public activeNotesForm!: FormGroup;
  clientCode = '';
  currentClient: string | null = '';
  currentGroupName: string | undefined = '';
  currentGroupID: number | null = null;
  groupInfo!: GroupInfo | null;
  carrierList: CarrierDetail[] = [] as CarrierDetail[];
  stateDropdown: string[] = [];
  global = Global;
  noteID: any;
  activeNotes!: ActiveNotes;
  userName!: string;

  constructor(private fb: FormBuilder, private cps: CarrierProfilingService, private spinner: NgxSpinnerService,
              private route: ActivatedRoute, private router: Router, private ans: ActiveNotesService,
              public authenticator: AuthenticatorService) {
    this.noteID = this.route.snapshot.paramMap.get('noteID');
  }

  get availableCarrierList() {
    let carrierList: any[] = [];
    this.carrierList.forEach(value => {
      carrierList.push(value.carrierName);
    });
    return carrierList;
  }

  ngOnInit(): void {
    if (this.noteID != null) { this.spinner.show('activeNotesSpinner').then(); }
    Constants.FULL_STATE_DROPDOWN.forEach(value => {
      this.stateDropdown.push(value.item);
    });

    this.activeNotesForm = this.fb.group({
      clientCode: [''],
      groupID: [''],
      shipperState: [''],
      consigneeState: [''],
      carrierID: [''],
      carrierName: [''],
      note: ['', Validators.required]
    });

    this.setUser();

    if (this.noteID != null) {
      this.setEditActiveNote();
    } else {
      this.getCarrierList();
    }
  }

  getCarrierList() {
    this.carrierList.length = 0;
    this.cps.getAvailableCarriers().subscribe({
      next: response => {
        for (const carrier of response) {
          if (carrier.tiberID && carrier.tiberID > 0) { this.carrierList.push(carrier); }
        }
        if (this.activeNotes?.carrierID && this.activeNotes?.carrierID > 0) {
          this.activeNotesForm.get('carrierID')?.setValue(this.activeNotes.carrierID);
          this.activeNotesForm.get('carrierName')?.setValue(this.activeNotes.carrierName);
        }
      }
    });
  }

  // When a client plant is selected, use (this.clientDropdown.groupInfo) to collect any information needed
  groupEventHandler($event: GroupInfo) {
    this.groupInfo = $event;
    this.currentGroupID = this.clientDropdown.groupForm.get('plant')?.value !== '' ? this.groupInfo.groupID : null;
    this.clientCode = this.groupInfo.clientCode;
    this.activeNotesForm.get('clientCode')?.setValue(this.groupInfo.clientCode);
    this.activeNotesForm.get('groupID')?.setValue(this.currentGroupID);
  }

  onClientChange() {
    this.groupInfo = null;
    this.currentGroupID = null;
    this.clientCode = this.clientDropdown.groupForm.get('client')?.value !== '' ?
      this.clientDropdown.groupForm.get('client')?.value.split('-')[0] : '';
    this.activeNotesForm.get('clientCode')?.setValue(this.clientCode);
    this.activeNotesForm.get('groupID')?.setValue(this.currentGroupID);
  }

  setControlValue(value: any, controlName = '') {
    if (controlName === 'carrierID') {
      this.activeNotesForm.get('carrierID')?.setValue(this.getCarrierValue(value));
      this.activeNotesForm.get('carrierName')?.setValue(value);
    }
    if (controlName === 'shipperState') {
      this.activeNotesForm.get('shipperState')?.setValue(value);
    }
    if (controlName === 'consigneeState') {
      this.activeNotesForm.get('consigneeState')?.setValue(value);
    }
  }

  onClickDeleteActiveNote() {
    Swal.fire({
      title: 'Are you sure you want to delete this note?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#28a745',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteActiveNote();
      } else {
        return;
      }
    });
  }

  onClickSaveActiveNote() {
    if (!this.activeNotesForm.valid) {
      $('#notesText').addClass('is-invalid');
      return;
    }

    if ((this.activeNotesForm.get('clientCode')?.value == null || this.activeNotesForm.get('clientCode')?.value == '') &&
      (this.activeNotesForm.get('groupID')?.value == null || this.activeNotesForm.get('groupID')?.value == '') &&
      (this.activeNotesForm.get('carrierID')?.value == null || this.activeNotesForm.get('carrierID')?.value == '') &&
      (this.activeNotesForm.get('shipperState')?.value == null || this.activeNotesForm.get('shipperState')?.value == '') &&
      (this.activeNotesForm.get('consigneeState')?.value == null || this.activeNotesForm.get('consigneeState')?.value == '')) {
        Swal.fire('',
        '<i style="font-weight: bold;">Please select at least one of these: Client, Carrier, Locations</i>',
        'warning').then();
      return;
    }

    this.spinner.show('activeNotesSpinner').then();

    const activeNote: ActiveNotes = {
      id: this.noteID ?? null,
      clientCode: this.activeNotesForm.get('clientCode')?.value,
      groupID: this.activeNotesForm.get('groupID')?.value,
      carrierID: this.activeNotesForm.get('carrierID')?.value ? this.activeNotesForm.get('carrierID')?.value : null,
      shipperState: this.activeNotesForm.get('shipperState')?.value,
      consigneeState: this.activeNotesForm.get('consigneeState')?.value,
      user: this.userName,
      note: this.activeNotesForm.get('note')?.value
    };

    if (this.noteID != null) {
      this.updateActiveNote(activeNote);
    } else {
      this.addActiveNote(activeNote);
    }
  }

  addActiveNote(activeNote: ActiveNotes) {
    this.ans.saveActiveNote(activeNote).subscribe({
      error: () => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Add active note', 'Add active note could not be completed', 'warning').then();
      },
      complete: () => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Note created', 'Note created successfully', 'success').then(() => {
          this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
            this.router.navigate(['SPAs/notes/list']);
          });
        });
      }
    });
  }

  updateActiveNote(activeNote: ActiveNotes) {
    this.ans.updateActiveNote(activeNote).subscribe({
      error: () => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Update active note', 'Update active note could not be completed', 'warning').then();
      },
      complete: () => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Note updated', 'Note updated successfully', 'success').then(() => {
          this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
            this.router.navigate(['SPAs/notes/list']);
          });
        });
      }
    });
  }

  setEditActiveNote() {
    this.ans.getActiveNote(this.noteID).subscribe({
      next: (response: any) => {
        this.activeNotes = response;
      },
      error:() => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Something went wrong trying to load the note', '', 'warning').then(() => {
          this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
            this.router.navigate(['SPAs/notes/list']).then();
          });
        });
      }, complete:() => {
        this.clientCode = this.activeNotes.clientCode;
        this.currentClient = this.activeNotes.clientCode ? this.activeNotes.clientCode + '-' + this.activeNotes.clientName : null;
        this.currentGroupName = this.activeNotes.groupName;
        this.currentGroupID = this.activeNotes.groupID;
        this.clientDropdown.currentClient = this.activeNotes.clientCode + '-' + this.activeNotes.clientName;
        this.clientDropdown.currentGroup = this.activeNotes.groupID;
        this.clientDropdown.setClientList();

        this.activeNotesForm.get('groupID')?.setValue(this.activeNotes.groupID);
        this.activeNotesForm.get('clientCode')?.setValue(this.activeNotes.clientCode);
        this.activeNotesForm.get('shipperState')?.setValue(this.activeNotes.shipperState);
        this.activeNotesForm.get('consigneeState')?.setValue(this.activeNotes.consigneeState);
        this.activeNotesForm.get('carrierID')?.setValue(this.activeNotes.carrierID);
        this.activeNotesForm.get('carrierName')?.setValue(this.activeNotes.carrierName);
        this.activeNotesForm.get('note')?.setValue(this.activeNotes.note);

        this.getCarrierList();
        this.spinner.hide('activeNotesSpinner').then();
      }
    });
  }

  deleteActiveNote() {
    this.spinner.show('activeNotesSpinner').then();
    this.ans.deleteActiveNote(this.noteID).subscribe({
      next:() => {
        this.spinner.hide('activeNotesSpinner').then();
        this.router.navigateByUrl('/SPAs', {skipLocationChange: true}).then(() => {
          this.router.navigate(['SPAs/notes/list']).then();
        });
      },
      error: () => {
        this.spinner.hide('activeNotesSpinner').then();
        Swal.fire('Delete active note', 'Delete active note could not be completed', 'error').then();
      }
    });
  }

  getCarrierValue(name: string) {
    let val: any = '';
    if (name) {
      for (const carrier of this.carrierList) {
        if (carrier.carrierName == name) {
          val = carrier.tiberID;
          break;
        }
      }
    }
    return val;
  }

  setUser() {
    this.authenticator.subscribe(() => {
      this.userName = this.authenticator?.user?.username ?? null;
    });
  }
}

