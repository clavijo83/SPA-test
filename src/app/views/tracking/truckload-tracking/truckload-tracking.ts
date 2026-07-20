import {Component, OnInit, signal} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';
import { UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-truckload-tracking',
  standalone: false,
  templateUrl: './truckload-tracking.html',
  styleUrl: './truckload-tracking.css',
})
export class TruckloadTracking implements OnInit {
  loadedGridCounter = 0;
  truckloadTrackingStatus = signal('truckloadTracking');

  constructor(private spinner: NgxSpinnerService, private utilityService: UtilityService) {
  }

  ngOnInit(): void {
    this.loadedGridCounter = 0;
    this.spinner.show('truckloadTrackingSpinner').then();
    this.utilityService.truckloadTrackingStatus$.subscribe(value => {
      this.truckloadTrackingStatus.set(value);
    });
  }

  requestForQuoteTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForLateQuoteResponsesTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForSubmittedQuotesTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForPrebookedNoteLateTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForPrebookedAndLateTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForPickupDateAndTimePassedTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForAppointmentRequiredTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForMissingTransitUpdateTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForLateDeliveryTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadInTransitRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadProblemRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadDispatchedRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadAllRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForDeliveredNeedsPODTabRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForPrebookedRolledRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadAtPickupRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadAtdeliveryRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadDeliveredRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadPendingRecordCount() {
    this.closeTrackingSpinner();
  }

  requestForTruckloadFailureRecordCount() {
    this.closeTrackingSpinner();
  }

  closeTrackingSpinner() {
    // when a grid is filled it increase the counter, if all grids are filled, we close the spinner.
    // the number is 23 because at the moment there are 24 grids.
    this.loadedGridCounter++;
    if (this.loadedGridCounter >= 8) {
      this.spinner.hide('truckloadTrackingSpinner').then();
      this.loadedGridCounter = 0;
    }
  }

}
