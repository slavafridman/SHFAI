import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PersonalShifts } from './personal-shifts';
import { PersonalMessages } from './personal-messages';
import { Employees } from './employees';
import { Operational } from './operational';
import { Breaks } from './breaks';
import { ShiftPreview } from './shift-preview';
import { Replacement } from './replacement';
import { Staffing } from './staffing';
import { Exceptions } from './exceptions';
import { Reports } from './reports';
import { Buildings } from './buildings';
import { InternalJobs } from './internal-jobs';
import { SystemParameters } from './system-parameters';

@Component({
  imports: [MatButtonModule, MatCardModule, MatToolbarModule, PersonalShifts, PersonalMessages, Employees, Operational, Breaks, ShiftPreview, Replacement, Staffing, Exceptions, Reports, Buildings, InternalJobs, SystemParameters],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
