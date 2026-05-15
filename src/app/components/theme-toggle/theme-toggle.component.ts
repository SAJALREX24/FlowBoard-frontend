import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [title]="theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      class="theme-toggle inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300
             bg-zinc-800/70 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 hover:scale-105
             shadow-md hover:shadow-lg"
    >
      <ng-container *ngIf="theme.mode() === 'dark'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <span>Light</span>
      </ng-container>
      <ng-container *ngIf="theme.mode() === 'light'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <span>Dark</span>
      </ng-container>
    </button>
  `,
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
