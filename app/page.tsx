"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Github } from "@thesvg/react";
import {
  ArrowRightIcon,
  DownloadIcon,
  FileTextIcon,
  FlaskConicalIcon,
  MoonIcon,
  PlusIcon,
  TrashIcon,
} from "@thesvg/ui-react";
import { useAuth } from "@/context/AuthContext";

const steps = [
  {
    number: "01",
    title: "Add your details",
    description: "Enter your course, student information, and experiments.",
    icon: (props: React.ComponentProps<typeof FileTextIcon>) => <FileTextIcon {...props} />,
  },
  {
    number: "02",
    title: "Link your code",
    description: "Attach a GitHub link to each experiment for easy verification.",
    icon: (props: React.ComponentProps<typeof Github>) => <Github variant="mono" {...props} />,
  },
  {
    number: "03",
    title: "Export your record",
    description: "Preview your work, then download a PDF or DOCX file.",
    icon: (props: React.ComponentProps<typeof DownloadIcon>) => <DownloadIcon {...props} />,
  },
];

function EditorPreview() {
  return (
    <div
      aria-label="Preview of the Labora lab record editor"
      className="relative mx-auto w-full max-w-[790px] overflow-hidden rounded-[20px] border border-[#e4e4e7] bg-white text-left shadow-[0_36px_90px_-42px_rgba(28,28,35,0.38),0_10px_25px_-12px_rgba(28,28,35,0.10)]"
    >
      <div className="flex h-[54px] items-center justify-between gap-3 border-b border-[#eeeef0] px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-5 sm:gap-8">
          <div className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold tracking-tight text-[#171717]">
            <FlaskConicalIcon className="h-4 w-4" />
            <span>Labora</span>
          </div>
          <div className="flex h-[54px] items-stretch gap-5 text-[11px] font-medium sm:gap-7 sm:text-xs">
            <span className="inline-flex items-center border-b-2 border-[#171717] text-[#171717]">Editor</span>
            <span className="inline-flex items-center text-[#8b8b90]">History</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[#83838a]">
          <MoonIcon className="h-4 w-4" />
          <span className="h-6 w-6 rounded-full border border-[#e9e9ec] bg-[#f2f2f4]" />
        </div>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-6 pt-7 sm:px-6 sm:pb-9 sm:pt-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-space-grotesk,inherit)] text-xl font-bold tracking-tight text-[#171717] sm:text-2xl">Lab Record</h3>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#85858b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9a9aa0]" /> Autosave enabled
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e5e5e8] bg-white px-2.5 py-2 text-[10px] font-semibold text-[#232329] shadow-sm sm:px-3">
            <PlusIcon className="h-3 w-3" /> New Record
          </div>
        </div>

        <div className="rounded-[14px] border border-[#e7e7e9] bg-white p-4 shadow-[0_3px_14px_rgba(20,20,20,0.025)] sm:p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-[#f0f0f1] pb-3 text-xs font-semibold text-[#29292d]">
            <FileTextIcon className="h-3.5 w-3.5 text-[#67676d]" /> Record details
          </div>
          <div className="space-y-3.5">
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">Course title and code</p>
              <div className="flex min-h-9 items-center rounded-lg border border-[#e5e5e8] px-3 text-[11px] text-[#3b3b41]">19AI410 - Machine Learning Laboratory</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">Student name</p>
                <div className="flex min-h-9 items-center rounded-lg border border-[#e5e5e8] px-3 text-[11px] text-[#3b3b41]">Student Name</div>
              </div>
              <div className="min-w-0">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">Register number</p>
                <div className="flex min-h-9 items-center truncate rounded-lg border border-[#e5e5e8] px-3 font-mono text-[10px] text-[#3b3b41]">211419104001</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <h4 className="text-xs font-bold text-[#242429]">Experiments</h4>
          <span className="rounded-full bg-[#f3f3f4] px-2 py-0.5 text-[9px] text-[#717179]">1 entry</span>
        </div>
        <div className="mt-2.5 rounded-[14px] border border-[#e7e7e9] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-3">
            <span className="rounded-md bg-[#f4f4f5] px-2 py-1 font-mono text-[10px] text-[#494950]">01 / Experiment</span>
            <TrashIcon className="h-3.5 w-3.5 text-[#b8b8be]" />
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">Experiment title</p>
            <div className="flex min-h-9 items-center rounded-lg border border-[#e5e5e8] px-3 text-[11px] text-[#3b3b41]">Decision Tree Classification</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">Date</p>
              <div className="flex min-h-9 items-center rounded-lg border border-[#e5e5e8] px-3 font-mono text-[10px] text-[#5b5b62]">12/11/2026</div>
            </div>
            <div className="min-w-0">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.075em] text-[#66666e]">GitHub link</p>
              <div className="flex min-h-9 items-center overflow-hidden rounded-lg border border-[#e5e5e8] px-3 font-mono text-[10px] text-[#5b5b62]">
                <span className="truncate">github.com/user/project</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#dcdce0] bg-[#fafafb] text-[11px] font-medium text-[#65656c]">
          <PlusIcon className="h-3.5 w-3.5" /> Add experiment
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-[#e9e9ec] bg-white p-2">
          <div className="flex min-h-9 items-center justify-center rounded-lg bg-[#f4f4f5] text-[10px] font-medium text-[#595960]">Preview</div>
          <div className="flex min-h-9 items-center justify-center rounded-lg border border-[#e6e6e9] text-[10px] font-medium text-[#595960]">Export DOCX</div>
          <div className="flex min-h-9 items-center justify-center rounded-lg bg-[#1c1c1e] text-[10px] font-medium text-white">Download PDF</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  if (authLoading || user) return null;

  const reveal = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9fafb] font-sans text-[#171717] antialiased selection:bg-[#e9e9ec] selection:text-[#171717]">
      {/* Quiet cool-gray ambience, limited to the hero preview area. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[1000px] overflow-hidden">
        <div className="absolute left-1/2 top-[410px] h-[530px] w-[990px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(220,228,237,0.34),transparent_72%)]" />
        {/* Two quiet orbital arcs frame the preview without crossing the copy. */}
        <div className="absolute -left-[310px] top-[550px] h-[460px] w-[520px] rotate-[-24deg] rounded-[50%] border border-[#dfe5ec]/70 sm:-left-[225px]" />
        <div className="absolute -right-[320px] top-[600px] h-[460px] w-[550px] rotate-[21deg] rounded-[50%] border border-[#dfe5ec]/70 sm:-right-[235px]" />
      </div>

      <header className="relative z-20 mx-auto flex h-[76px] w-full max-w-[1160px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-[#171717]" aria-label="Labora home">
          <FlaskConicalIcon className="h-[22px] w-[22px]" />
          <span className="font-[family-name:var(--font-space-grotesk,inherit)] text-[19px] font-bold tracking-[-0.04em]">Labora</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-7">
          <a href="#how-it-works" className="hidden text-[13px] font-medium text-[#66666e] transition-colors hover:text-[#171717] sm:inline-flex">How it works</a>
          <Link href="/login" className="text-[13px] font-medium text-[#4f4f56] transition-colors hover:text-black">Sign in</Link>
          <Link href="/login" className="inline-flex h-9 items-center rounded-lg bg-[#1d1d1f] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#3a3a3f]">Get started</Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section aria-labelledby="hero-heading" className="mx-auto max-w-[1100px] px-5 pt-20 text-center sm:px-8 sm:pt-24 lg:pt-[100px]">
          
          <h1 id="hero-heading" className="mx-auto max-w-[850px] font-[family-name:var(--font-space-grotesk,inherit)] text-[clamp(2.55rem,6.3vw,5rem)] font-semibold leading-[1.09] tracking-[-0.065em] text-[#141416]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span {...reveal(0.05)} className="block">One workspace, from</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span {...reveal(0.22)} className="block">code to record.</motion.span>
            </span>
          </h1>
          <motion.p {...reveal(0.40)} className="mx-auto mt-6 max-w-[550px] text-[14px] leading-[1.85] text-[#62626b] sm:text-[16px]">
            Organize your experiments, connect your GitHub code, and export clean, ready-to-submit lab records — without the repetitive formatting.
          </motion.p>
          <motion.div {...reveal(0.55)} className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1c1c1e] px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#37373b] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              Get started <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            <a href="#how-it-works" className="inline-flex h-11 items-center rounded-xl border border-[#dcdce1] bg-white px-5 text-[13px] font-semibold text-[#34343a] transition-all hover:bg-[#f5f5f6] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              How it works
            </a>
          </motion.div>
          {/* An editorial product stage: textured field, floating editor, and a small
              document slip emerging below it. All artwork is decorative; the
              actual authenticated editor is unchanged. */}
          <motion.div {...reveal(0.68)} className="relative isolate mx-auto mt-16 max-w-[1000px] pb-16 sm:mt-[76px] sm:pb-24">
            {/* Sparse geometry stays at the sides; the editor remains the focus. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[0%] -top-4 bottom-12 -z-20 overflow-hidden rounded-[32px] sm:inset-x-[-5%]">
              <div
                className="absolute inset-0 opacity-[0.27] [mask-image:radial-gradient(ellipse_at_center,black_8%,transparent_63%)]"
                style={{ backgroundImage: 'linear-gradient(to right, #d9e0e8 1px, transparent 1px), linear-gradient(to bottom, #d9e0e8 1px, transparent 1px)', backgroundSize: '46px 46px' }}
              />
              <div className="absolute inset-x-[9%] top-[15%] h-[73%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(217,226,237,0.30),transparent_73%)] blur-3xl" />
            </div>

            {/* A single offset sheet creates the layered-paper feeling. */}
            <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[52px] top-[30px] -z-10 rotate-[1.6deg] rounded-[23px] border border-[#e0e5eb] bg-[#eef2f6] shadow-[0_18px_30px_-24px_rgba(25,25,30,0.18)] sm:bottom-[80px]" />

            <EditorPreview />

            {/* A small 'document' peeks out below the editor like an exported sheet. */}
            <div aria-hidden="true" className="pointer-events-none absolute bottom-[8px] right-[5%] z-10 w-[178px] rotate-[3deg] rounded-[12px] border border-[#dedee4] bg-white px-4 pb-3 pt-4 text-left shadow-[0_14px_30px_-14px_rgba(25,25,30,0.28)] sm:bottom-[23px] sm:right-[7%] sm:w-[218px] sm:rounded-[14px] sm:px-5 sm:pb-4 sm:pt-5">
              <div className="mb-2 flex items-center justify-between text-[9px] font-semibold text-[#34343b] sm:text-[10px]">
                <span>LAB RECORD.pdf</span>
                <FileTextIcon className="h-3.5 w-3.5 text-[#868690]" />
              </div>
              <div className="h-px w-full bg-[#e8e8ec]" />
              <div className="mt-3 h-1.5 w-[82%] rounded-full bg-[#dedee4]" />
              <div className="mt-1.5 h-1.5 w-[61%] rounded-full bg-[#e8e8ed]" />
              <div className="mt-3 flex items-center gap-1.5 text-[9px] font-medium text-[#777781]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8c8c96]" />
                Ready to export
              </div>
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-[1120px] scroll-mt-16 px-5 pb-28 pt-28 sm:px-8 sm:pb-36 sm:pt-36">
          <div className="text-center">
            <span className="inline-flex rounded-full border border-[#e7e7eb] bg-[#f4f4f6] px-3 py-1.5 text-[11px] font-medium text-[#65656d]">How it works</span>
            <h2 id="how-title" className="mt-5 font-[family-name:var(--font-space-grotesk,inherit)] text-[clamp(2rem,4.2vw,3.3rem)] font-semibold leading-tight tracking-[-0.05em] text-[#161618]">From experiment to document.</h2>
            <p className="mx-auto mt-3 max-w-[540px] text-sm leading-7 text-[#707079] sm:text-[15px]">Three simple steps to a formatted lab record.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div key={number} className="group rounded-[17px] border border-[#e8e8eb] bg-white/75 px-7 py-7 shadow-[0_6px_20px_rgba(20,20,30,0.018)] transition-all hover:-translate-y-1 hover:border-[#d8d8dc] hover:shadow-[0_16px_35px_rgba(20,20,30,0.04)]">
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#e8e8eb] bg-[#fbfbfc] text-[#222226]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] text-[#a6a6ac]">{number}</span>
                </div>
                <h3 className="mt-7 font-[family-name:var(--font-space-grotesk,inherit)] text-[18px] font-semibold tracking-tight text-[#242428]">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#707078]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#ededf0] bg-white/45">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-4 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#26262b]">
            <FlaskConicalIcon className="h-4 w-4" /> Labora
          </div>
          <p className="text-[11px] text-[#8b8b93]">© {new Date().getFullYear()} Labora. Lab records, simplified.</p>
          <Link href="/login" className="text-xs font-medium text-[#66666e] transition-colors hover:text-[#18181b]">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
