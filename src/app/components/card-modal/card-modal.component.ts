import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card, CardService, UpdateCardRequest } from '../../core/card.service';

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

  constructor(private cardService: CardService) {}

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
}

