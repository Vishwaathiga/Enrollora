
import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { RegisterStudentRequest } from '../../../core/auth/auth.models';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  registerRequest: RegisterStudentRequest = {
    name: '',
    email: '',
    password: '',
    department: '',
    age: 0,
    cgpa: 0,
  };

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  onRegister(): void {
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.authService.register(this.registerRequest).subscribe({
      next: (response) => {
        this.successMessage.set(
          'Registration successful! Your account is pending administrator approval. You can log in once your account is approved.'
        );

        this.isLoading.set(false);

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 4000);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.detail ||
          error.error?.message ||
          'Registration failed. Please try again.'
        );

        this.isLoading.set(false);

        console.error('Registration failed:', error);
      },
    });
  }
}
