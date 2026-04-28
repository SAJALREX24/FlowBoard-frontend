import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Workspace {
  workspaceId: number;
  name: string;
  description: string | null;
  ownerId: number;
  visibility: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  ownerId: number;
  visibility: string;
  logoUrl?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  visibility?: string;
  logoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly apiUrl = 'http://localhost:5011/api/workspaces';

  constructor(private http: HttpClient) {}

  async getMyWorkspaces(userId: number): Promise<Workspace[]> {
    return await firstValueFrom(
      this.http.get<Workspace[]>(`${this.apiUrl}/by-member/${userId}`)
    );
  }

  async getWorkspaceById(workspaceId: number): Promise<Workspace> {
    return await firstValueFrom(
      this.http.get<Workspace>(`${this.apiUrl}/${workspaceId}`)
    );
  }

  async createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
    return await firstValueFrom(
      this.http.post<Workspace>(this.apiUrl, request)
    );
  }

  async updateWorkspace(workspaceId: number, request: UpdateWorkspaceRequest): Promise<Workspace> {
    return await firstValueFrom(
      this.http.put<Workspace>(`${this.apiUrl}/${workspaceId}`, request)
    );
  }

  async deleteWorkspace(workspaceId: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${workspaceId}`)
    );
  }
}