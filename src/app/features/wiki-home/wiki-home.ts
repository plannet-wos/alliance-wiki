import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AdminFeedback } from '../../core/models/article.model';

const SUPERADMIN_KEY = 'fw_superadmin';

interface Alliance { id: string; name: string; }

// ── Superadmin login dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-superadmin-login-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Superadmin Login</h2>
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
export class SuperadminLoginDialog {
  private ref            = inject<MatDialogRef<SuperadminLoginDialog>>(MatDialogRef);
  private articleService = inject(ArticleService);

  username = '';
  password = '';
  hide     = true;
  error    = false;
  loading  = false;

  async submit() {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.error   = false;
    const ok = await this.articleService.authenticateSuperAdmin(this.username, this.password);
    this.loading = false;
    if (ok) {
      this.ref.close(true);
    } else {
      this.error    = true;
      this.password = '';
    }
  }
}

// ── Wiki home component ──────────────────────────────────────────────────────
@Component({
  selector: 'app-wiki-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule, FormsModule],
  templateUrl: './wiki-home.html',
  styleUrl:    './wiki-home.scss'
})
export class WikiHome implements OnInit {
  private firestore      = inject(Firestore);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private articleService = inject(ArticleService);
  private cdr            = inject(ChangeDetectorRef);

  alliances$!:     Observable<Alliance[]>;
  isSuperAdmin     = false;
  adminFeedback$:  Observable<AdminFeedback[]> | null = null;
  showFeedback     = false;

  ngOnInit() {
    this.alliances$ = collectionData(
      collection(this.firestore, 'alliances'), { idField: 'id' }
    ) as Observable<Alliance[]>;

    this.isSuperAdmin = sessionStorage.getItem(SUPERADMIN_KEY) === 'true';
    if (this.isSuperAdmin) {
      this.adminFeedback$ = this.articleService.getAllAdminFeedback();
    }
  }

  open(allianceId: string) {
    this.router.navigate(['/wiki', allianceId]);
  }

  toggleSuperAdmin() {
    if (this.isSuperAdmin) {
      sessionStorage.removeItem(SUPERADMIN_KEY);
      this.isSuperAdmin   = false;
      this.adminFeedback$ = null;
      this.showFeedback   = false;
    } else {
      const ref = this.dialog.open(SuperadminLoginDialog, { width: '320px' });
      ref.afterClosed().subscribe((success: boolean) => {
        if (success) {
          sessionStorage.setItem(SUPERADMIN_KEY, 'true');
          this.isSuperAdmin   = true;
          this.adminFeedback$ = this.articleService.getAllAdminFeedback();
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleFeedbackPanel() {
    this.showFeedback = !this.showFeedback;
  }
}
