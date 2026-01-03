import { query } from '../config/database';

export interface ISurveyAnswer {
  id: string;
  appointmentId: string;
  fieldId: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SurveyAnswer {
  static async create(data: {
    appointmentId: string;
    fieldId: string;
    value: string;
  }): Promise<ISurveyAnswer> {
    const sql = `
      INSERT INTO survey_answers (appointment_id, field_id, value)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await query(sql, [data.appointmentId, data.fieldId, data.value]);
    return this.mapRowToSurveyAnswer(result.rows[0]);
  }

  static mapRowToSurveyAnswer(row: any): ISurveyAnswer {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      fieldId: row.field_id,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
