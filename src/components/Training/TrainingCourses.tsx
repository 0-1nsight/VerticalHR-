import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  X,
  Play,
  FileText,
  Video,
  Presentation,
  FolderOpen
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { TrainingCourse } from '../../types';
import { CourseMaterialsModal } from './CourseMaterialsModal';
import { CourseLearningPlayer } from './CourseLearningPlayer';

export const TrainingCourses: React.FC = () => {
  const { trainingCourses, employees, addTrainingCourse, enrollInCourse } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [managingMaterialsCourse, setManagingMaterialsCourse] = useState<TrainingCourse | null>(null);
  const [learningPlayerCourse, setLearningPlayerCourse] = useState<TrainingCourse | null>(null);

  const [formState, setFormState] = useState({
    title: '',
    code: '',
    category: 'Compliance',
    instructor: 'Internal L&D Team',
    durationHours: 4,
    description: '',
    status: 'upcoming' as TrainingCourse['status']
  });

  const canManageCourses = user?.role === 'admin' || user?.role === 'hr_manager';
  const currentEmpId = user?.employeeId || employees[0]?.id || '1';

  const categories = ['all', ...new Set(trainingCourses.map(c => c.category))];

  const filteredCourses = trainingCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    addTrainingCourse({
      title: formState.title,
      code: formState.code,
      category: formState.category,
      instructor: formState.instructor,
      durationHours: Number(formState.durationHours),
      description: formState.description,
      status: formState.status,
      enrolledEmployeeIds: [],
      completionRate: 0
    });
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Professional Development</h1>
          <p className="text-gray-600 text-sm mt-1">Curated corporate courses, mandatory compliance modules, and upskilling programs</p>
        </div>
        {canManageCourses && (
          <button
            onClick={() => {
              setFormState({
                title: '',
                code: `TRN-${Math.floor(100 + Math.random() * 900)}`,
                category: 'Compliance',
                instructor: 'Internal L&D Team',
                durationHours: 4,
                description: '',
                status: 'upcoming'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Training Course
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search course title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 capitalize"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const isEnrolled = course.enrolledEmployeeIds.includes(currentEmpId);
          return (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-colors">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                    {course.code}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-medium capitalize ${
                    course.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    course.status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3">{course.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Instructor: {course.instructor}</p>

                <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{course.durationHours} Hours</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{course.enrolledEmployeeIds.length} Enrolled</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Cohort Completion Rate</span>
                    <span className="font-semibold text-gray-900">{course.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${course.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Materials Breakdown Badge */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{course.materials?.length || 0} Modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    {course.materials?.some(m => m.type === 'video') && (
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    )}
                    {course.materials?.some(m => m.type === 'pdf') && (
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                    {course.materials?.some(m => m.type === 'ppt') && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Presentation className="w-3 h-3" /> PPT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Player & Material Management */}
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => {
                    if (!isEnrolled) {
                      enrollInCourse(course.id, currentEmpId);
                    }
                    setLearningPlayerCourse(course);
                  }}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isEnrolled ? 'Open Learning Player & Study' : 'Enroll & Start Course'}
                </button>

                {canManageCourses && (
                  <button
                    onClick={() => setManagingMaterialsCourse(course)}
                    className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    Manage Materials (Videos, PDFs, PPTs)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Add New Training Course</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workplace Diversity & Anti-Bias Training"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lead Instructor / Team</label>
                  <input
                    type="text"
                    required
                    value={formState.instructor}
                    onChange={(e) => setFormState({ ...formState, instructor: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.durationHours}
                    onChange={(e) => setFormState({ ...formState, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Course Curriculum & Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline syllabus, key objectives, and completion criteria..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials Management Modal */}
      {managingMaterialsCourse && (
        <CourseMaterialsModal
          course={managingMaterialsCourse}
          onClose={() => setManagingMaterialsCourse(null)}
        />
      )}

      {/* Course Learning Player Modal */}
      {learningPlayerCourse && (
        <CourseLearningPlayer
          course={learningPlayerCourse}
          onClose={() => setLearningPlayerCourse(null)}
        />
      )}
    </div>
  );
};
