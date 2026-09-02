import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc,
  setDoc, deleteDoc, getDoc, query, where, orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Article, ArticleFeedback, AdminFeedback } from '../models/article.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private firestore = inject(Firestore);

  getArticlesByAlliance(allianceId: string): Observable<Article[]> {
    return collectionData(
      query(collection(this.firestore, 'wiki_articles'), where('allianceId', '==', allianceId)),
      { idField: 'id' }
    ) as Observable<Article[]>;
  }

  async getArticle(id: string): Promise<Article | null> {
    const snap = await getDoc(doc(this.firestore, `wiki_articles/${id}`));
    return snap.exists() ? (snap.data() as Article) : null;
  }

  async saveArticle(article: Article): Promise<void> {
    await setDoc(doc(this.firestore, `wiki_articles/${article.id}`), article, { merge: true });
  }

  async deleteArticle(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `wiki_articles/${id}`));
  }

  // Login moved to AuthService (real Firebase Auth now — see the multi-state rollout plan).

  async uploadImage(file: File): Promise<string> {
    const { cloudName, uploadPreset } = environment.cloudinary;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const data = await res.json();
    return data.secure_url as string;
  }

  // ── Article Feedback ────────────────────────────────────────────────────────

  async submitArticleFeedback(feedback: Omit<ArticleFeedback, 'id'>): Promise<void> {
    const id = `feedback_${Date.now()}`;
    await setDoc(doc(this.firestore, `article_feedback/${id}`), { ...feedback, id });
  }

  getFeedbackByArticle(articleId: string): Observable<ArticleFeedback[]> {
    return collectionData(
      query(
        collection(this.firestore, 'article_feedback'),
        where('articleId', '==', articleId),
        orderBy('createdAt', 'asc')
      ),
      { idField: 'id' }
    ) as Observable<ArticleFeedback[]>;
  }

  // ── Admin Feedback ──────────────────────────────────────────────────────────

  async submitAdminFeedback(feedback: Omit<AdminFeedback, 'id'>): Promise<void> {
    const id = `adminfb_${Date.now()}`;
    await setDoc(doc(this.firestore, `admin_feedback/${id}`), { ...feedback, id });
  }

  getAllAdminFeedback(): Observable<AdminFeedback[]> {
    return collectionData(
      query(collection(this.firestore, 'admin_feedback'), orderBy('createdAt', 'desc')),
      { idField: 'id' }
    ) as Observable<AdminFeedback[]>;
  }
}
