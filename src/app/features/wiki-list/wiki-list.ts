import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { Observable, map, firstValueFrom, filter, timeout, catchError, of } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginDialog } from '../../shared/login-dialog/login-dialog';
import { Article } from '../../core/models/article.model';
import { allianceId as resolveAllianceId } from '../../core/models/alliance.model';

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
  private cdr             = inject(ChangeDetectorRef);
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
    this.cdr.detectChanges(); // zoneless — see LoginDialog.submit()
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
  protected auth          = inject(AuthService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);

  stateId!: string;
  allianceSlug!: string;
  allianceId!: string;
  articles$!:  Observable<Article[]>;
  isAdmin      = false;

  ngOnInit() {
    this.stateId = this.route.snapshot.paramMap.get('stateId')!;
    this.allianceSlug = this.route.snapshot.paramMap.get('allianceSlug')!;
    this.allianceId = resolveAllianceId(this.stateId, this.allianceSlug);
    this.isAdmin = this.auth.canAdminister(this.allianceId);
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
    this.router.navigate([this.stateId, 'wiki', this.allianceSlug, 'article', id]);
  }

  newArticle() {
    this.router.navigate([this.stateId, 'wiki', this.allianceSlug, 'new']);
  }

  async deleteArticle(id: string, event: Event) {
    event.stopPropagation();
    await this.articleService.deleteArticle(id);
  }

  editArticle(id: string, event: Event) {
    event.stopPropagation();
    this.router.navigate([this.stateId, 'wiki', this.allianceSlug, 'edit', id]);
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
      // There's only one signed-in account now (real Firebase Auth) — no more separate
      // per-alliance vs. superadmin sessions to toggle independently, so "exit admin" here
      // just signs out entirely, same as wiki-home's superadmin toggle.
      this.auth.logout();
      this.isAdmin = false;
      this._loadArticles();
    } else {
      const ref = this.dialog.open(LoginDialog, { width: '320px' });
      ref.afterClosed().subscribe(async (success: boolean) => {
        if (!success) return;
        await firstValueFrom(toObservable(this.auth.account).pipe(
          filter((a) => a !== null),
          timeout(6000),
          catchError(() => of(null)),
        ));
        this.isAdmin = this.auth.canAdminister(this.allianceId);
        this._loadArticles();
      });
    }
  }
}
