---
title: "Rails: Auto-Formatting on VSCode"
description: "Use Syntax Tree to auto-format your Ruby on Rails files on Visual Studio Code, and stop arguing about formatting in code review."
publishedAt: 2023-07-05
---

Auto code formatters like Prettier bring several benefits to the table.

- They save you valuable time by automatically formatting your code, eliminating the need for manual formatting.
- They ensure code is consistent and readable across your entire project.
- They reduce code review discussions related to formatting, making collaboration smoother.

Overall, you can focus on writing code without worrying about formatting rules. So, let's setup your Rails project so it can handle the formatting, while you enjoy the pure pleasure of coding.

## Install the syntax_tree gem

You're only going to need one new dependency:

```ruby
gem 'syntax_tree'
```

Then from the command line:

```bash
bundle install
```

## Setup a .streerc file

We can now setup a `.streerc` file at the root of the project:

```text
--print-width=120
--plugins=plugin/single_quotes,plugin/trailing_comma
--ignore-files='**/node_modules/**'
--ignore-files='vendor/**'
```

## Prevent conflicts with Rubocop

RuboCop and Syntax Tree serve different purposes, but there is some overlap with RuboCop, so Syntax Tree provides a Rubocop configuration file to disable rules that are redundant with Syntax Tree.

To use this configuration file, add the following snippet to the top of your project's `.rubocop.yml`:

```yaml
inherit_gem:
  syntax_tree: config/rubocop.yml
```

## Install the VS Code extension

Probably the easiest step. You'll also need one extension from the VS Code marketplace: [ruby-syntax-tree.vscode-syntax-tree](https://marketplace.visualstudio.com/items?itemName=ruby-syntax-tree.vscode-syntax-tree)

## Modify your VS Code settings

Lastly, you'll need to make sure VS Code is using the right code formatter to auto-format your Ruby files. You can set up a different value for Ruby files if you also use another code formatter such as Prettier.

This is what I do, so my `settings.json` file looks like the following:

```json
"editor.formatOnSave": true,
"editor.defaultFormatter": "esbenp.prettier-vscode",
"[ruby]": {
  "editor.defaultFormatter": "ruby-syntax-tree.vscode-syntax-tree"
},
```

Once everyone's on the same formatter, style stops showing up in review. The diff is about what changed, not how it looks.
