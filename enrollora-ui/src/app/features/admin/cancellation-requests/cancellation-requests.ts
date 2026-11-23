import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal,  ChangeDetectionStrategy, } from '@angular/core';

import { EnrollmentService } from '../../enrollments/enrollment.service';
import { CancellationResponse } from '../../enrollments/enrollment.models';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancellationRequestsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  processingId = signal<number | null>(null);

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService
      .getCancellationRequests(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;

          this.errorMessage.set(
            body?.detail ||
              body?.message ||
              body?.title ||
              'Unable to load cancellation requests.',
          );

          this.isLoading.set(false);
        },
      });
  }

  statusLabel(status: number): string {
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

  approve(request: CancellationResponse): void {
    const confirmed = window.confirm(
      `Approve the cancellation request for ${request.studentName}?`,
    );

    if (!confirmed) {
      return;
    }

    const remarks = window.prompt(
      'Enter administrator remarks (optional):',
    );

    if (remarks === null) {
      return;
    }

    this.processingId.set(request.cancellationRequestId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService
      .approveCancellationRequest(
        request.cancellationRequestId,
        remarks.trim() || null,
      )
      .subscribe({
        next: (response) => {
          this.updateRequest(response);
          this.successMessage.set(
            'Cancellation request approved successfully. The enrollment is now cancelled.',
          );
          this.processingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.setActionError(error, 'Unable to approve the request.');
        },
      });
  }

  reject(request: CancellationResponse): void {
    const confirmed = window.confirm(
      `Reject the cancellation request for ${request.studentName}?`,
    );

    if (!confirmed) {
      return;
    }

    const remarks = window.prompt(
      'Enter the reason for rejection (optional):',
    );

    if (remarks === null) {
      return;
    }

    this.processingId.set(request.cancellationRequestId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService
      .rejectCancellationRequest(
        request.cancellationRequestId,
        remarks.trim() || null,
      )
      .subscribe({
        next: (response) => {
          this.updateRequest(response);
          this.successMessage.set('Cancellation request rejected.');
          this.processingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.setActionError(error, 'Unable to reject the request.');
        },
      });
  }

  private updateRequest(updatedRequest: CancellationResponse): void {
    this.requests.update((currentRequests) =>
      currentRequests.map((request) =>
        request.cancellationRequestId ===
        updatedRequest.cancellationRequestId
          ? updatedRequest
          : request,
      ),
    );
  }

  private setActionError(
    error: HttpErrorResponse,
    fallback: string,
  ): void {
    const body = error.error;

    this.errorMessage.set(
      body?.detail || body?.message || body?.title || fallback,
    );

    this.processingId.set(null);
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }
}