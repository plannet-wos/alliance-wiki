import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { Article } from '../../core/models/article.model';

const ADMIN_KEY = 'fw_admin';

// ── Inline admin-login dialog ────────────────────────────────────────────────
@Component({
  selector: 'app-admin-login-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Admin Login</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Username</mat-label>
        <input matInput [(ngModel)]="username" (keydown.enter)="submit()" autofocus>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%;margin-top:4px">
        <mat-label>Password</mat-label>
        <input matInput [type]="hide ? 'password' : 'text'" [(ngModel)]="password" (keydown.enter)="submit()">
        <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
          <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <p *ngIf="error" style="color:var(--mat-warn-color,#f44336);margin:0;font-size:13px">Incorrect credentials.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="loading">
        {{ loading ? 'Checking...' : 'Login' }}
      </button>
    </mat-dialog-actions>
  `
})
export class AdminLoginDialog {
  private ref            = inject<MatDialogRef<AdminLoginDialog>>(MatDialogRef);
  private articleService = inject(ArticleService);
  data                   = inject<{ allianceId: string }>(MAT_DIALOG_DATA);

  username = '';
  password = '';
  hide     = true;
  error    = false;
  loading  = false;

  async submit() {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.error   = false;
    const ok = await this.articleService.authenticate(this.username, this.password, this.data.allianceId);
    this.loading = false;
    if (ok) {
      this.ref.close(true);
    } else {
      this.error    = true;
      this.password = '';
    }
  }
}

// ── Admin feedback dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-feedback-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Submit Feedback</h2>
    <mat-dialog-content>
      <p style="font-size:13px;color:#666;margin:0 0 12px">
        Share general feedback about this wiki. Only the superadmin will see this.
      </p>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Your feedback</mat-label>
        <textarea matInput [(ngModel)]="content" rows="5" placeholder="What's working well? What could be improved?" autofocus></textarea>
      </mat-form-field>
      <p *ngIf="error" style="color:var(--mat-warn-color,#f44336);margin:4px 0 0;font-size:13px">Failed to submit. Please try again.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!content.trim() || loading">
        {{ loading ? 'Sending...' : 'Submit' }}
      </button>
    </mat-dialog-actions>
  `
})
export class AdminFeedbackDialog {
  private ref            = inject<MatDialogRef<AdminFeedbackDialog>>(MatDialogRef);
  private articleService = inject(ArticleService);
  data                   = inject<{ allianceId: string }>(MAT_DIALOG_DATA);

  content = '';
  error   = false;
  loading = false;

  async submit() {
    if (!this.content.trim()) return;
    this.loading = true;
    this.error   = false;
    try {
      await this.articleService.submitAdminFeedback({
        allianceId: this.data.allianceId,
        content:    this.content.trim(),
        createdAt:  Date.now()
      });
      this.ref.close(true);
    } catch {
      this.error = true;
    }
    this.loading = false;
  }
}

// ── Wiki list component ──────────────────────────────────────────────────────
@Component({
  selector: 'app-wiki-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatDialogModule, MatSnackBarModule
  ],
  templateUrl: './wiki-list.html',
  styleUrl:    './wiki-list.scss'
})
export class WikiList implements OnInit {
  private articleService = inject(ArticleService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);

  allianceId!: string;
  articles$!:  Observable<Article[]>;
  isAdmin      = false;

  ngOnInit() {
    this.allianceId = this.route.snapshot.paramMap.get('allianceId')!;
    this.isAdmin    = sessionStorage.getItem(ADMIN_KEY) === this.allianceId;
    this._loadArticles();
  }

  private _loadArticles() {
    const all$ = this.articleService.getArticlesByAlliance(this.allianceId);
    if (this.isAdmin) {
      this.articles$ = all$;
    } else {
      this.articles$ = all$.pipe(
        map(articles => articles.filter(a => a.status === 'published' || !a.status))
      );
    }
  }

  openArticle(id: string) {
    this.router.navigate(['/wiki', this.allianceId, 'article', id]);
  }

  newArticle() {
    this.router.navigate(['/wiki', this.allianceId, 'new']);
  }

  async deleteArticle(id: string, event: Event) {
    event.stopPropagation();
    await this.articleService.deleteArticle(id);
  }

  editArticle(id: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/wiki', this.allianceId, 'edit', id]);
  }

  openAdminFeedback() {
    const ref = this.dialog.open(AdminFeedbackDialog, { width: '420px', data: { allianceId: this.allianceId } });
    ref.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.snackBar.open('Feedback submitted', 'Close', { duration: 2500 });
      }
    });
  }

  toggleAdmin() {
    if (this.isAdmin) {
      sessionStorage.removeItem(ADMIN_KEY);
      this.isAdmin = false;
      this._loadArticles();
    } else {
      const ref = this.dialog.open(AdminLoginDialog, { width: '320px', data: { allianceId: this.allianceId } });
      ref.afterClosed().subscribe((success: boolean) => {
        if (success) {
          sessionStorage.setItem(ADMIN_KEY, this.allianceId);
          this.isAdmin = true;
          this._loadArticles();
          this.cdr.detectChanges();
        }
      });
    }
  }
}
