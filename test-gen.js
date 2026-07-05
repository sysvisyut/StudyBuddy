const axios = require('axios');
(async () => {
  try {
    console.log('Sending request...');
    const res = await axios.post('http://localhost:3000/api/study-type-content', {
      courseId: "test-course-id-123",
      type: "flashcard",
      topic: "Javascript Basics"
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
})();
