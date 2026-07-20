import {Component, OnInit, ViewChild} from '@angular/core';
import {DataTable} from '../../../../components/data-table/data-table';
import {NgxSpinnerService} from 'ngx-spinner';
import {ActiveNotesService} from '../../../../services/active-notes/active-notes.service';
import {ActiveNotes} from '../../../../interfaces/active-notes';
import {Global} from '../../../../common/global';

@Component({
  selector: 'app-notes-list',
  standalone: false,
  templateUrl: './notes-list.html',
  styleUrl: './notes-list.css',
})
export class NotesList implements OnInit {
  @ViewChild(DataTable) dt!: DataTable;
  sortOrder = [[0, 'desc']];
  reportData: ActiveNotes[] = [];
  global = Global;
  notesTableColumns = [
    {
      title: 'id',
      data: 'id',
      visible: false
    },
    {
      title: 'Client',
      data: 'clientName',
      orderable: true,
      targets: 0,
      width: '7%',
      className: 'dt-nowrap',
      render(data: any) {
        if (data === null) {
          data = '';
        }
        return '<span tabindex="0">' + data.toUpperCase() + '</span>';
      }
    },
    {
      title: 'Plant',
      data: 'groupName',
      orderable: true,
      targets: 1,
      width: '7%',
      className: 'dt-nowrap',
      render(data: any) {
        if (data === null) {
          data = '';
        }
        return '<span tabindex="0">' + data.toUpperCase() + '</span>';
      }
    },
    {
      title: 'Carrier',
      data: 'carrierName',
      orderable: true,
      targets: 2,
      width: '7%',
      className: 'dt-nowrap'
    },
    {
      title: 'Shipper State',
      data: 'shipperState',
      orderable: true,
      targets: 3,
      width: '8%',
      className: 'dt-nowrap'
    },
    {
      title: 'Consignee State',
      data: 'consigneeState',
      orderable: true,
      targets: 4,
      width: '8%',
      className: 'dt-nowrap'
    },
    {
      title: 'Note',
      data: 'note',
      orderable: true,
      targets: 5,
    }
  ];

  constructor(private spinner: NgxSpinnerService, private ans: ActiveNotesService) {
  }

  ngOnInit(): void {
    this.getReportData();
  }

  getReportData() {
    $('#notesListDataTable_wrapper > div:nth-child(1)').css('display', 'none');
    this.spinner.show('notesListSpinner');
    this.reportData.length = 0;
    this.ans.getNotes('').subscribe({
      next: (response: any) => {
        this.reportData = response;
      },
      complete: () => {
        this.dt.reDrawTable(this.reportData);
        $('#notesListDataTable_wrapper > div:nth-child(1)').css('display', 'none');
        this.spinner.hide('notesListSpinner');
      }
    });
  }
}

