import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MultiFactorResolver } from 'firebase/auth';
import { AuthService, MfaRequiredError } from '../../core/services/auth.service';

/**
 * Single login dialog for both entry points (superadmin, from wiki-home; alliance admin, from
 * wiki-list) — there's no longer a "which alliance" field to ask for, since that's intrinsic
 * to the account now rather than something the old per-alliance write-trick needed supplied
 * up front. Closes with `true` on success, same contract the two dialogs it replaces used, so
 * callers only need to check the resulting account's rank/allianceId themselves.
 */
@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Admin Login</h2>
    <mat-dialog-content>
      @if (!pendingMfaResolver()) {
        <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="email" (keydown.enter)="submit()" autofocus autocomplete="username">
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%;margin-top:4px">
          <mat-label>Password</mat-label>
          <input matInput [type]="hide ? 'password' : 'text'" [(ngModel)]="password" (keydown.enter)="submit()" autocomplete="current-password">
          <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
            <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>
        @if (error()) {
          <p class="dialog-error">Incorrect credentials.</p>
        }
      } @else {
        <p class="mfa-hint">Enter the 6-digit code from your authenticator app.</p>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Authenticator code</mat-label>
          <input matInput [(ngModel)]="otp" (keydown.enter)="submitOtp()" inputmode="numeric" maxlength="6" autocomplete="one-time-code">
        </mat-form-field>
        @if (error()) {
          <p class="dialog-error">Invalid authenticator code.</p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!pendingMfaResolver()) {
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Checking...' : 'Login' }}
        </button>
      } @else {
        <button mat-button (click)="cancelMfa()">Back</button>
        <button mat-flat-button color="primary" (click)="submitOtp()" [disabled]="loading()">
          {{ loading() ? 'Checking...' : 'Verify' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-error { color: var(--mat-warn-color, #f44336); margin: 0; font-size: 13px; }
    .mfa-hint { font-size: 13px; opacity: 0.8; margin: 0 0 4px; }
  `],
})
export class LoginDialog {
  private ref = inject<MatDialogRef<LoginDialog>>(MatDialogRef);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  otp = '';
  hide = true;
  error = signal(false);
  loading = signal(false);
  pendingMfaResolver = signal<MultiFactorResolver | null>(null);

  async submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      await this.auth.login(this.email, this.password);
      this.ref.close(true);
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        this.pendingMfaResolver.set(err.resolver);
      } else {
        this.error.set(true);
        this.password = '';
      }
    } finally {
      this.loading.set(false);
      // Zoneless: nothing schedules a re-render after an await resolves on its own.
      this.cdr.detectChanges();
    }
  }

  async submitOtp() {
    const resolver = this.pendingMfaResolver();
    if (!resolver || !this.otp) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      await this.auth.completeMfaSignIn(resolver, this.otp);
      this.ref.close(true);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  cancelMfa() {
    this.pendingMfaResolver.set(null);
    this.otp = '';
    this.error.set(false);
  }
}
