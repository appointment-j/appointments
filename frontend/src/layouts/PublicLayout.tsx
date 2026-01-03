import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ScreenContainer className="bg-background-light font-majalla">
      <div className="min-h-screen flex flex-col">

        {/* ===== Header ===== */}
        <header
          className="
            sticky top-0 z-40
            bg-white
            border-b border-gray-border-light
            px-4 sm:px-6
            py-4
            flex items-center justify-between
          "
        >
          <div className="flex items-center gap-3">
            {/* زر الموبايل */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              ☰
            </button>

            <h1 className="text-xl sm:text-2xl font-extrabold text-primary">
              BatTechno
            </h1>
          </div>

          {/* روابط ديسكتوب */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/home" className="hover:text-primary transition">
              الرئيسية
            </Link>
            <Link to="/faq" className="hover:text-primary transition">
              الأسئلة الشائعة
            </Link>
            <Link to="/login">
              <Button variant="primary">تسجيل الدخول</Button>
            </Link>
          </nav>
        </header>

        {/* ===== Content ===== */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* ===== Mobile Sidebar ===== */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
              />

              {/* Sidebar */}
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="
                  fixed top-0 right-0 z-50
                  h-full w-[85%] max-w-sm
                  bg-white
                  shadow-xl
                  px-6 py-6
                  md:hidden
                "
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-primary">
                    القائمة
                  </h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl"
                  >
                    ×
                  </button>
                </div>

                <nav className="space-y-2 text-sm">
                  <Link
                    to="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                  >
                    الرئيسية
                  </Link>

                  <Link
                    to="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-gray-100 transition"
                  >
                    الأسئلة الشائعة
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full mt-4">
                      تسجيل الدخول
                    </Button>
                  </Link>
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

      </div>
    </ScreenContainer>
  );
}
