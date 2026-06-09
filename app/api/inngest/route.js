import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { CreateNewUser } from "../../../inngest/functions";

// Inngest is kept for user-creation events only.
// Note generation is now handled directly in /api/generate-course-outline
export const { GET, POST, PUT } = serve(inngest, [
    CreateNewUser,
]);