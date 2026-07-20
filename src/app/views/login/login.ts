import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticatorService} from '@aws-amplify/ui-angular';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  currentUserName: any;
  hideBtn = false;

  constructor(public authenticator: AuthenticatorService, private route: Router) {
  }

  // User already logged in, route to dashboard
  ngOnInit() {
    sessionStorage.clear();
    this.hideBtn = false;
    this.authenticator.subscribe(() => {
      this.currentUserName = this.authenticator?.user?.username ?? null;
      if (this.currentUserName) {
        this.hideBtn = true;
        this.route.navigateByUrl("SPAs/new").then();
      } else {
        console.log("Login not found");
      }
    });
  }

  refreshAuth () {
    this.hideBtn = true;
    if (this.authenticator.authStatus == "unauthenticated") this.authenticator.signOut();
  }
}
