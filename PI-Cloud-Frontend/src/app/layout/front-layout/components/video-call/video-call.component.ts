import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
  sender: 'you' | 'doctor';
  text: string;
  time: string;
}

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLInputElement>;

  private api = 'http://localhost:8090/peakwell/api/consultations';

  // Call state
  consultationId: number | null = null;
  consultation: any = null;
  callState: 'loading' | 'ready' | 'connecting' | 'connected' | 'ended' = 'loading';
  error = '';

  // Media
  localStream: MediaStream | null = null;
  cameraOn = true;
  micOn = true;
  screenSharing = false;
  private screenStream: MediaStream | null = null;

  // Timer
  callStartTime: number | null = null;
  callDuration = '00:00';
  private timerInterval: any = null;

  // Chat
  chatOpen = false;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  unreadChat = 0;

  // Notes
  notesOpen = false;
  callNotes = '';

  // UI
  localMinimized = false;
  showControls = true;
  private controlsTimeout: any;

  // Doctor simulation (for demo — simulates doctor joining)
  doctorJoined = false;
  private doctorTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.consultationId = id != null ? +id : null;
  
    if (this.consultationId != null) {
      this.loadConsultation();
    } else {
      this.callState = 'ready';
    }
  
    this.initCamera();
  }

  ngOnDestroy(): void {
    this.stopAllStreams();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.doctorTimer) clearTimeout(this.doctorTimer);
    if (this.controlsTimeout) clearTimeout(this.controlsTimeout);
  }

  // ── Load consultation details ────────────────────

  private loadConsultation(): void {
    if (this.consultationId == null) return;
    this.http.get<any>(`${this.api}/${this.consultationId}`).subscribe({
      next: data => {
        this.consultation = data;
        this.callState = 'ready';
      },
      error: () => {
        this.callState = 'ready';
      }
    });
  }

  // ── Camera / Mic Init ────────────────────────────

  private async initCamera(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      // Wait for view to init
      setTimeout(() => {
        if (this.localVideoRef?.nativeElement) {
          this.localVideoRef.nativeElement.srcObject = this.localStream;
        }
      }, 200);

    } catch (err: any) {
      console.warn('Camera access denied:', err);
      this.error = 'Camera/microphone access is required for video calls. Please allow access and refresh.';
    }
  }

  // ── Call Controls ─────────────────────────────────

  startCall(): void {
    this.callState = 'connecting';

    // Simulate connection delay
    setTimeout(() => {
      this.callState = 'connected';
      this.callStartTime = Date.now();
      this.startTimer();

      // Simulate doctor joining after 2s
      this.doctorTimer = setTimeout(() => {
        this.doctorJoined = true;
        this.addSystemMessage('Dr. ' + (this.consultation?.doctorName || 'Sarah Mills') + ' has joined the call');

        // Mirror local stream to remote for demo purposes
        if (this.remoteVideoRef?.nativeElement && this.localStream) {
          // In real WebRTC this would be the remote peer's stream
          // For demo, we show a mirrored view
          this.remoteVideoRef.nativeElement.srcObject = this.localStream;
        }
      }, 2000);
    }, 1500);
  }

  endCall(): void {
    this.callState = 'ended';
    this.stopTimer();
    this.stopAllStreams();
  
    if (this.callNotes.trim() && this.consultationId != null) {
      this.http.put(`${this.api}/${this.consultationId}/notes`, {
        doctorNotes: this.callNotes
      }).subscribe();
    }
  }

  toggleCamera(): void {
    this.cameraOn = !this.cameraOn;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => t.enabled = this.cameraOn);
    }
  }

  toggleMic(): void {
    this.micOn = !this.micOn;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = this.micOn);
    }
  }

  async toggleScreenShare(): Promise<void> {
    if (this.screenSharing) {
      // Stop screen share, restore camera
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }
      if (this.localVideoRef?.nativeElement && this.localStream) {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }
      this.screenSharing = false;
    } else {
      try {
        this.screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true, audio: false
        });
        if (this.localVideoRef?.nativeElement && this.screenStream) {
          this.localVideoRef.nativeElement.srcObject = this.screenStream;
        }
        this.screenSharing = true;
    
        const track = this.screenStream?.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            this.toggleScreenShare();
          };
        }
      } catch {
        // User cancelled screen share picker
      }
    }
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.unreadChat = 0;
      this.notesOpen = false;
      setTimeout(() => this.chatInputRef?.nativeElement?.focus(), 100);
    }
  }

  toggleNotes(): void {
    this.notesOpen = !this.notesOpen;
    if (this.notesOpen) this.chatOpen = false;
  }

  toggleLocalSize(): void {
    this.localMinimized = !this.localMinimized;
  }

  // ── Chat ──────────────────────────────────────────

  sendChat(): void {
    const text = this.chatInput.trim();
    if (!text) return;

    this.chatMessages.push({
      sender: 'you',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    this.chatInput = '';

    // Simulate doctor reply after 2-4s
    setTimeout(() => {
      const replies = [
        'I see, let me check your latest records.',
        'That\'s great progress! Keep it up.',
        'I\'d recommend adjusting your diet plan slightly.',
        'Can you tell me more about your symptoms?',
        'Your biometrics are looking much better.',
        'Let\'s schedule a follow-up in two weeks.',
        'Have you been taking your supplements regularly?',
        'I\'ll update your nutrition plan after this call.',
      ];
      this.chatMessages.push({
        sender: 'doctor',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      if (!this.chatOpen) this.unreadChat++;
    }, 2000 + Math.random() * 2000);
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.sendChat();
  }

  private addSystemMessage(text: string): void {
    this.chatMessages.push({
      sender: 'doctor',
      text: '📢 ' + text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
  }

  // ── Timer ─────────────────────────────────────────

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.callStartTime) {
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        this.callDuration = `${mins}:${secs}`;
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ── Cleanup ───────────────────────────────────────

  private stopAllStreams(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
  }

  // ── Navigation ────────────────────────────────────

  goBack(): void {
    this.stopAllStreams();
    this.router.navigate(['/dossier']);
  }

  rejoinCall(): void {
    this.callState = 'loading';
    this.doctorJoined = false;
    this.chatMessages = [];
    this.callDuration = '00:00';
    this.initCamera().then(() => {
      this.callState = 'ready';
    });
  }
}