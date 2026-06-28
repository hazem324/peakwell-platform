export interface Attachment {
  id?: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  articleId: number;
  createdAt?: Date;
}
