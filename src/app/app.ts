import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('icarus-SPAs');

  constructor(private location: Location) {
    // Add site24x7 monitor only for Production
    // if (environment.production) {
    //   const bodyElement = document.body;
    //   const scriptElement = document.createElement('script');
    //   scriptElement.textContent  = '(function(w,d,s,r,k,h,m){if(w.performance && w.performance.getEntriesByType("timing") && w.performance.getEntriesByType("navigation")) {w[r] = w[r] || function(){(w[r].q = w[r].q || []).push(arguments)};h=d.createElement("script");h.async=true;h.setAttribute("src",s+k);d.getElementsByTagName("head")[0].appendChild(h);(m = window.onerror),(window.onerror = function (b, c, d, f, g) {m && m(b, c, d, f, g),g || (g = new Error(b)),(w[r].q = w[r].q || []).push(["captureException",g]);})}})(window,document,"//static.site24x7rum.com/beacon/site24x7rum-min.js?appKey=","s247r","a488eb1a234edf8edc0e14f078982290");';
    //   bodyElement.appendChild(scriptElement);
    // }
  }

  getLocationPath(): string {
    return this.location.path();
  }
}
