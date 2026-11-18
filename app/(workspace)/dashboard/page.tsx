'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import DocumentPreviewModal from '@/components/document-preview-modal';
import WorkspaceTour from '@/components/workspace-tour';
import { generatePDF, generateDOCX, mergeWithBonafide } from '@/lib/document-generator';
import { getLabRecord, parseCourseInfo } from '@/lib/record-service';
import { db } from '@/lib/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import {
  Plus,
  Trash2,
  Eye,
  Download,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  History,
  X,
  Cloud,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';


export interface Experiment {
  id?: string;
  experimentNo: number;
  title: string;
  date: string;
  githubUrl: string;
}

export interface SavedRecord {
  id: string;
  recordName: string;
  courseTitle: string;
  studentName: string;
  registerNumber: string;
  experiments: Experiment[];
  updatedAt: string;
}

// Validate the URL structurally instead of accepting any string starting with "http".
// Repository URLs and links to files, folders, commits, and issues are supported.
const isValidGitHubUrl = (value: string): boolean => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname)) return false;
    if (url.username || url.password || url.port || url.search) return false;
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return false;
    const [owner, repo] = segments;
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(owner) &&
      /^[a-zA-Z0-9_.-]+$/.test(repo) && repo !== '.' && repo !== '..';
  } catch {
    return false;
  }
};

