import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PersonalShifts } from './personal-shifts';
import { PersonalMessages } from './personal-messages';
import { Employees } from './employees';

@Component({
  imports: [MatButtonModule, MatCardModule, MatToolbarModule, PersonalShifts, PersonalMessages, Employees],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
