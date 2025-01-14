# theory.amsterdam: Website for TCS in Amsterdam
[![Netlify Status](https://api.netlify.com/api/v1/badges/af68c57e-db12-4d28-8383-410f5b7c9981/deploy-status)](https://app.netlify.com/sites/theory-amsterdam/deploys)

This website provides an overview of the academic research in theoretical computer science (TCS) carried out at various institutions in Amsterdam.

Initiated by Christian Schaffner in September 2021, currently maintained by Christian Schaffner, Ulle Endriss and others.

Built from [Wowchemy's Research Group Template](https://github.com/wowchemy/starter-hugo-research-group) for [Hugo](https://github.com/gohugoio/hugo).

## Building this website from scratch locally

### On Mac/Linux

1. Install [Hugo and its dependencies](https://wowchemy.com/docs/getting-started/install-hugo-extended/).

2. Clone this repo:

```bash
$ git clone git@github.com:theory-amsterdam/website-theory-amsterdam.git
```

3. Start the Hugo server to see the site live locally at http://localhost:1313/ (or at whatever the Hugo server tells you):

```bash
$ cd website-theory-amsterdam
$ hugo server
```

4. Edit the [Markdown source files](https://wowchemy.com/docs/content/writing-markdown-latex/) with the `.md` extension in the [/content/](/content) subdirectory to make changes to the site. As long as the Hugo server is running, your changes should be visible immediately at http://localhost:1313/.

5. Using a suitable editor like [Visual Studio Code](https://code.visualstudio.com/) allows you to easily search across all source files and will help find the correct file to edit if you want to make specific changes.

6. Add new researchers by duplicating a similar subfolder in [/content/authors/](/content/authors) and adjusting the `.md` content and replacing the avatar picture.

7. When you are happy with the result, commit the changes to the master branch. The site is then automatically deployed to https://theory-amsterdam.netlify.app/ and accessible under https://theory.amsterdam.

### On Windows

1. Install:
   - [GitHub Desktop](https://desktop.github.com/)
   - [Visual Studio Code](https://code.visualstudio.com/)
   - [Hugo and its dependencies](https://wowchemy.com/docs/getting-started/install-hugo-extended/#windows), including PowerShell and Scoop.
   - [Go](https://go.dev/doc/install)

## Updating an existing personal page

If you just want to edit a single already existing page, you can do this through the GitHub web interface by following these steps:

1. Log into https://github.com, or sign up for an account if you don't have one.
2. Navigate to the `_index.md` file of the personal page you want to edit, e.g., [/content/authors/schaffner/_index.md](/content/authors/schaffner/_index.md).
3. Click on the "edit" icon in the upper right corner.
4. The system will warn you that you don't have write permission in the repository and that it will create a fork of the repo instead.
5. Make the edits you want in your copy of the file.
6. Click on "commit changes..." in the upper right corner.
7. Provide a sensible `commit message` like "Update _index.html of Christian Schaffner" and `description` like "update job descriptions".
8. When you are happy with the proposed changes, click on `create pull request`, and again on `create pull request` to confirm.
9. Then wait until one of the maintainers of the project approves your request or provides you with more information on how to adapt your request.

In these beginner's guides, you can find some more information about [pull requests](https://www.howtogeek.com/devops/what-are-git-pull-requests-and-how-do-you-use-them/) and [how to get started with them](https://github.blog/developer-skills/github/beginners-guide-to-github-creating-a-pull-request/).


## Troubleshooting

This [information](https://wowchemy.com/docs/hugo-tutorials/troubleshooting/) might be useful. Sometimes, you might have to [delete Hugo's default cache folder](https://wowchemy.com/docs/hugo-tutorials/troubleshooting/#error-failed-to-resolve-output-format).

For more information, try the search function on the [Wowchemy website](https://wowchemy.com/).
