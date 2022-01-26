# theory.amsterdam: website for TCS in Amsterdam
[![Netlify Status](https://api.netlify.com/api/v1/badges/af68c57e-db12-4d28-8383-410f5b7c9981/deploy-status)](https://app.netlify.com/sites/theory-amsterdam/deploys)

This website provides an overview of the academic research in theoretical computer science (TCS) carried out at various institutions in Amsterdam.

initiated by Christian Schaffner in September 2021

built from [Wowchemy's Research Group Template](https://github.com/wowchemy/starter-hugo-research-group) for [Hugo](https://github.com/gohugoio/hugo)

## Building this website from scratch locally

1. Install [Hugo and its dependencies](https://wowchemy.com/docs/getting-started/install-hugo-extended/)

2. Clone this repo:

```bash
git clone git@github.com:theory-amsterdam/website-theory-amsterdam.git
```

3. Start Hugo server to see the site live locally at http://localhost:1313/ (or at whatever the hugo server tells you)!

```bash
cd website-theory-amsterdam
hugo server
```

4. Edit the [markdown source files](https://wowchemy.com/docs/content/writing-markdown-latex/) with ending .md in the [/content/](https://github.com/theory-amsterdam/website-theory-amsterdam/tree/main/content) subdirectory to make changes to the site. As long as the hugo server is running, your changes should be visible immediately at http://localhost:1313/.

5. Using a suitable editor like [Atom](https://atom.io/) allows to easily search across all source files, and will help finding the correct file to edit if you want to make specific changes.

6. Add new researchers by duplicating a similar subfolder in [/content/authors/](https://github.com/theory-amsterdam/website-theory-amsterdam/tree/main/content/authors) and adjusting the .md content and replacing the avatar picture.

7. When you are happy with the result, commit the changes to the master branch. The site is then automatically deployed to https://theory-amsterdam.netlify.app/ and accessible under https://theory.amsterdam .

## Troubleshooting
This [information](https://wowchemy.com/docs/hugo-tutorials/troubleshooting/) might be useful. Sometimes, you might have to [delete Hugo's default cache folder](https://wowchemy.com/docs/hugo-tutorials/troubleshooting/#error-failed-to-resolve-output-format).

For more information, try the search function on the [wowchemy website](https://wowchemy.com/).
