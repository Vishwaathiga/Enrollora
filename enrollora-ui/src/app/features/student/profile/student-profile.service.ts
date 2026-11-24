
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { StudentResponse } from '../../admin/students/student.models';

export interface UpdateStudentProfileRequest {
  name: string;
  department: string;
  age: number;
  cgpa: number;
}

@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/students/me`;

  getMyProfile(): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(this.apiUrl);
  }

  updateMyProfile(
    profile: UpdateStudentProfileRequest,
  ): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(this.apiUrl, profile);
  }
}
