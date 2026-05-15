import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-decor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-decor" aria-hidden="true">
      <!-- Checkbox / list icon -->
      <svg class="decor-icon i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M8 12l3 3 5-6"/>
      </svg>

      <!-- Clipboard -->
      <svg class="decor-icon i2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="5" width="16" height="17" rx="2"/>
        <rect x="9" y="2" width="6" height="5" rx="1"/>
        <path d="M8 12h8M8 16h5"/>
      </svg>

      <!-- Sticky note -->
      <svg class="decor-icon i3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h12l4 4v12H4z"/>
        <path d="M16 4v4h4"/>
        <path d="M8 13h6M8 17h4"/>
      </svg>

      <!-- Calendar -->
      <svg class="decor-icon i4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M3 10h18M8 3v4M16 3v4"/>
        <circle cx="8" cy="15" r="1"/>
        <circle cx="12" cy="15" r="1"/>
        <circle cx="16" cy="15" r="1"/>
      </svg>

      <!-- Lightbulb -->
      <svg class="decor-icon i5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6M10 21h4"/>
        <path d="M12 3a6 6 0 0 0-4 10.5c1 .8 1.5 1.7 1.5 2.5v1h5v-1c0-.8.5-1.7 1.5-2.5A6 6 0 0 0 12 3z"/>
      </svg>

      <!-- Star -->
      <svg class="decor-icon i6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15 9 22 10 17 15 18 22 12 18.5 6 22 7 15 2 10 9 9 12 2"/>
      </svg>

      <!-- Rocket -->
      <svg class="decor-icon i7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 13c0-3 3-9 9-11 0 5-3 11-9 11z"/>
        <path d="M5 13c-1.5 1-2 3-2 5 2 0 4-.5 5-2"/>
        <circle cx="14" cy="8" r="1.5"/>
      </svg>

      <!-- Chat bubble -->
      <svg class="decor-icon i8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5h16v11H8l-4 4z"/>
        <path d="M8 10h8M8 13h5"/>
      </svg>

      <!-- Target / bullseye -->
      <svg class="decor-icon i9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5"/>
      </svg>

      <!-- Pencil -->
      <svg class="decor-icon i10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/>
        <path d="M14 6l3 3"/>
      </svg>

      <!-- Sparkle -->
      <svg class="decor-icon i11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
      </svg>

      <!-- Gear -->
      <svg class="decor-icon i12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>
      </svg>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .bg-decor {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .decor-icon {
      position: absolute;
      width: 64px;
      height: 64px;
      opacity: 0.10;
      color: #10b981;
      animation: drift 22s ease-in-out infinite;
    }
    body.light-theme .decor-icon {
      opacity: 0.14;
      color: #3b82f6;
    }

    @keyframes drift {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      25%     { transform: translate(15px,-20px) rotate(8deg); }
      50%     { transform: translate(-10px,-30px) rotate(-5deg); }
      75%     { transform: translate(-20px,10px) rotate(4deg); }
    }
    @keyframes spinSlow {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .i1  { top: 6%;  left: 4%;  width: 56px; animation-delay: -2s; color: #10b981; }
    .i2  { top: 12%; left: 88%; width: 72px; animation-delay: -7s; color: #6366f1; }
    .i3  { top: 28%; left: 18%; width: 60px; animation-delay: -4s; color: #14b8a6; }
    .i4  { top: 22%; left: 70%; width: 70px; animation-delay: -11s; color: #a855f7; }
    .i5  { top: 44%; left: 6%;  width: 64px; animation-delay: -6s; color: #f59e0b; }
    .i6  { top: 50%; left: 92%; width: 50px; animation-delay: -9s; color: #ec4899; }
    .i7  { top: 60%; left: 30%; width: 80px; animation-delay: -3s; color: #06b6d4; }
    .i8  { top: 68%; left: 78%; width: 64px; animation-delay: -13s; color: #10b981; }
    .i9  { top: 82%; left: 12%; width: 70px; animation-delay: -5s; color: #6366f1; animation: spinSlow 40s linear infinite; }
    .i10 { top: 88%; left: 62%; width: 58px; animation-delay: -8s; color: #f43f5e; }
    .i11 { top: 38%; left: 48%; width: 50px; animation-delay: -10s; color: #eab308; animation: spinSlow 30s linear infinite; }
    .i12 { top: 76%; left: 50%; width: 60px; animation-delay: -14s; color: #8b5cf6; animation: spinSlow 50s linear infinite reverse; }

    body.light-theme {
      .i1  { color: #2563eb; }
      .i2  { color: #4f46e5; }
      .i3  { color: #0ea5e9; }
      .i4  { color: #7c3aed; }
      .i5  { color: #d97706; }
      .i6  { color: #db2777; }
      .i7  { color: #0891b2; }
      .i8  { color: #2563eb; }
      .i9  { color: #4f46e5; }
      .i10 { color: #e11d48; }
      .i11 { color: #ca8a04; }
      .i12 { color: #7c3aed; }
    }

    @media (max-width: 768px) {
      .decor-icon { transform: scale(0.7); }
    }
  `]
})
export class BackgroundDecorComponent {}
