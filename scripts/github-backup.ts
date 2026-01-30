// GitHub Backup Script - Uses Replit GitHub Integration
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function main() {
  const repoName = process.argv[2] || 'coretech-stack-alignment-tool';
  
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Check if repo exists
  let repo;
  try {
    const { data } = await octokit.repos.get({
      owner: user.login,
      repo: repoName,
    });
    repo = data;
    console.log(`Repository "${repoName}" already exists.`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Creating repository "${repoName}"...`);
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'CoreTech Stack Alignment Tool - MSP software stack tracking and gap analysis',
        private: false,
        auto_init: false,
      });
      repo = data;
      console.log(`Repository created: ${repo.html_url}`);
    } else {
      throw error;
    }
  }
  
  console.log(`\nRepository URL: ${repo.html_url}`);
  console.log(`\nTo push your code, run these commands in your terminal:`);
  console.log(`\n  git remote add origin ${repo.clone_url}`);
  console.log(`  git push -u origin main`);
  console.log(`\nOr if origin already exists:`);
  console.log(`  git remote set-url origin ${repo.clone_url}`);
  console.log(`  git push -u origin main`);
}

main().catch(console.error);
