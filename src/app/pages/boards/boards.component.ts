import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { WorkspaceService, Workspace } from '../../core/workspace.service';
import { BoardService, Board, CreateBoardRequest } from '../../core/board.service';
import { WorkspaceMemberService, WorkspaceMember } from '../../core/workspace-member.service';
import { UserService, UserSummary } from '../../core/user.service';

interface MemberWithUser {
  member: WorkspaceMember;
  user: UserSummary | null;
}

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

  // Members modal state
  showMembers = false;
  members: MemberWithUser[] = [];
  isLoadingMembers = false;
  inviteEmail = '';
  inviteRole = 'MEMBER';
  isInviting = false;
  inviteMessage = '';
  inviteError = '';

  readonly roles = ['OBSERVER', 'MEMBER', 'ADMIN'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private boardService: BoardService,
    private memberService: WorkspaceMemberService,
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
      const memberList = await this.memberService.getMembers(this.workspaceId);
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
        this.inviteError = `No user found with email ${trimmedEmail}. They need to register first.`;
        return;
      }

      if (this.members.some(m => m.member.userId === foundUser.userId)) {
        this.inviteError = `${foundUser.fullName} is already a member.`;
        return;
      }

      await this.memberService.addMember(this.workspaceId, {
        userId: foundUser.userId,
        role: this.inviteRole
      });

      this.inviteMessage = `Added ${foundUser.fullName} as ${this.inviteRole}.`;
      this.inviteEmail = '';
      await this.loadMembers();
    } catch (error: any) {
      console.error('Invite failed:', error);
      if (error.status === 409) {
        this.inviteError = 'User is already a member of this workspace.';
      } else {
        this.inviteError = 'Failed to add member. Please try again.';
      }
    } finally {
      this.isInviting = false;
    }
  }

  async changeRole(member: MemberWithUser, newRole: string): Promise<void> {
    try {
      await this.memberService.updateRole(this.workspaceId, member.member.userId, { role: newRole });
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
    if (!confirm(`Remove ${userName} from this workspace?`)) return;

    try {
      await this.memberService.removeMember(this.workspaceId, member.member.userId);
      this.members = this.members.filter(m => m.member.userId !== member.member.userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }
}