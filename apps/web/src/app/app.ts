import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PersonalShifts } from './personal-shifts';

@Component({
  imports: [MatButtonModule, MatCardModule, MatToolbarModule, PersonalShifts],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
