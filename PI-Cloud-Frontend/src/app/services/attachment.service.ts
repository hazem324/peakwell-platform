import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attachment } from '../models/attachment.model';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private apiUrl = 'http://localhost:8090/peakwell/api/attachments';

  constructor(private http: HttpClient) { }

  uploadAttachment(articleId: number, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(
      `${this.apiUrl}/article/${articleId}`,
      formData
    );
  }

  getAttachmentsByArticle(articleId: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(
      `${this.apiUrl}/article/${articleId}`
    );
  }

  downloadAttachment(id: number, fileName: string): void {
    const link = document.createElement('a');
    link.href = `${this.apiUrl}/download/${id}`;
    link.download = fileName;
    link.click();
  }

  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
