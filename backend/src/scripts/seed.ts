import dotenv from 'dotenv';
import { connectDB, query } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@battechno.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const admin = await User.create({
        fullName: adminName,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        language: 'ar',
        isActive: true,
        isEmailVerified: true,
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if FAQs exist
    const faqResult = await query('SELECT COUNT(*) FROM faqs');
    const faqCount = parseInt(faqResult.rows[0].count);

    if (faqCount === 0) {
      await query(`
        INSERT INTO faqs (question_ar, answer_ar, question_en, answer_en, "order", is_active) VALUES
        (
          'كيف يمكنني حجز موعد؟',
          'يمكنك حجز موعد من خلال صفحة حجز المواعيد. اختر نوع الموعد (حضوري أو عن بعد)، ثم اختر التاريخ والوقت المناسبين.',
          'How can I book an appointment?',
          'You can book an appointment through the booking page. Choose the appointment type (in-person or online), then select a suitable date and time.',
          1,
          true
        ),
        (
          'ما هي أوقات العمل؟',
          'أوقات العمل من الساعة 9 صباحاً حتى 5 مساءً، من الأحد إلى الخميس.',
          'What are the working hours?',
          'Working hours are from 9 AM to 5 PM, Sunday to Thursday.',
          2,
          true
        ),
        (
          'كيف يمكنني إلغاء موعد؟',
          'يمكنك إلغاء موعد من خلال صفحة مواعيدي. اختر الموعد المراد إلغاؤه واضغط على زر الإلغاء.',
          'How can I cancel an appointment?',
          'You can cancel an appointment through the My Appointments page. Select the appointment you want to cancel and click the cancel button.',
          3,
          true
        )
      `);
      console.log('✅ Sample FAQs created');
    } else {
      console.log('ℹ️  FAQs already exist');
    }

    console.log('✅ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();
