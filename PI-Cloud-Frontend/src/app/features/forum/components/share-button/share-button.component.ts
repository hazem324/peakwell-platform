import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-share-button',
  templateUrl: './share-button.component.html',
  styleUrl: './share-button.component.css'
})
export class ShareButtonComponent {
  @Input() articleId: number | null = null;
  @Input() articleTitle: string = '';

  isDropdownOpen: boolean = false;
  copyFeedback: string = '';

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  copyLink(): void {
    const url = `${window.location.origin}/forum/detail/${this.articleId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copyFeedback = 'Copied!';
      setTimeout(() => {
        this.copyFeedback = '';
        this.closeDropdown();
      }, 2000);
    });
  }

  shareOnLinkedIn(): void {
    const url = `${window.location.origin}/forum/detail/${this.articleId}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    this.closeDropdown();
  }

  shareOnTwitter(): void {
    const url = `${window.location.origin}/forum/detail/${this.articleId}`;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(this.articleTitle)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    this.closeDropdown();
  }

  shareOnFacebook(): void {
    const url = `${window.location.origin}/forum/detail/${this.articleId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    this.closeDropdown();
  }
}
