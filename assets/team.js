// Builds the team page from data/team.json.
// Everything is written with textContent, so a name or bio can never inject HTML.
"use strict";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkRow(person) {
  const row = el("div", "person-links");

  if (person.linkedin) {
    const a = el("a", "person-link", "LinkedIn");
    a.href = person.linkedin;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    row.append(a);
  }
  if (person.github) {
    const a = el("a", "person-link", "GitHub");
    a.href = "https://github.com/" + person.github;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    row.append(a);
  }
  if (person.email) {
    const a = el("a", "person-link", "Email");
    a.href = "mailto:" + person.email;
    row.append(a);
  }
  if (person.project) {
    const a = el("a", "person-link", "Their project");
    a.href = person.project;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    row.append(a);
  }
  return row;
}

function card(person) {
  const wrap = el("div", "person");

  const top = el("div", "person-top");
  if (person.photo) {
    const img = document.createElement("img");
    img.className = "avatar";
    img.src = person.photo;
    img.alt = person.name;
    img.loading = "lazy";
    top.append(img);
  } else {
    top.append(el("div", "avatar initials", initials(person.name)));
  }

  const who = el("div");
  who.append(el("h3", null, person.name));
  who.append(el("p", "person-role", person.role));
  top.append(who);
  wrap.append(top);

  if (person.bio) wrap.append(el("p", "person-bio", person.bio));

  if (Array.isArray(person.focus) && person.focus.length) {
    const tags = el("div", "person-tags");
    for (const f of person.focus) tags.append(el("span", "tag", f));
    wrap.append(tags);
  }

  wrap.append(linkRow(person));
  return wrap;
}

async function loadTeam() {
  const grid = document.getElementById("team-grid");
  const count = document.getElementById("team-count");
  try {
    const response = await fetch("data/team.json");
    if (!response.ok) throw new Error("not found");
    const people = await response.json();

    grid.replaceChildren();
    for (const person of people) grid.append(card(person));
    if (count) count.textContent = `${people.length} people`;
  } catch (error) {
    grid.replaceChildren(
      el("p", "person-bio", "Could not load the team list (data/team.json).")
    );
  }
}

loadTeam();
