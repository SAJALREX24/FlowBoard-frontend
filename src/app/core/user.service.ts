import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserSummary {
  userId: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = 'https://flowboard-backend-nehc.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  async findByEmail(emailAddr: string): Promise<UserSummary | null> {
    try {
      return await firstValueFrom(
        this.http.get<UserSummary>(`${this.apiUrl}/users/by-email/${encodeURIComponent(emailAddr)}`)
      );
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async findById(userId: number): Promise<UserSummary | null> {
    try {
      return await firstValueFrom(
        this.http.get<UserSummary>(`${this.apiUrl}/users/${userId}`)
      );
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }
}

