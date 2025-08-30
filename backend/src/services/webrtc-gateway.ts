import { WebSocket } from 'ws';
import OpenAI from 'openai';
import { 
  WSMessage, 
  ClientOfferMessage, 
  ClientICEMessage,
  StatusMessage,
  TranscriptDeltaMessage,
  TranscriptFinalMessage,
  SummaryReadyMessage,
  ErrorMessage
} from '../../../shared/types';
import { CallsService } from './calls';
import { LeadsService } from './leads';
import { ProjectsService } from './projects';

interface WebRTCSession {
  call_id: number;
  ws: WebSocket;
  openaiClient?: any; // OpenAI Realtime session data
  transcript: string;
  startTime?: Date;
}

export class WebRTCGateway {
  private sessions = new Map<string, WebRTCSession>();
  private openai: OpenAI;

  constructor(
    private callsService: CallsService,
    private leadsService: LeadsService,
    private projectsService: ProjectsService
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  handleConnection(ws: WebSocket, call_id: string) {
    console.log(`🔗 WebRTC session connected: ${call_id}`);
    
    const session: WebRTCSession = {
      call_id: parseInt(call_id),
      ws,
      transcript: ''
    };

    this.sessions.set(call_id, session);

    // Send initial status
    this.sendMessage(session, {
      type: 'status',
      status: 'connecting'
    } as StatusMessage);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(session, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendError(session, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log(`🔌 WebRTC session disconnected: ${call_id}`);
      this.cleanupSession(session);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebRTC session error: ${call_id}`, error);
      this.sendError(session, 'Connection error');
      this.cleanupSession(session);
    });
  }

  private async handleMessage(session: WebRTCSession, message: WSMessage) {
    try {
      switch (message.type) {
        case 'client-offer':
          await this.handleClientOffer(session, message as ClientOfferMessage);
          break;
        case 'client-ice':
          await this.handleClientICE(session, message as ClientICEMessage);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(session, 'Internal server error');
    }
  }

  private async handleClientOffer(session: WebRTCSession, message: ClientOfferMessage) {
    try {
      // Update call status to connecting
      await this.callsService.updateStatus(session.call_id, 'connecting');

      // Get call and lead information
      const call = await this.callsService.findById(session.call_id);
      if (!call) {
        throw new Error('Call not found');
      }

      const lead = await this.leadsService.findById(call.lead_id!);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const project = lead.project_id ? await this.projectsService.findById(lead.project_id) : null;

      // Initialize OpenAI Realtime (ephemeral session)
      const realtimeSession = await this.initializeOpenAI(session, lead, project);

      // Send session data to client for direct WebRTC connection
      this.sendMessage(session, {
        type: 'session-ready',
        session: {
          model: (realtimeSession as any).model,
          client_secret: { value: (realtimeSession as any).client_secret.value }
        }
      });

      // Send status update
      this.sendMessage(session, {
        type: 'status',
        status: 'in-progress'
      } as StatusMessage);

      // Update call status
      await this.callsService.updateStatus(session.call_id, 'in-progress');
      session.startTime = new Date();

    } catch (error) {
      console.error('Error handling client offer:', error);
      this.sendError(session, 'Failed to initialize call');
      await this.callsService.updateStatus(session.call_id, 'failed');
    }
  }

  private async handleClientICE(session: WebRTCSession, message: ClientICEMessage) {
    // Handle ICE candidate from client
    // This would be forwarded to OpenAI Realtime in a real implementation
    console.log('ICE candidate received:', message.candidate);
  }

  private async handleToolCall(session: WebRTCSession, event: any) {
    try {
      console.log('Tool call received:', event);

      let result;
      switch (event.name) { // function_call.name yerine event.name kullan
        case 'create_calendar_event':
          result = await this.handleCreateCalendarEvent(session, event.arguments);
          break;
        case 'send_message':
          result = await this.handleSendMessage(session, event.arguments);
          break;
        case 'log_crm_outcome':
          result = await this.handleLogCrmOutcome(session, event.arguments);
          break;
        default:
          result = { error: 'Unknown tool' };
      }

      // Send tool result back to OpenAI
      await session.openaiClient.submitToolOutputs([{
        tool_call_id: event.id,
        output: JSON.stringify(result)
      }]);

    } catch (error) {
      console.error('Error handling tool call:', error);
      await session.openaiClient.submitToolOutputs([{
        tool_call_id: event.id,
        output: JSON.stringify({ error: 'Tool execution failed' })
      }]);
    }
  }

  private async handleCreateCalendarEvent(session: WebRTCSession, args: any) {
    const { lead_id, start_ts, end_ts, title, notes } = args; // JSON.parse kaldırıldı
    
    // Here you would integrate with your calendar system
    console.log('Creating calendar event:', { lead_id, start_ts, end_ts, title, notes });
    
    return {
      success: true,
      event_id: `event_${Date.now()}`,
      message: 'Randevu başarıyla oluşturuldu'
    };
  }

  private async handleSendMessage(session: WebRTCSession, args: any) {
    const { message, type } = args; // JSON.parse kaldırıldı
    
    // Here you would integrate with your messaging system
    console.log('Sending message:', { message, type });
    
    return {
      success: true,
      message_id: `msg_${Date.now()}`,
      message: 'Mesaj başarıyla gönderildi'
    };
  }

  private async handleLogCrmOutcome(session: WebRTCSession, args: any) {
    const { outcome, notes, next_action } = args; // JSON.parse kaldırıldı
    
    // Update call outcome in database
    await this.callsService.updateOutcome(session.call_id, outcome, notes, next_action);
    
    return {
      success: true,
      outcome: outcome,
      message: 'CRM sonucu kaydedildi'
    };
  }

  private async initializeOpenAI(session: WebRTCSession, lead: any, project: any) {
    try {
      // Create system prompt based on project and lead info
      const systemPrompt = this.createSystemPrompt(lead, project);

      console.log('Initializing OpenAI Realtime with prompt:', systemPrompt);

             // Initialize OpenAI Realtime API with correct parameters
       const realtimeSession = await this.openai.beta.realtime.sessions.create({
         model: "gpt-4o-realtime-preview",
         voice: "alloy",
         instructions: systemPrompt,
         // ⬇⬇⬇ konuşmayı tetiklemek için
         turn_detection: { type: "server_vad", threshold: 0.5, silence_duration_ms: 500 },
         modalities: ["text", "audio"],
         tools: [
          {
            type: "function",
            name: "create_calendar_event",
            description: "Müşteri için randevu oluştur",
            parameters: {
              type: "object",
              properties: {
                lead_id: { type: "string" },
                start_ts: { type: "string", format: "date-time" },
                end_ts: { type: "string", format: "date-time" },
                title: { type: "string" },
                notes: { type: "string" }
              },
              required: ["lead_id", "start_ts", "end_ts", "title"]
            }
          },
          {
            type: "function",
            name: "send_message",
            description: "Müşteriye mesaj gönder",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string" },
                type: { type: "string", enum: ["sms", "email"] }
              },
              required: ["message", "type"]
            }
          },
          {
            type: "function",
            name: "log_crm_outcome",
            description: "CRM sonucunu kaydet",
            parameters: {
              type: "object",
              properties: {
                outcome: { type: "string", enum: ["interested", "not_interested", "follow_up", "appointment"] },
                notes: { type: "string" },
                next_action: { type: "string" }
              },
              required: ["outcome"]
            }
          }
        ]
      });

      // Store OpenAI session data (ephemeral session)
      session.openaiClient = realtimeSession;

      console.log('OpenAI Realtime session created successfully');

      return realtimeSession;

    } catch (error) {
      console.error('Error initializing OpenAI:', error);
      throw error;
    }
  }



  private createSystemPrompt(lead: any, project: any): string {
    let prompt = `Sen profesyonel bir satış temsilcisisin. Türkçe konuşuyorsun.

Amaç: Projeyi doğru ve net anlat; KVKK bilgilendirmesi yap; randevuya yönlendir.
Tarz: Kısa cümleler; telefonda netlik; soru sor → dinle → kısa yanıt.
Yasaklar: Yanıltıcı vaat yok; doğrulanmamış bilgi verme.
Dil: Türkçe.

Müşteri: ${lead.full_name}`;

    if (project) {
      prompt += `

Proje Bilgileri:
- Proje: ${project.name}
- Açıklama: ${project.description || 'Açıklama yok'}
- Fiyat Aralığı: ${project.price_range || 'Belirtilmemiş'}
- Teslim Tarihi: ${project.delivery_date || 'Belirtilmemiş'}
- Adres: ${project.address || 'Belirtilmemiş'}`;

      // SSS bilgilerini ekle
      if (project.faq_json && Object.keys(project.faq_json).length > 0) {
        prompt += `

Sık Sorulan Sorular ve Cevapları:`;
        Object.entries(project.faq_json).forEach(([key, faq]: [string, any]) => {
          if (faq.question && faq.answer) {
            prompt += `
S: ${faq.question}
C: ${faq.answer}`;
          }
        });
      }

      // Doküman bilgilerini ekle
      if (project.docs_json && Object.keys(project.docs_json).length > 0) {
        prompt += `

Mevcut Dokümanlar:`;
        Object.entries(project.docs_json).forEach(([key, doc]: [string, any]) => {
          if (doc.name && doc.url) {
            prompt += `
- ${doc.name}: ${doc.url}`;
          }
        });
        prompt += `

Müşteri doküman isterse bu linkleri paylaşabilirsin.`;
      }
    }

    prompt += `

KVKK bilgilendirmesi yap ve onay al. Randevu planlaması için hazır ol.`;

    return prompt;
  }

     private handleTranscript(session: WebRTCSession, text: string) {
     // Send transcript delta
     this.sendMessage(session, {
       type: 'transcript.delta',
       text
     } as TranscriptDeltaMessage);

     // Update session transcript
     session.transcript += text;

     // Update database periodically
     this.callsService.updateTranscript(session.call_id, session.transcript);
   }

  private async sendTTSAudio(session: WebRTCSession, text: string) {
    try {
      // Use OpenAI TTS API to generate speech
      const mp3 = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy", // or "echo", "fable", "onyx", "nova", "shimmer"
        input: text,
      });

      // Convert to base64 for WebSocket transmission
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      // Send audio data to client
      this.sendMessage(session, {
        type: 'audio.data',
        audio: base64Audio,
        text: text
      });

      console.log(`TTS audio sent for: "${text}"`);

    } catch (error) {
      console.error('Error generating TTS audio:', error);
      // Fallback: send text only if TTS fails
      this.sendMessage(session, {
        type: 'transcript.delta',
        text: text
      } as TranscriptDeltaMessage);
    }
  }

  private async handleSummary(session: WebRTCSession, summary: any) {
    // Send summary ready message
    this.sendMessage(session, {
      type: 'summary.ready',
      summary: summary.summary,
      sentiment: summary.sentiment || 'neutral',
      score_hotness: summary.score_hotness || 50
    } as SummaryReadyMessage);

    // Update database
    await this.callsService.updateSummary(
      session.call_id,
      summary.summary,
      summary.sentiment || 'neutral',
      summary.score_hotness || 50
    );

    // Update call status to completed
    await this.callsService.updateStatus(session.call_id, 'completed');
  }

  private sendMessage(session: WebRTCSession, message: WSMessage) {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(message));
    }
  }

  private sendError(session: WebRTCSession, message: string) {
    this.sendMessage(session, {
      type: 'error',
      message
    } as ErrorMessage);
  }

  private async cleanupSession(session: WebRTCSession) {
    try {
      // Update call status if not already completed/failed
      const call = await this.callsService.findById(session.call_id);
      if (call && call.status === 'in-progress') {
        await this.callsService.updateStatus(session.call_id, 'failed');
      }

      // Cleanup OpenAI Realtime session
      if (session.openaiClient) {
        console.log('Cleaned up OpenAI Realtime session');
      }

      // Remove from sessions map
      this.sessions.delete(session.call_id.toString());

    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
  }

  // Public method to get session count
  getSessionCount(): number {
    return this.sessions.size;
  }
}
