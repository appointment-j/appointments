import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

const FaqPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);

  // Find the selected category or default to the first one
  const category: FAQCategory | undefined = categorySlug 
    ? faqData.find(cat => cat.slug === categorySlug)
    : faqData[0];

  // Filter FAQs based on search query
  const filteredFaqs = category && category.faqs ? 
    category.faqs.filter(faq => 
      faq.question_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer_ar.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

  // Handle mobile view detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update URL when category changes
  useEffect(() => {
    if (!categorySlug && faqData.length > 0) {
      navigate(`/faq/${faqData[0].slug}`, { replace: true });
    }
  }, [categorySlug, navigate]);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCategoryChange = (slug: string) => {
    navigate(`/faq/${slug}`);
    setExpandedId(null); // Reset expanded state when changing categories
    setSearchQuery(''); // Clear search when changing categories
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
          className="max-w-6xl mx-auto px-4 sm:px-6 py-10"
        >
          {/* Page Title */}
          <motion.div variants={item} className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              الأسئلة الشائعة
            </h1>
            <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
          </motion.div>

          <div className={`grid ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-8`}>
            {/* Categories sidebar */}
            <div className={`${isMobileView ? 'mb-6' : 'lg:col-span-1'}`}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">الفئات</h2>
              <div className={`space-y-2 ${isMobileView ? 'max-h-60 overflow-y-auto' : 'max-h-[600px] overflow-y-auto pr-2'}`}>
                {faqData.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-right p-4 rounded-2xl transition-colors duration-200 ${
                      category.slug === cat.slug
                        ? 'bg-orange-50 text-orange-700 border-r-4 border-orange-500'
                        : 'hover:bg-gray-100 text-gray-700 border-r-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 text-lg">{cat.icon}</span>
                      <span className="font-medium">{cat.title_ar}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Content */}
            <div className={`${isMobileView ? '' : 'lg:col-span-3'}`}>
              {/* Category Header */}
              <motion.div variants={item} className="mb-8">
                <div className="flex items-center justify-center md:justify-start mb-6">
                  <span className="text-3xl ml-3">{category.icon}</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {category.title_ar}
                  </h2>
                </div>
                <p className="text-gray-600 text-center md:text-right">
                  {category.subtitle_ar || category.subtitle}
                </p>
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
                        className={`w-full p-6 text-right flex justify-between items-center bg-white hover:bg-gray-50 transition-colors duration-200 ${
                          expandedId === faq.id ? 'border-b border-orange-200' : ''
                        }`}
                        onClick={() => toggleAccordion(faq.id)}
                        aria-expanded={expandedId === faq.id}
                      >
                        <span className="text-lg font-semibold text-gray-900 flex-1 text-right">
                          {faq.question_ar}
                        </span>
                        <motion.div
                          animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-4 flex-shrink-0"
                        >
                          <svg 
                            className="h-6 w-6 text-orange-500"
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 9l-7 7-7-7" 
                            />
                          </svg>
                        </motion.div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {expandedId === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-gray-50">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
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
                    {searchQuery 
                      ? `لا توجد أسئلة تطابق بحثك "${searchQuery}". حاول استخدام كلمات مفتاحية مختلفة.` 
                      : category.faqs.length > 0
                        ? 'لا توجد أسئلة تطابق بحثك.'
                        : 'سيتم إضافة الأسئلة قريبًا'}
                  </p>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition"
                    >
                      مسح البحث
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
};

export default FaqPage;