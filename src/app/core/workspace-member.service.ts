import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WorkspaceMember {
  workspaceMemberId: number;
  workspaceId: number;
  userId: number;
  role: string;
  joinedAt: string;
}

export interface AddMemberRequest {
  userId: number;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceMemberService {
  private readonly apiUrl = 'https://flowboard-backend-nehc.onrender.com/api/workspaces';

  constructor(private http: HttpClient) {}

  async getMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    return await firstValueFrom(
      this.http.get<WorkspaceMember[]>(`${this.apiUrl}/${workspaceId}/members`)
    );
  }

  async addMember(workspaceId: number, request: AddMemberRequest): Promise<WorkspaceMember> {
    return await firstValueFrom(
      this.http.post<WorkspaceMember>(`${this.apiUrl}/${workspaceId}/members`, request)
    );
  }

  async updateRole(workspaceId: number, userId: number, request: UpdateMemberRoleRequest): Promise<WorkspaceMember> {
    return await firstValueFrom(
      this.http.put<WorkspaceMember>(`${this.apiUrl}/${workspaceId}/members/${userId}`, request)
    );
  }

  async removeMember(workspaceId: number, userId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${workspaceId}/members/${userId}`)
    );
  }
}

