import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import { enableProdMode } from "@angular/core";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

platformBrowser().bootstrapModule(AppModule, {

}).catch(err => console.error(err));
