import { Request, Response, NextFunction } from 'express';
import { Faq } from '../models/Faq';
import { AppError } from '../middleware/errorHandler';

export const getFaqs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.query;
    const condition: any = {};

    if (isActive !== undefined) {
      condition.isActive = isActive === 'true';
    }

    const faqs = await Faq.find(condition);
    res.json({ faqs });
  } catch (error) {
    next(error);
  }
};

export const createFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { question_ar, answer_ar, question_en, answer_en, order, isActive } = req.body;

    const faq = await Faq.create({
      question_ar,
      answer_ar,
      question_en,
      answer_en,
      order,
      isActive,
    });

    res.status(201).json({ message: 'FAQ created', faq });
  } catch (error) {
    next(error);
  }
};

export const updateFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { question_ar, answer_ar, question_en, answer_en, order, isActive } = req.body;

    const faq = await Faq.update(id, {
      question_ar,
      answer_ar,
      question_en,
      answer_en,
      order,
      isActive,
    });

    res.json({ message: 'FAQ updated', faq });
  } catch (error: any) {
    if (error.message === 'FAQ not found') {
      res.status(404).json({ message: 'FAQ not found' });
      return;
    }
    next(error);
  }
};

export const deleteFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await Faq.delete(id);

    res.json({ message: 'FAQ deleted' });
  } catch (error: any) {
    if (error.message === 'FAQ not found') {
      res.status(404).json({ message: 'FAQ not found' });
      return;
    }
    next(error);
  }
};

export const reorderFaqs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { faqIds } = req.body; // array of _id strings in new order

    if (!Array.isArray(faqIds)) {
      res.status(400).json({ message: 'faqIds must be an array' });
      return;
    }

    // Prepare updates for bulk write
    const updates = faqIds.map((id, index) => ({
      id,
      order: index,
    }));
    
    await Faq.bulkWrite(updates);

    res.json({ message: 'FAQs reordered' });
  } catch (error) {
    next(error);
  }
};
