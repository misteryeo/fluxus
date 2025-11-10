import { NextRequest, NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/githubApp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerParam = searchParams.get("owner");

    if (!ownerParam) {
      return NextResponse.json(
        { error: "Missing required owner parameter (username or organization name)" },
        { status: 400 }
      );
    }

    const octokit = await getInstallationOctokit();
    
    try {
      // Fetch repositories for the user/organization
      // Using repos.listForUser for users and repos.listForOrg for organizations
      // We'll try user first, then org if it fails
      let repos: any[] = [];
      
      try {
        const { data: userRepos } = await octokit.rest.repos.listForUser({
          username: ownerParam,
          type: "all", // all, owner, member
          sort: "updated",
          direction: "desc",
          per_page: 100,
        });
        repos = userRepos;
      } catch (userError: any) {
        // If user lookup fails, try as organization
        if (userError.status === 404) {
          try {
            const { data: orgRepos } = await octokit.rest.repos.listForOrg({
              org: ownerParam,
              type: "all",
              sort: "updated",
              direction: "desc",
              per_page: 100,
            });
            repos = orgRepos;
          } catch (orgError: any) {
            if (orgError.status === 404) {
              return NextResponse.json(
                { 
                  error: `User or organization "${ownerParam}" not found or GitHub App does not have access.` 
                },
                { status: 404 }
              );
            }
            throw orgError;
          }
        } else {
          throw userError;
        }
      }

      // Map repositories to a simpler format
      const mappedRepos = repos
        .filter((repo) => !repo.archived) // Filter out archived repos
        .map((repo) => ({
          fullName: repo.full_name,
          name: repo.name,
          private: repo.private,
          description: repo.description,
          updatedAt: repo.updated_at,
          defaultBranch: repo.default_branch,
        }))
        .sort((a, b) => {
          // Sort by updated date, most recent first
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

      return NextResponse.json({ repos: mappedRepos });
    } catch (apiError: any) {
      // Handle GitHub API errors
      if (apiError.status === 404) {
        return NextResponse.json(
          { 
            error: `User or organization "${ownerParam}" not found or GitHub App does not have access.` 
          },
          { status: 404 }
        );
      }
      if (apiError.status === 403) {
        return NextResponse.json(
          { 
            error: `Access denied to repositories for "${ownerParam}". The GitHub App may not have the required permissions.` 
          },
          { status: 403 }
        );
      }
      // Re-throw to be caught by outer catch
      throw apiError;
    }
  } catch (error: any) {
    console.error("Failed to fetch repositories:", error);
    const errorMessage = error?.message || "Failed to fetch repositories";
    const statusCode = error?.status || 502;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

