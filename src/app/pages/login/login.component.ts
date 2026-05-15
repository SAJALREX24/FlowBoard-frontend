import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login({
        email: this.email,
        password: this.password
      });
      this.router.navigate(['/workspaces']);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.status === 401) {
        this.errorMessage = 'Invalid email or password.';
      } else if (error.status === 0) {
        this.errorMessage = 'Cannot reach the server. Is the Gateway running?';
      } else {
        this.errorMessage = 'Login failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}