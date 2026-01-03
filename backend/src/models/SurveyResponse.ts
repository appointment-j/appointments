import { query } from '../config/database';

export interface ISurveyResponse {
  id: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  age?: number;
  socialStatus?: string;
  phone: string;
  nationality: string;
  nationalId?: string;
  passportId?: string;
  region?: string;
  major?: string;
  university?: string;
  heardFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SurveyResponse {
  static async create(data: {
    firstName: string;
    fatherName: string;
    lastName: string;
    age?: number;
    socialStatus?: string;
    phone: string;
    nationality: string;
    nationalId?: string;
    passportId?: string;
    region?: string;
    major?: string;
    university?: string;
    heardFrom?: string;
  }): Promise<ISurveyResponse> {
    const sql = `
      INSERT INTO survey_responses (
        first_name, father_name, last_name, age, social_status, phone,
        nationality, national_id, passport_id, region, major, university, heard_from
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await query(sql, [
      data.firstName,
      data.fatherName,
      data.lastName,
      data.age || null,
      data.socialStatus || null,
      data.phone,
      data.nationality,
      data.nationalId || null,
      data.passportId || null,
      data.region || null,
      data.major || null,
      data.university || null,
      data.heardFrom || null,
    ]);
    return this.mapRowToSurveyResponse(result.rows[0]);
  }

  static async findById(id: string): Promise<ISurveyResponse | null> {
    const sql = 'SELECT * FROM survey_responses WHERE id = $1';
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToSurveyResponse(result.rows[0]);
  }

  static mapRowToSurveyResponse(row: any): ISurveyResponse {
    return {
      id: row.id,
      firstName: row.first_name,
      fatherName: row.father_name,
      lastName: row.last_name,
      age: row.age,
      socialStatus: row.social_status,
      phone: row.phone,
      nationality: row.nationality,
      nationalId: row.national_id,
      passportId: row.passport_id,
      region: row.region,
      major: row.major,
      university: row.university,
      heardFrom: row.heard_from,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}