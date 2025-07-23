import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReleaseItem, BreadcrumbItem, Comment, NavigationItem } from '../models/release.model';
import { StateService } from '../services/state.service';
import { ReleaseDataService } from '../services/release-data.service';

@Component({
  selector: 'app-release-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './release-detail.html',
  styleUrls: ['./release-detail.scss']
})
export class ReleaseDetailComponent implements OnInit, OnDestroy {
  selectedReleaseItem$!: Observable<ReleaseItem | null>;
  breadcrumbs: BreadcrumbItem[] = [];
  comments: Comment[] = [];
  newComment = '';
  currentUser = 'Current User'; // In real app, get from auth service
  
  private subscriptions: Subscription[] = [];

  constructor(
    private stateService: StateService,
    private releaseDataService: ReleaseDataService
  ) { }

  ngOnInit() {
    this.selectedReleaseItem$ = this.stateService.selectedReleaseItem$;

    // Load breadcrumbs when navigation item changes
    const navItemSub = this.stateService.selectedNavItem$.subscribe(navItem => {
      if (navItem) {
        this.releaseDataService.getBreadcrumbForNavItem(navItem.id).subscribe(breadcrumbs => {
          this.breadcrumbs = breadcrumbs;
        });
      }
    });

    // Load comments when release item changes
    const releaseItemSub = this.selectedReleaseItem$.subscribe(item => {
      if (item) {
        this.releaseDataService.getComments(item.id).subscribe(comments => {
          this.comments = comments;
        });
      } else {
        this.comments = [];
      }
    });

    this.subscriptions.push(navItemSub, releaseItemSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addComment() {
    if (!this.newComment.trim()) return;

    this.selectedReleaseItem$.subscribe(item => {
      if (item) {
        const comment = {
          releaseItemId: item.id,
          author: this.currentUser,
          authorAvatar: 'https://github.com/currentuser.png',
          content: this.newComment.trim()
        };

        this.releaseDataService.addComment(comment).subscribe(newComment => {
          this.comments.push(newComment);
          this.newComment = '';
        });
      }
    }).unsubscribe();
  }

  formatDateTime(dateTimeString: string): string {
    return new Date(dateTimeString.replace(' ', 'T')).toLocaleString();
  }

  formatSmartDate(dateTimeString: string): string {
    const date = new Date(dateTimeString.replace(' ', 'T'));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) {
      // Today - show relative time
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffHours < 1) {
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      } else {
        return `${diffHours} hours ago`;
      }
    } else {
      // Other dates - show yyyy-MM-dd format
      return date.toISOString().split('T')[0];
    }
  }
}