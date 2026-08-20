import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TiptapEditor } from '../../shared/tiptap-editor/tiptap-editor';
import { ArticleService } from '../../core/services/article.service';
import { Article } from '../../core/models/article.model';

// ── Inline image-URL dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-cover-image-url-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Add Cover Image by URL</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Image URL</mat-label>
        <input matInput type="url" [(ngModel)]="url" placeholder="https://..." (keydown.enter)="submit()" autofocus>
      </mat-form-field>
      <p style="font-size:12px;color:#888;margin:0">The URL will be saved and used directly as the image source.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!url">Use URL</button>
    </mat-dialog-actions>
  `
})
export class CoverImageUrlDialog {
  private ref = inject<MatDialogRef<CoverImageUrlDialog>>(MatDialogRef);
  url = '';
  submit() { if (this.url) this.ref.close(this.url); }
}

@Component({
  selector: 'app-wiki-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule,
    TiptapEditor
  ],
  templateUrl: './wiki-editor.html',
  styleUrl:    './wiki-editor.scss'
})
export class WikiEditor implements OnInit {
  private articleService = inject(ArticleService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  private cdr            = inject(ChangeDetectorRef);

  allianceId!: string;
  articleId:   string | null = null;
  isEdit       = false;
  saving       = false;

  title        = '';
  category     = '';
  authorName   = '';
  content      = '';
  coverImage   = '';
  coverLoading = false;
  contentReady = false;
  currentStatus: 'published' | 'draft' = 'published';
  private originalCreatedAt: number | null = null;

  async ngOnInit() {
    this.allianceId = this.route.snapshot.paramMap.get('allianceId')!;
    this.articleId  = this.route.snapshot.paramMap.get('articleId');
    this.isEdit     = !!this.articleId;

    if (this.isEdit && this.articleId) {
      const article = await this.articleService.getArticle(this.articleId);
      if (article) {
        this.title              = article.title;
        this.category           = article.category  ?? '';
        this.authorName         = article.authorName ?? '';
        this.content            = article.content;
        this.coverImage         = article.coverImage ?? '';
        this.currentStatus      = article.status ?? 'published';
        this.originalCreatedAt  = article.createdAt;
      }
    }
    this.contentReady = true;
    this.cdr.detectChanges();
  }

  onContentChange(html: string) {
    this.content = html;
  }

  removeCover() {
    this.coverImage = '';
  }

  async uploadCover(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverLoading = true;
    this.cdr.detectChanges();
    try {
      this.coverImage = await this.articleService.uploadImage(file);
    } finally {
      this.coverLoading = false;
      this.cdr.detectChanges();
    }
  }

  addCoverByUrl() {
    const ref = this.dialog.open(CoverImageUrlDialog, { width: '400px' });
    ref.afterClosed().subscribe((url: string) => {
      if (url) { this.coverImage = url; this.cdr.detectChanges(); }
    });
  }

  async saveAsDraft() {
    await this._save('draft');
  }

  async publish() {
    await this._save('published');
  }

  private async _save(status: 'published' | 'draft') {
    if (!this.title.trim() || !this.content.trim()) return;
    this.saving = true;
    try {
      const now = Date.now();
      const id  = this.articleId ?? `article_${now}`;
      const article: Article = {
        id,
        allianceId:  this.allianceId,
        title:       this.title.trim(),
        content:     this.content,
        category:    this.category.trim()   || null,
        authorName:  this.authorName.trim() || null,
        coverImage:  this.coverImage        || null,
        status,
        createdAt:   this.isEdit ? (this.originalCreatedAt ?? now) : now,
        updatedAt:   now
      };
      await this.articleService.saveArticle(article);
      const msg = status === 'draft' ? 'Saved as draft' : (this.isEdit ? 'Article updated' : 'Article published');
      this.snackBar.open(msg, 'Close', { duration: 2500 });
      this.router.navigate(['/wiki', this.allianceId, 'article', id]);
    } catch (e) {
      console.error(e);
      this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
    }
    this.saving = false;
  }

  cancel() {
    this.router.navigate(['/wiki', this.allianceId]);
  }
}
