import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Card {
  cardId: number;
  title: string;
  description: string | null;
  listId: number;
  boardId: number;
  position: number;
  assigneeId: number | null;
  createdBy: number;
  dueDate: string | null;
  priority: string | null;
  coverColor: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  listId: number;
  boardId: number;
  createdBy: number;
}

export interface MoveCardRequest {
  newListId: number;
  newPosition: number;
}

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly apiUrl = 'http://localhost:5011/api/cards';

  constructor(private http: HttpClient) {}

  async getCardsByBoard(boardId: number): Promise<Card[]> {
    return await firstValueFrom(
      this.http.get<Card[]>(`${this.apiUrl}/by-board/${boardId}`)
    );
  }

  async createCard(request: CreateCardRequest): Promise<Card> {
    return await firstValueFrom(
      this.http.post<Card>(this.apiUrl, request)
    );
  }

  async moveCard(cardId: number, request: MoveCardRequest): Promise<Card> {
    return await firstValueFrom(
      this.http.post<Card>(`${this.apiUrl}/${cardId}/move`, request)
    );
  }
}