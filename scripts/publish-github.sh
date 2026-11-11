#!/usr/bin/env bash
#
# publish-github.sh — create the GreenToken repository on GitHub and push the
# full history, then set the repository "About" metadata so the live demo link
# shows on the repository page.
#
# Usage:
#   GH_TOKEN=ghp_xxx ./scripts/publish-github.sh [repo-name]
#
# The token needs the `repo` scope. It is used for the API calls and the git
# push only — it is never written into the repository, never stored on disk,
# and never committed. If you pass it inline as an argument, prefer the
# GH_TOKEN environment variable so it does not land in your shell history.
#
set -euo pipefail

REPO_NAME="${1:-greentoken}"
DESCRIPTION="Unit 5 course project — verifiable blue-green carbon tokens on Hyperledger Fabric. Live demo: https://greentoken-7gc.pages.dev"
HOMEPAGE="https://greentoken-7gc.pages.dev"
TOPICS="hyperledger-fabric,blockchain,smart-contracts,carbon-tokens,react,typescript,cloudflare,21CSE432IT"
VISIBILITY="public"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -z "${GH_TOKEN:-}" ]]; then
  cat >&2 <<'EOF'
error: GH_TOKEN is not set.

Create a Personal Access Token (scope: repo) at:
  https://github.com/settings/tokens/new

Then run:
  GH_TOKEN=ghp_xxx ./scripts/publish-github.sh
EOF
  exit 1
fi

command -v git >/dev/null || { echo "error: git is not installed" >&2; exit 1; }
command -v curl >/dev/null || { echo "error: curl is not installed" >&2; exit 1; }

# --- who am I -------------------------------------------------------------
AUTH_OUT="$(mktemp)"
AUTH_CODE="$(curl -s -o "$AUTH_OUT" -w '%{http_code}' \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user)"

if [[ "$AUTH_CODE" != "200" ]]; then
  echo "error: GitHub rejected the token (HTTP $AUTH_CODE)." >&2
  if [[ "$AUTH_CODE" == "401" ]]; then
    echo "       The token is invalid or has expired. Check that you copied it whole," >&2
    echo "       and that it has the 'repo' scope. Classic token:" >&2
    echo "         https://github.com/settings/tokens/new" >&2
  fi
  echo "       GitHub said: $(python3 -c 'import json,sys
try:
    d = json.load(open(sys.argv[1]))
    print(d.get("message", ""))
except Exception:
    print("(no message)")' "$AUTH_OUT")" >&2
  rm -f "$AUTH_OUT"
  exit 1
fi

LOGIN="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["login"])' "$AUTH_OUT")"
rm -f "$AUTH_OUT"
echo "authenticated as: $LOGIN"

# --- create the repository if it does not exist ---------------------------
HTTP_CODE="$(curl -s -o /tmp/gh-create.json -w '%{http_code}' \
  -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"private\":$([ "$VISIBILITY" = private ] && echo true || echo false),\"has_issues\":true,\"has_wiki\":false}")"

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "created repository: $LOGIN/$REPO_NAME"
elif [[ "$HTTP_CODE" == "422" ]]; then
  echo "repository $LOGIN/$REPO_NAME already exists — reusing it"
else
  echo "error: could not create the repository (HTTP $HTTP_CODE)" >&2
  cat /tmp/gh-create.json >&2 || true
  exit 1
fi

# --- set the About metadata: description, homepage, topics ---------------
curl -fsS -X PATCH \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/$LOGIN/$REPO_NAME \
  -d "{\"description\":\"$DESCRIPTION\",\"homepage\":\"$HOMEPAGE\"}" >/dev/null

curl -fsS -X PUT \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/$LOGIN/$REPO_NAME/topics \
  -d "{\"names\":[\"hyperledger-fabric\",\"blockchain\",\"smart-contracts\",\"carbon-tokens\",\"react\",\"typescript\",\"cloudflare\",\"21CSE432IT\"]}" >/dev/null

echo "about section updated — live demo link: $HOMEPAGE"

# --- push the history -----------------------------------------------------
REMOTE_URL="https://github.com/$LOGIN/$REPO_NAME.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# The token is passed to git through a temporary askpass helper, so it never
# appears in .git/config, in the reflog, or in `git remote -v` output.
ASKPASS="$(mktemp)"
cat > "$ASKPASS" <<EOF
#!/usr/bin/env sh
case "\$1" in
  *Username*) echo "x-access-token" ;;
  *Password*) echo "$GH_TOKEN" ;;
esac
EOF
chmod +x "$ASKPASS"

cleanup() { rm -f "$ASKPASS"; }
trap cleanup EXIT

GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0 \
  git push -u origin HEAD:main

# The default branch on GitHub is `main`; keep the local branch in step.
git branch --set-upstream-to=origin/main HEAD >/dev/null 2>&1 || true

echo
echo "done — https://github.com/$LOGIN/$REPO_NAME"
echo "live demo: $HOMEPAGE"
