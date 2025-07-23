import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemsMenuComponent } from '../systems-menu/systems-menu';
import { ReleaseListComponent } from '../release-list/release-list';
import { ReleaseDetailComponent } from '../release-detail/release-detail';
import { StateService, Theme } from '../services/state.service';
import { AuthService, User } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    SystemsMenuComponent,
    ReleaseListComponent,
    ReleaseDetailComponent
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  private themeSubscription!: Subscription;
  private menuCollapseSubscription!: Subscription;
  private userSubscription!: Subscription;
  
  isMenuCollapsed = false;
  currentUser: User | null = null;
  showUserMenu = false;

  constructor(
    private stateService: StateService, 
    private renderer: Renderer2,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.themeSubscription = this.stateService.theme$.subscribe(theme => {
      this.updateTheme(theme);
    });

    this.menuCollapseSubscription = this.stateService.isMenuCollapsed$.subscribe(collapsed => {
      this.isMenuCollapsed = collapsed;
    });

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
    this.menuCollapseSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }

  toggleTheme() {
    this.stateService.toggleTheme();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    this.showUserMenu = false;
    this.authService.logout();
  }

  closeUserMenu() {
    this.showUserMenu = false;
  }

  private updateTheme(theme: Theme) {
    if (theme === 'dark') {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}