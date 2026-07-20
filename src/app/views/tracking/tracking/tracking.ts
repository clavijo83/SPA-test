import {Component, OnInit, signal} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';
import {UtilityService} from '../../../services/utility/utility.service';

@Component({
  selector: 'app-tracking',
  standalone: false,
  templateUrl: './tracking.html',
  styleUrl: './tracking.css',
})
export class Tracking implements OnInit {
  loadedGridCounter = 0;
  trackingStatus = signal('All');

  constructor(private spinner: NgxSpinnerService, private utilityService: UtilityService) {
  }

  ngOnInit(): void {
    this.loadedGridCounter = 0;
    this.spinner.show('trackingSpinner').then();
    this.utilityService.trackingStatus$.subscribe(value => {
      this.trackingStatus.set(value);
    });
  }

  closeTrackingSpinner() {
    // when a grid is filled it increase the counter, if all grids are filled, we close the spinner.
    // the number is 10 because at the moment there are 11 grids.
    this.loadedGridCounter++;
    if (this.loadedGridCounter >= 8) {
      this.spinner.hide('trackingSpinner').then();
      this.loadedGridCounter = 0;
    }
  }

  trackingRecordCount() {
    this.closeTrackingSpinner();
  }
}
