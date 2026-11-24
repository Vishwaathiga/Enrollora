
import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  StudentProfileService,
  UpdateStudentProfileRequest,
} from './student-profile.service';

import { StudentResponse } from '../../admin/students/student.models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfile implements OnInit {
  private profileService = inject(StudentProfileService);

  profile = signal<StudentResponse | null>(null);

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isEditMode = signal(false);

  profileForm = new FormGroup({
    name: new FormControl('', Validators.required),
    department: new FormControl('', Validators.required),
    age: new FormControl(18, [
      Validators.required,
      Validators.min(17),
      Validators.max(60),
    ]),
    cgpa: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(10),
    ]),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.profileService.getMyProfile().subscribe({
      next: (response) => {
        this.profile.set(response);

        this.profileForm.patchValue({
          name: response.name,
          department: response.department,
          age: response.age,
          cgpa: response.cgpa,
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Profile loading failed:', error);
        this.errorMessage.set('Unable to load profile details.');
        this.isLoading.set(false);
      },
    });
  }

  enableEdit(): void {
    const currentProfile = this.profile();

    if (!currentProfile) {
      return;
    }

    this.profileForm.patchValue({
      name: currentProfile.name,
      department: currentProfile.department,
      age: currentProfile.age,
      cgpa: currentProfile.cgpa,
    });

    this.successMessage.set('');
    this.errorMessage.set('');
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');

    const currentProfile = this.profile();

    if (currentProfile) {
      this.profileForm.patchValue({
        name: currentProfile.name,
        department: currentProfile.department,
        age: currentProfile.age,
        cgpa: currentProfile.cgpa,
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();

    const profileData: UpdateStudentProfileRequest = {
      name: formValue.name!,
      department: formValue.department!,
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileService.updateMyProfile(profileData).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.isSaving.set(false);
        this.isEditMode.set(false);
        this.successMessage.set('Profile updated successfully.');
      },
      error: (error) => {
        console.error('Profile update failed:', error);
        this.errorMessage.set('Unable to update profile.');
        this.isSaving.set(false);
      },
    });
  }
}
