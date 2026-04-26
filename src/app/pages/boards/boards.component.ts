import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { WorkspaceService, Workspace } from '../../core/workspace.service';
import { BoardService, Board, CreateBoardRequest } from '../../core/board.service';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boards.component.html',
  styleUrl: './boards.component.scss'
})
export class BoardsComponent implements OnInit {
  workspaceId = 0;
  workspace: Workspace | null = null;
  boards: Board[] = [];
  isLoading = true;
  errorMessage = '';
  currentUserName = '';
  currentUserId = 0;

  showCreateForm = false;
  newName = '';
  newDescription = '';
  newVisibility = 'PRIVATE';
  newColor = 'BLUE';
  isCreating = false;

  readonly colors = ['BLUE', 'GREEN', 'PURPLE', 'ORANGE', 'RED', 'GRAY'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private boardService: BoardService
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserName = user.fullName;
    this.currentUserId = user.userId;

    this.workspaceId = Number(this.route.snapshot.paramMap.get('workspaceId'));
    if (!this.workspaceId) {
      this.router.navigate(['/workspaces']);
      return;
    }

    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [workspace, boards] = await Promise.all([
        this.workspaceService.getWorkspaceById(this.workspaceId),
        this.boardService.getBoardsByWorkspace(this.workspaceId)
      ]);
      this.workspace = workspace;
      this.boards = boards;
    } catch (error: any) {
      console.error('Failed to load boards:', error);
      if (error.status === 401) {
        this.authService.logout();
        return;
      }
      this.errorMessage = 'Failed to load boards.';
    } finally {
      this.isLoading = false;
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newName = '';
      this.newDescription = '';
      this.newVisibility = 'PRIVATE';
      this.newColor = 'BLUE';
    }
  }

  async createBoard(): Promise<void> {
    if (!this.newName.trim()) return;

    this.isCreating = true;
    try {
      const request: CreateBoardRequest = {
        name: this.newName.trim(),
        description: this.newDescription.trim() || undefined,
        workspaceId: this.workspaceId,
        createdBy: this.currentUserId,
        visibility: this.newVisibility,
        backgroundColor: this.newColor
      };
      const created = await this.boardService.createBoard(request);
      this.boards.unshift(created);
      this.toggleCreateForm();
    } catch (error: any) {
      console.error('Failed to create board:', error);
      this.errorMessage = 'Failed to create board.';
    } finally {
      this.isCreating = false;
    }
  }

  openBoard(boardId: number): void {
    this.router.navigate(['/boards', boardId]);
  }

  backToWorkspaces(): void {
    this.router.navigate(['/workspaces']);
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
    return map[color || 'GRAY'] || 'bg-gray-500';
  }
}