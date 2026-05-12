import api from './api.js';

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getBySlug: (slug) => api.get(`/courses/${slug}`),
  getFeatured: () => api.get('/courses/featured'),
  getMyCourses: () => api.get('/courses/instructor/my-courses'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  updateStatus: (id, status) => api.patch(`/courses/${id}/status`, { status }),
  getStudents: (id) => api.get(`/courses/${id}/students`),

  getSections: (courseId) => api.get(`/sections/course/${courseId}`),
  createSection: (courseId, data) => api.post(`/sections/course/${courseId}`, data),
  updateSection: (id, data) => api.put(`/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/sections/${id}`),
  reorderSections: (courseId, order) => api.put(`/sections/course/${courseId}/reorder`, { order }),

  createLesson: (data) => api.post('/lessons', data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  getLesson: (id) => api.get(`/lessons/${id}`),
  reorderLessons: (order) => api.put('/lessons/reorder', { order }),
  addResource: (data) => api.post('/lessons/resources', data),
};

export const enrollmentService = {
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  getMyEnrollments: () => api.get('/enrollments/my'),
  updateProgress: (data) => api.post('/enrollments/progress', data),
  getCourseProgress: (courseId) => api.get(`/enrollments/progress/${courseId}`),
};

export const reviewService = {
  getCourseReviews: (courseId, params) => api.get(`/reviews/course/${courseId}`, { params }),
  addReview: (data) => api.post('/reviews', data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const wishlistService = {
  get: () => api.get('/wishlist'),
  add: (courseId) => api.post('/wishlist', { courseId }),
  remove: (courseId) => api.delete(`/wishlist/${courseId}`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const uploadService = {
  uploadVideo: (file, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
};

export const quizService = {
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  get: (id) => api.get(`/quizzes/${id}`),
  getByLesson: (lessonId) => api.get(`/quizzes/lesson/${lessonId}`),
  addQuestion: (data) => api.post('/quizzes/questions', data),
  updateQuestion: (id, data) => api.put(`/quizzes/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/quizzes/questions/${id}`),
  submit: (data) => api.post('/quizzes/submit', data),
  getResults: (quizId) => api.get(`/quizzes/${quizId}/results`),
};

export const discussionService = {
  get: (lessonId) => api.get(`/discussions/lesson/${lessonId}`),
  create: (data) => api.post('/discussions', data),
  delete: (id) => api.delete(`/discussions/${id}`),
  pin: (id) => api.patch(`/discussions/${id}/pin`),
};

export const noteService = {
  get: (courseId) => api.get(`/notes/course/${courseId}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getCourses: (params) => api.get('/admin/courses', { params }),
  approveCourse: (id, status) => api.patch(`/admin/courses/${id}/approve`, { status }),
  getRevenue: () => api.get('/admin/revenue'),
  getInstructorAnalytics: () => api.get('/admin/instructor/analytics'),
};

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const certificateService = {
  getMy: () => api.get('/certificates/my'),
  get: (id) => api.get(`/certificates/${id}`),
};
