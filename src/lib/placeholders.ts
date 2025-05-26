
import type { Profile, MentorshipRequest, DiscussionThread, Comment } from "@/types";

// All placeholder arrays have been removed to ensure data comes from Firestore.
// You can re-add mock data generators here for testing if needed,
// but they should not be imported by live application pages.

// Example of how you might keep a mock student/alumni for MOCK_CURRENT_USER_ID if needed,
// but for a fully DB driven app, even these would ideally be actual DB entries.
// For now, we assume profileService.getProfile(MOCK_CURRENT_USER_ID) is the source of truth.

export const MOCK_USER_STUDENT_FOR_TESTING_ID = "student123_dev_profile";
export const MOCK_USER_ALUMNI_FOR_TESTING_ID = "alumni456_dev_profile";

// Ensure these are not used directly in components that should fetch live data.
// These are just conceptual placeholders for what IDs might be used in mock constants.
