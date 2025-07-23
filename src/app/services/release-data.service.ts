import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { System, ReleaseNote, NavigationCategory, NavigationItem, BreadcrumbItem, Comment } from '../models/release.model';

@Injectable({
  providedIn: 'root'
})
export class ReleaseDataService {

  private systems: System[] = [
    { id: 'sys-a', name: 'System A' },
    { id: 'sys-b', name: 'System B' },
    { id: 'sys-c', name: 'System C' },
    { id: 'sys-d', name: 'System D' },
    { id: 'sys-e', name: 'System E' },
    { id: 'sys-f', name: 'System F' }
  ];

  private navigationCategories: NavigationCategory[] = [
    {
      id: 'development',
      name: 'Development',
      icon: 'code',
      items: [
        {
          id: 'frontend',
          name: 'Frontend Systems',
          icon: 'web',
          isSelectable: false,
          children: [
            { id: 'sys-a', name: 'Web Application', systemId: 'sys-a', isSelectable: true, icon: 'app' },
            { id: 'sys-b', name: 'Mobile App', systemId: 'sys-b', isSelectable: true, icon: 'phone' }
          ]
        },
        {
          id: 'backend',
          name: 'Backend Services',
          icon: 'server',
          isSelectable: false,
          children: [
            { id: 'sys-c', name: 'API Gateway', systemId: 'sys-c', isSelectable: true, icon: 'api' },
            { id: 'sys-d', name: 'Microservices', systemId: 'sys-d', isSelectable: true, icon: 'service' }
          ]
        }
      ]
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: 'cloud',
      items: [
        {
          id: 'deployment',
          name: 'Deployment Systems',
          icon: 'deploy',
          isSelectable: false,
          children: [
            { id: 'sys-e', name: 'CI/CD Pipeline', systemId: 'sys-e', isSelectable: true, icon: 'pipeline' }
          ]
        },
        { id: 'sys-f', name: 'Monitoring Platform', systemId: 'sys-f', isSelectable: true, icon: 'monitor' }
      ]
    }
  ];

  private releaseNotes: ReleaseNote[] = [
    {
      systemId: 'sys-a',
      items: [
        { 
          id: 'a-1', 
          version: '1.0.0', 
          date: '2025-07-20', 
          title: 'Initial Release', 
          content: '<h1>Initial Release of Web Application</h1><p>This is the first version of our web application system.</p>',
          author: 'John Smith',
          department: 'Frontend Development',
          publishedAt: '2025-07-20 14:30:25'
        },
        { 
          id: 'a-2', 
          version: '1.1.0', 
          date: '2024-07-21', 
          title: 'Feature Update', 
          content: '<h2>Feature Update 1.1.0</h2><ul><li>Added new feature X</li><li>Improved performance</li></ul>',
          author: 'Jane Doe',
          department: 'Product Team',
          publishedAt: '2024-07-21 09:15:42'
        }
      ]
    },
    {
      systemId: 'sys-b',
      items: [
        { 
          id: 'b-1', 
          version: '2.0.0', 
          date: '2024-07-19', 
          title: 'Major Release', 
          content: '<h1>Mobile App 2.0.0</h1><p>Complete overhaul of the mobile UI.</p>',
          author: 'Sarah Wilson',
          department: 'Mobile Development',
          publishedAt: '2024-07-19 16:45:33'
        }
      ]
    },
    {
      systemId: 'sys-c',
      items: [
        { id: 'c-1', version: '1.0.0', date: '2024-07-18', title: 'API Gateway Launch', content: '<h1>API Gateway Initial Release</h1><p>Centralized API management system.</p>' }
      ]
    },
    {
      systemId: 'sys-d',
      items: [
        { id: 'd-1', version: '1.2.0', date: '2024-07-17', title: 'Microservices Update', content: '<h1>Microservices 1.2.0</h1><p>Enhanced service discovery and load balancing.</p>' }
      ]
    },
    {
      systemId: 'sys-e',
      items: [
        { id: 'e-1', version: '3.0.0', date: '2024-07-16', title: 'CI/CD Pipeline Upgrade', content: '<h1>CI/CD Pipeline 3.0.0</h1><p>Faster deployment with enhanced security.</p>' }
      ]
    },
    {
      systemId: 'sys-f',
      items: [
        { id: 'f-1', version: '2.1.0', date: '2024-07-15', title: 'Monitoring Enhancement', content: '<h1>Monitoring Platform 2.1.0</h1><p>Real-time metrics and alerting improvements.</p>' }
      ]
    }
  ];

  constructor() { }

  getSystems(): Observable<System[]> {
    return of(this.systems);
  }

  getNavigationCategories(): Observable<NavigationCategory[]> {
    return of(this.navigationCategories);
  }

  getSystemByNavId(navId: string): Observable<System | undefined> {
    // Find navigation item and return corresponding system
    for (const category of this.navigationCategories) {
      for (const item of category.items) {
        if (item.systemId && item.id === navId) {
          const system = this.systems.find(s => s.id === item.systemId);
          return of(system);
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.systemId && child.id === navId) {
              const system = this.systems.find(s => s.id === child.systemId);
              return of(system);
            }
          }
        }
      }
    }
    return of(undefined);
  }

  getReleaseNotes(systemId: string): Observable<ReleaseNote | undefined> {
    const note = this.releaseNotes.find(n => n.systemId === systemId);
    return of(note);
  }

  getBreadcrumbForNavItem(navId: string): Observable<BreadcrumbItem[]> {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    for (const category of this.navigationCategories) {
      for (const item of category.items) {
        if (item.id === navId) {
          breadcrumbs.push({ name: category.name, isActive: false });
          breadcrumbs.push({ name: item.name, isActive: true });
          return of(breadcrumbs);
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.id === navId) {
              breadcrumbs.push({ name: category.name, isActive: false });
              breadcrumbs.push({ name: item.name, isActive: false });
              breadcrumbs.push({ name: child.name, isActive: true });
              return of(breadcrumbs);
            }
          }
        }
      }
    }
    
    return of([]);
  }

  // Mock comments data
  private comments: Comment[] = [
    {
      id: 'c-1',
      releaseItemId: 'a-1',
      author: 'Alex Chen',
      authorAvatar: 'https://github.com/alexchen.png',
      content: 'Great work on the initial release! The new features look promising.',
      createdAt: '2025-07-20 15:22:10'
    },
    {
      id: 'c-2',
      releaseItemId: 'a-1',
      author: 'Maria Garcia',
      authorAvatar: 'https://github.com/mariagarcia.png',
      content: 'Looking forward to testing this in our environment.',
      createdAt: '2025-07-20 16:45:33'
    }
  ];

  getComments(releaseItemId: string): Observable<Comment[]> {
    const itemComments = this.comments.filter(c => c.releaseItemId === releaseItemId);
    return of(itemComments);
  }

  addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Observable<Comment> {
    const newComment: Comment = {
      ...comment,
      id: `c-${this.comments.length + 1}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.comments.push(newComment);
    return of(newComment);
  }
}
