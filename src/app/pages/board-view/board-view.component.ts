import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { AuthService } from '../../core/auth.service';
import { BoardService, Board } from '../../core/board.service';
import { ListService, BoardList, CreateListRequest } from '../../core/list.service';
import { CardService, Card, CreateCardRequest, MoveCardRequest } from '../../core/card.service';

interface ListWithCards {
  list: BoardList;
  cards: Card[];
}

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss'
})
export class BoardViewComponent implements OnInit {
  boardId = 0;
  board: Board | null = null;
  columns: ListWithCards[] = [];
  isLoading = true;
  errorMessage = '';
  currentUserName = '';
  currentUserId = 0;

  // Add list form
  showAddList = false;
  newListName = '';
  isAddingList = false;

  // Add card per-list state
  addingCardToListId: number | null = null;
  newCardTitle = '';
  isAddingCard = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private boardService: BoardService,
    private listService: ListService,
    private cardService: CardService
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserName = user.fullName;
    this.currentUserId = user.userId;

    this.boardId = Number(this.route.snapshot.paramMap.get('boardId'));
    if (!this.boardId) {
      this.router.navigate(['/workspaces']);
      return;
    }

    await this.loadBoard();
  }

  async loadBoard(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [board, lists, cards] = await Promise.all([
        this.boardService.getBoardById(this.boardId),
        this.listService.getListsByBoard(this.boardId),
        this.cardService.getCardsByBoard(this.boardId)
      ]);

      this.board = board;
      this.columns = lists
        .sort((a, b) => a.position - b.position)
        .map(list => ({
          list,
          cards: cards
            .filter(c => c.listId === list.listId)
            .sort((a, b) => a.position - b.position)
        }));
    } catch (error: any) {
      console.error('Failed to load board:', error);
      if (error.status === 401) {
        this.authService.logout();
        return;
      }
      this.errorMessage = 'Failed to load board.';
    } finally {
      this.isLoading = false;
    }
  }

  async addList(): Promise<void> {
    if (!this.newListName.trim()) return;
    this.isAddingList = true;
    try {
      const request: CreateListRequest = {
        name: this.newListName.trim(),
        boardId: this.boardId,
        createdBy: this.currentUserId
      };
      const created = await this.listService.createList(request);
      this.columns.push({ list: created, cards: [] });
      this.newListName = '';
      this.showAddList = false;
    } catch (error) {
      console.error('Failed to add list:', error);
    } finally {
      this.isAddingList = false;
    }
  }

  startAddingCard(listId: number): void {
    this.addingCardToListId = listId;
    this.newCardTitle = '';
  }

  cancelAddingCard(): void {
    this.addingCardToListId = null;
    this.newCardTitle = '';
  }

  async addCard(listId: number): Promise<void> {
    if (!this.newCardTitle.trim()) return;
    this.isAddingCard = true;
    try {
      const request: CreateCardRequest = {
        title: this.newCardTitle.trim(),
        listId,
        boardId: this.boardId,
        createdBy: this.currentUserId
      };
      const created = await this.cardService.createCard(request);
      const column = this.columns.find(c => c.list.listId === listId);
      if (column) {
        column.cards.push(created);
      }
      this.cancelAddingCard();
    } catch (error) {
      console.error('Failed to add card:', error);
    } finally {
      this.isAddingCard = false;
    }
  }

  // Drag-drop handler — used by both same-list reorder and cross-list move
  async onCardDrop(event: CdkDragDrop<Card[]>): Promise<void> {
    const fromListId = Number(event.previousContainer.id.replace('list-', ''));
    const toListId = Number(event.container.id.replace('list-', ''));

    if (event.previousContainer === event.container) {
      // Same-list reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Cross-list move
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const movedCard = event.container.data[event.currentIndex];
    const newPosition = this.calculateNewPosition(event.container.data, event.currentIndex);

    try {
      await this.cardService.moveCard(movedCard.cardId, {
        newListId: toListId,
        newPosition
      });
      movedCard.listId = toListId;
      movedCard.position = newPosition;
    } catch (error) {
      console.error('Failed to move card:', error);
      // On failure, reload the whole board to recover
      await this.loadBoard();
    }
  }

  // Compute a position between neighbors using fractional positioning
  private calculateNewPosition(cards: Card[], index: number): number {
    const prev = index > 0 ? cards[index - 1].position : 0;
    const next = index < cards.length - 1 ? cards[index + 1].position : prev + 200;
    return (prev + next) / 2;
  }

  get connectedListIds(): string[] {
    return this.columns.map(c => `list-${c.list.listId}`);
  }

  backToBoards(): void {
    if (this.board) {
      this.router.navigate(['/workspaces', this.board.workspaceId, 'boards']);
    } else {
      this.router.navigate(['/workspaces']);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getColorClass(color: string | null): string {
    const map: Record<string, string> = {
      'BLUE': 'bg-blue-500',
      'GREEN': 'bg-green-500',
      'PURPLE': 'bg-purple-500',
      'ORANGE': 'bg-orange-500',
      'RED': 'bg-red-500',
      'GRAY': 'bg-gray-500'
    };
    return map[color || 'BLUE'] || 'bg-blue-500';
  }

  getPriorityClass(priority: string | null): string {
    const map: Record<string, string> = {
      'LOW': 'bg-blue-100 text-blue-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'URGENT': 'bg-red-100 text-red-700'
    };
    return map[priority || ''] || 'bg-gray-100 text-gray-700';
  }
}