import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastServiceService } from '../../../../services/toast-service.service';
import { NutritionDataService } from '../../../../services/nutrition-data.service';
import { BlogPost } from '../../../../models/nutrition.models';




@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent {

  posts: BlogPost[];

  constructor(private data: NutritionDataService, public toastService: ToastServiceService, private router: Router) {
    this.posts = this.data.blogPosts;
  }

  openPost(post: BlogPost): void {
    this.toastService.show(`📖 Opening: "${post.title}"`);
  }

  goToForum(): void {
    this.router.navigate(['/forum']);
  }

}
