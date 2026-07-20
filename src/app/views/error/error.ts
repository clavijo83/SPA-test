import { Component } from '@angular/core';

@Component({
  selector: 'app-error',
  standalone: false,
  templateUrl: './error.html',
  styleUrl: './error.css',
})
export class ErrorComponent {
  errorMessage = 'Error, Page not found.';
}
