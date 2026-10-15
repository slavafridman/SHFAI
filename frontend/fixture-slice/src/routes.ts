import { type Routes, type UrlMatcher } from '@angular/router';
import { ShiftDayPage } from './shift-day-page';

// One route configuration keeps the same page/form alive across context commits.
export const shiftDayMatcher: UrlMatcher = segments => {
  if (segments.length === 1 && segments[0].path === 'shift-day')
    return { consumed: segments };
  if (segments.length === 4 && segments[0].path === 'employees' && segments[2].path === 'shift-days')
    return { consumed: segments, posParams: { employeeId: segments[1], shiftDayId: segments[3] } };
  return null;
};
export const routes: Routes = [
  { matcher: shiftDayMatcher, component: ShiftDayPage },
  { path: '', pathMatch: 'full', redirectTo: 'shift-day' },
  { path: '**', redirectTo: 'shift-day' },
];
