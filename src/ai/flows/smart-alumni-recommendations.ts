
'use server';

/**
 * @fileOverview AI flow to provide smart alumni recommendations to students based on their interests.
 *
 * - getSmartAlumniRecommendations - A function that returns a list of recommended alumni.
 * - SmartAlumniRecommendationsInput - The input type for the getSmartAlumniRecommendations function.
 * - SmartAlumniRecommendationsOutput - The return type for the getSmartAlumniRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartAlumniRecommendationsInputSchema = z.object({
  studentInterests: z
    .string()
    .describe('A comma separated list of the students interests.'),
  studentGoals: z.string().describe('The students goals.'),
  studentAcademicInfo: z.string().describe('The students academic information.'),
  alumniProfiles: z.string().describe('A list of available alumni profiles.'),
});
export type SmartAlumniRecommendationsInput = z.infer<
  typeof SmartAlumniRecommendationsInputSchema
>;

const SmartAlumniRecommendationsOutputSchema = z.object({
  recommendedAlumni: z
    .string()
    .describe('A comma separated list of recommended alumni.'),
});
export type SmartAlumniRecommendationsOutput = z.infer<
  typeof SmartAlumniRecommendationsOutputSchema
>;

export async function getSmartAlumniRecommendations(
  input: SmartAlumniRecommendationsInput
): Promise<SmartAlumniRecommendationsOutput> {
  return smartAlumniRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartAlumniRecommendationsPrompt',
  input: {schema: SmartAlumniRecommendationsInputSchema},
  output: {schema: SmartAlumniRecommendationsOutputSchema},
  prompt: `You are an AI assistant designed to provide smart alumni recommendations to students.

  Given the following information about a student:
  - Interests: {{{studentInterests}}}
  - Goals: {{{studentGoals}}}
  - Academic Info: {{{studentAcademicInfo}}}

  And the following list of alumni profiles:
  {{{alumniProfiles}}}

  Recommend a list of alumni that would be a good fit for the student to connect with for mentorship.

  Return a comma separated list of the recommended alumni.
  `,
});

const smartAlumniRecommendationsFlow = ai.defineFlow(
  {
    name: 'smartAlumniRecommendationsFlow',
    inputSchema: SmartAlumniRecommendationsInputSchema,
    outputSchema: SmartAlumniRecommendationsOutputSchema,
  },
  async (input): Promise<SmartAlumniRecommendationsOutput> => {
    try {
      const response = await prompt(input);
      const output = response.output;

      if (!output || typeof output.recommendedAlumni !== 'string') {
        console.error('SmartAlumniRecommendationsFlow: LLM did not return valid output or recommendedAlumni string.', { responseDetails: response });
        // Return a default value that matches SmartAlumniRecommendationsOutputSchema
        // This prevents a crash if the LLM fails to produce structured output
        return { recommendedAlumni: "" };
      }
      return output;
    } catch (e: any) {
      console.error("Error executing smartAlumniRecommendationsPrompt in flow:", e);
      // Return a default or error-indicating output that matches the schema
      // This helps the client side identify there was an issue.
      return { recommendedAlumni: "Error: Could not fetch recommendations from AI." };
    }
  }
);