const isValidRegisterNumber = (value: string): boolean => /^[A-Za-z0-9]{12}$/.test(value.trim());

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const invalidMotion = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [shakingExperiments, setShakingExperiments] = useState<number[]>([]);
  const clearInvalid = (name: string) => setInvalidFields(prev => prev.filter(item => item !== name));

  const flagInvalidFields = () => {
    const failures: string[] = [];
    if (!courseTitle.trim()) failures.push('courseTitle');
    if (!studentName.trim()) failures.push('studentName');
    if (!isValidRegisterNumber(registerNumber)) failures.push('registerNumber');
    experiments.forEach((exp, index) => {
      if (!exp.title.trim()) failures.push(`title-${index}`);
      if (!isValidGitHubUrl(exp.githubUrl)) failures.push(`githubUrl-${index}`);
    });
    setInvalidFields(failures);
    if (failures.length) {
      // Restart the card animation even when the user retries without changing a field.
      setShakingExperiments([]);
      const cardsToShake = experiments.flatMap((_, i) =>
        failures.includes(`title-${i}`) || failures.includes(`githubUrl-${i}`) ? [i] : []
      );
      if (!reduceMotion && cardsToShake.length) {
        requestAnimationFrame(() => setShakingExperiments(cardsToShake));
      }
      // A shared controller animates only inputs whose custom key is invalid.
      void invalidMotion.start((field: string) => failures.includes(field) && !reduceMotion
        ? { x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.30, ease: 'easeInOut' } }
        : { x: 0, transition: { duration: 0 } });
      const first = document.querySelector<HTMLInputElement>(`[data-validation-key="${failures[0]}"]`);
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  // Active Firestore Record Identifier
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  // Form Fields State
  const [courseTitle, setCourseTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');

  const [newExperimentId, setNewExperimentId] = useState<string | null>(null);

  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: 'exp-1',
      experimentNo: 1,
      title: '',
      date: '',
      githubUrl: '',
    },
  ]);

  // Sync & Load States
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Modal & Generation States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showBonafideModal, setShowBonafideModal] = useState(false);
  const [rememberBonafideChoice, setRememberBonafideChoice] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isDocxGenerating, setIsDocxGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; hasPostActions?: boolean } | null>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPayloadRef = useRef<string>('');

  const isFormValid = Boolean(
    courseTitle.trim() &&
    studentName.trim() &&
    isValidRegisterNumber(registerNumber) &&
    experiments.length > 0 &&
    experiments.every((exp) => exp.title.trim() && isValidGitHubUrl(exp.githubUrl))
  );

  // Auth Guard & Firestore Record Loader
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const idParam = searchParams.get('id');
    const isExplicitNew = searchParams.get('new') === 'true';

    if (idParam && !isExplicitNew) {
      setIsRecordLoading(true);
      getLabRecord(user.uid, idParam)
        .then((docData) => {
          if (docData) {
            setCurrentRecordId(docData.id || idParam);

            const displayTitle =
              docData.courseCode &&
              docData.courseTitle &&
              !docData.courseTitle.includes(docData.courseCode)
                ? `${docData.courseCode} - ${docData.courseTitle}`
                : docData.courseTitle || docData.courseCode || '';

            setCourseTitle(displayTitle);
            setStudentName(docData.studentName || user.displayName || '');
            setRegisterNumber(docData.registerNumber || '');

            if (docData.experiments && docData.experiments.length > 0) {
              setExperiments(
                docData.experiments.map((exp, idx) => ({
                  id: `exp-${idx + 1}`,
                  experimentNo: exp.experimentNo || idx + 1,
                  title: exp.title || '',
                  date: exp.date || '',
                  githubUrl: exp.githubUrl || '',
                }))
              );
            }

            const initialPayload = JSON.stringify({
              courseTitle: displayTitle.trim(),
              studentName: (docData.studentName || user.displayName || '').trim(),
              registerNumber: (docData.registerNumber || '').trim(),
              experiments: (docData.experiments || []).map((exp, idx) => ({
                experimentNo: idx + 1,
                title: (exp.title || '').trim(),
                date: exp.date || '',
                githubUrl: (exp.githubUrl || '').trim(),
              })),
            });
            lastSavedPayloadRef.current = initialPayload;
            setSyncStatus('saved');
          } else {
            showToast('Record not found. Starting clean record.');
            setCurrentRecordId(null);
            if (user.displayName) setStudentName(user.displayName);
          }
        })
        .catch((err) => {
          console.error('Failed to load record from Firestore:', err);
          showToast('Failed to load record from cloud.');
        })
        .finally(() => {
          setIsInitialLoad(false);
          setIsRecordLoading(false);
          setIsHydrated(true);
        });
    } else {
      if (isExplicitNew) {
        window.history.replaceState({}, '', '/dashboard');
      }
      setCurrentRecordId(null);
      if (user.displayName) {
        setStudentName(user.displayName);
      }
      setIsInitialLoad(false);
      setIsHydrated(true);
    }
  }, [user, loading, router]);

  // Real-Time Debounced Firestore Auto-Save
  useEffect(() => {
    if (!user?.uid || isInitialLoad || isRecordLoading || !db) return;

    // Check if form contains minimum content to justify saving
    const hasContent = courseTitle.trim() || experiments.some((e) => e.title.trim());
    if (!hasContent) return;

    const payloadObj = {
      courseTitle: courseTitle.trim(),
      studentName: studentName.trim(),
      registerNumber: registerNumber.trim(),
      experiments: experiments.map((exp, idx) => ({
        experimentNo: idx + 1,
        title: exp.title.trim(),
        date: exp.date,
        githubUrl: exp.githubUrl.trim(),
      })),
    };

    const payloadString = JSON.stringify(payloadObj);
    if (payloadString === lastSavedPayloadRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!db) return;
      setSyncStatus('saving');
      try {
        const { courseCode, courseTitle: parsedTitle } = parseCourseInfo(courseTitle);
        const payload = {
          courseCode,
          courseTitle: parsedTitle || courseTitle.trim(),
          studentName: studentName.trim(),
          registerNumber: registerNumber.trim(),
          recordDate: experiments[0]?.date || new Date().toISOString().split('T')[0],
          experiments: experiments.map((exp, idx) => ({
            experimentNo: idx + 1,
            title: exp.title.trim(),
            date: exp.date,
            githubUrl: exp.githubUrl.trim(),
          })),
          updatedAt: new Date().toISOString(),
        };

        if (currentRecordId) {
          // Update active record in place
          await setDoc(doc(db, 'users', user.uid, 'records', currentRecordId), payload, {
            merge: true,
          });
          lastSavedPayloadRef.current = payloadString;
          setSyncStatus('saved');
        } else {
          // Create new record document and lock ID to prevent duplicate spam
          const docRef = await addDoc(collection(db, 'users', user.uid, 'records'), {
            ...payload,
            createdAt: new Date().toISOString(),
          });
          lastSavedPayloadRef.current = payloadString;
          setCurrentRecordId(docRef.id);
          window.history.replaceState({}, '', `/dashboard?id=${docRef.id}`);
          setSyncStatus('saved');
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setSyncStatus('error');
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    courseTitle,
    studentName,
    registerNumber,
    experiments,
    user?.uid,
    currentRecordId,
    isInitialLoad,
    isRecordLoading,
  ]);

  const showToast = (message: string, hasPostActions = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, hasPostActions });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // "New Record" / Reset Action
  const handleStartNewRecord = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const cleanExperiments: Experiment[] = [
      {
        id: 'exp-1',
        experimentNo: 1,
        title: '',
        date: '',
        githubUrl: '',
      },
    ];

    setCurrentRecordId(null);
    setCourseTitle('');
    setRegisterNumber('');
    setExperiments(cleanExperiments);
    setInvalidFields([]);
    setShakingExperiments([]);
    setNewExperimentId(null);
    setSyncStatus('idle');
    lastSavedPayloadRef.current = '';

    if (user?.displayName) {
      setStudentName(user.displayName);
    } else {
      setStudentName('');
    }

    window.history.replaceState({}, '', '/dashboard');
    showToast('Clean record template ready.', false);
  };

  const handleRegisterNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (sanitized.length <= 12) {
      setRegisterNumber(sanitized);
      clearInvalid('registerNumber');
    }
  };

  const handleAddExperiment = () => {
    const newExp: Experiment = {
      id: `exp-${Date.now()}`,
      experimentNo: experiments.length + 1,
      title: '',
      date: '',
      githubUrl: '',
    };
    setExperiments((prev) => [...prev, newExp]);
    setNewExperimentId(newExp.id!);
    setInvalidFields([]);
    setShakingExperiments([]);
  };

  // Reveal the newly created experiment, the Add button and (when space allows)
  // the document action bar together. Account for the sticky navigation and dock.
  useEffect(() => {
    if (!newExperimentId) return;
    const timer = window.setTimeout(() => {
      const card = document.getElementById(`experiment-${newExperimentId}`);
      const addButton = document.getElementById('tour-add-btn');
      const actionBar = document.getElementById('tour-action-bar');
      if (!card || !addButton || !actionBar) return;

      const topInset = 76;
      const bottomInset = 22;
      const viewport = window.innerHeight;
      const cardRect = card.getBoundingClientRect();
      const addRect = addButton.getBoundingClientRect();
      const dockRect = actionBar.getBoundingClientRect();
      const absoluteTop = window.scrollY + cardRect.top;
      const completeGroupHeight = dockRect.bottom - cardRect.top;
      const cardAndAddHeight = addRect.bottom - cardRect.top;
      const available = viewport - topInset - bottomInset;

      let scrollTarget: number;
      if (completeGroupHeight <= available) {
        // Center the complete authoring group when the screen is tall enough.
        scrollTarget = absoluteTop - topInset - (available - completeGroupHeight) / 2;
      } else if (cardAndAddHeight <= available) {
        // Small laptop: keep the entire experiment and Add button visible.
        scrollTarget = absoluteTop - topInset - (available - cardAndAddHeight) / 2;
      } else {
        // Narrow phone: prioritize the card; actions stay accessible below.
        scrollTarget = absoluteTop - topInset;
      }
      // Prevent overscrolling beyond the document's scrollable content.
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
      window.scrollTo({ top: Math.max(0, Math.min(scrollTarget, maxScroll)), behavior: 'smooth' });
      window.setTimeout(() => card.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 360);
      setNewExperimentId(null);
    }, 110);
    return () => window.clearTimeout(timer);
  }, [newExperimentId]);

  const handleDeleteExperiment = (index: number) => {
    if (experiments.length <= 1) return;
    setInvalidFields([]);
    setShakingExperiments([]);
    setExperiments((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((exp, idx) => ({
        ...exp,
        experimentNo: idx + 1,
      }));
    });
  };

  const handleUpdateExperiment = (
    index: number,
    field: 'title' | 'date' | 'githubUrl',
    value: string
  ) => {
    clearInvalid(`${field}-${index}`);
    setExperiments((prev) =>
      prev.map((exp, idx) => {
        if (idx === index) {
          return { ...exp, [field]: value };
        }
        return exp;
      })
    );
  };

  // Preview Handler
  const handlePreviewClick = () => {
    if (!flagInvalidFields()) return;
    setIsPreviewOpen(true);
  };

  // PDF Download Handler
  const executePdfDownload = async (withBonafide: boolean) => {
    setIsPdfGenerating(true);

    try {
      const documentData = {
        courseTitle: courseTitle.trim(),
        studentName: studentName.trim(),
        registerNumber: registerNumber.trim(),
        experiments: experiments.map((exp, idx) => ({
          id: exp.id || `exp-${idx + 1}`,
          title: exp.title.trim(),
          date: exp.date,
          githubLink: exp.githubUrl.trim(),
        })),
      };

      if (withBonafide) {
        const basePdfBlob = (await generatePDF(documentData, true)) as Blob;
        if (basePdfBlob) {
          const mergedBlob = await mergeWithBonafide(basePdfBlob);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(mergedBlob);
          link.download = `${courseTitle.trim() || 'document'}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        }
      } else {
        await generatePDF(documentData, false);
      }

      showToast('PDF downloaded successfully!', true);
    } catch (e) {
      console.error('PDF generation failed:', e);
      showToast('Failed to generate PDF.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePdfDownloadClick = async () => {
    if (!flagInvalidFields()) {
      showToast('Please fill the highlighted fields before generating PDF.');
      return;
    }

    const savedChoice = localStorage.getItem('pdf_download_choice');
    const count = parseInt(localStorage.getItem('pdf_download_count') || '0', 10);

    if (savedChoice && count < 20) {
      localStorage.setItem('pdf_download_count', (count + 1).toString());
      await executePdfDownload(savedChoice === 'with');
    } else {
      setShowBonafideModal(true);
    }
  };

  const handleBonafideChoice = async (withBonafide: boolean) => {
    setShowBonafideModal(false);

    if (rememberBonafideChoice) {
      localStorage.setItem('pdf_download_choice', withBonafide ? 'with' : 'without');
      localStorage.setItem('pdf_download_count', '1');
    } else {
      localStorage.removeItem('pdf_download_choice');
      localStorage.removeItem('pdf_download_count');
    }

    await executePdfDownload(withBonafide);
  };

  // DOCX Download Handler
  const handleDownloadDocx = async () => {
    if (!flagInvalidFields()) {
      showToast('Please fill the highlighted fields before generating DOCX.');
      return;
    }
    setIsDocxGenerating(true);

    try {
      await generateDOCX({
        courseTitle: courseTitle.trim(),
        studentName: studentName.trim(),
        registerNumber: registerNumber.trim(),
        experiments: experiments.map((exp, idx) => ({
          id: exp.id || `exp-${idx + 1}`,
          title: exp.title.trim(),
          date: exp.date,
          githubLink: exp.githubUrl.trim(),
        })),
      });
      showToast('DOCX downloaded successfully!', true);
    } catch (e) {
      console.error('DOCX generation failed:', e);
      showToast('Failed to generate DOCX.');
    } finally {
      setIsDocxGenerating(false);
    }
  };

  if (loading || !user || !isHydrated || isRecordLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--text-secondary)] dark:text-[var(--text-secondary)]" />
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-wide">
            {isRecordLoading ? 'Loading record from cloud...' : 'Verifying workspace session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-12">
      <WorkspaceTour />
      <style>{`
        @keyframes labora-invalid-experiment {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .labora-shake-experiment { animation: labora-invalid-experiment 320ms ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .labora-shake-experiment { animation: none; }
        }
      `}</style>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            role="status"
            aria-live="polite"
            className="fixed top-18 right-4 sm:right-6 z-50 flex flex-col gap-2.5 rounded-2xl border border-neutral-200/90 dark:border-[#303030] bg-white/95 dark:bg-[#191919]/95 p-3.5 sm:p-4 text-xs font-semibold shadow-xl backdrop-blur-md max-w-[92vw] sm:max-w-md text-neutral-900 dark:text-[#F4F4F5]"
          >
            <div className="flex items-center gap-2.5">
              {toast.message.toLowerCase().includes('fail') ||
              toast.message.toLowerCase().includes('fill') ||
              toast.message.toLowerCase().includes('please') ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-500/10 dark:bg-[#222222] text-[var(--text-secondary)] dark:text-[#A1A1AA]">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <span className="leading-snug flex-1 font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                type="button"
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-[#F4F4F5] p-0.5 rounded-lg transition cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {toast.hasPostActions && (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-[#303030]">
                <button
                  onClick={() => {
                    setToast(null);
                    handleStartNewRecord();
                  }}
                  type="button"
                  className="labora-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer bg-[#3B5BDB] hover:bg-[#364FC7] text-white border-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Record</span>
                </button>

                <button
                  onClick={() => {
                    setToast(null);
                    router.push('/history');
                  }}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 dark:border-[#303030] bg-neutral-50 dark:bg-[#141414] px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-[#F4F4F5] shadow-2xs transition hover:bg-neutral-100 dark:hover:bg-[#222222] active:scale-95 cursor-pointer"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>View History</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-9">
        {/* Compact workspace heading — keep actions close to the title. */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="labora-display text-[26px] sm:text-[29px] font-bold tracking-[-0.045em] text-neutral-950 dark:text-[#F4F4F5] leading-tight">
              Lab Record
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 dark:text-[#A1A1AA]" role="status" aria-live="polite">
              {syncStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> :
                <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'error' ? 'bg-rose-500' : syncStatus === 'saved' ? 'bg-neutral-500' : 'bg-neutral-400'}`} />}
              <span>{syncStatus === 'saving' ? 'Saving changes' : syncStatus === 'error' ? 'Unable to sync' : syncStatus === 'saved' ? 'All changes saved' : 'Autosave enabled'}</span>
            </div>
          </div>
          <button
            onClick={handleStartNewRecord}
            type="button"
            title="Start a new blank lab record"
            className="labora-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-semibold transition active:scale-[0.98] cursor-pointer bg-[#3B5BDB] hover:bg-[#364FC7] text-white border-0"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Record
          </button>
        </div>

        {/* Section 1: Course & Student Metadata Card */}
        <div
          id="tour-meta-form"
          className="labora-panel rounded-2xl border border-neutral-200/90 dark:border-[#303030] bg-white dark:bg-[#191919] p-5 sm:p-6 shadow-[0_3px_16px_rgba(15,23,42,0.025)] mb-6"
        >
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-neutral-100 dark:border-[#303030]">
            <FileText className="h-4 w-4 text-neutral-500 dark:text-[#A1A1AA]" strokeWidth={1.8} />
            <h2 className="labora-heading text-sm font-bold tracking-tight text-neutral-950 dark:text-[#F4F4F5]">
              Record details
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                  Course Title and Code <span className="text-[var(--text-muted)]">*</span>
                </label>
                <span className="text-[10px] text-neutral-400 dark:text-[#A1A1AA]">e.g., 19AI410 - Machine Learning</span>
              </div>
              <motion.input
                custom="courseTitle"
                animate={invalidMotion}
                data-validation-key="courseTitle"
                aria-invalid={invalidFields.includes("courseTitle")}
                type="text"
                value={courseTitle}
                onChange={(e) => { setCourseTitle(e.target.value); clearInvalid("courseTitle"); }}
                placeholder="e.g., 19AI410 - Machine Learning Laboratory"
                className="labora-input aria-invalid:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-[#F4F4F5] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Student Name <span className="text-[var(--text-muted)]">*</span>
                </label>
                <motion.input
                  custom="studentName"
                  animate={invalidMotion}
                  data-validation-key="studentName"
                  aria-invalid={invalidFields.includes("studentName")}
                  type="text"
                  value={studentName}
                  onChange={(e) => { setStudentName(e.target.value); clearInvalid("studentName"); }}
                  placeholder="e.g., John Doe"
                  className="labora-input aria-invalid:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-[#F4F4F5] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                    Register Number <span className="text-[var(--text-muted)]">*</span>
                  </label>
                  <span className={`labora-mono text-[10px] ${invalidFields.includes('registerNumber') ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400 dark:text-[#A1A1AA]'}`}>{registerNumber.length}/12</span>
                </div>
                <motion.input
                  custom="registerNumber"
                  animate={invalidMotion}
                  data-validation-key="registerNumber"
                  aria-invalid={invalidFields.includes("registerNumber")}
                  type="text"
                  value={registerNumber}
                  onChange={handleRegisterNumberChange}
                  placeholder="e.g., 211419104001"
                  maxLength={12}
                  className="labora-input aria-invalid:border-rose-500 aria-invalid:focus:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2.5 text-xs sm:text-sm labora-mono text-neutral-900 dark:text-[#F4F4F5] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] tracking-wider transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
                />
                {invalidFields.includes('registerNumber') && (
                  <p role="alert" className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">Register number must contain exactly 12 letters or digits.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Experiment Input Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="labora-heading text-sm sm:text-base font-bold tracking-tight text-neutral-950 dark:text-[#F4F4F5]">
                Experiments
              </h2>
              <span className="rounded-full bg-neutral-100 dark:bg-[#141414] px-2 py-0.5 text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] border border-neutral-200/80 dark:border-[#303030]">
                {experiments.length} {experiments.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

          </div>

          <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {experiments.map((exp, index) => {
              const expNumberFormatted = String(exp.experimentNo || index + 1).padStart(2, '0');
              const isOnlyOne = experiments.length === 1;
              const hasValidLink = isValidGitHubUrl(exp.githubUrl);

              return (
                <motion.div
                  key={exp.id || `exp-${index}`}
                  layout="position"
                  initial={{ opacity: 0, y: 22, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                  id={index === 0 ? 'tour-exp-card-0' : `experiment-${exp.id}`}
                  onAnimationEnd={(event) => {
                    if (event.animationName === 'labora-invalid-experiment') {
                      setShakingExperiments(prev => prev.filter(value => value !== index));
                    }
                  }}
                  className={`labora-panel rounded-2xl border bg-white dark:bg-[#191919] p-4 sm:p-5 shadow-[0_3px_16px_rgba(15,23,42,0.025)] ${
                    invalidFields.includes(`title-${index}`) || invalidFields.includes(`githubUrl-${index}`)
                      ? 'border-rose-400 dark:border-rose-500/70'
                      : 'border-neutral-200/90 dark:border-[#303030] hover:border-[var(--border-color)] dark:hover:border-[#444444]'
                  } ${shakingExperiments.includes(index) ? 'labora-shake-experiment' : ''}`}
                >
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-100 dark:border-[#303030]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold labora-mono text-neutral-900 dark:text-[#F4F4F5] bg-neutral-100 dark:bg-[#141414] border border-neutral-200/80 dark:border-[#303030]">
                        {expNumberFormatted} <span className="font-sans font-semibold text-neutral-500 dark:text-[#A1A1AA]">/ Experiment</span>
                      </span>
                      {exp.title.trim() && hasValidLink && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] dark:text-[#A1A1AA]">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteExperiment(index)}
                      disabled={isOnlyOne}
                      type="button"
                      title={isOnlyOne ? 'At least one experiment is required' : 'Delete experiment'}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                        isOnlyOne
                          ? 'cursor-not-allowed opacity-30 text-neutral-400 dark:text-neutral-600'
                          : 'text-neutral-400 dark:text-[#A1A1AA] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer active:scale-95'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                        Experiment Title <span className="text-[var(--text-muted)]">*</span>
                      </label>
                      <motion.input
                        custom={`title-${index}`}
                        animate={invalidMotion}
                        data-validation-key={`title-${index}`}
                        aria-invalid={invalidFields.includes(`title-${index}`)}
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleUpdateExperiment(index, 'title', e.target.value)}
                        placeholder="e.g., Implementation of Decision Tree Classification Algorithm"
                        className="labora-input aria-invalid:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-[#F4F4F5] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                          Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={exp.date || ''}
                          onChange={(e) => handleUpdateExperiment(index, 'date', e.target.value)}
                          className="labora-input aria-invalid:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2 text-xs sm:text-sm text-neutral-900 dark:text-[#F4F4F5] transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-neutral-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                            GitHub Link <span className="text-[var(--text-muted)]">*</span>
                          </label>
                          {hasValidLink && (
                            <a
                              href={exp.githubUrl.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] dark:text-[#A1A1AA] hover:text-[#F4F4F5] hover:underline"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        <motion.input
                          custom={`githubUrl-${index}`}
                          animate={invalidMotion}
                          data-validation-key={`githubUrl-${index}`}
                          aria-invalid={invalidFields.includes(`githubUrl-${index}`)}
                          type="url"
                          value={exp.githubUrl}
                          onChange={(e) =>
                            handleUpdateExperiment(index, 'githubUrl', e.target.value)
                          }
                          placeholder="https://github.com/username/repository"
                          className="labora-input aria-invalid:border-rose-500 aria-invalid:focus:border-rose-500 aria-invalid:ring-0 w-full rounded-xl border border-[#E5E5E5] dark:border-[#303030] bg-white dark:bg-[#141414] px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-[#F4F4F5] placeholder:text-neutral-400 dark:placeholder:text-[#71717A] transition-colors duration-150 outline-none focus:outline-none focus:border-[#3B5BDB] dark:focus:border-[#3B5BDB] focus:ring-0"
                        />
                        {invalidFields.includes(`githubUrl-${index}`) && (
                          <p role="alert" className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">Enter a valid GitHub URL (https://github.com/owner/repo).</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Section 3: Add Experiment Button & Executive Action Toolbar */}
        <div className="flex flex-col mt-3 space-y-4">
          <button
            id="tour-add-btn"
            onClick={() => handleAddExperiment()}
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-color)] dark:border-[#303030] bg-[var(--bg-subtle)] dark:bg-[#191919] py-3 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A1A1AA] hover:border-[#3B5BDB] dark:hover:border-[#3B5BDB] hover:bg-[var(--primary-soft)] dark:hover:bg-[#222222] dark:hover:text-[#F4F4F5] transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add experiment</span>
          </button>

          {/* Action Dock */}
          <div
            id="tour-action-bar"
            className="labora-panel w-full rounded-2xl border border-neutral-200/90 dark:border-[#303030] bg-white/95 dark:bg-[#191919]/95 p-3 sm:p-4 shadow-[0_5px_22px_rgba(15,23,42,0.035)] backdrop-blur-lg"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Preview Button */}
              <button
                onClick={() => handlePreviewClick()}
                type="button"
                title="Preview document"
                className={`labora-export-preview inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                  isDark
                    ? 'border-[#303030] bg-[#222222] text-[#F4F4F5] hover:bg-[#2c2c2c]'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>

              {/* DOCX Button */}
              <button
                onClick={() => handleDownloadDocx()}
                disabled={isDocxGenerating || isPdfGenerating}
                type="button"
                className="labora-export-docx inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-[#303030] bg-neutral-50/80 dark:bg-[#222222] px-4 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-[#F4F4F5] shadow-2xs transition-all hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {isDocxGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
                ) : (
                  <FileText className="h-4 w-4 text-neutral-600 dark:text-[#A1A1AA]" />
                )}
                <span>Export DOCX</span>
              </button>

              {/* PDF Button */}
              <button
                onClick={() => handlePdfDownloadClick()}
                disabled={isPdfGenerating || isDocxGenerating}
                type="button"
                className="labora-primary labora-export-pdf col-span-2 sm:col-span-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer bg-[#3B5BDB] hover:bg-[#364FC7] text-white border-0"
              >
                {isPdfGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-neutral-950" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Download PDF</span>
              </button>
            </div>

            {!isFormValid && (
              <p className="mt-2 text-center text-[10px] text-neutral-400 dark:text-[#A1A1AA] font-medium">
                Complete the required fields to enable preview and export.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Bonafide Certificate Options Modal */}
      <AnimatePresence>
        {showBonafideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md"
              onClick={() => setShowBonafideModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="labora-dialog relative z-10 w-full max-w-md rounded-3xl border border-neutral-200/90 dark:border-[#303030] bg-white dark:bg-[#191919] p-6 sm:p-7 shadow-2xl text-neutral-950 dark:text-[#F4F4F5]"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-[#303030]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-[#222222] text-[var(--text-secondary)] dark:text-[#A1A1AA]">
                    <Download className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold tracking-tight">PDF Export Options</h3>
                </div>
                <button
                  onClick={() => setShowBonafideModal(false)}
                  type="button"
                  className="rounded-full p-1 text-neutral-400 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#222222] hover:text-neutral-700 dark:hover:text-[#F4F4F5] transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-[#A1A1AA] mb-6 leading-relaxed">
                Choose whether to merge the official college Bonafide Certificate page at the beginning of your Lab Record PDF.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={() => handleBonafideChoice(true)}
                  type="button"
                  className="labora-primary w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 bg-[#3B5BDB] hover:bg-[#364FC7] text-white border-0"
                >
                  <span>Download with Bonafide</span>
                </button>

                <button
                  onClick={() => handleBonafideChoice(false)}
                  type="button"
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition border border-neutral-200/90 dark:border-[#303030] bg-neutral-50 dark:bg-[#141414] hover:bg-neutral-100 dark:hover:bg-[#222222] text-neutral-800 dark:text-[#F4F4F5] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Download without Bonafide</span>
                </button>
              </div>

              <div className="flex items-center gap-3 border-t border-neutral-100 dark:border-[#303030] pt-4">
                <input
                  type="checkbox"
                  id="rememberChoice"
                  checked={rememberBonafideChoice}
                  onChange={(e) => setRememberBonafideChoice(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-[#303030] bg-white dark:bg-[#141414] text-[#3B5BDB] dark:text-[#3B5BDB] focus:ring-[#3B5BDB] cursor-pointer"
                />
                <label
                  htmlFor="rememberChoice"
                  className="text-xs select-none cursor-pointer text-neutral-600 dark:text-[#A1A1AA]"
                >
                  Remember my choice (prompts again after 20 downloads)
                </label>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        isDark={isDark}
        courseTitle={courseTitle.trim()}
        studentName={studentName}
        registerNumber={registerNumber}
        experiments={experiments.map((exp, idx) => ({
          id: exp.id || `exp-${idx + 1}`,
          title: exp.title,
          date: exp.date,
          githubLink: exp.githubUrl,
        }))}
      />
    </div>
  );
}
