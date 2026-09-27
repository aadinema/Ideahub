# IdeaHub — Agent Instructions

## Codebase Navigation
This project uses graphify for codebase structure/architecture queries.
- If graphify-out/graph.json exists: use `graphify query`, `graphify path`, 
  `graphify explain` instead of grep for architecture questions.
- Prefer graphify-out/wiki/index.md if present (currently absent).
- Read graphify-out/GRAPH_REPORT.md for broad reviews.
- After modifying code, run `graphify update .`
- See .agents/rules/graphify.md and .agents/workflows/graphify.md for full detail.

## Project Memory
Before answering any question or doing any task on IdeaHub, read 
.claude/memory/*.md first. If the codebase contradicts memory, flag the 
conflict, ask which is correct, then update memory and log it in 
.claude/memory/CHANGELOG.md. After any code change, update the relevant 
memory file(s) in the same session — don't defer it. Never answer from 
general assumption if memory already covers the topic.
