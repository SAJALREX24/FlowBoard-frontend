import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card, CardService, UpdateCardRequest } from '../../core/card.service';
import { BoardMemberService, BoardMember } from '../../core/board-member.service';
import { UserService, UserSummary } from '../../core/user.service';
import { AuthService } from '../../core/auth.service';
import { CommentService, Comment as CardComment, CreateCommentRequest } from '../../core/comment.service';
import { ChecklistService, ChecklistItem, CreateChecklistItemRequest, UpdateChecklistItemRequest } from '../../core/checklist.service';

@Component({
  selector: 'app-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-modal.component.html',
  styleUrls: ['./card-modal.component.scss']
})
export class CardModalComponent implements OnChanges {
  @Input() cardId: number | null = null;
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() cardDeleted = new EventEmitter<number>();

  card: Card | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  // Editing state
  editingTitle: boolean = false;
  titleDraft: string = '';
  descriptionDraft: string = '';

  // Dropdown options
  readonly priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  readonly coverColorOptions = [
    { value: null, label: 'None' },
    { value: 'RED', label: 'Red' },
    { value: 'ORANGE', label: 'Orange' },
    { value: 'YELLOW', label: 'Yellow' },
    { value: 'GREEN', label: 'Green' },
    { value: 'BLUE', label: 'Blue' },
    { value: 'PURPLE', label: 'Purple' },
    { value: 'PINK', label: 'Pink' }
  ];

  // Assignee
  boardMembers: { userId: number; fullName: string; email: string }[] = [];
  loadingMembers = false;

  // Comments
  comments: CardComment[] = [];
  commentsByParent: Map<number | null, CardComment[]> = new Map();
  loadingComments = false;
  newCommentContent = '';
  isPostingComment = false;
  replyingTo: number | null = null;
  replyContent = '';

  // Checklist
  checklistItems: ChecklistItem[] = [];
  loadingChecklist = false;
  newItemText = '';
  isAddingItem = false;

  currentUserId = 0;
  currentUserName = '';

