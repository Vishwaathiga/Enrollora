
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginRequest } from '../../../core/auth/auth.models';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  expectedRole = this.route.snapshot.data['role'] as string;

  loginRequest: LoginRequest = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';

  onLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.role !== this.expectedRole) {
          this.authService.logout();
          this.errorMessage =
            `This account cannot access the ${this.expectedRole === 'Administrator' ? 'Admin' : 'Student'} Login. Please use the correct login option.`;
          return;
        }

        if (response.role === 'Administrator') {
          this.router.navigate(['/admin/dashboard']);
        } else if (response.role === 'Student') {
          this.router.navigate(['/student/dashboard']);
        }
      },

      error: (error) => {
        console.error('Login failed:', error);

        this.errorMessage =
          error.error?.detail ||
          error.error?.message ||
          'Something went wrong. Please try again.';

        this.isLoading = false;
      },
    });
  }
}
