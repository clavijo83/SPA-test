import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {AuthSession, fetchAuthSession} from "aws-amplify/auth";
import {from, Observable} from "rxjs";
import {switchMap} from "rxjs/operators";
import {environment} from "../../../environments/environment";

// Intercepts any outgoing requests and appends Access Token as an Authorization header
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authRequest: any;

  constructor() {
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(fetchAuthSession()).pipe(
      switchMap((auth: AuthSession) => {
        let idToken: any;
        //SET TOKEN
        if (request.url.includes(environment.ENV_NSYNC_BASE_URL)) {
          // nsync IL token -> internal auth
          idToken = environment.API_TOKEN;
        } else {
          // aws api gateway Cognito token -> user pool
          idToken = auth?.tokens?.idToken?.toString() ?? '';
        }

        //SET HEADERS
        if (request.url.includes(environment.VOLUME_RATES_URL) && !environment.production) {
          this.authRequest = request.clone({
            headers: new HttpHeaders({
              Authorization: idToken
            })
          });
        } else {
          if (request.url.includes(environment.AWS_CLAIM_URL)) {
            this.authRequest = request.clone({
              headers: new HttpHeaders({
                "x-api-key": environment.AWS_CLAIM_API_KEY
              })
            });
          } else {
            this.authRequest = request.clone({
              headers: new HttpHeaders({
                Authorization: idToken
              })
            });
          }
        }
        return next.handle(this.authRequest);
      })
    );
  }
}
