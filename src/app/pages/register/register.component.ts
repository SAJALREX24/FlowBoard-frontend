import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  emailField = '';
  passwordField = '';
  usernameField = '';
  fullNameField = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.emailField || !this.passwordField || !this.usernameField || !this.fullNameField) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (this.passwordField.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.register({
        email: this.emailField.trim(),
        password: this.passwordField,
        username: this.usernameField.trim(),
        fullName: this.fullNameField.trim()
      });
      this.router.navigate(['/workspaces']);
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.status === 409) {
        this.errorMessage = 'Email or username already in use.';
      } else if (error.status === 400) {
        this.errorMessage = 'Please check your input and try again.';
      } else if (error.status === 0) {
        this.errorMessage = 'Cannot reach the server. Is the Gateway running?';
      } else {
        this.errorMessage = 'Registration failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
