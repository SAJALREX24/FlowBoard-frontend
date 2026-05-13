import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChecklistItem {
  itemId: number;
  cardId: number;
  text: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistItemRequest {
  cardId: number;
  text: string;
}

export interface UpdateChecklistItemRequest {
  text: string;
  isCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly apiUrl = 'https://flowboard-backend-nehc.onrender.com/api/labels/checklist-items';

  constructor(private http: HttpClient) {}

  async getItemsByCard(cardId: number): Promise<ChecklistItem[]> {
    return await firstValueFrom(
      this.http.get<ChecklistItem[]>(`${this.apiUrl}/by-card/${cardId}`)
    );
  }

  async createItem(request: CreateChecklistItemRequest): Promise<ChecklistItem> {
    return await firstValueFrom(
      this.http.post<ChecklistItem>(this.apiUrl, request)
    );
  }

  async updateItem(itemId: number, request: UpdateChecklistItemRequest): Promise<ChecklistItem> {
    return await firstValueFrom(
      this.http.put<ChecklistItem>(`${this.apiUrl}/${itemId}`, request)
    );
  }

  async deleteItem(itemId: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${itemId}`)
    );
  }
}

