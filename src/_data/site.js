const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const yaml = require("js-yaml");

if (!process.env.CI) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function fail(message) {
  throw new Error(`[config] ${message}`);
}

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function readSiteYaml() {
  const requested = pickString(process.env.SITE_CONFIG_FILE);
  const candidates = [requested, "site.yaml", "site.yml"].filter(Boolean);

  let configFile = "";
  for (const candidate of candidates) {
    const candidatePath = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(candidatePath)) {
      configFile = candidate;
      break;
    }
  }

  if (!configFile) {
    return {};
  }

  try {
    const configPath = path.resolve(process.cwd(), configFile);
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = yaml.load(raw);
    return asObject(parsed) || {};
  } catch (error) {
    fail(`Unable to parse ${configFile}: ${error.message}`);
  }
}

const fileConfig = readSiteYaml();
const fileSocial = asObject(fileConfig.social) || {};

function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readRequiredValue(label, ...values) {
  const value = pickString(...values);
  if (!value) {
    fail(`Missing required value: ${label}`);
  }
  return value;
}

function parseUrlField(label, value, required = false) {
  const normalized = pickString(value);
  if (!normalized) {
    if (required) {
      fail(`${label} must be a valid URL`);
    }
    return "";
  }

  try {
    return new URL(normalized).toString();
  } catch {
    fail(`${label} must be a valid URL`);
  }
}

function parseAssetOrUrlField(label, value, required = false) {
  const normalized = pickString(value);
  if (!normalized) {
    if (required) {
      fail(`${label} must be a valid URL or asset path`);
    }
    return "";
  }

  try {
    return new URL(normalized).toString();
  } catch {
    // Keep site-root absolute paths as-is.
    if (normalized.startsWith("/")) {
      return normalized;
    }

    // Map simple relative names to the passthrough static image folder.
    if (!normalized.includes("://") && !normalized.startsWith("./") && !normalized.startsWith("../")) {
      return `/assets/images/${normalized.replace(/^\/+/, "")}`;
    }

    // Preserve explicit relative paths (e.g. ./images/foo.png) for advanced use.
    return normalized;
  }
}

function parseProjectsFromEnv() {
  const raw = pickString(process.env.PROJECTS_JSON);
  if (!raw) {
    fail("Provide projects in site.yaml (projects:) or PROJECTS_JSON");
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      fail("PROJECTS_JSON must be a JSON array");
    }
    return parsed;
  } catch {
    fail("PROJECTS_JSON must be valid JSON");
  }
}

function parseProjectList(rawProjects, sourceLabel) {
  if (!Array.isArray(rawProjects)) {
    fail(`${sourceLabel} must be an array`);
  }

  return rawProjects.map((project, index) => {
    const label = `${sourceLabel}[${index}]`;

    if (!project || typeof project !== "object" || Array.isArray(project)) {
      fail(`${label} must be an object`);
    }

    const title = pickString(project.title);
    const summary = pickString(project.summary, project.description);

    if (!title) {
      fail(`${label}.title is required`);
    }

    if (!summary) {
      fail(`${label}.summary is required`);
    }

    const highlightsRaw = project.highlights;
    const highlights = Array.isArray(highlightsRaw)
      ? highlightsRaw.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (highlightsRaw !== undefined && !Array.isArray(highlightsRaw)) {
      fail(`${label}.highlights must be an array of strings`);
    }

    const linksSource = asObject(project.links) || {};
    const links = {
      repo: parseUrlField(`${label}.links.repo`, pickString(linksSource.repo, project.repo_url)),
      demo: parseUrlField(`${label}.links.demo`, pickString(linksSource.demo, project.demo_url)),
      article: parseUrlField(`${label}.links.article`, pickString(linksSource.article, project.article_url))
    };

    const thumbnailSource = asObject(project.thumbnail) || {};
    const thumbnail = {
      url: parseAssetOrUrlField(`${label}.thumbnail.url`, pickString(thumbnailSource.url, project.thumbnail_url)),
      alt: pickString(thumbnailSource.alt, project.thumbnail_alt)
    };

    if (thumbnail.url && !thumbnail.alt) {
      thumbnail.alt = `${title} thumbnail`;
    }

    const mediaSource = asObject(project.media) || {};
    const imageSource = asObject(project.image) || {};
    const mediaUrl = pickString(mediaSource.url, imageSource.url, project.image_url);
    const mediaAlt = pickString(mediaSource.alt, imageSource.alt, project.image_alt);
    const mediaType = pickString(mediaSource.type, project.media_type) || "image";
    const mediaGif = pickString(mediaSource.gif, imageSource.gif, project.gif_url);

    const normalizedMediaType = mediaType.toLowerCase();
    if (!["image", "video"].includes(normalizedMediaType)) {
      fail(`${label}.media.type must be "image" or "video"`);
    }

    const media = {
      url: parseAssetOrUrlField(`${label}.media.url`, mediaUrl),
      alt: mediaAlt,
      type: normalizedMediaType,
      gif: parseAssetOrUrlField(`${label}.media.gif`, mediaGif)
    };

    if (media.url && !media.alt) {
      media.alt = `${title} preview`;
    }

    return {
      title,
      subtitle: pickString(project.subtitle),
      summary,
      highlights,
      links,
      media,
      thumbnail
    };
  });
}

const siteName = readRequiredValue("site_name/SITE_NAME", fileConfig.site_name, process.env.SITE_NAME);
const handle = readRequiredValue("site_handle/SITE_HANDLE", fileConfig.site_handle, process.env.SITE_HANDLE);
const bio = readRequiredValue("site_bio/SITE_BIO", fileConfig.site_bio, process.env.SITE_BIO);

const githubUrl = parseUrlField(
  "social.github_url/SOCIAL_GITHUB_URL",
  pickString(fileSocial.github_url, fileSocial.github, process.env.SOCIAL_GITHUB_URL),
  true
);

const linkedinUrl = parseUrlField(
  "social.linkedin_url/SOCIAL_LINKEDIN_URL",
  pickString(fileSocial.linkedin_url, fileSocial.linkedin, process.env.SOCIAL_LINKEDIN_URL),
  true
);

const mastodonUrl = parseUrlField(
  "social.mastodon_url/SOCIAL_MASTODON_URL",
  pickString(fileSocial.mastodon_url, fileSocial.mastodon, process.env.SOCIAL_MASTODON_URL),
  true
);

const projectSource = Array.isArray(fileConfig.projects)
  ? { value: fileConfig.projects, label: "projects" }
  : { value: parseProjectsFromEnv(), label: "PROJECTS_JSON" };

const projects = parseProjectList(projectSource.value, projectSource.label);

const siteUrl = parseUrlField("site_url/SITE_URL", pickString(fileConfig.site_url, process.env.SITE_URL));
const siteTitle = pickString(fileConfig.site_title, process.env.SITE_TITLE, siteName);
const siteDescription = pickString(fileConfig.site_description, process.env.SITE_DESCRIPTION, bio);

module.exports = {
  name: siteName,
  handle,
  currentYear: new Date().getFullYear(),
  bio,
  url: siteUrl,
  title: siteTitle,
  description: siteDescription,
  socials: [
    { label: "GitHub", url: githubUrl, iconClass: "fa-brands fa-github" },
    { label: "LinkedIn", url: linkedinUrl, iconClass: "fa-brands fa-linkedin" },
    { label: "Mastodon", url: mastodonUrl, iconClass: "fa-brands fa-mastodon" }
  ],
  projects
};
