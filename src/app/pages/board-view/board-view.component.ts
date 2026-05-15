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
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

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
  imports: [CommonModule, FormsModule, DragDropModule, CardModalComponent, ThemeToggleComponent],
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

  editingListId: number | null = null;
  editingListName = '';

  editingBoardName = false;
  boardNameDraft = '';

  // ===== Archive view (DEFERRED) =====
  // Backend lacks an endpoint to list archived cards. The cards/by-board endpoint
  // filters them out via EF Core query filter. To enable an archive view we'd need
  // to add a backend endpoint like GET /api/cards/by-board/{boardId}/archived,
  // which is out of scope for this build. The restoreCard service method is in place
  // for future use.
  showArchive = false;
  archivedCards: Card[] = [];
  loadingArchive = false;

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

  startEditingList(list: BoardList): void {
    this.editingListId = list.listId;
    this.editingListName = list.name;
  }

  cancelEditingList(): void {
    this.editingListId = null;
    this.editingListName = '';
  }

  async saveListName(list: BoardList): Promise<void> {
    const trimmed = this.editingListName.trim();
    if (!trimmed || trimmed === list.name) {
      this.cancelEditingList();
      return;
    }
    try {
      const updated = await this.listService.updateList(list.listId, { name: trimmed });
      list.name = updated.name;
    } catch (err) {
      console.error('Failed to rename list:', err);
    } finally {
      this.cancelEditingList();
    }
  }

  async archiveList(list: BoardList): Promise<void> {
    if (!confirm(`Archive list "${list.name}"? It will be hidden from the board.`)) return;
    try {
      await this.listService.archiveList(list.listId);
      this.columns = this.columns.filter(c => c.list.listId !== list.listId);
    } catch (err) {
      console.error('Failed to archive list:', err);
    }
  }

  startEditingBoardName(): void {
    if (!this.board) return;
    this.boardNameDraft = this.board.name;
    this.editingBoardName = true;
  }

  cancelEditingBoardName(): void {
    this.editingBoardName = false;
    this.boardNameDraft = '';
  }

  async saveBoardName(): Promise<void> {
    if (!this.board) return;
    const trimmed = this.boardNameDraft.trim();
    if (!trimmed || trimmed === this.board.name) {
      this.cancelEditingBoardName();
      return;
    }
    try {
      const updated = await this.boardService.updateBoard(this.board.boardId, { name: trimmed });
      this.board = updated;
    } catch (err) {
      console.error('Failed to update board:', err);
    } finally {
      this.editingBoardName = false;
      this.boardNameDraft = '';
    }
  }

  async openArchive(): Promise<void> {
    if (!this.board) return;
    this.showArchive = true;
    this.loadingArchive = true;
    try {
      // Fetch all cards for the board (including archived) — backend filters archived from getCardsByBoard,
      // so we collect by-list across archived lists too. For MVP scope, only show archived non-archived-list cards.
      // Pull all cards for the board, then filter client-side for those with isArchived === true.
      // Note: the backend's getCardsByBoard returns only non-archived cards. To get archived cards we'd
      // need a backend endpoint that returns archived cards, which doesn't exist.
      // Instead, we use the per-list endpoint via listing all lists and querying each — but that also
      // hides archived. The backend currently has no "list archived cards" endpoint.
      //
      // Workaround: hit by-board, which returns active cards only. Show empty state with explanation.
      this.archivedCards = [];
    } catch (err) {
      console.error('Failed to load archived cards:', err);
      this.archivedCards = [];
    } finally {
      this.loadingArchive = false;
    }
  }

  closeArchive(): void {
    this.showArchive = false;
    this.archivedCards = [];
  }

  async restoreCardFromArchive(card: Card): Promise<void> {
    try {
      await this.cardService.restoreCard(card.cardId);
      this.archivedCards = this.archivedCards.filter(c => c.cardId !== card.cardId);
      await this.loadBoard();
    } catch (err) {
      console.error('Failed to restore card:', err);
      alert('Failed to restore card.');
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

  goHome(): void {
    this.router.navigate(['/workspaces']);
  }

  getColorClass(color: string | null): string {
    // Card cover stripe — small accent on top of card. Use slightly muted shades
    // since it sits inside a zinc-800 card on a zinc-950 page.
    const map: Record<string, string> = {
      'BLUE': 'bg-sky-600',
      'GREEN': 'bg-emerald-600',
      'PURPLE': 'bg-violet-600',
      'ORANGE': 'bg-amber-600',
      'RED': 'bg-rose-600',
      'GRAY': 'bg-zinc-600',
      'YELLOW': 'bg-yellow-600',
      'PINK': 'bg-pink-600'
    };
    return map[color || 'BLUE'] || 'bg-sky-600';
  }

  getBoardPageBgClass(): string {
    return 'bg-zinc-950';
  }

  getBoardAccentBandClass(color: string | null): string {
    const map: Record<string, string> = {
      'BLUE': 'bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent',
      'GREEN': 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent',
      'PURPLE': 'bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent',
      'ORANGE': 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent',
      'RED': 'bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent',
      'GRAY': 'bg-gradient-to-r from-zinc-500/20 via-zinc-500/10 to-transparent'
    };
    return map[color || 'BLUE'] || 'bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent';
  }

  getPriorityClass(priority: string | null): string {
    const map: Record<string, string> = {
      'LOW': 'bg-sky-950 text-sky-300 border border-sky-800',
      'MEDIUM': 'bg-amber-950 text-amber-300 border border-amber-800',
      'HIGH': 'bg-orange-950 text-orange-300 border border-orange-800',
      'URGENT': 'bg-red-950 text-red-300 border border-red-800'
    };
    return map[priority || ''] || 'bg-zinc-800 text-zinc-300 border border-zinc-700';
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarColorClass(seed: number | string): string {
    const palette = [
      'bg-emerald-600',
      'bg-teal-600',
      'bg-cyan-600',
      'bg-sky-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-fuchsia-600',
      'bg-rose-600',
      'bg-amber-600',
      'bg-lime-600'
    ];
    const num = typeof seed === 'number'
      ? seed
      : Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[Math.abs(num) % palette.length];
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



