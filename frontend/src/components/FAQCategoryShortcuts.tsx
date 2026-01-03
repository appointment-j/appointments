import React from 'react';
import { Link } from 'react-router-dom';
import { faqData } from '../utils/faqData';
import { Card } from './Card';

interface FAQCategoryShortcutsProps {
  className?: string;
  basePath?: string; // اختياري: لتستخدمه في /faq أو /app/faq
}

const FAQCategoryShortcuts: React.FC<FAQCategoryShortcutsProps> = ({
  className = '',
  basePath = '/app/faq',
}) => {
  return (
    <div className={`w-full ${className}`} dir="rtl">
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
        الأسئلة الشائعة
      </h2>
      <p className="text-gray-500 mb-8">
        إجابات سريعة لأكثر الأسئلة شيوعًا قبل حجز موعدك
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faqData.map((category) => (
          <Link
            key={category.id}
            to={`${basePath}/${category.slug}`}
            className="block group"
          >
            <Card
              hover
              className="
                h-full
                border border-gray-200
                bg-white
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]
                hover:border-orange-200
              "
            >
              <div className="flex items-start gap-4 p-6">
                <div className="text-2xl leading-none">{category.icon}</div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 transition-colors group-hover:text-orange-600">
                    {category.title_ar}
                  </h3>

                  <p className="text-gray-500 text-sm">
                    {category.faqs.length} سؤال
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FAQCategoryShortcuts;
