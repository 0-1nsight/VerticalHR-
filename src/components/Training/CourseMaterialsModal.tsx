import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Video, 
  FileText, 
  Presentation, 
  Link as LinkIcon, 
  Trash2, 
  Upload, 
  CheckCircle, 
  Clock, 
  FileCode,
  AlertCircle
} from 'lucide-react';
import { TrainingCourse, CourseMaterial } from '../../types';
import { useData } from '../../contexts/DataContext';

interface CourseMaterialsModalProps {
  course: TrainingCourse;
  onClose: () => void;
}

export const CourseMaterialsModal: React.FC<CourseMaterialsModalProps> = ({ course, onClose }) => {
  const { addCourseMaterial, deleteCourseMaterial } = useData();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'video' as CourseMaterial['type'],
    urlOrData: '',
    fileName: '',
    description: '',
    durationMinutes: 15,
    fileSize: '4.2 MB',
    isRequired: true
  });
  const [formError, setFormError] = useState('');

  const materials = course.materials || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setFormError('Uploaded file cannot exceed 25MB.');
      return;
    }
    setFormError('');

    const sizeFormatted = file.size < 1024 * 1024 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // Detect file type
    let autoType: CourseMaterial['type'] = 'pdf';
    if (file.type.includes('video') || file.name.endsWith('.mp4')) autoType = 'video';
    else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) autoType = 'ppt';
    else if (file.type.includes('pdf')) autoType = 'pdf';
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) autoType = 'doc';

    const reader = new FileReader();
    reader.onload = () => {
      setMaterialForm(prev => ({
        ...prev,
        fileName: file.name,
        type: autoType,
        fileSize: sizeFormatted,
        urlOrData: reader.result as string,
        title: prev.title.trim() === '' ? file.name.replace(/\.[^/.]+$/, '') : prev.title
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.urlOrData && !materialForm.fileName) {
      setFormError('Please provide a file or streaming video URL.');
      return;
    }

    addCourseMaterial(course.id, {
      title: materialForm.title,
      type: materialForm.type,
      urlOrData: materialForm.urlOrData,
      fileName: materialForm.fileName || `${materialForm.title}.${materialForm.type === 'video' ? 'mp4' : materialForm.type}`,
      description: materialForm.description,
      durationMinutes: Number(materialForm.durationMinutes) || 15,
      fileSize: materialForm.fileSize || '3.5 MB',
      isRequired: materialForm.isRequired
    });

    // Reset & switch to list
    setMaterialForm({
      title: '',
      type: 'video',
      urlOrData: '',
      fileName: '',
      description: '',
      durationMinutes: 15,
      fileSize: '4.2 MB',
      isRequired: true
    });
    setFormError('');
    setActiveTab('list');
  };

  const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-rose-600" />;
      case 'pdf': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'ppt': return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'doc': return <FileCode className="w-5 h-5 text-emerald-600" />;
      default: return <LinkIcon className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{course.code}</span>
            <h3 className="text-base font-semibold text-white">Course Materials Management</h3>
            <p className="text-xs text-slate-300 mt-0.5">{course.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Curriculum Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Add New Material (Video, PDF, PPT)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              {materials.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <Presentation className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-gray-700">No Course Materials Uploaded Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Upload video lectures, PDF compliance handbooks, or PPT slide decks for employees to study.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Material Now
                  </button>
                </div>
              ) : (
                materials.map((mat, idx) => (
                  <div 
                    key={mat.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-blue-200 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
                        {getMaterialIcon(mat.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-gray-900">{mat.title}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {mat.type}
                          </span>
                          {mat.isRequired && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {mat.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{mat.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                          {mat.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {mat.durationMinutes} mins
                            </span>
                          )}
                          {mat.fileSize && <span>· {mat.fileSize}</span>}
                          <span>· Added {new Date(mat.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCourseMaterial(course.id, mat.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Remove Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleAddMaterial} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Material Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Material Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'video', label: 'Video Lecture', icon: <Video className="w-4 h-4 text-rose-600" /> },
                    { type: 'pdf', label: 'PDF Handbook', icon: <FileText className="w-4 h-4 text-blue-600" /> },
                    { type: 'ppt', label: 'PPT Slide Deck', icon: <Presentation className="w-4 h-4 text-amber-600" /> },
                    { type: 'link', label: 'Web / External Link', icon: <LinkIcon className="w-4 h-4 text-indigo-600" /> }
                  ].map(option => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setMaterialForm({ ...materialForm, type: option.type as CourseMaterial['type'] })}
                      className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                        materialForm.type === option.type
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-semibold shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: AML Red Flags & Sanctions Identification"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload file or enter URL */}
              {materialForm.type === 'link' || materialForm.type === 'video' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {materialForm.type === 'video' ? 'Video Stream URL or MP4 Link' : 'External Resource URL'} *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/lecture.mp4 or https://www.youtube.com/watch?v=..."
                    value={materialForm.urlOrData}
                    onChange={(e) => setMaterialForm({ ...materialForm, urlOrData: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Or you can also upload a local MP4 file below.</span>
                </div>
              ) : null}

              {/* File Dropzone for PDF, PPT, Doc, or video */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload File (PDF document, PowerPoint slides, or video)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 bg-gray-50 transition-colors">
                  <input
                    type="file"
                    id="materialFile"
                    onChange={handleFileUpload}
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4"
                    className="hidden"
                  />
                  <label htmlFor="materialFile" className="cursor-pointer block">
                    {materialForm.fileName ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-7 h-7 text-emerald-600 mb-1" />
                        <span className="text-xs font-semibold text-gray-900">{materialForm.fileName}</span>
                        <span className="text-[11px] text-gray-500">{materialForm.fileSize}</span>
                        <span className="text-[11px] text-blue-600 underline mt-1">Change file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-800">Browse PDF, PPT, or MP4 file</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">Up to 25MB</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Duration and Required */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Study Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={materialForm.durationMinutes}
                    onChange={(e) => setMaterialForm({ ...materialForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={materialForm.isRequired}
                      onChange={(e) => setMaterialForm({ ...materialForm, isRequired: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">Mandatory for Course Completion</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Material Summary / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered in this module..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Material to Course
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
