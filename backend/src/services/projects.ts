import { Pool } from 'pg';
import { Project } from '../../../shared/types';

export class ProjectsService {
  constructor(private pool: Pool) {}

  async create(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { name, description, price_range, delivery_date, address, docs_url, faq_json, docs_json } = project;
    
    const result = await this.pool.query(
      `INSERT INTO projects (name, description, price_range, delivery_date, address, docs_url, faq_json, docs_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, price_range, delivery_date, address, docs_url, faq_json, docs_json]
    );

    return result.rows[0];
  }

  async findAll(query?: string, page: number = 1, size: number = 10): Promise<{ projects: Project[]; total: number }> {
    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (query) {
      whereClause = `WHERE name ILIKE $${paramIndex} OR description ILIKE $${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    const offset = (page - 1) * size;
    
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM projects ${whereClause}`,
      params
    );

    const projectsResult = await this.pool.query(
      `SELECT * FROM projects ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, size, offset]
    );

    return {
      projects: projectsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async findById(id: number): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async update(id: number, project: Partial<Project>): Promise<Project | null> {
    const fields = Object.keys(project).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    if (fields.length === 0) return this.findById(id);

    const values = fields.map(field => (project as any)[field]);
    const result = await this.pool.query(
      `UPDATE projects SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM projects WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }
}
