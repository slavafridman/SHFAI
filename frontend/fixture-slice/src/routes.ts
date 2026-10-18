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
  { path: 'employees/:employeeId/shift-days/:shiftDayId/breaks-and-exceptions',
    loadComponent: () => import('./shift-items-page').then(m => m.ShiftItemsPage) },
  { path: 'my-shifts/selected/:employeeId', loadComponent: () => import('./my-shifts-page').then(m => m.MyShiftsPage) },
  { path: 'my-shifts', loadComponent: () => import('./my-shifts-page').then(m => m.MyShiftsPage) },
  { path: 'shift-search', loadComponent: () => import('./shift-search-page').then(m => m.ShiftSearchPage) },
  { path: 'current-shifts', loadComponent: () => import('./current-shifts-page').then(m => m.CurrentShiftsPage) },
  { matcher: shiftDayMatcher, component: ShiftDayPage },
  { path: '', pathMatch: 'full', redirectTo: 'current-shifts' },
  { path: '**', redirectTo: 'current-shifts' },
];
