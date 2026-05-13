import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Board {
  boardId: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdBy: number;
  visibility: string;
  backgroundColor: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  workspaceId: number;
  createdBy: number;
  visibility: string;
  backgroundColor?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  visibility?: string;
  backgroundColor?: string;
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly apiUrl = 'https://flowboard-backend-nehc.onrender.com/api/boards';

  constructor(private http: HttpClient) {}

  async getBoardsByWorkspace(workspaceId: number): Promise<Board[]> {
    return await firstValueFrom(
      this.http.get<Board[]>(`${this.apiUrl}/by-workspace/${workspaceId}`)
    );
  }

  async getBoardById(boardId: number): Promise<Board> {
    return await firstValueFrom(
      this.http.get<Board>(`${this.apiUrl}/${boardId}`)
    );
  }

  async createBoard(request: CreateBoardRequest): Promise<Board> {
    return await firstValueFrom(
      this.http.post<Board>(this.apiUrl, request)
    );
  }

  async updateBoard(boardId: number, request: UpdateBoardRequest): Promise<Board> {
    return await firstValueFrom(
      this.http.put<Board>(`${this.apiUrl}/${boardId}`, request)
    );
  }

  async closeBoard(boardId: number): Promise<void> {
    return await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/${boardId}/close`, {})
    );
  }

  async reopenBoard(boardId: number): Promise<void> {
    return await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/${boardId}/reopen`, {})
    );
  }
}

