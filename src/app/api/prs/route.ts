import { NextRequest, NextResponse } from "next/server";

import { getInstallationOctokit } from "@/lib/githubApp";

function extractInitials(login: string | null | undefined) {
  if (!login) return "??";
  // GitHub usernames are single words, so just take first 2 characters
  const cleaned = login.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  return cleaned || "??";
}

function deriveRiskLevel(labels: string[]): "low" | "medium" | "high" {
  const normalized = labels.map((label) => label.toLowerCase());
  if (normalized.some((label) => label.includes("security") || label.includes("dependencies"))) {
    return "high";
  }
  if (normalized.some((label) => label.includes("bug"))) {
    return "low";
  }
  if (normalized.some((label) => label.includes("feature") || label.includes("enhancement"))) {
    return "medium";
  }
  return "medium";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoParam = searchParams.get("repo");

    if (!repoParam) {
      return NextResponse.json(
        { error: "Missing required repo parameter (format: owner/repo)" },
        { status: 400 }
      );
    }

    const [owner, repo] = repoParam.split("/");
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Invalid repo parameter. Expected format owner/repo" },
        { status: 400 }
      );
    }

    const octokit = await getInstallationOctokit();
    
    try {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: 50,
      });

      const mergedPRs = pulls.filter((pr) => pr.merged_at);

      const mappedPRs = mergedPRs.map((pr) => {
        const labels = (pr.labels || []).map((label) =>
          typeof label === "string" ? label : label.name ?? ""
        ).filter((label): label is string => Boolean(label));

        return {
          id: pr.number.toString(),
          number: pr.number,
          title: pr.title ?? "(untitled)",
          author: {
            name: pr.user?.login ?? "unknown",
            avatar: extractInitials(pr.user?.login ?? ""),
          },
          labels,
          mergedDate: pr.merged_at ?? new Date().toISOString(),
          repo: repoParam,
          branch: pr.base?.ref ?? "unknown",
          filesChanged: pr.changed_files ?? 0,
          riskLevel: deriveRiskLevel(labels),
        };
      });

      return NextResponse.json({ prs: mappedPRs });
    } catch (apiError: any) {
      // Handle GitHub API errors
      if (apiError.status === 404) {
        return NextResponse.json(
          { 
            error: `Repository "${repoParam}" not found or GitHub App does not have access. Please ensure the repository exists and the GitHub App has been installed with appropriate permissions.` 
          },
          { status: 404 }
        );
      }
      if (apiError.status === 403) {
        return NextResponse.json(
          { 
            error: `Access denied to repository "${repoParam}". The GitHub App may not have the required permissions.` 
          },
          { status: 403 }
        );
      }
      // Re-throw to be caught by outer catch
      throw apiError;
    }
  } catch (error: any) {
    console.error("Failed to fetch PRs:", error);
    const errorMessage = error?.message || "Failed to fetch pull requests";
    const statusCode = error?.status || 502;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
