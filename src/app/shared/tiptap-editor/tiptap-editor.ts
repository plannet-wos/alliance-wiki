import {
  Component, Input, Output, EventEmitter,
  OnDestroy, ElementRef, ViewChild, AfterViewInit, inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

// ── Inline link dialog ───────────────────────────────────────────────────────
@Component({
  selector: 'app-link-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Insert Link</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>URL</mat-label>
        <input matInput type="url" [(ngModel)]="url" placeholder="https://..." (keydown.enter)="submit()" autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!url">Insert</button>
    </mat-dialog-actions>
  `
})
export class LinkDialog {
  private ref = inject<MatDialogRef<LinkDialog>>(MatDialogRef);
  url = '';
  submit() { if (this.url) this.ref.close(this.url); }
}

// ── Image-by-URL dialog ──────────────────────────────────────────────────────
@Component({
  selector: 'app-image-url-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Insert Image by URL</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Image URL</mat-label>
        <input matInput type="url" [(ngModel)]="url" placeholder="https://..." (keydown.enter)="submit()" autofocus>
      </mat-form-field>
      <p style="font-size:12px;color:#888;margin:0">The URL will be saved and used directly as the image source.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!url">Insert</button>
    </mat-dialog-actions>
  `
})
export class ImageUrlDialog {
  private ref = inject<MatDialogRef<ImageUrlDialog>>(MatDialogRef);
  url = '';
  submit() { if (this.url) this.ref.close(this.url); }
}

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDividerModule, MatDialogModule],
  templateUrl: './tiptap-editor.html',
  styleUrl:    './tiptap-editor.scss'
})
export class TiptapEditor implements AfterViewInit, OnDestroy {
  @Input()  initialContent = '';
  @Output() contentChange  = new EventEmitter<string>();

  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  private dialog         = inject(MatDialog);
  private articleService = inject(ArticleService);
  private cdr            = inject(ChangeDetectorRef);

  editor:    Editor | undefined;
  uploading  = false;

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit,
        Image.configure({ inline: false, allowBase64: false }),
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: 'Start writing your guide...' }),
      ],
      content: this.initialContent,
      onUpdate: ({ editor }) => {
        this.contentChange.emit(editor.getHTML());
      }
    });
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  // ── Toolbar helpers ──────────────────────────────────────────────────────

  isActive(type: string, attrs?: Record<string, unknown>): boolean {
    return this.editor?.isActive(type, attrs) ?? false;
  }

  toggleBold()        { this.editor?.chain().focus().toggleBold().run(); }
  toggleItalic()      { this.editor?.chain().focus().toggleItalic().run(); }
  toggleStrike()      { this.editor?.chain().focus().toggleStrike().run(); }
  toggleCode()        { this.editor?.chain().focus().toggleCode().run(); }
  toggleBullet()      { this.editor?.chain().focus().toggleBulletList().run(); }
  toggleOrdered()     { this.editor?.chain().focus().toggleOrderedList().run(); }
  toggleBlockquote()  { this.editor?.chain().focus().toggleBlockquote().run(); }
  toggleCodeBlock()   { this.editor?.chain().focus().toggleCodeBlock().run(); }
  setH(level: 1|2|3) { this.editor?.chain().focus().toggleHeading({ level }).run(); }
  setHr()             { this.editor?.chain().focus().setHorizontalRule().run(); }
  undo()              { this.editor?.chain().focus().undo().run(); }
  redo()              { this.editor?.chain().focus().redo().run(); }

  setLink() {
    const ref = this.dialog.open(LinkDialog, { width: '360px' });
    ref.afterClosed().subscribe((url: string) => {
      if (url) this.editor?.chain().focus().setLink({ href: url }).run();
    });
  }

  async uploadImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.cdr.detectChanges();
    try {
      const url = await this.articleService.uploadImage(file);
      this.editor?.chain().focus().setImage({ src: url }).run();
    } finally {
      this.uploading = false;
      (event.target as HTMLInputElement).value = '';
      this.cdr.detectChanges();
    }
  }

  insertImageByUrl() {
    const ref = this.dialog.open(ImageUrlDialog, { width: '400px' });
    ref.afterClosed().subscribe((url: string) => {
      if (url) this.editor?.chain().focus().setImage({ src: url }).run();
    });
  }
}
