import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BoardMember {
  memberId: number;
  boardId: number;
  userId: number;
  role: string;
  joinedAt: string;
}

export interface AddBoardMemberRequest {
  userId: number;
  role: string;
}

export interface UpdateBoardMemberRoleRequest {
  role: string;
}

@Injectable({ providedIn: 'root' })
export class BoardMemberService {
  private readonly apiUrl = 'https://flowboard-backend-48oe.onrender.com/api/boards';

  constructor(private http: HttpClient) {}

  async getMembers(boardId: number): Promise<BoardMember[]> {
    return await firstValueFrom(
      this.http.get<BoardMember[]>(`${this.apiUrl}/${boardId}/members`)
    );
  }

  async addMember(boardId: number, request: AddBoardMemberRequest): Promise<BoardMember> {
    return await firstValueFrom(
      this.http.post<BoardMember>(`${this.apiUrl}/${boardId}/members`, request)
    );
  }

  async updateRole(boardId: number, userId: number, request: UpdateBoardMemberRoleRequest): Promise<BoardMember> {
    return await firstValueFrom(
      this.http.put<BoardMember>(`${this.apiUrl}/${boardId}/members/${userId}`, request)
    );
  }

  async removeMember(boardId: number, userId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${boardId}/members/${userId}`)
    );
  }
}
