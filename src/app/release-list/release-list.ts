import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReleaseNote, ReleaseItem, NavigationItem } from '../models/release.model';
import { StateService } from '../services/state.service';
import { ReleaseDataService } from '../services/release-data.service';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-release-list',
  imports: [CommonModule],
  templateUrl: './release-list.html',
  styleUrls: ['./release-list.scss'],
  animations: [
    trigger('contentSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ]),
    trigger('itemSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('{{delay}}ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: '0' } })
    ])
  ]
})
export class ReleaseListComponent implements OnInit, OnDestroy {
  releaseNote$!: Observable<ReleaseNote | undefined>;
  selectedReleaseItemId: string | null = null;
  selectedNavItem: NavigationItem | null = null;
  contentAnimationState = 'initial';
  
  private releaseItemSubscription!: Subscription;
  private navItemSubscription!: Subscription;

  constructor(
    private stateService: StateService,
    private releaseDataService: ReleaseDataService
  ) { }

  ngOnInit() {
    this.releaseNote$ = this.stateService.selectedSystem$.pipe(
      switchMap(system => {
        this.contentAnimationState = 'loaded';
        if (system) {
          return this.releaseDataService.getReleaseNotes(system.id);
        }
        return new Observable<undefined>();
      })
    );

    this.releaseItemSubscription = this.stateService.selectedReleaseItem$.subscribe(item => {
      this.selectedReleaseItemId = item ? item.id : null;
    });

    this.navItemSubscription = this.stateService.selectedNavItem$.subscribe(navItem => {
      this.selectedNavItem = navItem;
    });
  }

  ngOnDestroy() {
    this.releaseItemSubscription.unsubscribe();
    this.navItemSubscription.unsubscribe();
  }

  selectReleaseItem(item: ReleaseItem) {
    this.stateService.setSelectedReleaseItem(item);
  }

  trackByItem(index: number, item: ReleaseItem): string {
    return item.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  isNewRelease(dateString: string): boolean {
    const releaseDate = new Date(dateString);
    const today = new Date();
    
    // 오늘 날짜와 비교 (시간 제외)
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const releaseDateOnly = new Date(releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate());
    
    return todayDateOnly.getTime() === releaseDateOnly.getTime();
  }
}
