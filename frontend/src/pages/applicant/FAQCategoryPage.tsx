import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { faqData as allFaqData, FAQCategory as FetchedFAQCategory, FAQItem as FAQQuestion } from '../../utils/faqData';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const FAQCategoryPage: React.FC = () => {
  const { categorySlug, questionId } = useParams<{ categorySlug: string; questionId?: string }>();
  const navigate = useNavigate();

  const [selectedQuestion, setSelectedQuestion] = useState<FAQQuestion | null>(null);
  const [category, setCategory] = useState<FetchedFAQCategory | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    // Find the category by ID
    const foundCategory = allFaqData.find(cat => cat.slug === categorySlug);
    setCategory(foundCategory || null);

    // Check if a specific question ID is provided in the URL
    
    if (foundCategory) {
      if (questionId) {
        // Find the specific question
        const foundQuestion = foundCategory.faqs.find((q: FAQQuestion) => q.id === questionId);
        if (foundQuestion) {
          setSelectedQuestion(foundQuestion);
        } else {
          // If question not found, default to first question
          setSelectedQuestion(foundCategory.faqs[0] || null);
        }
      } else {
        // If no specific question, default to first question
        setSelectedQuestion(foundCategory.faqs[0] || null);
      }
    }
  }, [categorySlug, questionId]);

  useEffect(() => {
    // Handle mobile view detection
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!category) {
    return (
      <ScreenContainer>
        <Panel className="min-h-screen bg-white font-majalla">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
              <p className="text-gray-600 mb-6">The requested FAQ category does not exist.</p>
              <Button 
                onClick={() => navigate('/app/dashboard')}
                className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Panel>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Back to dashboard button */}
          <div className="mb-8">
            <Button 
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center text-orange-500 hover:text-orange-600 transition"
            >
              <span className="mr-2">←</span> Back to Dashboard
            </Button>
          </div>

          <div className="mb-10">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{category.icon}</span>
              <h1 className="text-3xl font-extrabold text-gray-900">{category.title_ar}</h1>
            </div>
            <p className="text-gray-600">
              {category.faqs.length} frequently asked questions
            </p>
          </div>

          {/* Mobile view - question list */}
          {isMobileView && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
              <div className="space-y-3">
                {category.faqs.map((question: FAQQuestion) => (
                  <Card
                    key={question.id}
                    className={`p-4 cursor-pointer border ${
                      selectedQuestion?.id === question.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } transition-colors`}
                    onClick={() => {
                      setSelectedQuestion(question);
                      navigate(`/app/faq/${category?.slug}/${question.id}`);
                    }}
                  >
                    <h3 className="font-medium text-gray-900">{question.question_ar}</h3>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Desktop layout - two columns */}
          <div className={`grid ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-8`}>
            {/* Questions list (hidden on mobile when not in mobile view) */}
            {!isMobileView && (
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {category.faqs.map((question: FAQQuestion) => (
                    <Card
                      key={question.id}
                      className={`p-4 cursor-pointer border ${
                        selectedQuestion?.id === question.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      } transition-colors`}
                      onClick={() => {
                        setSelectedQuestion(question);
                        navigate(`/app/faq/${category?.slug}/${question.id}`);
                      }}
                    >
                      <h3 className="font-medium text-gray-900">{question.question_ar}</h3>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Answer view */}
            <div className={`lg:col-span-2 ${isMobileView && selectedQuestion ? 'block' : isMobileView ? 'hidden' : 'block'}`}>
              {selectedQuestion ? (
                <Card className="p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedQuestion.question_ar}
                  </h2>
                  <div className="prose prose-gray max-w-none mb-6">
                    <p className="text-gray-700 whitespace-pre-line">{selectedQuestion.answer_ar}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => navigate('/app/appointments/book')}
                      className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition flex-1"
                    >
                      Book an Appointment
                    </Button>
                    <Button
                      onClick={() => navigate('/app/dashboard')}
                      variant="secondary"
                      className="px-6 py-3 rounded-2xl transition flex-1"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-10 border border-gray-200 text-center">
                  <p className="text-gray-500">Select a question to view the answer</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </ScreenContainer>
  );
};

export default FAQCategoryPage;