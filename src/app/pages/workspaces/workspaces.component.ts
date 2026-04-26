import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { WorkspaceService, Workspace, CreateWorkspaceRequest } from '../../core/workspace.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.scss'
})
export class WorkspacesComponent implements OnInit {
  workspaces: Workspace[] = [];
  isLoading = true;
  errorMessage = '';
  currentUserName = '';
  currentUserId = 0;

  // Create form state
  showCreateForm = false;
  newName = '';
  newDescription = '';
  newVisibility = 'PRIVATE';
  isCreating = false;

  constructor(
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserName = user.fullName;
    this.currentUserId = user.userId;
    await this.loadWorkspaces();
  }

  async loadWorkspaces(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.workspaces = await this.workspaceService.getMyWorkspaces(this.currentUserId);
    } catch (error: any) {
      console.error('Failed to load workspaces:', error);
      if (error.status === 401) {
        this.authService.logout();
        return;
      }
      this.errorMessage = 'Failed to load workspaces. Please try again.';
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
    }
  }

  async createWorkspace(): Promise<void> {
    if (!this.newName.trim()) {
      return;
    }

    this.isCreating = true;
    try {
      const request: CreateWorkspaceRequest = {
        name: this.newName.trim(),
        description: this.newDescription.trim() || undefined,
        ownerId: this.currentUserId,
        visibility: this.newVisibility
      };
      const created = await this.workspaceService.createWorkspace(request);
      this.workspaces.unshift(created);
      this.toggleCreateForm();
    } catch (error: any) {
      console.error('Failed to create workspace:', error);
      this.errorMessage = 'Failed to create workspace.';
    } finally {
      this.isCreating = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}