import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  submitted = false;
  dashboardForm: FormGroup = new FormGroup({
    bolInputControl: new FormControl('', Validators.required)
  });

  constructor() {
  }

  get dashboardFormControl() {
    return this.dashboardForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    let id = this.dashboardForm.get('bolInputControl')?.value
    if (this.dashboardForm.valid) {
      window.open(`SPAs/reports/tracking-details/${id}`, '_blank');
    }
  }
}
