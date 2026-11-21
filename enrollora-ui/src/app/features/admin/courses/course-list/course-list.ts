
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  showForm = signal(false);
  isSaving = signal(false);

  course: SaveCourseRequest = this.emptyCourse();

  ngOnInit(): void {
    this.loadCourses();
  }

  emptyCourse(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
  }

  openAddForm(): void {
    this.course = this.emptyCourse();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveCourse(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.course.courseName.trim() || !this.course.duration.trim()) {
      this.errorMessage.set('Please enter course name and duration.');
      return;
    }

    if (this.course.fees < 0 || this.course.capacity < 1) {
      this.errorMessage.set('Fees cannot be negative and capacity must be at least 1.');
      return;
    }

    this.isSaving.set(true);

    this.courseService.createCourse(this.course).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.successMessage.set('Course added successfully!');
        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error adding course:', error);
        this.isSaving.set(false);
        this.errorMessage.set(
          error.error?.message || 'Unable to add course. Please try again.'
        );
      },
    });
  }

  loadCourses(): void {
    this.isLoading.set(true);

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set('Unable to load courses.');
        this.isLoading.set(false);
      },
    });
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadCourses();
    }
  }
}
