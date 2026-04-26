import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface BoardList {
  listId: number;
  name: string;
  boardId: number;
  position: number;
  createdBy: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListRequest {
  name: string;
  boardId: number;
  createdBy: number;
}

@Injectable({ providedIn: 'root' })
export class ListService {
  private readonly apiUrl = 'http://localhost:5011/api/lists';

  constructor(private http: HttpClient) {}

  async getListsByBoard(boardId: number): Promise<BoardList[]> {
    return await firstValueFrom(
      this.http.get<BoardList[]>(`${this.apiUrl}/by-board/${boardId}`)
    );
  }

  async createList(request: CreateListRequest): Promise<BoardList> {
    return await firstValueFrom(
      this.http.post<BoardList>(this.apiUrl, request)
    );
  }
}