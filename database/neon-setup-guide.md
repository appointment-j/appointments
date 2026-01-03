# دليل إعداد قاعدة البيانات على Neon

## الخطوة 1: إنشاء قاعدة البيانات على Neon

1. اذهب إلى https://console.neon.tech
2. سجل دخول أو أنشئ حساب
3. اضغط "Create Project"
4. اختر اسم للمشروع (مثلاً: battechno-appointments)
5. اختر Region (الأقرب لك)
6. اضغط "Create Project"

## الخطوة 2: الحصول على Connection String

1. بعد إنشاء المشروع، ستجد Connection String في الصفحة الرئيسية
2. انسخه - سيكون شكله:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## الخطوة 3: تشغيل Schema في SQL Editor

1. في Neon Console، اضغط على "SQL Editor" من القائمة الجانبية
2. افتح ملف `database/schema.sql` من المشروع
3. انسخ كل المحتوى والصقه في SQL Editor
4. اضغط "Run" أو F5
5. يجب أن ترى رسالة "Success" أو "Query executed successfully"

## الخطوة 4: التحقق من الجداول

في SQL Editor، نفذ:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

يجب أن ترى جميع الجداول:
- users
- site_entries
- faqs
- appointments
- blocked_days
- blocked_time_ranges
- tutorials
- survey_fields
- survey_answers
- employee_bonus_entries

## الخطوة 5: تحديث Backend (اختياري)

⚠️ **مهم**: الكود الحالي يعمل مع MongoDB. إذا أردت استخدام PostgreSQL:

### تثبيت المكتبات المطلوبة:
```bash
cd backend
npm install pg @types/pg
```

### تحديث database.ts:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = () => pool.connect();
```

### تحديث .env:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## ملاحظة مهمة

المشروع الحالي **مبني بالكامل على MongoDB**. إذا أردت استخدام PostgreSQL:

1. ستحتاج إلى إعادة كتابة جميع Models (من Mongoose إلى SQL)
2. ستحتاج إلى تغيير جميع Controllers
3. ستحتاج إلى تحديث جميع Queries

**الخيار الأسهل**: استخدم **MongoDB Atlas** (مجاني) بدلاً من Neon:
- https://www.mongodb.com/cloud/atlas
- أنشئ حساب مجاني
- أنشئ Cluster
- انسخ Connection String
- ضعه في `.env` كـ `MONGODB_URI`

الكود الحالي سيعمل مباشرة بدون أي تغييرات!

