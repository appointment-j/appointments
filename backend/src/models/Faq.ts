import { query } from '../config/database';

export interface IFaq {
  id: string;
  question_ar: string;
  answer_ar: string;
  question_en: string;
  answer_en: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Faq {
  static async find(condition?: { isActive?: boolean }): Promise<IFaq[]> {
    let sql = 'SELECT * FROM faqs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(condition.isActive);
    }

    sql += ' ORDER BY "order" ASC, created_at ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToFaq(row));
  }

  static async findById(id: string): Promise<IFaq | null> {
    const result = await query('SELECT * FROM faqs WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToFaq(result.rows[0]);
  }

  static async create(data: {
    question_ar: string;
    answer_ar: string;
    question_en: string;
    answer_en: string;
    order?: number;
    isActive?: boolean;
  }): Promise<IFaq> {
    // Get max order if not provided
    let order = data.order;
    if (order === undefined) {
      const maxOrderResult = await query('SELECT MAX("order") as max_order FROM faqs');
      order = (maxOrderResult.rows[0]?.max_order || 0) + 1;
    }

    const sql = `
      INSERT INTO faqs (question_ar, answer_ar, question_en, answer_en, "order", is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.question_ar,
      data.answer_ar,
      data.question_en,
      data.answer_en,
      order,
      data.isActive !== undefined ? data.isActive : true,
    ];

    const result = await query(sql, params);
    return this.mapRowToFaq(result.rows[0]);
  }

  static async update(id: string, data: Partial<IFaq>): Promise<IFaq> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.question_ar !== undefined) {
      updates.push(`question_ar = $${paramIndex++}`);
      params.push(data.question_ar);
    }
    if (data.answer_ar !== undefined) {
      updates.push(`answer_ar = $${paramIndex++}`);
      params.push(data.answer_ar);
    }
    if (data.question_en !== undefined) {
      updates.push(`question_en = $${paramIndex++}`);
      params.push(data.question_en);
    }
    if (data.answer_en !== undefined) {
      updates.push(`answer_en = $${paramIndex++}`);
      params.push(data.answer_en);
    }
    if (data.order !== undefined) {
      updates.push(`"order" = $${paramIndex++}`);
      params.push(data.order);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (updates.length === 0) {
      const faq = await this.findById(id);
      if (!faq) throw new Error('FAQ not found');
      return faq;
    }

    params.push(id);
    const sql = `UPDATE faqs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('FAQ not found');
    return this.mapRowToFaq(result.rows[0]);
  }

  static async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM faqs WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new Error('FAQ not found');
  }

  static async bulkWrite(updates: Array<{ id: string; order: number }>): Promise<void> {
    for (const update of updates) {
      await query('UPDATE faqs SET "order" = $1 WHERE id = $2', [update.order, update.id]);
    }
  }

  static mapRowToFaq(row: any): IFaq {
    return {
      id: row.id,
      question_ar: row.question_ar,
      answer_ar: row.answer_ar,
      question_en: row.question_en,
      answer_en: row.answer_en,
      order: row.order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
