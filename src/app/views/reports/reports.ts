import {Component, OnInit, ViewChild} from '@angular/core';
import {Global} from '../../common/global';
import {Constants} from '../../constants/constants';
import {formatDate} from '@angular/common';
import {ShipmentRecord} from '../../interfaces/shipment-record';
import {ReportsService} from '../../services/reports/reports.service';
import Swal from 'sweetalert2';
import {NgxSpinnerService} from 'ngx-spinner';
import {ReportsSearch} from './reports-search/reports-search';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  @ViewChild(ReportsSearch) searchComponent!: ReportsSearch;
  existingOpenReferenceFields: any[] = [];
  newRefName = '';
  newRefValue = '';
  poNumber: string | null = null;
  soNumber: string | null = null;
  clientCode = '';
  referenceDropDown: any[] = [];
  global = Global;
  reportData: any = null;
  clients: any;
  clientDropdownValues: any[] = [];

  constructor(private rs: ReportsService, private spinner: NgxSpinnerService, private route: ActivatedRoute) {
    this.reportData = history.state.data ?  history.state.data : null;
    this.clients = this.route.snapshot.data["clients"];
    if (this.clients.length > 0) {
      this.setDropdownOptions();
    }
  }

  ngOnInit(): void {
    this.referenceDropDown = Constants.SEARCH_REFERENCE_FIELD_DROPDOWN;
    if (this.reportData) {
      this.global.recordStatus.set('recordsAll');
      if (this.searchComponent) {
        this.searchComponent.searchRecords(this.reportData);
      } else {
        setTimeout(() => { this.searchComponent.searchRecords(this.reportData); }, 1000);
      }
    }
  }

  setDropdownOptions() {
    // REDUCE TO REMOVE DUPLICATE CLIENT CODES
    const client = this.clients.reduce((accumulator: any[], current: any) => {
      if (!accumulator.some(item => item.clientCode === current.clientCode)) {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    // GROUP CLIENTS WITH PLANTS
    client.forEach((c: any) => {
      this.clientDropdownValues.push({name: c.clientCode + '-' + c.companyName, value: c.clientCode});
    });
  }

  toDatePicker(description: string) {
    if (description === 'MABD') {
      return 'date';
    } else {
      return 'text';
    }
  }

  addReferences() {
    this.existingOpenReferenceFields = this.existingOpenReferenceFields ? this.existingOpenReferenceFields : [];
    if (this.newRefValue && this.newRefName) {
      const newRef = {
        rftID: this.getOpenRefByName(this.newRefName).rftID,
        value: this.newRefName === 'MABD' ? formatDate(this.newRefValue, 'MM/dd/yyyy', 'en') : this.newRefValue,
        rftDescription: this.newRefName,
        rftAbbreviation: this.getOpenRefByName(this.newRefName).rftAbbreviation,
      };
      this.existingOpenReferenceFields.push(newRef);
      this.newRefName = '';
      this.newRefValue = '';
    }
  }

  removeReferences(i: number) {
    this.existingOpenReferenceFields = this.existingOpenReferenceFields.filter((value, index) => index != i);
  }

  setReferenceName(value: any) {
    this.newRefName = value;
  }

  referenceDropdownList() {
    const referenceList: string[] = [];
    this.referenceDropDown.forEach(ref => {
      referenceList.push(ref.rftDescription);
    });
    return referenceList;
  }

  updateExistingOpenReference(newValue: any, type: string, refIndex: number) {
    if (this.existingOpenReferenceFields.length !== 0) {
      this.existingOpenReferenceFields.forEach((val, index) => {
        if (refIndex === index) {
          if (type === 'description') {
            // SET UPDATED VALUES
            val.rftID = this.getOpenRefByName(newValue).rftID;
            val.rftDescription = this.getOpenRefByName(newValue).rftDescription;
            val.rftAbbreviation = this.getOpenRefByName(newValue).rftAbbreviation;
            val.value = this.getOpenRefByName(newValue).rftDescription === 'MABD' && val.value != '' ?
              formatDate(val.value, 'MM/dd/yyyy', 'en') : val.value;
          } else {
            // SET NEW REFERENCE VALUE
            val.value = newValue.target.value;
          }
        }
      });
    }
  }

  getOpenRefByName(refName: string) {
    let openRef = {
      rftID: null,
      rftDescription: null,
      rftAbbreviation: null
    };
    this.referenceDropDown.forEach(ref => {
      if (ref.rftDescription == refName) {
        openRef.rftID = ref.rftID;
        openRef.rftDescription = ref.rftDescription;
        openRef.rftAbbreviation = ref.rftAbbreviation;
      }
    });
    if (!openRef.rftID) { openRef = this.getOpenRefByID(52); } // if rftID null then return by default Reference #
    return openRef;
  }

  getOpenRefByID(rftID: number) {
    let openRef = {
      rftID: null,
      rftDescription: null,
      rftAbbreviation: null
    };
    this.referenceDropDown.forEach(ref => {
      if (ref.rftID == rftID) {
        openRef.rftID = ref.rftID;
        openRef.rftDescription = ref.rftDescription;
        openRef.rftAbbreviation = ref.rftAbbreviation;
      }
    });
    return openRef;
  }

  focusOutReferenceName(event: any, index: any = null) {
    const newRefName = event.target.value && event.target.value !== '' ? event.target.value : 'Reference #';
    if (index) {
      this.updateExistingOpenReference(newRefName, 'description', index);
    }
  }

  onClickClear() {
    this.existingOpenReferenceFields = [];
    this.newRefName = '';
    this.newRefValue = '';
    this.poNumber = null;
    this.soNumber = null;
    this.clientCode = '';
  }

  onClickSearch() {
    let saveOpenRef = [];
    if (this.existingOpenReferenceFields != null && typeof this.existingOpenReferenceFields !== 'undefined') {
      this.existingOpenReferenceFields.forEach(ref => {
        saveOpenRef.push({
          orfID: -1,
          rftID: ref.rftID,
          shipmentID: -1,
          value: ref.value,
          rftDescription: ref.rftDescription,
          rftAbbreviation: ''
        });
      });
    }

    if (this.newRefValue && this.newRefName) {
      saveOpenRef.push({
        orfID: -1,
        rftID: this.getOpenRefByName(this.newRefName).rftID,
        shipmentID: -1,
        value: this.newRefName === 'MABD' ? formatDate(this.newRefValue, 'MM/dd/yyyy', 'en') : this.newRefValue,
        rftDescription: this.newRefName,
        rftAbbreviation: ''
      });
    }

    const searchFields = {
      poNumber: this.poNumber,
      soNumber: this.soNumber,
      clientCode: this.clientCode,
      openReferenceFields: saveOpenRef
    };

    if ((this.poNumber || this.soNumber && this.clientCode !== '') || saveOpenRef.length > 0) {
      this.spinner.show('recordsSpinner');
      this.rs.getRecordsShipmentSearch(searchFields).subscribe({
        next: response => {
          this.spinner.hide('recordsSpinner');
          const reportData: ShipmentRecord[] = response as ShipmentRecord[];
          if (reportData.length > 0) {
            this.global.recordStatus.set('recordsAll');
            this.searchComponent.searchRecords(reportData);
          } else {
            Swal.fire('', 'No Records Found', 'info');
          }
        },
        error: e => {
          this.spinner.hide('recordsSpinner');
          Swal.fire('', 'No Records Found' + (e ? ': ' + e : ''), 'info');
        }
      });
    }
  }

  recordsCompleteTabCount(value: number) {
    this.global.recordsCompleteCount.set(value);
  }

  recordsPendingTabCount(value: number) {
    this.global.recordsPendingCount.set(value);
  }

  recordsIncompleteTabCount(value: number) {
    this.global.recordsIncompleteCount.set(value);
  }
}

