import { query } from '../config/database';

export interface ISurveyField {
  id: string;
  label_ar: string;
  label_en: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: string[];
  isRequired: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SurveyField {
  static async find(condition?: { isActive?: boolean }): Promise<ISurveyField[]> {
    let sql = 'SELECT * FROM survey_fields WHERE 1=1';
    const params: any[] = [];

    if (condition?.isActive !== undefined) {
      sql += ' AND is_active = $1';
      params.push(condition.isActive);
    }

    sql += ' ORDER BY "order" ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToSurveyField(row));
  }

  static mapRowToSurveyField(row: any): ISurveyField {
    return {
      id: row.id,
      label_ar: row.label_ar,
      label_en: row.label_en,
      type: row.type,
      options: row.options || [],
      isRequired: row.is_required,
      order: row.order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
