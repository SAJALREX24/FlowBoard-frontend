import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { AuthService } from '../../core/auth.service';
import { BoardService, Board } from '../../core/board.service';
import { ListService, BoardList, CreateListRequest } from '../../core/list.service';
import { CardService, Card, CreateCardRequest, MoveCardRequest } from '../../core/card.service';
import { BoardMemberService, BoardMember } from '../../core/board-member.service';
import { UserService, UserSummary } from '../../core/user.service';
import { CardModalComponent } from '../../components/card-modal/card-modal.component';

interface ListWithCards {
  list: BoardList;
  cards: Card[];
}

interface MemberWithUser {
  member: BoardMember;
  user: UserSummary | null;
}

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CardModalComponent],
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

  showAddList = false;
  newListName = '';
  isAddingList = false;

  addingCardToListId: number | null = null;
  newCardTitle = '';
  isAddingCard = false;

  // Members modal state
  showMembers = false;
  members: MemberWithUser[] = [];
  isLoadingMembers = false;
  inviteEmail = '';
  inviteRole = 'MEMBER';
  isInviting = false;
  inviteMessage = '';
  inviteError = '';
  // Card modal state
  isCardModalOpen = false;
  selectedCardId: number | null = null;

  readonly roles = ['OBSERVER', 'MEMBER', 'ADMIN'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private boardService: BoardService,
    private listService: ListService,
    private cardService: CardService,
    private memberService: BoardMemberService,
    private userService: UserService
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

  async onCardDrop(event: CdkDragDrop<Card[]>): Promise<void> {
    const fromListId = Number(event.previousContainer.id.replace('list-', ''));
    const toListId = Number(event.container.id.replace('list-', ''));

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
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
      await this.loadBoard();
    }
  }

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
  // ===== Card Modal =====
  openCardModal(cardId: number): void {
    this.selectedCardId = cardId;
    this.isCardModalOpen = true;
  }

  closeCardModal(): void {
    this.isCardModalOpen = false;
    this.selectedCardId = null;
  }

  onCardUpdated(updated: Card): void {
    for (const column of this.columns) {
      const idx = column.cards.findIndex(c => c.cardId === updated.cardId);
      if (idx !== -1) {
        column.cards[idx] = updated;
        break;
      }
    }
  }

  onCardDeleted(cardId: number): void {
    for (const column of this.columns) {
      const idx = column.cards.findIndex(c => c.cardId === cardId);
      if (idx !== -1) {
        column.cards.splice(idx, 1);
        break;
      }
    }
  }

  // ===== Members =====
  async openMembers(): Promise<void> {
    this.showMembers = true;
    await this.loadMembers();
  }

  closeMembers(): void {
    this.showMembers = false;
    this.inviteEmail = '';
    this.inviteRole = 'MEMBER';
    this.inviteMessage = '';
    this.inviteError = '';
  }

  async loadMembers(): Promise<void> {
    this.isLoadingMembers = true;
    try {
      const memberList = await this.memberService.getMembers(this.boardId);
      const enriched: MemberWithUser[] = await Promise.all(
        memberList.map(async (m) => {
          let userInfo: UserSummary | null = null;
          try {
            userInfo = await this.userService.findById(m.userId);
          } catch (err) {
            console.error('Failed to load user', m.userId, err);
          }
          return { member: m, user: userInfo };
        })
      );
      this.members = enriched;
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      this.isLoadingMembers = false;
    }
  }

  async invite(): Promise<void> {
    const trimmedEmail = this.inviteEmail.trim();
    if (!trimmedEmail) return;

    this.isInviting = true;
    this.inviteMessage = '';
    this.inviteError = '';

    try {
      const foundUser = await this.userService.findByEmail(trimmedEmail);
      if (!foundUser) {
        this.inviteError = `No user found with email ${trimmedEmail}.`;
        return;
      }

      if (this.members.some(m => m.member.userId === foundUser.userId)) {
        this.inviteError = `${foundUser.fullName} is already a member.`;
        return;
      }

      await this.memberService.addMember(this.boardId, {
        userId: foundUser.userId,
        role: this.inviteRole
      });

      this.inviteMessage = `Added ${foundUser.fullName} as ${this.inviteRole}.`;
      this.inviteEmail = '';
      await this.loadMembers();
    } catch (error: any) {
      console.error('Invite failed:', error);
      if (error.status === 409) {
        this.inviteError = 'User is already a member of this board.';
      } else {
        this.inviteError = 'Failed to add member. Please try again.';
      }
    } finally {
      this.isInviting = false;
    }
  }

  async changeRole(member: MemberWithUser, newRole: string): Promise<void> {
    try {
      await this.memberService.updateRole(this.boardId, member.member.userId, { role: newRole });
      member.member.role = newRole;
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  }

  async removeMember(member: MemberWithUser): Promise<void> {
    if (member.member.userId === this.currentUserId) {
      this.inviteError = "You can't remove yourself.";
      return;
    }
    const userName = member.user?.fullName || `User ${member.member.userId}`;
    if (!confirm(`Remove ${userName} from this board?`)) return;

    try {
      await this.memberService.removeMember(this.boardId, member.member.userId);
      this.members = this.members.filter(m => m.member.userId !== member.member.userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }
}



