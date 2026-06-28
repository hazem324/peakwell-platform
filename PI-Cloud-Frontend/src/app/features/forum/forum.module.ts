import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


import { ForumRoutingModule } from './forum-routing.module';
import { ForumDashboardComponent } from './pages/forum-dashboard/forum-dashboard.component';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';
import { ArticleFormComponent } from './components/article-form/article-form.component';
import { CommentListComponent } from './components/comment-list/comment-list.component';
import { CommentFormComponent } from './components/comment-form/comment-form.component';
import { ReactionBarComponent } from './components/reaction-bar/reaction-bar.component';
import { ShareButtonComponent } from './components/share-button/share-button.component';
import { SaveButtonComponent } from './components/save-button/save-button.component';
import { AttachmentListComponent } from './components/attachment-list/attachment-list.component';
import { AttachmentUploadComponent } from './components/attachment-upload/attachment-upload.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@NgModule({
  declarations: [
    ForumDashboardComponent,
    ArticleListComponent,
    ArticleDetailComponent,
    ArticleFormComponent,
    CommentListComponent,
    CommentFormComponent,
    ReactionBarComponent,
    ShareButtonComponent,
    SaveButtonComponent,
    AttachmentListComponent,
    AttachmentUploadComponent,
    ClickOutsideDirective
  ],
  imports: [
    CommonModule,
    RouterModule,
    ForumRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class ForumModule { }
