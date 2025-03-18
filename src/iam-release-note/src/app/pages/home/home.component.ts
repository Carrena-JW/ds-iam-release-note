import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule
    ],
    template: `
<mat-icon color="" aria-hidden="false" aria-label="Example home icon" fontIcon="home"></mat-icon>

        <div class="main-banner">
    
        <p class="sub-word">Racoon.</p>
            <p class="main-word">Release Notes</p>
        </div>
    `,
    styleUrl: './home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent { }
