import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { System, ReleaseItem, NavigationItem } from '../models/release.model';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly _selectedSystem = new BehaviorSubject<System | null>(null);
  readonly selectedSystem$ = this._selectedSystem.asObservable();

  private readonly _selectedReleaseItem = new BehaviorSubject<ReleaseItem | null>(null);
  readonly selectedReleaseItem$ = this._selectedReleaseItem.asObservable();

  private readonly _selectedNavItem = new BehaviorSubject<NavigationItem | null>(null);
  readonly selectedNavItem$ = this._selectedNavItem.asObservable();

  private readonly _theme = new BehaviorSubject<Theme>('light');
  readonly theme$ = this._theme.asObservable();

  // Navigation state for animations
  private readonly _isNavigating = new BehaviorSubject<boolean>(false);
  readonly isNavigating$ = this._isNavigating.asObservable();

  // Menu collapse state
  private readonly _isMenuCollapsed = new BehaviorSubject<boolean>(false);
  readonly isMenuCollapsed$ = this._isMenuCollapsed.asObservable();

  setSelectedSystem(system: System | null) {
    this._isNavigating.next(true);
    this._selectedSystem.next(system);
    this.setSelectedReleaseItem(null); // Reset detail when system changes
    
    // Reset navigation state after animation
    setTimeout(() => this._isNavigating.next(false), 300);
  }

  setSelectedReleaseItem(item: ReleaseItem | null) {
    this._isNavigating.next(true);
    this._selectedReleaseItem.next(item);
    
    // Reset navigation state after animation
    setTimeout(() => this._isNavigating.next(false), 250);
  }

  setSelectedNavItem(item: NavigationItem | null) {
    this._selectedNavItem.next(item);
  }

  toggleTheme() {
    this._theme.next(this._theme.value === 'light' ? 'dark' : 'light');
  }

  toggleMenuCollapse() {
    this._isMenuCollapsed.next(!this._isMenuCollapsed.value);
  }

  setMenuCollapsed(collapsed: boolean) {
    this._isMenuCollapsed.next(collapsed);
  }
}
