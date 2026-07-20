import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-shipment-access-denied',
  standalone: false,
  templateUrl: './shipment-access-denied.html',
  styleUrl: './shipment-access-denied.css',
})
export class ShipmentAccessDenied implements OnInit {

  constructor(private router: Router, public authenticator: AuthenticatorService) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      //this.router.navigateByUrl('SPAs/new');
      this.authenticator.signOut({ global: true });
      this.router.navigate([""]).then();
    }, 5000);
  }
}
