# theory.amsterdam: Website for TCS in Amsterdam
[![Netlify Status](https://api.netlify.com/api/v1/badges/af68c57e-db12-4d28-8383-410f5b7c9981/deploy-status)](https://app.netlify.com/sites/theory-amsterdam/deploys)

This website provides an overview of the academic research in theoretical computer science (TCS) carried out at various institutions in Amsterdam.

Initiated by Christian Schaffner in September 2021, currently maintained by Christian Schaffner, Ulle Endriss and others.

Built with [Eleventy](https://www.11ty.dev/) and [Bootstrap 5](https://getbootstrap.com/).

## Running the site locally

1. Install [Node.js](https://nodejs.org/) (v20 or newer).

2. Clone this repo:

```bash
$ git clone git@github.com:theory-amsterdam/website-theory-amsterdam.git
$ cd website-theory-amsterdam
$ npm install
```

3. Start the dev server (serves at http://localhost:8080/ by default and live-reloads on changes):

```bash
$ npm run dev
```

4. Edit the Markdown files in [/src/](/src) to make changes. The site rebuilds automatically while the dev server is running.

5. Add a new researcher by duplicating a folder in [/src/authors/](/src/authors), editing the `index.md` frontmatter, and dropping in an `avatar.jpg` (or `.png` / `.jpeg`).

6. When you're happy with the result, commit to `main`. Netlify rebuilds and deploys automatically to https://theory-amsterdam.netlify.app/ (and https://theory.amsterdam).

To produce a one-off production build into `_site/`:

```bash
$ npm run build
```

## Updating an existing personal page

If you just want to edit a single already existing page, you can do this through the GitHub web interface by following these steps:

1. Log into https://github.com, or sign up for an account if you don't have one.
2. Navigate to the `index.md` file of the personal page you want to edit, e.g., [/src/authors/schaffner/index.md](/src/authors/schaffner/index.md).
3. Click on the "edit" icon in the upper right corner.
4. The system will warn you that you don't have write permission in the repository and that it will create a fork of the repo instead.
5. Make the edits you want in your copy of the file.
6. Click on "commit changes..." in the upper right corner.
7. Provide a sensible `commit message` like "Update index.md of Christian Schaffner" and `description` like "update job descriptions".
8. When you are happy with the proposed changes, click on `create pull request`, and again on `create pull request` to confirm.
9. Then wait until one of the maintainers of the project approves your request or provides you with more information on how to adapt your request.

In these beginner's guides, you can find some more information about [pull requests](https://www.howtogeek.com/devops/what-are-git-pull-requests-and-how-do-you-use-them/) and [how to get started with them](https://github.blog/developer-skills/github/beginners-guide-to-github-creating-a-pull-request/).

## Project layout

```
src/
  _includes/   layouts and reusable templates
  _data/       global data (e.g. avatars.js)
  assets/      CSS, media, static files passed through to the build
  authors/     one folder per researcher (index.md + avatar)
  posts/       news & job posts (one folder per post)
  contact/     contact page
  history/     history page
  institutes/  institutes page
  post/        /post/ listing page
  index.njk    homepage
eleventy.config.js
netlify.toml
```
