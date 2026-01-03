import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ScreenContainer, Panel } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { faqData, FAQCategory } from '../utils/faqData';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export default function FAQCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the category by slug
  const category: FAQCategory | undefined = useMemo(() => {
    return faqData.find(cat => cat.slug === categorySlug);
  }, [categorySlug]);

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!category) return [];
    
    if (!searchQuery.trim()) {
      return category.faqs;
    }
    
    const query = searchQuery.toLowerCase();
    return category.faqs.filter(faq => 
      faq.question_ar.toLowerCase().includes(query) || 
      faq.answer_ar.toLowerCase().includes(query)
    );
  }, [category, searchQuery]);

  useEffect(() => {
    if (!category) {
      navigate('/faq');
    }
  }, [category, navigate]);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!category) {
    return (
      <ScreenContainer>
        <Panel className="min-h-screen bg-white font-majalla">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
            <h2 className="text-xl font-bold text-red-500 mb-4">الفئة غير موجودة</h2>
            <p className="text-gray-600 mb-6">الفئة المطلوبة غير موجودة.</p>
            <Link 
              to="/faq" 
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition"
            >
              العودة إلى الأسئلة الشائعة
            </Link>
          </div>
        </Panel>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <motion.div
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto px-4 sm:px-6 py-10"
        >
          {/* Breadcrumb and back button */}
          <motion.div variants={item} className="mb-8">
            <Link 
              to="/faq" 
              className="flex items-center text-orange-500 hover:text-orange-600 transition mb-6"
            >
              <span className="ml-2">←</span> العودة إلى الأسئلة الشائعة
            </Link>
            
            <div className="text-center mb-10">
              <div className="flex items-center justify-center mb-4">
                <span className="text-2xl ml-3">{category.icon}</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {category.title_ar}
                </h1>
              </div>
              <p className="text-gray-600">
                {category.subtitle_ar || category.subtitle}
              </p>
            </div>
          </motion.div>

          {/* Search Input */}
          <motion.div variants={item} className="mb-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث في الأسئلة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </motion.div>

          {/* FAQ List */}
          {filteredFaqs.length > 0 ? (
            <motion.div 
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {filteredFaqs.map((faq) => (
                <motion.div 
                  key={faq.id} 
                  variants={item}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  <button
                    className={`w-full p-5 text-right flex justify-between items-center bg-white hover:bg-gray-50 transition-colors ${
                      expandedId === faq.id ? 'border-b border-gray-200' : ''
                    }`}
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={expandedId === faq.id}
                  >
                    <span className="text-lg font-medium text-gray-900 text-right">
                      {faq.question_ar}
                    </span>
                    <span className="text-2xl text-orange-500">
                      {expandedId === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {expandedId === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-gray-50">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer_ar}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={item} className="text-center py-12">
              <div className="text-5xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-600 mb-6">
                لا توجد أسئلة تطابق بحثك "{searchQuery}". حاول استخدام كلمات مفتاحية مختلفة.
              </p>
              <Button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition"
              >
                مسح البحث
              </Button>
            </motion.div>
          )}

          {/* Back to FAQ categories */}
          <motion.div variants={item} className="mt-10 text-center">
            <Link 
              to="/faq" 
              className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition"
            >
              استعرض فئات أخرى
            </Link>
          </motion.div>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}