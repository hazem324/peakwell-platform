import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForumDashboardComponent } from './pages/forum-dashboard/forum-dashboard.component';
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';
import { ArticleFormComponent } from './components/article-form/article-form.component';
import { ArticleListComponent } from './components/article-list/article-list.component';

const routes: Routes = [
  {
    path: '',
    component: ArticleListComponent
  },
  {
    path: 'create',
    component: ArticleFormComponent
  },
  {
    path: 'detail/:id',
    component: ArticleDetailComponent
  },
  {
    path: 'edit/:id',
    component: ArticleFormComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForumRoutingModule { }