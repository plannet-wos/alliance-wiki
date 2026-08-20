import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { Article, ArticleFeedback } from '../../core/models/article.model';

@Component({
  selector: 'app-wiki-article',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  templateUrl: './wiki-article.html',
  styleUrl:    './wiki-article.scss'
})
export class WikiArticle implements OnInit {
  private articleService = inject(ArticleService);
  private adminSession   = inject(AdminSessionService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);

  article:      Article | null = null;
  allianceId!:  string;
  isAdmin       = false;

  // Feedback
  feedback$:          Observable<ArticleFeedback[]> | null = null;
  feedbackText        = '';
  submittingFeedback  = false;

  async ngOnInit() {
    this.allianceId      = this.route.snapshot.paramMap.get('allianceId')!;
    const articleId      = this.route.snapshot.paramMap.get('articleId')!;
    this.isAdmin         = this.adminSession.canAdminister(this.allianceId);

    const article = await this.articleService.getArticle(articleId);

    // Draft guard: non-admins cannot access drafts
    if (article && article.status === 'draft' && !this.isAdmin) {
      this.router.navigate(['/wiki', this.allianceId]);
      return;
    }

    this.article = article;

    if (this.article) {
      this.feedback$ = this.articleService.getFeedbackByArticle(this.article.id);
    }

    this.cdr.detectChanges();
  }

  edit() {
    this.router.navigate(['/wiki', this.allianceId, 'edit', this.article!.id]);
  }

  back() {
    this.router.navigate(['/wiki', this.allianceId]);
  }

  async submitFeedback() {
    if (!this.feedbackText.trim() || !this.article) return;
    this.submittingFeedback = true;
    try {
      await this.articleService.submitArticleFeedback({
        articleId:  this.article.id,
        allianceId: this.allianceId,
        content:    this.feedbackText.trim(),
        createdAt:  Date.now()
      });
      this.feedbackText = '';
      this.snackBar.open('Feedback submitted', 'Close', { duration: 2500 });
    } catch {
      this.snackBar.open('Failed to submit feedback', 'Close', { duration: 3000 });
    }
    this.submittingFeedback = false;
    this.cdr.detectChanges();
  }
}
