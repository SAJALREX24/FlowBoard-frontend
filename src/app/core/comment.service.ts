import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Comment {
  commentId: number;
  cardId: number;
  authorId: number;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateCommentRequest {
  cardId: number;
  authorId: number;
  content: string;
  parentCommentId?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly apiUrl = 'https://flowboard-backend-nehc.onrender.com/api/comments';

  constructor(private http: HttpClient) {}

  async getCommentsByCard(cardId: number): Promise<Comment[]> {
    return await firstValueFrom(
      this.http.get<Comment[]>(`${this.apiUrl}/by-card/${cardId}`)
    );
  }

  async getReplies(commentId: number): Promise<Comment[]> {
    return await firstValueFrom(
      this.http.get<Comment[]>(`${this.apiUrl}/${commentId}/replies`)
    );
  }

  async createComment(request: CreateCommentRequest): Promise<Comment> {
    return await firstValueFrom(
      this.http.post<Comment>(this.apiUrl, request)
    );
  }

  async updateComment(commentId: number, request: UpdateCommentRequest): Promise<Comment> {
    return await firstValueFrom(
      this.http.put<Comment>(`${this.apiUrl}/${commentId}`, request)
    );
  }

  async deleteComment(commentId: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${commentId}`)
    );
  }
}

