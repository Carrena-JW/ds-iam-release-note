import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login')
      .then(c => c.LoginComponent),
    canActivate: [LoginGuard], // Prevent authenticated users from accessing login
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // Protect all child routes
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home')
          .then(c => c.HomeComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home', // Redirect unknown routes to home (will be protected by AuthGuard)
  },
];

