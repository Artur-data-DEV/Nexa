# FIXED ENVIRONMENT KNOWLEDGE (CONHECIMENTO FIXO DO AMBIENTE)

- **Operating System (Sistema Operacional):** Windows 10/11
- **Default Shell (Shell Padrão):** PowerShell 7
- **Constraints (Restrições):**
    - **NO** Linux, WSL, or Bash.
    - **ALL** developer commands MUST be Windows-native (PowerShell/CMD).
    - If a Linux command is suggested/used (e.g., `ls -la`, `grep` without `findstr` or binary, etc.), it is WRONG.
    - **CRITICAL:** Use individual PowerShell commands, avoiding `&&` (use `;` or newline).
    - Example: `cd folder; npm run build` instead of `cd folder && npm run build`.

# PROJECT RULES
- Always check `.agent/rules.md` for environmental constraints.
- Prioritize PowerShell 7 syntax.
