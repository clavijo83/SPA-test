import {Component, model, signal} from '@angular/core';
import {ActiveNotes} from "../../interfaces/active-notes";
import {ActiveNotesService} from "../../services/active-notes/active-notes.service";
import Swal from "sweetalert2";

@Component({
  selector: 'app-active-notes-view',
  standalone: false,
  templateUrl: './active-notes-view.html',
  styleUrl: './active-notes-view.css',
})
export class ActiveNotesView {
  clientCode = model('');
  groupID = model('');
  carrierID = model('');
  shipperState = model('');
  consigneeState = model('');
  collapseNotes = signal(false);
  notes = signal<ActiveNotes[]>([]);

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

  constructor(private ans: ActiveNotesService) {
  }

  getNotes(param: string, value: string, group: string = '') {
    if (value == null) return;

    if (param == "clientCode") {
      this.clientCode.set(value);
      this.groupID.set(group);
    }
    if (param == "carrierID") this.carrierID.set(value);
    if (param == "shipperState") this.shipperState.set(value);
    if (param == "consigneeState") this.consigneeState.set(value);

    let searchParams: any = {
      clientCode: this.clientCode(),
      groupID: this.groupID(),
      carrierID: this.carrierID(),
      shipperState: this.shipperState(),
      consigneeState: this.consigneeState()
    }

    let queryParams = Object.keys(searchParams).map(key => searchParams[key] !== '' ? key + '=' + searchParams[key] : '').filter(key => key !== '' && key != null).join('&');

    this.ans.getNotes(queryParams).subscribe({
      next: response => {
        let uniqueNotes = response as ActiveNotes[];
        this.notes.set(uniqueNotes.filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i));
      }
    });
  }

  resetParams() {
    this.clientCode.set('');
    this.groupID.set('');
    this.carrierID.set('');
    this.shipperState.set('');
    this.consigneeState.set('');
  }

  clickCollapseExpand(collapse: boolean, name: string) {
    this.collapseNotes.set(collapse);
    $('#' + name).tooltip('hide');
  }

  clickEditNotes(edit: boolean, id: any, originalNote: string = '') {
    $('#btnEditNotes' + id).css('display', edit ? 'none' : 'inline-block');
    $('#btnDeleteNotes' + id).css('display', edit ? 'none' : 'inline-block');
    $('#btnCancelNotes' + id).css('display', edit ? 'inline-block' : 'none');
    $('#btnSaveNotes' + id).css('display', edit ? 'inline-block' : 'none');
    if (edit) {
      $('#txtNotes' + id).removeAttr('disabled');
    } else {
      $('#txtNotes' + id).attr('disabled', 'true').val(originalNote);
    }
  }

  clickSaveNotes(note: ActiveNotes, id: any) {
    note.note = $('#txtNotes' + id).val()?.toString().trim() ?? '';
    this.ans.updateActiveNote(note).subscribe({
      next: () => {
        this.Toast.fire({
          icon: 'success',
          title: 'Note updated successfully'
        })
      },
      error: () => {
        this.Toast.fire({
          icon: 'warning',
          title: 'Note could not be updated'
        })
      },
      complete: () => {
        this.clickEditNotes(false, id, note.note)
      }
    });
  }

  clickDeleteNotes(id: any, note: ActiveNotes) {
    this.ans.deleteActiveNote(id).subscribe({
      next: () => {
        this.notes.update(() => this.notes().filter(item => item.id !== id));
        this.Toast.fire({
          icon: 'success',
          title: 'Note deleted successfully'
        })
      },
      error: () => {
        this.Toast.fire({
          icon: 'warning',
          title: 'Note could not be deleted'
        })
      },
      complete: () => {
        this.clickEditNotes(false, id, note.note)
      }
    });
  }
}

