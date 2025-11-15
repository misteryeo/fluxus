import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { PR } from "@/types";
import {
  getTechnicalSummaryPrompt,
  getUserFacingValuePrompt,
  getWhatChangedSummaryPrompt,
  getWhyNowSummaryPrompt,
  type ToneSettings,
  type SummaryPromptInput,
} from "@/lib/aiPrompts";
import { buildContext } from "@/utils/buildContext";
import { getInstallationOctokit } from "@/lib/githubApp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface SummaryRequestBody {
  prs: PR[];
  tone: ToneSettings;
}

interface SummaryResponse {
  technicalSummary: string;
  userFacingValue: string;
  whatChanged: string;
  whyNow: string;
}

async function fetchPRDetails(prs: PR[]) {
  try {
    const octokit = await getInstallationOctokit();
    const prDetails = await Promise.all(
      prs.map(async (pr) => {
        try {
          const [owner, repo] = pr.repo.split("/");
          const { data } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: pr.number,
          });

          // Get list of files changed
          const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pr.number,
            per_page: 30, // Limit to first 30 files
          });

          return {
            number: pr.number,
            body: data.body || undefined,
            files: files.map((f) => f.filename),
          };
        } catch (error) {
          console.error(`Failed to fetch details for PR #${pr.number}:`, error);
          return {
            number: pr.number,
            body: undefined,
            files: [],
          };
        }
      })
    );

    return prDetails;
  } catch (error) {
    console.error("Failed to fetch PR details:", error);
    return [];
  }
}

async function generateField(promptFn: (input: SummaryPromptInput) => { system: string; user: string }, input: SummaryPromptInput): Promise<string> {
  try {
    const prompt = promptFn(input);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return "Not enough information";
    }

    const parsed = JSON.parse(content);
    return parsed.text || "Not enough information";
  } catch (error) {
    console.error("Failed to generate field:", error);
    return "Not enough information";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequestBody = await request.json();
    const { prs, tone } = body;

    if (!prs || !Array.isArray(prs) || prs.length === 0) {
      return NextResponse.json(
        { error: "At least one PR is required" },
        { status: 400 }
      );
    }

    // Build context from PRs
    const context = buildContext({ prs, summary: "" });

    // Fetch PR details (descriptions and file lists)
    const prDetails = await fetchPRDetails(prs);

    // Prepare input for prompts
    const promptInput: SummaryPromptInput = {
      prs,
      context,
      coreSummary: "", // We're generating this, so leave empty
      tone,
      prDetails,
    };

    // Generate all fields in parallel
    const [technicalSummary, userFacingValue, whatChanged, whyNow] = await Promise.all([
      generateField(getTechnicalSummaryPrompt, promptInput),
      generateField(getUserFacingValuePrompt, promptInput),
      generateField(getWhatChangedSummaryPrompt, promptInput),
      generateField(getWhyNowSummaryPrompt, promptInput),
    ]);

    const response: SummaryResponse = {
      technicalSummary,
      userFacingValue,
      whatChanged,
      whyNow,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to generate summary:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
