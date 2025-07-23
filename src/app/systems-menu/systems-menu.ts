import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCategory, NavigationItem, System } from '../models/release.model';
import { ReleaseDataService } from '../services/release-data.service';
import { StateService } from '../services/state.service';
import { Observable, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-systems-menu',
  imports: [CommonModule],
  templateUrl: './systems-menu.html',
  styleUrls: ['./systems-menu.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        maxHeight: '0px',
        opacity: 0,
        overflow: 'hidden',
        marginBottom: '0px'
      })),
      state('expanded', style({
        maxHeight: '1000px',
        opacity: 1,
        overflow: 'visible',
        marginBottom: '0.5rem'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class SystemsMenuComponent implements OnInit, OnDestroy {
  navigationCategories$!: Observable<NavigationCategory[]>;
  selectedNavId: string | null = null;
  expandedCategories = new Set<string>();
  expandedItems = new Set<string>();
  isMenuCollapsed = false;
  
  private systemSubscription!: Subscription;
  private menuCollapseSubscription!: Subscription;

  constructor(
    private releaseDataService: ReleaseDataService,
    private stateService: StateService
  ) { }

  ngOnInit() {
    this.navigationCategories$ = this.releaseDataService.getNavigationCategories();
    
    // Expand all categories by default for better UX
    this.releaseDataService.getNavigationCategories().subscribe(categories => {
      categories.forEach(category => {
        this.expandedCategories.add(category.id);
      });
    });

    // Listen for system changes to update selected navigation item
    this.systemSubscription = this.stateService.selectedSystem$.subscribe(system => {
      this.selectedNavId = system ? this.findNavIdForSystem(system.id) : null;
    });

    // Listen for menu collapse state changes
    this.menuCollapseSubscription = this.stateService.isMenuCollapsed$.subscribe(collapsed => {
      this.isMenuCollapsed = collapsed;
    });
  }

  ngOnDestroy() {
    this.systemSubscription.unsubscribe();
    this.menuCollapseSubscription.unsubscribe();
  }

  toggleMenuCollapse() {
    this.stateService.toggleMenuCollapse();
  }

  toggleCategory(categoryId: string) {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  handleItemClick(item: NavigationItem) {
    if (item.isSelectable && item.systemId) {
      // Handle selectable item (leaf node)
      this.releaseDataService.getSystemByNavId(item.id).subscribe(system => {
        if (system) {
          this.stateService.setSelectedSystem(system);
          this.stateService.setSelectedNavItem(item);
          this.selectedNavId = item.id;
        }
      });
    } else if (item.children && item.children.length > 0) {
      // Handle non-selectable item with children (toggle expansion)
      if (this.expandedItems.has(item.id)) {
        this.expandedItems.delete(item.id);
      } else {
        this.expandedItems.add(item.id);
      }
    }
  }

  // TrackBy functions for performance
  trackByCategory(index: number, category: NavigationCategory): string {
    return category.id;
  }

  trackByItem(index: number, item: NavigationItem): string {
    return item.id;
  }

  // Helper method to find navigation ID for a system ID
  private findNavIdForSystem(systemId: string): string | null {
    // This would typically be cached or optimized
    const allItems = this.getAllNavigationItems();
    const item = allItems.find(item => item.systemId === systemId);
    return item ? item.id : null;
  }

  private getAllNavigationItems(): NavigationItem[] {
    const items: NavigationItem[] = [];
    this.releaseDataService.getNavigationCategories().subscribe(categories => {
      categories.forEach(category => {
        category.items.forEach(item => {
          items.push(item);
          if (item.children) {
            items.push(...item.children);
          }
        });
      });
    });
    return items;
  }

}
