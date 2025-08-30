import { Pool } from 'pg';
import { Lead } from '../../../shared/types';

export class LeadsService {
  constructor(private pool: Pool) {}

  async create(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const { project_id, full_name, phone_e164, source, consent_kvkk, consent_text, utm } = lead;
    
    const result = await this.pool.query(
      `INSERT INTO leads (project_id, full_name, phone_e164, source, consent_kvkk, consent_text, utm)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [project_id, full_name, phone_e164, source, consent_kvkk, consent_text, utm]
    );

    return result.rows[0];
  }

  async findAll(query?: string, page: number = 1, size: number = 10): Promise<{ leads: Lead[]; total: number }> {
    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (query) {
      whereClause = `WHERE l.full_name ILIKE $${paramIndex} OR l.phone_e164 ILIKE $${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    const offset = (page - 1) * size;
    
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM leads l ${whereClause}`,
      params
    );

    const leadsResult = await this.pool.query(
      `SELECT l.*, p.name as project_name, p.description as project_description
       FROM leads l
       LEFT JOIN projects p ON l.project_id = p.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, size, offset]
    );

    return {
      leads: leadsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async findById(id: number): Promise<Lead | null> {
    const result = await this.pool.query(
      `SELECT l.*, p.name as project_name, p.description as project_description
       FROM leads l
       LEFT JOIN projects p ON l.project_id = p.id
       WHERE l.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async update(id: number, lead: Partial<Lead>): Promise<Lead | null> {
    const fields = Object.keys(lead).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    if (fields.length === 0) return this.findById(id);

    const values = fields.map(field => (lead as any)[field]);
    const result = await this.pool.query(
      `UPDATE leads SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM leads WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }
}
