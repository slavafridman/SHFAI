import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { IdentityResponseV1 } from './contract';
import { id } from './contract';

/** Navigation only. Selected resource context is never an authentication claim. */
@Component({
  selector: 'shf-employee-name',
  imports: [RouterLink],
  template: `
    @if (allowed()) {
      <a [id]="opener()" class="employee-card-link"
        [routerLink]="['/employees', employeeId(), 'operational-card']"
        [attr.aria-label]="firstName() + ' ' + lastName() + ' — כרטיס עובד/ת'">
        <bdi dir="auto">{{ firstName() }} {{ lastName() }}</bdi><small>כרטיס עובד/ת</small>
      </a>
    } @else {
      <bdi dir="auto">{{ firstName() }} {{ lastName() }}</bdi>
      <small class="unavailable">כרטיס עובד/ת — אין הרשאה זמינה</small>
    }
  `,
  styles: [`
    :host { display:inline-block; max-inline-size:100%; overflow-wrap:anywhere; }
    a { display:inline-flex; flex-direction:column; justify-content:center; min-block-size:48px;
      min-inline-size:48px; color:var(--primary, #0067a5); text-underline-offset:3px; }
    small { display:block; font-size:.78em; font-weight:normal; }
    .unavailable { color:#526473; }
    a:focus-visible { outline:3px solid #0067a5; outline-offset:2px; border-radius:4px; }
  `],
})
export class EmployeeName {
  readonly employeeId = input.required<string>();
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly principal = input<IdentityResponseV1 | null>(null);
  readonly opener = input.required<string>();
  allowed() { return id(this.employeeId()) && !!this.principal()?.principal.capabilities.includes('employee:read'); }
}
