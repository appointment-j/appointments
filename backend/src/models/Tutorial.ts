import { query } from '../config/database';

export interface ITutorial {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  videoUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class Tutorial {
  static async findOne(condition: { id?: string; order?: number }): Promise<ITutorial | null> {
    let sql = 'SELECT * FROM tutorials WHERE ';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition.id) {
      conditions.push(`id = $${params.length + 1}`);
      params.push(condition.id);
    }
    if (condition.order !== undefined) {
      conditions.push(`order = $${params.length + 1}`);
      params.push(condition.order);
    }

    if (conditions.length === 0) return null;
    sql += conditions.join(' AND ');

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;

    return this.mapRowToTutorial(result.rows[0]);
  }

  static async findById(id: string): Promise<ITutorial | null> {
    return this.findOne({ id });
  }

  static async create(data: {
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    videoUrl?: string;
    order: number;
    isActive?: boolean;
  }): Promise<ITutorial> {
    const sql = `
      INSERT INTO tutorials (
        title_ar, title_en, description_ar, description_en, video_url, "order", is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.title_ar,
      data.title_en,
      data.description_ar,
      data.description_en,
      data.videoUrl || null,
      data.order,
      data.isActive !== undefined ? data.isActive : true,
    ];

    const result = await query(sql, params);
    return this.mapRowToTutorial(result.rows[0]);
  }

  static async update(id: string, data: Partial<ITutorial>): Promise<ITutorial> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title_ar !== undefined) {
      updates.push(`title_ar = $${paramIndex++}`);
      params.push(data.title_ar);
    }
    if (data.title_en !== undefined) {
      updates.push(`title_en = $${paramIndex++}`);
      params.push(data.title_en);
    }
    if (data.description_ar !== undefined) {
      updates.push(`description_ar = $${paramIndex++}`);
      params.push(data.description_ar);
    }
    if (data.description_en !== undefined) {
      updates.push(`description_en = $${paramIndex++}`);
      params.push(data.description_en);
    }
    if (data.videoUrl !== undefined) {
      updates.push(`video_url = $${paramIndex++}`);
      params.push(data.videoUrl);
    }
    if (data.order !== undefined) {
      updates.push(`order = $${paramIndex++}`);
      params.push(data.order);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (updates.length === 0) {
      const tutorial = await this.findById(id);
      if (!tutorial) throw new Error('Tutorial not found');
      return tutorial;
    }

    params.push(id);
    const sql = `UPDATE tutorials SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Tutorial not found');
    return this.mapRowToTutorial(result.rows[0]);
  }

  static async find(condition?: { isActive?: boolean }): Promise<ITutorial[]> {
    let sql = 'SELECT * FROM tutorials';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.isActive !== undefined) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(condition.isActive);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY order ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToTutorial(row));
  }

  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM tutorials WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static mapRowToTutorial(row: any): ITutorial {
    return {
      id: row.id,
      title_ar: row.title_ar,
      title_en: row.title_en,
      description_ar: row.description_ar,
      description_en: row.description_en,
      videoUrl: row.video_url,
      order: row.order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export { Tutorial };