  constructor(
    private cardService: CardService,
    private boardMemberService: BoardMemberService,
    private userService: UserService,
    private authService: AuthService,
    private commentService: CommentService,
    private checklistService: ChecklistService
  ) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.userId;
      this.currentUserName = user.fullName;
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['cardId'] && this.cardId !== null && this.isOpen) {
      await this.loadCard();
    }
  }

  async loadCard(): Promise<void> {
    if (this.cardId === null) return;
    this.loading = true;
    this.errorMessage = '';
    try {
      this.card = await this.cardService.getCardById(this.cardId);
      this.titleDraft = this.card.title;
      this.descriptionDraft = this.card.description ?? '';

      await Promise.all([
        this.loadBoardMembers(this.card.boardId),
        this.loadComments(this.card.cardId),
        this.loadChecklist(this.card.cardId)
      ]);
    } catch (err: any) {
      this.errorMessage = 'Failed to load card. ' + (err?.message ?? '');
      console.error('Load card error:', err);
    } finally {
      this.loading = false;
    }
  }

  startEditingTitle(): void {
    if (!this.card) return;
    this.titleDraft = this.card.title;
    this.editingTitle = true;
  }

  async saveTitle(): Promise<void> {
    if (!this.card || !this.titleDraft.trim()) {
      this.editingTitle = false;
      return;
    }
    if (this.titleDraft === this.card.title) {
      this.editingTitle = false;
      return;
    }
    await this.updateField({ title: this.titleDraft.trim() });
    this.editingTitle = false;
  }

  async saveDescription(): Promise<void> {
    if (!this.card) return;
    const current = this.card.description ?? '';
    if (this.descriptionDraft === current) return;
    await this.updateField({ description: this.descriptionDraft });
  }

  async changePriority(value: string): Promise<void> {
    if (!this.card || value === this.card.priority) return;
    await this.updateField({ priority: value });
  }

  async changeDueDate(value: string): Promise<void> {
    if (!this.card) return;
    const newDate = value || null;
    if (newDate === this.card.dueDate) return;
    await this.updateField({ dueDate: newDate });
  }

  async changeCoverColor(value: string | null): Promise<void> {
    if (!this.card || value === this.card.coverColor) return;
    await this.updateField({ coverColor: value });
  }

  private async updateField(patch: UpdateCardRequest): Promise<void> {
    if (!this.card) return;
    const fullRequest: UpdateCardRequest = {
      title: patch.title ?? this.card.title,
      description: patch.description !== undefined ? patch.description : (this.card.description ?? undefined),
      priority: patch.priority !== undefined ? patch.priority : (this.card.priority ?? undefined),
      dueDate: patch.dueDate !== undefined ? patch.dueDate : this.card.dueDate,
      assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : this.card.assigneeId,
      coverColor: patch.coverColor !== undefined ? patch.coverColor : this.card.coverColor
    };
    try {
      const updated = await this.cardService.updateCard(this.card.cardId, fullRequest);
      this.card = updated;
      this.cardUpdated.emit(updated);
    } catch (err: any) {
      this.errorMessage = 'Failed to save change. ' + (err?.message ?? '');
      console.error('Update card error:', err);
    }
  }

  async deleteCard(): Promise<void> {
    if (!this.card) return;
    const confirmed = confirm(`Delete card "${this.card.title}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const deletedId = this.card.cardId;
      await this.cardService.deleteCard(deletedId);
      this.cardDeleted.emit(deletedId);
      this.close();
    } catch (err: any) {
      this.errorMessage = 'Failed to delete card. ' + (err?.message ?? '');
      console.error('Delete card error:', err);
    }
  }

  close(): void {
    this.editingTitle = false;
    this.errorMessage = '';
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  formatDateForInput(isoDate: string | null): string {
    if (!isoDate) return '';
    return isoDate.substring(0, 10);
  }

  // ===== Assignee =====
  async loadBoardMembers(boardId: number): Promise<void> {
    this.loadingMembers = true;
    try {
      const members: BoardMember[] = await this.boardMemberService.getMembers(boardId);
      const enriched = await Promise.all(
        members.map(async (m) => {
          try {
            const user = await this.userService.findById(m.userId);
            return {
              userId: m.userId,
              fullName: user?.fullName ?? `User ${m.userId}`,
              email: user?.email ?? ''
            };
          } catch {
            return { userId: m.userId, fullName: `User ${m.userId}`, email: '' };
          }
        })
      );
      this.boardMembers = enriched;
    } catch (err) {
      console.error('Failed to load board members:', err);
      this.boardMembers = [];
    } finally {
      this.loadingMembers = false;
    }
  }

  async changeAssignee(value: string): Promise<void> {
    if (!this.card) return;
    const newAssigneeId = value === '' ? null : Number(value);
    if (newAssigneeId === this.card.assigneeId) return;
    await this.updateField({ assigneeId: newAssigneeId });
  }

  assigneeName(userId: number | null): string {
    if (userId === null) return 'Unassigned';
    const m = this.boardMembers.find(x => x.userId === userId);
    return m ? m.fullName : `User ${userId}`;
  }

  // ===== Comments =====
  async loadComments(cardId: number): Promise<void> {
    this.loadingComments = true;
    try {
      const all = await this.commentService.getCommentsByCard(cardId);
      const visible = all.filter(c => !c.isDeleted);
      this.comments = visible;
      this.commentsByParent = new Map();
      for (const c of visible) {
        const key = c.parentCommentId;
        const list = this.commentsByParent.get(key) ?? [];
        list.push(c);
        this.commentsByParent.set(key, list);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      this.comments = [];
      this.commentsByParent = new Map();
    } finally {
      this.loadingComments = false;
    }
  }

  topLevelComments(): CardComment[] {
    return this.commentsByParent.get(null) ?? [];
  }

  repliesOf(commentId: number): CardComment[] {
    return this.commentsByParent.get(commentId) ?? [];
  }

  async postComment(): Promise<void> {
    if (!this.card || !this.newCommentContent.trim() || !this.currentUserId) return;
    this.isPostingComment = true;
    try {
      const req: CreateCommentRequest = {
        cardId: this.card.cardId,
        authorId: this.currentUserId,
        content: this.newCommentContent.trim(),
        parentCommentId: null
      };
      await this.commentService.createComment(req);
      this.newCommentContent = '';
      await this.loadComments(this.card.cardId);
    } catch (err) {
      console.error('Failed to post comment:', err);
      this.errorMessage = 'Failed to post comment.';
    } finally {
      this.isPostingComment = false;
    }
  }

  startReply(commentId: number): void {
    this.replyingTo = commentId;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyContent = '';
  }

  async postReply(parentId: number): Promise<void> {
    if (!this.card || !this.replyContent.trim() || !this.currentUserId) return;
    try {
      const req: CreateCommentRequest = {
        cardId: this.card.cardId,
        authorId: this.currentUserId,
        content: this.replyContent.trim(),
        parentCommentId: parentId
      };
      await this.commentService.createComment(req);
      this.replyingTo = null;
      this.replyContent = '';
      await this.loadComments(this.card.cardId);
    } catch (err) {
      console.error('Failed to post reply:', err);
      this.errorMessage = 'Failed to post reply.';
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    if (!this.card) return;
    if (!confirm('Delete this comment?')) return;
    try {
      await this.commentService.deleteComment(commentId);
      await this.loadComments(this.card.cardId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      this.errorMessage = 'Failed to delete comment.';
    }
  }

  formatCommentTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  // ===== Checklist =====
  async loadChecklist(cardId: number): Promise<void> {
    this.loadingChecklist = true;
    try {
      const items = await this.checklistService.getItemsByCard(cardId);
      this.checklistItems = items.sort((a, b) => a.position - b.position);
    } catch (err) {
      console.error('Failed to load checklist:', err);
      this.checklistItems = [];
    } finally {
      this.loadingChecklist = false;
    }
  }

  checklistProgress(): number {
    if (this.checklistItems.length === 0) return 0;
    const done = this.checklistItems.filter(i => i.isCompleted).length;
    return Math.round((done / this.checklistItems.length) * 100);
  }

  async addChecklistItem(): Promise<void> {
    if (!this.card || !this.newItemText.trim()) return;
    this.isAddingItem = true;
    try {
      const req: CreateChecklistItemRequest = {
        cardId: this.card.cardId,
        text: this.newItemText.trim()
      };
      await this.checklistService.createItem(req);
      this.newItemText = '';
      await this.loadChecklist(this.card.cardId);
    } catch (err) {
      console.error('Failed to add checklist item:', err);
      this.errorMessage = 'Failed to add checklist item.';
    } finally {
      this.isAddingItem = false;
    }
  }

  async toggleChecklistItem(item: ChecklistItem): Promise<void> {
    try {
      const req: UpdateChecklistItemRequest = {
        text: item.text,
        isCompleted: !item.isCompleted
      };
      const updated = await this.checklistService.updateItem(item.itemId, req);
      const idx = this.checklistItems.findIndex(i => i.itemId === item.itemId);
      if (idx !== -1) this.checklistItems[idx] = updated;
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
      this.errorMessage = 'Failed to update checklist item.';
    }
  }

  async deleteChecklistItem(item: ChecklistItem): Promise<void> {
    if (!confirm(`Delete checklist item "${item.text}"?`)) return;
    try {
      await this.checklistService.deleteItem(item.itemId);
      this.checklistItems = this.checklistItems.filter(i => i.itemId !== item.itemId);
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
      this.errorMessage = 'Failed to delete checklist item.';
    }
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
}

