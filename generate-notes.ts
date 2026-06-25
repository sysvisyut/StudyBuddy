import { db } from './configs/db';
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from './configs/schema';
import { generateNotesAiModel } from './configs/AiModel';
import { eq } from 'drizzle-orm';

async function generate() {
  const courses = await db.select().from(STUDY_MATERIAL_TABLE);
  if (courses.length === 0) {
    console.log('No courses found.');
    return process.exit(0);
  }
  const course = courses[0];
  const chapters = (course.courseLayout as any)?.chapters || [];
  console.log('Generating notes for', chapters.length, 'chapters...');

  for (let index = 0; index < chapters.length; index++) {
    const chapter = chapters[index];
    console.log('Generating chapter', index + 1, '...');
    const PROMPT = `Generate exam material detail content for each chapter, make sure to include all topic point in the content, make sure to give content in HTML format (Do not add HTML, head, body, title tag). The chapter: ${JSON.stringify(chapter)}`;
    try {
      const result = await generateNotesAiModel.sendMessage(PROMPT);
      const aiResp = result.response.text();
      await db.insert(CHAPTER_NOTES_TABLE).values({
        chapterId: index,
        courseId: course.courseId,
        notes: aiResp,
      });
      console.log('Saved chapter', index + 1);
    } catch (err) {
      console.error('Error generating chapter', index + 1, (err as any).message);
    }
  }
  
  await db.update(STUDY_MATERIAL_TABLE).set({ status: 'Ready' }).where(eq(STUDY_MATERIAL_TABLE.courseId, course.courseId));
  console.log('Done!');
  process.exit(0);
}
generate();
