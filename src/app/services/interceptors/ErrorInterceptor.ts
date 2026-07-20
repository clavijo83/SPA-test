import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {Router} from '@angular/router';

// Used to log a user out when their session is expired, and they make a request
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((e) => {
        console.log('HttpErrorResponse', e);

        if (e?.status?.toString() == '401') {
          console.log('401 Unauthorized');
          this.router.navigateByUrl('SPAs/shipment-access-denied').then();
          return throwError(() => new Error('Unauthorized')); // Re-throw the error
        }

        if (e?.status?.toString() == '403') {
          console.log('403 Forbidden');
          return throwError(() => new Error('Forbidden')); // Re-throw the error
        }

        let errorMessage = '';
        if (e && e?.response && e?.response?.status) {
          const statusCode = e?.response?.status ?? '';

          if (statusCode?.toString() === '401') {
            console.log('Unauthorized');
            this.router.navigateByUrl('SPAs/shipment-access-denied').then();
            return throwError(() => new Error('Unauthorized')); // Re-throw the error
          }

          if (statusCode?.toString() === '403') {
            console.log('Forbidden');
            return throwError(() => new Error('Forbidden')); // Re-throw the error
          }
        }

        if (e?.error?.error) {
          // Client-side validation error
          errorMessage = e?.error?.error ?? 'ErrorInterceptor: Unknown Error';
        } else if (e?.error?.message) {
          // Client-side error
          errorMessage = e?.error?.message ?? 'ErrorInterceptor: Unknown Error';
        } else if (e?.message) {
          // Client-side error
          errorMessage = e?.message ?? 'ErrorInterceptor: Unknown Error';
        } else if (e?.error) {
          // Client-side error
          errorMessage = e?.error ?? 'ErrorInterceptor: Unknown Error';
        } else {
          // Server-side error
          errorMessage = 'ErrorInterceptor: Unknown Error';
        }
        console.log(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
