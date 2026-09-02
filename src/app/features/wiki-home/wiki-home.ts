import { Component, inject, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, filter, timeout, catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginDialog } from '../../shared/login-dialog/login-dialog';
import { AdminFeedback } from '../../core/models/article.model';
import { Alliance } from '../../core/models/alliance.model';

@Component({
  selector: 'app-wiki-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule, FormsModule],
  templateUrl: './wiki-home.html',
  styleUrl:    './wiki-home.scss'
})
export class WikiHome implements OnInit {
  private firestore      = inject(Firestore);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private articleService = inject(ArticleService);
  protected auth         = inject(AuthService);

  stateId!: string;
  alliances$!:     Observable<Alliance[]>;
  adminFeedback$:  Observable<AdminFeedback[]> | null = null;
  showFeedback     = false;

  ngOnInit() {
    this.stateId = this.route.snapshot.paramMap.get('stateId')!;
    this.alliances$ = collectionData(
      query(collection(this.firestore, 'alliances'), where('stateId', '==', this.stateId))
    ) as Observable<Alliance[]>;

    if (this.auth.isSuperAdmin()) {
      this.adminFeedback$ = this.articleService.getAllAdminFeedback();
    }
  }

  open(alliance: Alliance) {
    this.router.navigate([this.stateId, 'wiki', alliance.slug]);
  }

  toggleSuperAdmin() {
    if (this.auth.isSuperAdmin()) {
      this.auth.logout();
      this.adminFeedback$ = null;
      this.showFeedback   = false;
    } else {
      const ref = this.dialog.open(LoginDialog, { width: '320px' });
      ref.afterClosed().subscribe(async (success: boolean) => {
        if (!success) return;
        // account() loads asynchronously via an onSnapshot listener — wait for it rather
        // than checking isSuperAdmin() in the same tick the dialog closes.
        await firstValueFrom(toObservable(this.auth.account).pipe(
          filter((a) => a !== null),
          timeout(6000),
          catchError(() => of(null)),
        ));
        if (this.auth.isSuperAdmin()) {
          this.adminFeedback$ = this.articleService.getAllAdminFeedback();
        }
      });
    }
  }

  toggleFeedbackPanel() {
    this.showFeedback = !this.showFeedback;
  }
}
