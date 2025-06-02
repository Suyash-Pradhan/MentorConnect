
'use server';

/**
 * @fileOverview An AI chatbot for answering student FAQs about the Alumni-Student Interaction Platform.
 * It can use tools to fetch live data summaries to provide better guidance.
 *
 * - answerFAQ - A function that answers student FAQs.
 * - AnswerFAQInput - The input type for the answerFAQ function.
 * - AnswerFAQOutput - The return type for the answerFAQ function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getDistinctAlumniIndustries } from '@/services/profileService';
import { getDistinctPostCategories } from '@/services/postService';
import { getDiscussionThreadTitles } from '@/services/discussionService';

const AnswerFAQInputSchema = z.object({
  question: z.string().describe('The question from the student.'),
});
export type AnswerFAQInput = z.infer<typeof AnswerFAQInputSchema>;

const AnswerFAQOutputSchema = z.object({
  answer: z.string().describe('The answer to the student question.'),
});
export type AnswerFAQOutput = z.infer<typeof AnswerFAQOutputSchema>;

// Tool: Get Alumni Industries List
const AlumniIndustriesOutputSchema = z.object({
  industries: z.array(z.string()).describe("A list of distinct industries alumni are in.")
});
const getAlumniIndustriesListTool = ai.defineTool(
  {
    name: 'getAlumniIndustriesList',
    description: 'Fetches a list of distinct industries represented by alumni on the platform. Use this if a user asks what kind of industries alumni are in, or about alumni expertise in general.',
    outputSchema: AlumniIndustriesOutputSchema,
  },
  async () => {
    const industries = await getDistinctAlumniIndustries();
    return { industries };
  }
);

// Tool: Get Post Categories List
const PostCategoriesOutputSchema = z.object({
  categories: z.array(z.string()).describe("A list of distinct categories for posts made by alumni.")
});
const getPostCategoriesListTool = ai.defineTool(
  {
    name: 'getPostCategoriesList',
    description: 'Fetches a list of distinct categories for posts made by alumni. Use this if a user asks what kind of topics or opportunities alumni post about.',
    outputSchema: PostCategoriesOutputSchema,
  },
  async () => {
    const categories = await getDistinctPostCategories();
    return { categories };
  }
);

// Tool: Get Discussion Topics Summary
const DiscussionTopicsOutputSchema = z.object({
  recentTopics: z.array(z.string()).describe("A list of titles from recent discussion threads.")
});
const getDiscussionTopicsSummaryTool = ai.defineTool(
  {
    name: 'getDiscussionTopicsSummary',
    description: 'Provides a few examples of recent discussion thread titles to give an idea of what topics are being discussed. Use this if a user asks what people are talking about in the discussions section.',
    outputSchema: DiscussionTopicsOutputSchema,
  },
  async () => {
    const titles = await getDiscussionThreadTitles({ limit: 5 });
    return { recentTopics: titles };
  }
);


export async function answerFAQ(input: AnswerFAQInput): Promise<AnswerFAQOutput> {
  return answerFAQFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerFAQPrompt',
  input: {schema: AnswerFAQInputSchema},
  output: {schema: AnswerFAQOutputSchema},
  tools: [getAlumniIndustriesListTool, getPostCategoriesListTool, getDiscussionTopicsSummaryTool],
  prompt: `You are "MentorBot", a friendly and knowledgeable AI assistant for the MentorConnect platform. MentorConnect is designed to bridge the gap between students and experienced alumni for mentorship, guidance, and career opportunities.

Your main goal is to help users understand and effectively use the platform's features. These include:
- **Role Selection:** Users choose between Student or Alumni roles upon first login.
- **Profile Management:** Users can create and update their profiles. Students can list academic interests, college, year, and goals. Alumni can list their job title, company, skills, experience years, education, industry, and LinkedIn profile.
- **Alumni Directory:** Students can search and filter a directory of alumni profiles to find potential mentors based on skills, industry, company, etc.
- **Mentorship Requests:** Students can send mentorship requests to alumni. Alumni receive these requests and can accept (which can initiate a chat), reject, or message the student.
- **Posts & Opportunities:** Alumni can create posts to share job openings, guidance, or success stories. These posts can include images, videos, and external links. Students and other alumni can view and comment on these posts.
- **Discussions:** Alumni can create discussion threads on various topics. Both students and alumni can participate by commenting on these threads.
- **Direct Chat:** Direct messaging is available for accepted mentorships and other interactions facilitated by the platform.
- **AI Chatbot (You!):** You are here to answer questions about the platform.
- **Help & Support Page:** A dedicated page with common FAQs and contact information.

To help you guide the user effectively, you have access to the following tools:
- \`getAlumniIndustriesList\`: Call this tool if the user asks about the range of industries alumni are in or wants to know about general alumni expertise.
- \`getPostCategoriesList\`: Call this tool if the user asks about the types of content alumni post (e.g., types of jobs, guidance topics).
- \`getDiscussionTopicsSummary\`: Call this tool if the user asks what topics are discussed on the platform.

When answering:
- If the question is about how to perform an action (e.g., "How do I update my profile?"), explain the steps clearly.
- If the question is about general platform capabilities (e.g., "What can alumni do here?"), describe the relevant features.
- If the question implies interest in specific content (e.g., "What kind of jobs are posted?", "What industries are alumni from?", "What are people talking about?"), consider using your tools.
  - **Crucially, when incorporating lists from tools (like industries, categories, or topics) into your answer, you MUST format them as part of the single text string for the 'answer' field.** For example, you might say "People are talking about topics such as: - Topic A - Topic B - Topic C." or "Alumni post about: Technical roles, Internships, and Career advice."
  - After presenting the information from the tool, guide the user to the appropriate section of the platform (e.g., Posts page, Alumni Directory, Discussions page).
- You can also offer tips on how to make the most of MentorConnect, such as advice on writing a good mentorship request, what information is useful in a profile for better matching, or how to engage in discussions effectively.
- Be specific about which user role (student or alumni) can perform certain actions if relevant (e.g., only alumni can create posts).

Remember, your primary function is to assist with platform-related queries. Politely decline to answer questions that are off-topic or unrelated to the MentorConnect platform and its use.
If a tool returns empty data (e.g., no industries found), inform the user gracefully (e.g., "Currently, no specific industries are listed, but you can browse all alumni in the directory.").
Do not invent information if the tools don't provide it. Instead, guide the user to where they might find it on the platform or suggest rephrasing.

**VERY IMPORTANT OUTPUT REQUIREMENT:**
Your entire response MUST be a single, valid JSON object that strictly adheres to the output schema: \`{"answer": "Your complete textual response goes here."}\`.
- Do NOT include any text, markdown characters (like \`+\`, \`-\` for lists, or \`###\` for headers), or explanations *outside* of this JSON object's string value for the "answer" field.
- If you need to present a list, format it naturally within the text of the "answer" string. For example: "Based on recent activity, discussions include topics like: - Career Advice - Networking Tips - Industry Trends." (This entire sentence, including the list, is the value of the "answer" field).
- Do not add any introductory or concluding remarks outside the JSON structure. Just the JSON.

User's question: {{{question}}}`,
});

const answerFAQFlow = ai.defineFlow(
  {
    name: 'answerFAQFlow',
    inputSchema: AnswerFAQInputSchema,
    outputSchema: AnswerFAQOutputSchema,
  },
  async (input): Promise<AnswerFAQOutput> => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        console.error('answerFAQFlow: AI model did not return an output.');
        return { answer: "I'm sorry, I couldn't come up with a response. Please try rephrasing your question." };
      }
      // Basic check for common non-JSON starts, though model should adhere.
      const textOutput = JSON.stringify(output); // Ensure we are dealing with the string representation
      if (textOutput.startsWith('"') && textOutput.endsWith('"')) {
         // This might happen if the model *only* returns the string content, not the full JSON.
         // Attempt to re-wrap it. This is a fallback.
         try {
            const parsedAnswer = JSON.parse(textOutput).answer; // If it's already {"answer": "..."} but stringified
            return { answer: parsedAnswer || "Could not parse AI's response." };
         } catch {
            // If the above fails, it might be the model just outputting the string value for 'answer'
            try {
                const innerContent = JSON.parse(textOutput); // textOutput is "string_value_for_answer"
                return { answer: innerContent };
            } catch (e) {
                 console.error("Error parsing a stringified-string response from AI", e);
                 return { answer: "I received a response, but it was not in the expected format. Please try again."};
            }
         }
      }
      return output; // Assuming it's correctly { answer: "..." }
    } catch (error: any) {
      console.error('Error executing answerFAQPrompt in flow:', error);
      let userMessage = "I'm currently having trouble connecting to the AI service. Please try again in a few moments.";
      if (error.message && (error.message.includes('Service Unavailable') || error.message.includes('overloaded'))) {
        userMessage = "The AI service is currently experiencing high demand. Please try your question again in a little while.";
      } else if (error.message && error.message.includes('API key not valid')) {
        userMessage = "There seems to be an issue with the AI service configuration. Please notify support.";
      } else if (error.message && error.message.toLowerCase().includes('json')) { // Catch JSON parsing errors explicitly
        userMessage = `I encountered an issue processing the AI's response format. You could try rephrasing. (Details: ${error.message.substring(0,100)})`;
      } else if (error.message) {
        userMessage = `I encountered an issue while processing your request. You could try rephrasing or ask about something else. (Details: ${error.message.substring(0,100)})`;
      }
      return { answer: userMessage };
    }
  }
);

