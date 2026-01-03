# Database Setup for Neon PostgreSQL

هذا الملف يحتوي على SQL scripts لإنشاء قاعدة البيانات على Neon PostgreSQL.

## خطوات الإعداد

### 1. إنشاء قاعدة البيانات على Neon

1. اذهب إلى [Neon Console](https://console.neon.tech)
2. أنشئ مشروع جديد
3. انسخ connection string

### 2. تشغيل Schema Script

1. افتح SQL Editor في Neon
2. انسخ محتوى `schema.sql` والصقه في المحرر
3. اضغط Run لتنفيذ الـ script

هذا سينشئ:
- جميع الجداول (Tables)
- الفهارس (Indexes)
- الدوال والـ Triggers لتحديث `updated_at` تلقائياً

### 3. تحديث Backend للعمل مع PostgreSQL

إذا أردت استخدام PostgreSQL بدلاً من MongoDB، ستحتاج إلى:

1. تثبيت `pg` و `pg-pool`:
```bash
cd backend
npm install pg @types/pg
```

2. تحديث `backend/src/config/database.ts`:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // من Neon
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
```

3. تحديث جميع Models لاستخدام PostgreSQL بدلاً من Mongoose

### 4. Connection String من Neon

سيكون شكله كالتالي:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

ضع هذا في `.env`:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

## ملاحظات مهمة

⚠️ **تحذير**: المشروع الحالي مبني على MongoDB. إذا أردت استخدام PostgreSQL:

1. ستحتاج إلى إعادة كتابة جميع Models
2. ستحتاج إلى تغيير جميع Queries من Mongoose إلى SQL
3. ستحتاج إلى تحديث Controllers

**الخيار الأفضل**: استخدم MongoDB Atlas (مجاني) بدلاً من Neon إذا كنت تريد البقاء مع MongoDB.

## MongoDB Atlas (بديل أسهل)

إذا أردت البقاء مع MongoDB:

1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ حساب مجاني
3. أنشئ Cluster
4. انسخ Connection String
5. ضعه في `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/battechno-appointments
```

هذا أسهل لأن الكود الحالي جاهز للعمل مع MongoDB مباشرة!

