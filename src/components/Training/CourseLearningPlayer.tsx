import React, { useState } from 'react';
import { 
  X, 
  Video, 
  FileText, 
  Presentation, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Award,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { TrainingCourse, CourseMaterial } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface CourseLearningPlayerProps {
  course: TrainingCourse;
  onClose: () => void;
}

export const CourseLearningPlayer: React.FC<CourseLearningPlayerProps> = ({ course, onClose }) => {
  const { updateCourseProgress } = useData();
  const { user } = useAuth();

  const materials = course.materials && course.materials.length > 0 
    ? course.materials 
    : [
        {
          id: 'default-1',
          title: 'Course Introduction & Syllabus Overview',
          type: 'pdf' as const,
          urlOrData: '',
          fileName: 'course-syllabus.pdf',
          description: 'Introduction to foundational topics, key concepts, and assessment roadmap.',
          durationMinutes: 10,
          uploadedAt: new Date().toISOString(),
          isRequired: true
        }
      ];

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0].id);
  const [completedMaterialIds, setCompletedMaterialIds] = useState<Set<string>>(new Set());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const activeMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];
  const currentEmpId = user?.employeeId || '1';

  // Sample slides for PPT decks
  const pptSlides = [
    {
      title: "Regulatory Overview & Statutory Obligations",
      subtitle: "Executive Summary & Core Directives",
      points: [
        "Statutory frameworks mandate institutional vigilance across all customer-facing staff.",
        "Obligation to identify, record, and report unusual transactions within 48 hours.",
        "Failure to adhere results in personal and institutional supervisory penalties."
      ],
      callout: "Key Takeaway: Compliance begins at first contact with client documentation."
    },
    {
      title: "Identification of High-Risk Indicators & PEPs",
      subtitle: "Politically Exposed Persons & Beneficial Ownership",
      points: [
        "Domestic and foreign PEPs require enhanced senior management onboarding sign-off.",
        "Unmasking beneficial ownership structures with > 25% direct or indirect equity.",
        "Screening against Consolidated UN & OFAC Sanctions Lists prior to transaction clearance."
      ],
      callout: "Action: Immediate escalation to AML compliance officer upon positive watchlist hits."
    },
    {
      title: "Verification Standards: 90-Day Proof of Address",
      subtitle: "Documentary Evidence Verification Protocols",
      points: [
        "Utility bills, bank statements, or municipal rates must be dated within 90 calendar days.",
        "Certified copies of identity documents must bear an unexpired commissioner of oaths stamp.",
        "Digital validation through biometric or authoritative source verification where available."
      ],
      callout: "Rule of Thumb: If an address proof is dated > 90 days ago, it must be rejected immediately."
    },
    {
      title: "Audit Trail & Record Retention Protocols",
      subtitle: "5-Year Statutory Record-Keeping Standard",
      points: [
        "All customer due diligence dossiers must be retained for a minimum of 5 years.",
        "Audit logs must record time of receipt, reviewing compliance officer, and verification notes.",
        "Regular spot checks conducted by internal risk audit teams."
      ],
      callout: "Final Thought: Accurate documentation protects both the client and the institution."
    }
  ];

  const toggleMaterialComplete = (materialId: string) => {
    const updated = new Set(completedMaterialIds);
    if (updated.has(materialId)) {
      updated.delete(materialId);
    } else {
      updated.add(materialId);
    }
    setCompletedMaterialIds(updated);

    const completionPercent = Math.round((updated.size / materials.length) * 100);
    updateCourseProgress(course.id, currentEmpId, completionPercent);
  };

  const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-rose-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'ppt': return <Presentation className="w-4 h-4 text-amber-500" />;
      default: return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const progressPercent = Math.round((completedMaterialIds.size / materials.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-slate-950 text-white rounded-2xl shadow-2xl max-w-6xl w-full h-[94vh] flex flex-col overflow-hidden border border-slate-800">
        
        {/* Top Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-blue-400">{course.code}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{course.category}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">{course.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress Bar */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Progress:</span>
              <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-semibold text-emerald-400">{progressPercent}%</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Learning Hub Body: Sidebar + Main Content Stage */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sidebar: Curriculum Index */}
          <div className="w-full md:w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Course Modules ({materials.length})
              </span>
              <span className="text-xs text-slate-500">
                {completedMaterialIds.size} of {materials.length} completed
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 flex-1">
              {materials.map((mat, index) => {
                const isSelected = mat.id === selectedMaterialId;
                const isCompleted = completedMaterialIds.has(mat.id);

                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setSelectedMaterialId(mat.id);
                      setCurrentSlideIndex(0);
                    }}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-slate-800/50 ${
                      isSelected ? 'bg-blue-950/40 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMaterialComplete(mat.id);
                      }}
                      className={`p-1 rounded cursor-pointer mt-0.5 transition-colors ${
                        isCompleted ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-mono text-slate-500">0{index + 1}.</span>
                        {getMaterialIcon(mat.type)}
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                          {mat.type}
                        </span>
                        {mat.isRequired && (
                          <span className="text-[10px] text-rose-400 bg-rose-950/50 px-1.5 rounded ml-auto">
                            Req
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}>
                        {mat.title}
                      </h4>
                      {mat.durationMinutes && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {mat.durationMinutes} minutes
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Completion Banner */}
            {progressPercent === 100 && (
              <div className="p-4 bg-emerald-950/40 border-t border-emerald-800/40 m-3 rounded-xl flex items-center gap-3">
                <Award className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-300">Curriculum Completed!</h5>
                  <p className="text-[11px] text-emerald-400/80">Certificate of completion recorded.</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Stage: Material Viewer (Video, PDF, PPT) */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
            
            {/* Stage Header Info */}
            <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  Active Learning Material · {activeMaterial.type.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeMaterial.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                {activeMaterial.urlOrData && (
                  <a
                    href={activeMaterial.urlOrData}
                    download={activeMaterial.fileName || 'learning-material'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Asset
                  </a>
                )}
                <button
                  onClick={() => toggleMaterialComplete(activeMaterial.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    completedMaterialIds.has(activeMaterial.id)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {completedMaterialIds.has(activeMaterial.id) ? 'Completed' : 'Mark as Done'}
                </button>
              </div>
            </div>

            {/* Viewer Component according to activeMaterial.type */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              
              {/* VIDEO PLAYER */}
              {activeMaterial.type === 'video' && (
                <div className="w-full max-w-4xl mx-auto space-y-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center group">
                    {activeMaterial.urlOrData && activeMaterial.urlOrData.startsWith('http') && !activeMaterial.urlOrData.includes('.mp4') ? (
                      <iframe
                        src={activeMaterial.urlOrData.includes('youtube') 
                          ? activeMaterial.urlOrData.replace('watch?v=', 'embed/') 
                          : activeMaterial.urlOrData}
                        title={activeMaterial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src={activeMaterial.urlOrData || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                        poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    )}
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Lecture Synopsis</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeMaterial.description || 
                        "Comprehensive instructional video addressing operational workflows, AML suspicious transaction detection, and risk management parameters."}
                    </p>
                  </div>
                </div>
              )}

              {/* PPT PRESENTATION SLIDE VIEWER */}
              {activeMaterial.type === 'ppt' && (
                <div className="w-full max-w-4xl mx-auto space-y-4">
                  {/* Presentation Canvas */}
                  <div className="aspect-16/9 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-xl border border-slate-800 shadow-2xl p-8 sm:p-12 flex flex-col justify-between relative">
                    {/* Top slide banner */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                        <Presentation className="w-4 h-4" />
                        <span>SLIDE DECK · {currentSlideIndex + 1} OF {pptSlides.length}</span>
                      </div>
                      <span className="text-xs text-slate-400">{course.code} Master Series</span>
                    </div>

                    {/* Active Slide Content */}
                    <div className="space-y-4 my-auto">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        {pptSlides[currentSlideIndex].subtitle}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {pptSlides[currentSlideIndex].title}
                      </h3>
                      
                      <ul className="space-y-3 pt-2">
                        {pptSlides[currentSlideIndex].points.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{pptSlides[currentSlideIndex].callout}</span>
                      </div>
                    </div>

                    {/* Slide Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          currentSlideIndex === 0
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-white bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous Slide
                      </button>

                      {/* Slide Indicator Dots */}
                      <div className="flex items-center gap-1.5">
                        {pptSlides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              currentSlideIndex === idx ? 'w-6 bg-amber-400' : 'bg-slate-700 hover:bg-slate-500'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        disabled={currentSlideIndex === pptSlides.length - 1}
                        onClick={() => setCurrentSlideIndex(prev => Math.min(pptSlides.length - 1, prev + 1))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          currentSlideIndex === pptSlides.length - 1
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Next Slide <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF HANDBOOK READER */}
              {(activeMaterial.type === 'pdf' || activeMaterial.type === 'doc' || activeMaterial.type === 'link') && (
                <div className="w-full max-w-4xl mx-auto space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{activeMaterial.title}</h4>
                          <p className="text-xs text-slate-400">
                            {activeMaterial.fileName || `${activeMaterial.title}.pdf`} · Compliance & Operational Reader
                          </p>
                        </div>
                      </div>

                      {activeMaterial.urlOrData && (
                        <a
                          href={activeMaterial.urlOrData}
                          download={activeMaterial.fileName || `${activeMaterial.title}.pdf`}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </a>
                      )}
                    </div>

                    {/* Structured Document Reading Sections */}
                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 max-h-[50vh] overflow-y-auto">
                      <div>
                        <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                          Section 1: Legislative Authority & Institutional Responsibility
                        </h5>
                        <p className="text-slate-400">
                          In accordance with statutory financial regulations and AML governance standards, accountable institutions 
                          must formulate and implement a Risk Management and Compliance Programme (RMCP). Every staff member is bound 
                          to scrutinize transactions and verify customer identity against authoritative national repositories.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/60">
                        <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                          Section 2: Verification of Natural Persons & 90-Day Rule
                        </h5>
                        <p className="text-slate-400">
                          Prior to establishing a business relationship or concluding any single transaction above regulatory thresholds:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                          <li>Verify full names, national identity or passport number, and nationality.</li>
                          <li>Obtain proof of residential address (municipal utility bill, tax document, or bank statement) issued within 90 days.</li>
                          <li>Establish whether the client is a Politically Exposed Person (PEP) or immediate family member of a prominent influential figure.</li>
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-800/60">
                        <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                          Section 3: Reporting Suspicious & Unusual Activities (STRs)
                        </h5>
                        <p className="text-slate-400">
                          Personnel who know or ought reasonably to have known or suspected that a transaction facilitates tax evasion, 
                          unlawful proceeds, or sanctions circumvention must lodge a Suspicious Activity Report without tipping off the customer.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                      <span>Document Version 3.4 · Authoritative L&D Edition</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready for examination & review
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Bottom Navigation */}
            <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Course: {course.title}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentIndex = materials.findIndex(m => m.id === selectedMaterialId);
                    if (currentIndex < materials.length - 1) {
                      setSelectedMaterialId(materials[currentIndex + 1].id);
                      setCurrentSlideIndex(0);
                    }
                  }}
                  disabled={materials.findIndex(m => m.id === selectedMaterialId) === materials.length - 1}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  Next Module <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
