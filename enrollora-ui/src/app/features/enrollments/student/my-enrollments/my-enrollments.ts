
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  EnrollmentResponse,
  CancellationResponse,
} from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isSubmittingCancellation = signal(false);
  submittingEnrollmentId = signal<number | null>(null);

  errorMessage = signal('');
  successMessage = signal('');
  cancellationError = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCancellationRequests(): void {
    this.enrollmentService.getMyCancellationRequests().subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Unable to load cancellation requests:', error);
        this.cancellationError.set(
          error.error?.detail ||
          error.error?.message ||
          'Unable to load cancellation request details.',
        );
      },
    });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  cancellationStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  cancellationRequestFor(enrollmentId: number): CancellationResponse | undefined {
    return this.cancellationRequests()
      .filter((request) => request.enrollmentId === enrollmentId)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime(),
      )[0];
  }

  requestCancellation(enrollment: EnrollmentResponse): void {
    const confirmed = window.confirm(
      `Do you want to request cancellation for ${enrollment.courseName}?`,
    );

    if (!confirmed) {
      return;
    }

    const reason = window.prompt('Please enter the reason for cancellation:');

    if (!reason || !reason.trim()) {
      return;
    }

    this.isSubmittingCancellation.set(true);
    this.submittingEnrollmentId.set(enrollment.enrollmentId);
    this.successMessage.set('');
    this.cancellationError.set('');

    this.enrollmentService
      .createCancellationRequest(enrollment.enrollmentId, {
        reason: reason.trim(),
      })
      .subscribe({
        next: (response) => {
          this.cancellationRequests.update((requests) => [
            response,
            ...requests,
          ]);

          this.successMessage.set(
            'Cancellation request submitted successfully. Waiting for administrator approval.',
          );

          this.isSubmittingCancellation.set(false);
          this.submittingEnrollmentId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.cancellationError.set(
            error.error?.detail ||
            error.error?.message ||
            error.error?.title ||
            'Unable to submit cancellation request.',
          );

          this.isSubmittingCancellation.set(false);
          this.submittingEnrollmentId.set(null);
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
