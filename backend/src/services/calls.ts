import { Pool } from 'pg';
import { Call, WebRTCSession } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class CallsService {
  constructor(private pool: Pool) {}

  async create(lead_id: number): Promise<WebRTCSession> {
    const session_id = uuidv4();
    
    const result = await this.pool.query(
      `INSERT INTO calls (lead_id, session_id, status)
       VALUES ($1, $2, 'created')
       RETURNING *`,
      [lead_id, session_id]
    );

    const call = result.rows[0];
    
    return {
      call_id: call.id,
      session_id: call.session_id,
      session_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/webrtc-client.html?call_id=${call.id}`,
      expires_in: 300 // 5 minutes
    };
  }

  async findById(id: number): Promise<Call | null> {
    const result = await this.pool.query(
      `SELECT c.*, l.full_name as lead_name, l.phone_e164 as lead_phone, p.name as project_name
       FROM calls c
       LEFT JOIN leads l ON c.lead_id = l.id
       LEFT JOIN projects p ON l.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async findByLeadId(lead_id: number): Promise<Call[]> {
    const result = await this.pool.query(
      `SELECT c.*, l.full_name as lead_name, l.phone_e164 as lead_phone, p.name as project_name
       FROM calls c
       LEFT JOIN leads l ON c.lead_id = l.id
       LEFT JOIN projects p ON l.project_id = p.id
       WHERE c.lead_id = $1
       ORDER BY c.created_at DESC`,
      [lead_id]
    );

    return result.rows;
  }

  async updateStatus(id: number, status: Call['status']): Promise<Call | null> {
    const updates: any = { status };
    
    if (status === 'in-progress' && !this.pool.query('SELECT started_at FROM calls WHERE id = $1', [id]).then(r => r.rows[0]?.started_at)) {
      updates.started_at = new Date();
    }
    
    if (status === 'completed' || status === 'failed') {
      updates.ended_at = new Date();
    }

    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const values = fields.map(field => updates[field]);
    const result = await this.pool.query(
      `UPDATE calls SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] || null;
  }

  async updateTranscript(id: number, transcript_text: string): Promise<Call | null> {
    const result = await this.pool.query(
      'UPDATE calls SET transcript_text = $2 WHERE id = $1 RETURNING *',
      [id, transcript_text]
    );

    return result.rows[0] || null;
  }

  async updateSummary(id: number, summary_json: any, sentiment: string, score_hotness: number): Promise<Call | null> {
    const result = await this.pool.query(
      'UPDATE calls SET summary_json = $2, sentiment = $3, score_hotness = $4 WHERE id = $1 RETURNING *',
      [id, summary_json, sentiment, score_hotness]
    );

    return result.rows[0] || null;
  }

  async updateOutcome(id: number, outcome: string, notes?: string, next_action?: string): Promise<Call | null> {
    const result = await this.pool.query(
      'UPDATE calls SET outcome = $2, outcome_notes = $3, next_action = $4 WHERE id = $1 RETURNING *',
      [id, outcome, notes, next_action]
    );

    return result.rows[0] || null;
  }

  async findAll(query?: { lead_id?: number; status?: string }, page: number = 1, size: number = 10): Promise<{ calls: Call[]; total: number }> {
    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (query?.lead_id) {
      whereClause = `WHERE c.lead_id = $${paramIndex}`;
      params.push(query.lead_id);
      paramIndex++;
    }

    if (query?.status) {
      whereClause = whereClause ? `${whereClause} AND c.status = $${paramIndex}` : `WHERE c.status = $${paramIndex}`;
      params.push(query.status);
      paramIndex++;
    }

    const offset = (page - 1) * size;
    
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM calls c ${whereClause}`,
      params
    );

    const callsResult = await this.pool.query(
      `SELECT c.*, l.full_name as lead_name, l.phone_e164 as lead_phone, p.name as project_name
       FROM calls c
       LEFT JOIN leads l ON c.lead_id = l.id
       LEFT JOIN projects p ON l.project_id = p.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, size, offset]
    );

    return {
      calls: callsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }
}
