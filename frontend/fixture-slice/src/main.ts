import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, RouterOutlet } from '@angular/router';
import { routes } from './routes';

@Component({
  selector: 'shf-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class App {}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
  ],
}).catch(() => {
  document.body.textContent = 'לא ניתן להפעיל את התצוגה. יש לטעון מחדש את העמוד.';
});
