# Editing your profile

Your card on the [team page](https://dataroadmap.github.io/Monogram16-site/team.html) comes
from one file: `data/team.json`. You change your own entry and send it to us as a
**pull request** — the same workflow used on every software team.

Nobody can break anyone else's card, and your change goes live as soon as it is merged.

---

## What your entry looks like

```json
{
  "slug": "your-name",
  "name": "Your Name",
  "role": "Student · Monogram 16",
  "bio": "One or two sentences. What you worked on, what you are interested in.",
  "focus": ["SQL", "Dashboards"],
  "email": "you@example.com",
  "linkedin": "https://www.linkedin.com/in/your-profile/",
  "github": "your-github-username",
  "project": "https://github.com/your-github-username/MarketLens",
  "photo": "assets/team/your-name.jpg"
}
```

Every field is optional except `name` and `role`. Leave a field as `""` and that
link simply doesn't appear. With no `photo`, your initials are shown in a circle —
which looks fine, so don't feel obliged.

---

## Doing it on github.com (no git needed)

1. Open `data/team.json` in the repository.
2. Click the **pencil** icon (top right of the file).
3. Find your entry and edit it. Keep the commas and quotation marks exactly as they are.
4. Scroll down, choose **Create a new branch for this commit**, and click **Propose changes**.
5. Click **Create pull request**.

That's it. You'll get a notification when it's merged.

## Doing it with git on your computer

```bash
git clone https://github.com/dataroadmap/Monogram16-site.git
cd Monogram16-site
git checkout -b profile-your-name

# edit data/team.json, and copy your photo into assets/team/

git add .
git commit -m "Add my profile"
git push -u origin profile-your-name
```

Then open the repository on github.com and click **Compare & pull request**.

---

## Adding a photo

- Put it in `assets/team/` and name it after yourself: `your-name.jpg`
- Square works best — around 400×400 pixels
- Keep it under 200 KB; a huge photo makes the page slow for everyone
- Set `"photo": "assets/team/your-name.jpg"` in your entry

## Before you open the pull request

- [ ] The file is still valid JSON — commas between entries, none after the last one
- [ ] You changed **only your own entry**
- [ ] Your LinkedIn link is the full address, starting with `https://`
- [ ] Your email is one you're happy to have on a public page

If something looks wrong after merging, open an issue — or just send another
pull request.
