import { db } from "@/configs/db";
import { STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE, USER_TABLE } from "@/configs/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
        // Fetch user basic info
        const userRows = await db.select().from(USER_TABLE).where(eq(USER_TABLE.email, email));
        const user = userRows[0] || null;

        // Fetch user's courses
        const courses = await db.select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.createdBy, email));
        
        // Fetch study type contents for these courses
        let content = [];
        if (courses.length > 0) {
            const courseIds = courses.map(c => c.courseId);
            content = await db.select()
                .from(STUDY_TYPE_CONTENT_TABLE)
                .where(inArray(STUDY_TYPE_CONTENT_TABLE.courseId, courseIds));
        }

        // Aggregate activities by Date
        const activityMap = {};

        // Backfill the last 180 days (approx 6 months) with empty data
        const today = new Date();
        for (let i = 180; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            activityMap[dateStr] = { count: 0, activities: [] };
        }

        const addActivity = (date, activity) => {
            if (!date) return;
            // Parse date to a string format like "2023-10-25" (YYYY-MM-DD)
            const dateStr = format(new Date(date), 'yyyy-MM-dd');
            if (activityMap[dateStr]) {
                activityMap[dateStr].count += 1;
                activityMap[dateStr].activities.push(activity);
            } else {
                // Just in case it's older than 365 days, we can still track it (ActivityCalendar will auto-expand to include it)
                activityMap[dateStr] = { count: 1, activities: [activity] };
            }
        };

        courses.forEach(course => {
            addActivity(course.createdAt, {
                type: 'course',
                title: `Generated course: ${course.topic}`,
                timestamp: course.createdAt
            });
        });

        content.forEach(item => {
            if (item.status === 'Ready') {
                const topic = courses.find(c => c.courseId === item.courseId)?.topic || 'Unknown Course';
                addActivity(item.createdAt, {
                    type: item.type.toLowerCase(),
                    title: `Generated ${item.type} for ${topic}`,
                    timestamp: item.createdAt
                });
            }
        });

        // Format for calendar: [{ date: '2023-01-01', count: 1, level: 1 }, ...]
        let activityData = Object.keys(activityMap).map(date => {
            const entry = activityMap[date];
            // Cap visual level between 1 and 4 based on density
            const level = Math.min(4, Math.max(1, Math.ceil(entry.count / 2))); 
            return {
                date,
                count: entry.count,
                level: level,
                activities: entry.activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            };
        });

        // The Activity Calendar fails if there is no data at all or only one point in time. 
        // We ensure there's at least a baseline range ending today.
        if (activityData.length === 0) {
            activityData = [{
                date: format(new Date(), 'yyyy-MM-dd'),
                count: 0,
                level: 0,
                activities: []
            }];
        }

        // Sort chronologically for the calendar component
        activityData = activityData.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Get recent activities (top 5 overall)
        const recentActivities = activityData
            .flatMap(d => d.activities)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        return NextResponse.json({
            user,
            stats: {
                totalCourses: courses.length,
                quizzesCompleted: content.filter(c => c.type.toLowerCase() === 'quiz' && c.status === 'Ready').length,
                flashcardsMastered: content.filter(c => c.type.toLowerCase() === 'flashcard' && c.status === 'Ready').length,
            },
            activityData,
            recentActivities
        });

    } catch (error) {
        console.error("[Profile API Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
